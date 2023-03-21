+++
title = "Game system objects"
date = 2023-03-21
[taxonomies]
cat = ["gamedev"]
tags = ["rust"]
+++

I've kept working on Rust game development since I last wrote about it in 2015.

A big initial problem with developing a game is coming up with an idiom for the core game object space that has many different types of objects that need to interact with each other in complex ways.
A language without Rust's borrow checking could do a design where the game world object has references to game entity objects and the game entity objects have references to the world object, with everything managed by a garbage collector.
This can get messy, like Joe Armstrong's quip about object-oriented programming, "You wanted a banana but what you got was a gorilla holding the banana and the entire jungle."

With Rust, the starting point is that everything should be tree-shaped.
The whole tree is rooted on the trunk, while branches don't know about the trunk below them and leaves don't know about the branches.
If you need to do operations with leaves that involve the rest of the tree, a straightforward approach is to provide the tree as a context to the operation.
A future Rust [might provide context-specification as a language feature](https://tmandry.gitlab.io/blog/posts/2021-12-21-context-capabilities/) but now we're stuck with passing it around as a threaded parameter.

## The core object

Threading a context parameter turns out to work pretty well for game code.
The context object is very important for the design, and needs strong conventions around it.
So far a good rule of thumb has been "the object that stores everything you need to save in a save game file".
I'm calling this object `Core` and use the variable `c` for it in the function signatures.
So I get code like this:

```rust
impl Entity {
    /// Look up other entities near this entity.
    fn get_neighbor(&self, c: &Core, offset: Vector) -> Option<Entity> {
        // This is a query method that does not change game state.
        c.get_entity(self.position(c) + offset)
    }

    /// Make an entity stronger with a power up effect.
    fn power_up(&self, c: &mut Core, strength: u32) {
        // This method changes the game state.
        c.set_component(self, PowerUp(strength));
    }
    ...
}
```

The core ends up being much like a database.
I'm using the [hecs](https://github.com/Ralith/hecs) entity component system for entity data, and have some additional stuff like global variables in the core object.

Entities (the individual game objects like goblins and spaceships) are contained in the core and can do very little by themselves.
Entity values are very similar to keys to database tables here.
Anything that needs access to other contents of the core or even data associated with a single entity needs a reference to the core in the method call.

Having the core reference with a known mutability status also helps if I want to make the game multithreaded.
Any methods that access a read-only `&Core` can be run in parallel.
These can include pathfinding AI for individual entities, which can make up a large part of the game runtime.
Mutating methods with `&mut Core` must be run in sequence.
If the core data was stored in a global variable, it would be much trickier to determine method calls that won't mutate the core.

It is also straightforward to return iterators to contents of the core by just making the iterator object share the lifetime with the core reference.

```rust
impl Core {
    fn live_entities(&self) -> impl Iterator<Item = Entity> + '_ { ... }
    ...
}
```

## Nesting systems

A full program can consist of multiple systems that are contained in a tree-like structure.
The game toplevel could consist of the engine core (only manages the runtime game logic) and the rendering state (draws things on screen, manages cached textures).
The toplevel object is used as a context parameter for high-level main game loop functions, and method calls drop down to using the subsystem members when control moves to a subsystem.

```rust
/// Toplevel game system.
struct GameLoop {
    /// Game core subsystem.
    c: Core,
    /// Graphics rendering subsystem.
    r: Renderer
}

impl GameLoop {
    fn render(&self) {
        // A shorthand for &self.c to make calls below more concise.
        let c = &self.c;

        for e in c.live_entities() {
            // Draw entities with rendering subsystem.
            // An entity's data accessors need the core reference
            // so they can access the ECS store.
            self.r.display(e.pos(c), e.icon(c));
        }
    }
}
```
