+++
title = "Roguelike game architecture in Rust 3 - The entity component system"
[taxonomies]
cat = ["gamedev"]
tags = ["rust", "deprecated"]
+++

Continued from [part 2](../roguelike-architecture-in-rust-2).

Everybody trying to make any sort of more complex game in Rust seems
to gravitate towards [entity component systems][gamedev-ecs]. I'm
not an exception. ECS is the big new thing in game architecture
these days, so this isn't necessarily a bad idea, but Rust goes out
of its way to make it feel necessary.

First of all, Rust is pretty limited at polymorphism. The world of a
complex game is a container for heterogeneous game objects. You have
things like knights, pebbles and chests, which have very different
data layouts and sets of operations, but who are also all physical
objects in the game world, and have some common functionality like
being present at a given point in the world. Textbook
object-oriented modeling situation basically. Rust could let you
store them as trait objects with the minimum shared interface, but
that doesn't help things along very far. First of all, you don't get
base implementation reuse for your actual object types, so you'd
need to figure out some trick to get out of copy-pasting the shared
functionality implementation for every actual entity type.

The next problem is that this sort of OO game world modeling is all
about downcasting. You start with the generic entities, then you
want to try downcasting one to a container (like a chest) to do
container stuff with it and another to creature (like a knight) to
do creature stuff with it. You can use the `BoxAny` trait to
try downcasting to a *concrete* type, but what we really want here
is casting to another trait object so that we still have the option
to use different concrete implementations for `Container` and
`Creature`, and at this point it seems that Rust's grudging
concessions to an object-oriented style reach their limits.

Fortunately it turns out that language-level OO isn't really a good
way to model video game worlds anyway. As the entity component
system folk have observed, you want more runtime flexibility and
data-drivenness than what standard OO's locking down the class of an
object for good at source code level can get you.

## Component structure

The basic idea of an entity component system is that a game world
entity starts out with no information except its identity, and all
the rest of the data and functionality is added at runtime by
associating component values of different types to the entity. The
way I do it with Rust is to have the [entity identity][entity] be
basically just an integer value and have [the
components][components] be containers of plain old data structs.
When [assigning][ecs] IDs to new entities, the smallest unused
integer will be assigned so that the components can be tightly
packed in an array instead of being accessed with an association
map. (They're currently accessed with a HashMap anyway, since VecMap
stopped being serializable.) Reusing IDs will cause aliasing errors
if something holds on to the ID of a deleted entity, so at some
point I probably need to turn the entity IDs into pairs of
nonreusable primary ID and reusable component list index and only
return components if the request handle has a valid UID.

The components are specified by their types, and each entity can
have zero or one of a specific type of component. There are multiple
ECS libraries for Rust that do the component sets using some sort of
`TypeId` based runtime lookup. However, I'm using the standard
serialization to do my save games, and couldn't see how you can
easily serialize `TypeId` and `Any` based structures. Instead, I use
a [macro][comp_macro] to generate a fixed encodable struct with
container fields for all the components, accessor methods and an
entity removal method that loops over every component. This struct
can then just be added to the serializable overall game state. Each
component type is made to implement the `Component` trait that
specifies a method for adding a component value of that type to an
object. This lets me do concise [prototype][prototypes] entity
initialization since the shared trait interface lets chain a list of
component values together without needing to refer to their
component accessors by name.

## Prototype inheritance

The entities also have a prototype inheritance system, via the
`parent` table in `Ecs`. If an entity does not have a specific type
of component associated with it but does have a parent entity, the
component is searched from the parent entity next. This lets me do
things like having named entities without duplicating the concrete
`String` for every individual instance by just having every entity
have a parent prototype that has the `Desc` component. The system is
also copy-on-write. If you ask for a mutable reference to a
component that's inherited from a parent, the child entity will
get a clone of the parent's component and the method will return a
reference to the new cloned component. This way you can have most
entities use a shared inherited description value, but you can give
some entities custom names without needing any extra logic.

For roguelikes in particular, the prototype system also gets you the
mechanics for the item identification subgame for free. The
prototypes for potions, scrolls and the like can be given randomly
permuted "glowing green potion" and "scroll of CROMULENT OSSIFRAGE"
prototype descriptions at world initialization, and when a type of
item is idenified, you can just modify the prototype to say "potion
of necrotizing fasciitis" instead, and this will change the
descriptions of all the potions inheriting that prototype from there
on.

The inheritance system is also a potential source of bugs. The
engine currently makes no difference between prototypes for entities
and actual entities you want running around in the game world.
Without some assertions in place, you could very well put a
prototype entity in the game world and then watch everything get
broken as the game mechanics start messing with it and mutating all
the inherited entities along the way. A general theme with the ECS
is that while it seems very useful for modeling the game world, it
is also a very un-Rustlike system of things that depend on runtime
data being set up just right with many possibilities to do
incoherent things unless you are very careful to guard against it.

## Entity behavior

The behavior of the entities is controlled through the
implementation of the [`Entity`][entity] type. Since the game world
is globally accessible, methods in `Entity` can access the rest of
the world state without having to carry a reference to the world
value with them. Using the global world cell locking pattern for
accessing the physical world data in the Entity methods, I can write
pretty comfortable higher level behavior code as long as I wrap all
the low-level accesses into methods.

There are a some parts of the ECS story that aren't quite clear
here, since I don't have any type level discrimination between
entities that do or don't have some necessary set of components. The
first obvious problem is that all operations that work on a single
entity go into `Entity`'s impl block, eventually turning it into the
Blob antipattern as the game gets more involved. The other problem
is that there isn't a consistent idiom for what to do when an entity
does not have the components that the operation expects it to have.
Some operations just no-op or return a default value if it makes
logical sense (`is_hostile_to` queries creatures for aggression, but
it also makes sense to say that rocks and chests aren't aggressive
enemies). Others just panic. Since I'm not making a library for
other users, it might make sense to just fail hard and fast when
I've made an error in setting up the entities being operated on, and
hope that I catch the error before the users do.

A possible way out of both problems would be to create
sub-interfaces like `Creature` or `Container`, which can only be
instantiated for entities that have all the requisite components.
There already are internal [component-speficic
accessors][component_ref], but these are wired to the world state
internals beyond the `Cell` airlock, so they can't be exposed to the
outside API. They would also be inadequate because many of the logical
entity subtype interfaces would depend on the presence of multiple
components, out of the current components a creature is expected to
have at least `Desc`, `Stats`, `Health`, `Alignment` and `Brain`.

Currently setting up a system like this feels like overengineering
compared to just dealing with the single panic-prone `Entity` blob.
I'll look into making things neater after I've gotten a full game
done and have a better perspective on everything that went wrong.

[gamedev-ecs]: http://stackoverflow.com/questions/1901251/component-based-game-engine-design
[entity]: https://github.com/rsaarelm/magog/blob/2365d6f4e5a318a28875d254ba2d5821ffc4e296/world/src/entity.rs
[components]: https://github.com/rsaarelm/magog/blob/2365d6f4e5a318a28875d254ba2d5821ffc4e296/world/src/components.rs
[ecs]: https://github.com/rsaarelm/magog/blob/2365d6f4e5a318a28875d254ba2d5821ffc4e296/world/src/ecs.rs
[comp_macro]: https://github.com/rsaarelm/magog/blob/2365d6f4e5a318a28875d254ba2d5821ffc4e296/world/src/ecs.rs#L111
[prototypes]: https://github.com/rsaarelm/magog/blob/2365d6f4e5a318a28875d254ba2d5821ffc4e296/world/src/prototype.rs
[component_ref]: https://github.com/rsaarelm/magog/blob/2365d6f4e5a318a28875d254ba2d5821ffc4e296/world/src/component_ref.rs
