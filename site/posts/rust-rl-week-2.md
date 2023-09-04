:title RUST-RL does /r/roguelikedev follows the complete tutorial, week 2
:date 2023-07-18
:tags RUST-RL roguelikedev procgen
:desc better wall bitmasks, and a step-by-step look at how modular builders can be chained together for more varied maps

procgen this week! and probably for the next long time. i messed around with the bitmask being used for the walls, and got chained builders in. of those things, the chains are the most fun to talk about.

### chained builders

this is more or less straight from bracket, but i think it's interesting to talk about. in essence, instead of defining one function that's generating a map from some parameters, map generation has turned into a modular chain of builders, that each accept the build data from the previous builder, and do some procgen magic, and then pass the build data on to the next builder.

here's a lengthy example of a map that might end up being rolled

```rust
let mut builder = BuilderChain::new(new_depth, width, height);
builder.start_with(BspDungeonBuilder::new());
builder.with(RoomSorter::new(RoomSort::CENTRAL));
builder.with(RoomDrawer::new());
builder.with(BresenhamCorridors::new());
builder.with(RoomCornerRounder::new());
builder.with(RoomBasedStartingPosition::new());
builder.with(DistantExit::new());
builder.with(RoomBasedSpawner::new());
```

it looks difficult to interpret compared to an all-in-one, one-liner like 

```rust
build_dungeon()
```

but if you take into account that almost all of these individual build steps are optional, as well as the fact that each build step is doing one single, very specific modification to the build data, it gets a lot simpler.

first, a completely blank slate is made, with given dimensions, and then the first step of a BspDungeon algorithm is ran: the map is split into rects, but left empty for now. the information about where the rects are is stored in the build data as a list of rooms

```rust
let mut builder = BuilderChain::new(new_depth, width, height);
builder.start_with(BspDungeonBuilder::new());
```

this gets followed up by a sort. in this case, it starts from the centre of the map and sorts the rooms from nearest-to-furthest, ending up with a spiral-ish order. this doesn't do anything on its own otherwise; the sorting is just for future reference by the next builders in the chain.

```rust
builder.with(RoomSorter::new(RoomSort::CENTRAL));
```

with sorted rooms, the next step is to *actually draw them to the map*. what we have right now is a list of places where rooms should go, but they're still all empty, and there aren't any walls. so that's what the next two builders in the chain do: following our sorted order from centre-most to outer-most, we first draw every single room to the map, and then follow it up by drawing corridors between them - in this case, with straight Bresenham lines from centre-to-centre; and because we sorted in this way, we end up with a map that starts in the centre and expands outwards.

```rust
builder.with(RoomDrawer::new());
builder.with(BresenhamCorridors::new());
```

we don't want square rooms! the RoomCornerRounder iterates through the rooms we've just drawn, and fills in the corners to make something that looks more natural than perfect squares. this approach is pretty good for something like a warren, or a cave system that you still want to have corridors between.

```rust
builder.with(RoomCornerRounder::new());
```

finally, we decide where the player should start, where they need to go do continue on through the dungeon, and where we want the mobs to spawn. in this example, we've got the player starting in a random room, the exit is being placed *as far away as possible*, even outside of rooms (it can end up in a corridor between rooms), and mobs are spawning *only* within rooms. they can still wander out of them, but the map'll start off with clear corridors.

```rust
builder.with(RoomBasedStartingPosition::new());
builder.with(DistantExit::new());
builder.with(RoomBasedSpawner::new());
```

of all of these stages, the only ones that are completely mandatory are a starting point (like BspDungeonBuilder, in this case), and the player's start- and end-points. we need *some sort* of map, somewhere for the player *to start*, somewhere for them *to go*; you don't even need somewhere for the monsters to spawn. if you want perfectly rectangular rooms, RoomCornerRounder could be skipped; if you want monsters to start in corridors, VoronoiSpawning could be used instead of RoomBased; if you don't like BspDungeons? you can substitute something else in it's place.

but in this case, here's what we ended up getting.

![image](/builder-chain.png)

hopefully this is at least a somewhat decent show of how a chain of builders can be beneficial. there's *a lot* of room to expand or modify a system like this, so this is where procgen becomes really fun. dungeon features, themeing different rooms, spawning a dragon in the largest room - anything.

