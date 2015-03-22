---
layout: post
author: Risto Saarelma
title: Roguelike game architecture in Rust 2 - The game application
tags:
    - gamedev
---

Continued from [part 1](../Roguelike-architecture-in-Rust-1).

The [game project][magog] is split into the toplevel application
crate and a `world` library crate in a subdirectory. The world crate
handles the game state and logic, while the main crate does user
interface. It's something like a client/server architecture, though
there isn't anything like a wire protocol between the two.

The toplevel client crate has full access to the public interface of
the world crate, but the world crate isn't aware of the toplevel.
Most of the time this works fine. The client translates UI events
into game actions, updates world state with the action and reads the
current worldstate to know what to draw on screen. The worldstate
only stores persistent objects like trees and chests though,
transient things like sound effects and particle clouds that don't
matter to the game logic beyond the fact that they got spawned don't
live in the game state. Transient effects get passed to the toplevel
as values in the [message queue][msg] in the world crate.

If I ever want to have NetHack style "Are you sure you want to stick
your head in the Sphere of Annihilation Y/N" style confirmation
dialogs that get tripped from within the world logic, I'm going to
have new problems with figuring out the UI - world interaction.
Though maybe I can just push functionality like that entirely into
the UI side.

## The screen state machine

The different screens in the game are implemented as state machine
[states][state] that consume events from the backend and return
state transition instructions. The [title screen state][titlestate]
is a very simple example that currently just renders the title
screen. In the future, there will probably be some menu logic here
to handle settings and save games. Most of the gameplay happens in
the [gameplay state][gamestate]. When the gameplay state is created,
it initializes the global game world object and then starts running
the game, displaying the game world and reading the user input. This
object is a bit of a mess of responsibilities, and should probably
split into multiple modules at some point.

## The command loop

The inputs from the player to the game go through function
[`action::input`][input]. The player controls a single avatar
character, which has its own speed of action. It won't act on every
world update frame, so the client uses
[`action::control_state`][control_state] to find out whether it
should try to come up with some player input or just update the
world. When left to its own devices without a player expecting
input, the world runs at 30 frames per second.

Theoretically the game should run exactly the same every time it
gets the same random number generator seed and player input
sequence, to the point where these could be used as save game data,
but I don't have tests in place to see if this is actually the case.

The `action` module in the world crate is a general grab-bag of free
functions that operate on the global world state.

## The global world structure

With some hesitation about losing all the lovely referential
transparency, I decided to just go ahead and put the mutable world
state in a [thread-local store][world] accessible from anywhere (as
long as I stick to a single thread). This lets me stop worrying
about just how the world reference should be carried over to every
point that wants to know things about the global game state.
Roguelikes are basically some simple display code you throw up in a
weekend and then years and years of accrued rat's nest of world
logic code that needs to know obscure things about dark corners of
the game world deep in some logic path or another.

It's also starting to become obvious at this point that the Rust
borrow checker hates video games. If you implement the world
structure naively, the first time you take a write reference to the
world you stop being able to read anything else from the world. For
example, you might want to do something like
`world.do_mutable_stuff(world.do_immutable_query())`. Nope. Can't
have mutable call's parameter be an immutable call to the same
object. I don't know if there's a good reason here why the compiler
doesn't just translate this into something like the `let x =
world.do_immutable_query(); world.do_mutable_stuff(x);` form that I
always end up typing by hand.

It gets more fun. Worlds contain game entities. You'll want to go
through them, run game logic for them and update them. Accessing the
entities of a naively put together world structure gets the world
locked. If you got a read lock, congrats, now you can't change the
world state in any way while holding on to the entity. Maintaining a
single write lock on the other hand becomes an ergonomical nightmare
if you want to, say, call a method on an entity that wants to query
the world state, another method that wants to mutate the world
state, maybe call one method with the other's return value as its
parameter and so on.

## The world access pattern

After wondering whether the decision to try to write video game
logic in Rust was one of those not very clever ideas to begin with,
I came up with a pattern to manage things. The `Cell` that I use to
implement the thread-local worldstate value does a runtime
equivalent of borrow checking. As long as I make sure never attempt
to borrow an already borrowed world, everything will work fine, and
I can write high-level game code that doesn't get gimped by constant
borrow checker issues.

The way I ended up doing things is to push reading or changing
things in the physical worldstate data structures as deep down into
the call chain as I can, and only acquiring the Cell borrow when I
absolutely must access the physical worldstate memory. At this point
I push a closure past the borrow airlock using the `world::with` or
`world::with_mut` functions. Once within the borrow, calling any
other function that uses the airlock will probably cause a runtime
panic, so the code inside the closure needs to be short and simple.
Most of the time this works quite well, since the `with` code
pattern is pretty distinct. The one thing I can't do is give the
concrete datatypes that go in the world any sort of complex methods
that interact with the high-level world logic, since those would end
up calling other airlock functions and panic on me.

Now I can have stuff like game entity handles, game world location
values and the like, which can be passed around with no borrow locks
and have interfaces that use the high level game logic that bottom
out to pushing the actual physical gamestate data around. Though I
also need to write some getter and setter type boilerplate code
because I can't expose references to any of the internal data
through the API.

[magog]: https://github.com/rsaarelm/magog/
[state]: https://github.com/rsaarelm/magog/blob/2365d6f4e5a318a28875d254ba2d5821ffc4e296/src/main.rs#L31
[titlestate]: https://github.com/rsaarelm/magog/blob/2365d6f4e5a318a28875d254ba2d5821ffc4e296/src/titlestate.rs
[gamestate]: https://github.com/rsaarelm/magog/blob/2365d6f4e5a318a28875d254ba2d5821ffc4e296/src/gamestate.rs
[msg]: https://github.com/rsaarelm/magog/blob/2365d6f4e5a318a28875d254ba2d5821ffc4e296/world/src/msg.rs
[critical]: http://www.gamesetwatch.com/2010/11/column_play_check_and_mate.php
[density]: http://www.gamedevblog.com/2005/04/notes_on_emanci.html
[input]: https://github.com/rsaarelm/magog/blob/2365d6f4e5a318a28875d254ba2d5821ffc4e296/world/src/action.rs#L94
[control_state]: https://github.com/rsaarelm/magog/blob/2365d6f4e5a318a28875d254ba2d5821ffc4e296/world/src/action.rs#L71
[world]: https://github.com/rsaarelm/magog/blob/2365d6f4e5a318a28875d254ba2d5821ffc4e296/world/src/world.rs
