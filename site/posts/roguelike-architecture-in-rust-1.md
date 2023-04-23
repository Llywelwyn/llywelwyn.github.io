:title Roguelike game architecture in Rust 1 - The utility layer
:date 2015-03-21
:tags cs/rust games/dev deprecated

I started looking into Mozilla's [Rust][rust] programming language
around Summer 2013 and had gotten comfortable enough with it by the
start of 2014 to start a more focused game development project.
Currently the project repository is at
<https://github.com/rsaarelm/magog>.

The project started out with miscellaneous rendering code and the
idea of making small test programs for various features and then
consolidating the code used for them into a library. The more
librarizable components ended up split into the [Calx][calx]
grab-bag game library repository.

The Magog game part is the Generic Fantasy Roguelike that I mess
with while working on my technology stack.

## Calx utilities crate

Calx utilities are the most generic level of reusable random stuff.

There's [yet another vector type][geom] that uses tuple struct
syntax for concise literals. I also needed a [custom
trait][primitive] for it to be able to talk about element types you
can do math on, since the generic math primitive trait containing
both floats and ints was dropped from the Rust standard libraries at
some point.

I also wanted to save a random number generator's internal state in
my save games to get games that always play the same way with the
same initial RNG seed. The standard library RNGs don't support
serialization or state dumping, so I made a [wrapper][encode_rng]
that dumps the RNG's bytes into a serialization container in an
`unsafe` block.

There's a [texture atlas generator][atlas] and [image
operations][img] which you can use to set a color key for
transparent pixels and then strip the fully transparent borders from
images before packing them into the atlas. This lets me draw my
sprites in a loose regular grid and then get an efficient atlas
texture out of them at runtime.

The game graphics are grayscale pixel art I draw with
[grafx2][grafx2] and that gets colorized
with a single hue when drawn at runtime.

There's also a compact [implementation][dijkstra] of a [Dijkstra
map][dijkstra_maps] for in-game pathfinding.

## Calx rendering backend

The rendering backend is implemented on top of [Glutin][glutin] and
[Glium][glium] and is based on the [`Canvas`][canvas] type. An
instantiated `Canvas` sets up a window and provides OpenGL shader
based rendering for the pixel art sprites. Canvas uses a builder
pattern where you can set up the application properties like window
size using a fluent API and then provides an iterator interface that
yields input events and render callbacks. The current iterator
design is maybe not quite ideal, since it sometimes leads to
convoluted user code when an input event should lead to an immediate
action on the render callback, and the user code needs to then set
up a local flag that will be checked when it receives the next
render event.

The primitive draw operation draws textured and vertex-colorized
triangles using the one atlas texture. All the graphics use the
single atlas and draw either single-color bitmap sprites or
solid-color polygons. The [`CanvasUtil`][canvas_util] trait provides
utility functions like drawing specific sprites or geometric shapes
that can be implemented on top of the base `Canvas` interface
without knowing anything about its internals.

The backend renders to a texture. To keep the pixel art aesthetics
consistent, I like having the logical resolution stay constant. The
target texture is then scaled up to fit the actual window. The
current design only magnifies the graphics by integer multiples so
that all the magnified pixels will be the same size. The default
640x360 resolution is picked to scale neatly into 720p and 1080p TV
resolutions.

I use a Colemak keyboard layout, so I need to have the
position-based QWEASD movement keys be read from the hardware
keyboard scancodes instead of the layout input. The [scancode
modules][scancode_win]
store the standard mappings from scancodes to keys for Linux,
Windows and OS X. I'm not quite sure where I originally got the key
lists from, possibly from the [DosBox source
code][scancode_dosbox].

The event system is pretty much just implementing my own flavor on
top of what comes out of Glutin, maybe it would've been better to
just try to push the scancode translation to Glutin and use Glutin's
event type directly. On the other hand, I'm not completely sure the
scancode stuff is completely correct, so I'm wary about pushing it
into a general-use crate. I don't have a Mac to test the OS X branch
with for example.

The backend also renders a variable width bitmap font. There's no
TTF importer, it's just hand-drawn sprites.

At this point there's enough machinery to start a window, read user
input and draw animated colorful graphics and text on the screen.
Next there needs to be an actual game program that uses this layer.

[rust]: http://www.rust-lang.org/
[calx]: https://github.com/rsaarelm/calx
[geom]: https://github.com/rsaarelm/calx/blob/a332c59dde7425b8a1e7bdac535d0cfd7c15f760/util/src/geom.rs
[primitive]: https://github.com/rsaarelm/calx/blob/a332c59dde7425b8a1e7bdac535d0cfd7c15f760/util/src/primitive.rs
[encode_rng]: https://github.com/rsaarelm/calx/blob/a332c59dde7425b8a1e7bdac535d0cfd7c15f760/util/src/encode_rng.rs
[atlas]: https://github.com/rsaarelm/calx/blob/a332c59dde7425b8a1e7bdac535d0cfd7c15f760/util/src/atlas.rs
[img]: https://github.com/rsaarelm/calx/blob/a332c59dde7425b8a1e7bdac535d0cfd7c15f760/util/src/img.rs
[grafx2]: https://code.google.com/p/grafx2/
[dijkstra]: https://github.com/rsaarelm/calx/blob/a332c59dde7425b8a1e7bdac535d0cfd7c15f760/util/src/dijkstra.rs
[dijkstra_maps]: http://www.roguebasin.com/index.php?title=The_Incredible_Power_of_Dijkstra_Maps
[glutin]: https://github.com/tomaka/glutin
[glium]: https://github.com/tomaka/glium
[canvas]: https://github.com/rsaarelm/calx/blob/a332c59dde7425b8a1e7bdac535d0cfd7c15f760/backend/src/canvas.rs
[canvas_util]: https://github.com/rsaarelm/calx/blob/a332c59dde7425b8a1e7bdac535d0cfd7c15f760/backend/src/canvas_util.rs
[scancode_win]: https://github.com/rsaarelm/calx/blob/a332c59dde7425b8a1e7bdac535d0cfd7c15f760/backend/src/scancode_windows.rs
[scancode_dosbox]: http://sourceforge.net/p/dosbox/code-0/HEAD/tree/dosbox/trunk/src/gui/sdl_mapper.cpp 
