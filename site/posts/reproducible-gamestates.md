:title Reproducible gamestates
:date 2023-03-23
:tags games/dev cs/rust cs/event-log

There's a very simple and high-level model for any game program that still has practical use.
It decomposes the game into
a *gamestate* that describes a snapshot of the game situation at some point in time,
player *inputs* and an *update* function that advances the gamestate given a player input.

The idea here is that everything in the game is deterministic clockwork
(and everything in the game *must* be deterministic clockwork)
except for the player inputs, which are unpredictable elements from outside the system.
The only way you can change things in the game state is to update it with a player input.
In any real-time game, the input set will also include "the player made no move, but time passes".
This is equivalent to the player passing a turn in a turn-based game.

The command interface needs to be squeezed in an enumeration for this to work,
but it's reasonably straightforward to map a bunch of method calls into corresponding enum variants.

For a concrete example, in a game of chess the gamestate type would specify the placement of pieces on a chessboard at a given moment of play,
and the input type would be the description of a single chess move.
The game is played by incrementing the board state with moves received from the user,
and the state can be examined after each move for a checkmate.

## What does this get us?

The design imposes some structural discipline.
The gamestate object only has one path for mutation,
otherwise you need to make do with immutable query functions.
So for debugging things going wrong when it changes, you always know where to start looking.
Since you need to ensure the game always plays the same with the same inputs,
there's early pressure to squish bugs related to nondeterminism.

The really neat thing is that you get a combined replay and save game system.
You can just save the setup for the initial game condition and the full sequence of player inputs,
and the you can restore the game state by playing back the inputs as fast as you can without updating the graphics.
Unless the games become very long or the game has otherwise heavy computational demands, this could even be the only save system used.
As far as I can tell, [Brogue](https://sites.google.com/site/broguegame/) uses only a method like this.

You can also use the input sequence to implement a debug undo command for free.
Just reset the game state to the initial state, then replay all inputs except the last one.
And now you've gone back in time for one turn.
If you keep saving inputs to a log file while you play, you can debug crashes by taking the log and replaying the game to the moment right before the crash.

A deterministic game system also helps if you're making a multiplayer game,
you can get away with only sending the inputs of other players over the net and trusting each client to correctly replay the rest of the game the same way.
See the article on [implementing multiplayer in Age of Empires](https://www.gamedeveloper.com/programming/1500-archers-on-a-28-8-network-programming-in-age-of-empires-and-beyond) for more on this.

## Ensuring determinism

So how do you make sure the game actually plays the exact same way every time given the same inputs?
An obvious failure is to use a random number generator that's seeded differently for every run.
Such RNG will give obviously different numbers each time.
The way to do it better is to use a specific seed for the generator and to save the seed as part of the initial gamestate definition in the input log.
This doesn't stop the potential problems though.
You need to also be careful where you use that RNG.
If you sample from it for something that happens in the user interface, when the game is being replayed without the user interface being active, the RNG will go out of sync.
So you must be careful to keep the game RNG hidden inside the gamestate.

There are other sources of nondeterminism.
Bad use of [multithreading](https://thedailywtf.com/articles/Sprite_Threading) is an obvious one.
A less obvious one is depending on the iteration order of a hash container.
The hash values of objects are often derived from their memory addresses, which are different for every run.
When using Rust, `BTreeMap` (if your keys implement `Ord`) or `indexmap::IndexMap` (if they're only `Hash`) gets you deterministic iteration order.

Floating point values are of course [just generally cursed](https://randomascii.wordpress.com/2013/07/16/floating-point-determinism/).

## Log robustness

As you work on a game, evolving your rules or your game maps will inevitably cause old logs to become invalid.
There isn't much you can do to guard against the rules changing, except manually updating your game version and trying to stick to a convention like SemVer so you can tell when compatibility has broken.
For the gamestate, you can save a checksum.
If the checksum is different on a replay, you know that the map generator is producing different maps or the fixed map has changed, whichever you are using.
This ends us with a log prefix that looks something like

> `v0.8.14  dungeons_of_doom(13126784)  75170fc230cd88f32e475ff4087f81d9`

This has the program version, an invocation for the map generation (which generator to use and which random seed to use) and the checksum for the generated map.

Just about any game is complex enough that you can't syntactically determine if an input deep in the thread is valid for the current gamestate or not.
The user interface should be able to query the current gamestate for validity during play, so we can assume that actions that ended up saved were good for that runtime instance.
If the playback of a log ends up running inputs that are invalid (like a character trying to move into a cell that has an impassable wall in it),
that can be treated as a hard error that indicates that the log is corrupted or does not match the current game version.
