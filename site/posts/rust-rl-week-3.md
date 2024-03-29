:title RUST-RL does /r/roguelikedev follows the complete tutorial, week 3
:date 2023-07-25
:tags RUST-RL roguelikedev procgen
:desc data-driven entities, input handling, and a brief overview of each of the main procgen techniques implemented so far and how they work

like last week, the interesting part to talk about is probably procgen again. but *very* briefly on the rest:

- all the entities other than the player are in their own .json file now. i also took the opportunity to atomise spawning a little; items are now in different tables for wands, food, equipment, etc. right now they get compiled into the binary, but i might end up changing that eventually so that players can toy around to their heart's content without having to build the game every time.
- there's a new runstate to handle player input whenever the action *also* needs a direction. previously, the player just pressed one button and did one thing, and anything else had to be a special case. now, the player can try to do something, and they'll be prompted to also say in which direction they'd like to do that thing, and it'll all be handled fairly cleanly behind the scenes.

## finishing up with mapgen - for now

the starter implementations of the main procgen algorithms all got finished this week. i say *starter implementations* because my personal philosophy here is that the systems and game content should really be the thing that guides the maps, rather than the other way around. i think there's a risk of running into dangerous territory if you invest a lot of time getting really in-depth on maps first, and then either don't have them play out how you anticipated once you dial the systems in, or feel a pressure to modify your systems just to force the maps to function how you hoped. i'm sure this is where a lot of people differ, but a systems-first approach has always worked better for me personally. 

as far as those implementations go, here's an overview:

- room-based
    - simple rooms
    - BSP (binary space partion)
    - BSP interiors
- shape-based
    - cellular automata
    - drunkard's walk
    - DLA (diffusion-limited aggregation)
    - mazes
    - voronoi 
    - WFC (wave function collapse)

### simple rooms
picks a random location and tries to place a room; if it doesn't intersect with an existing room, it succeeds. it keeps doing this until either maximum rooms is hit, or it fails too many times

### binary-space partioning
BSP divides the map into two chunks, and then iteratively divides each of those chunks into two more chunks, horizontally or vertically at random, until it ends up with a map sub-divided into roughly dungeon-sized, non-intersecting pieces. the standard BSP implementation then places a room into a number of those chunks; BSP interiors turns those chunks into rooms exactly as they are, ending up with a map that consists entirely of connected rooms and zero corridors (not great for a dungeon map, but perfect for the interior of a house or a castle in the future!)

### cellular automata
cellular automata is the algorithm behind Conway's Game of Life, and is the secret to making great caves. it begins with a completely random map, and a set of rules that determine how the state of each tile should evolve over time. with each pass of automation, it iterates through every tile on the map, and checks the tile against the ruleset to determine whether the it should end up being a wall or a floor.

it sounds a lot more complicated than it really is, so here it is in action. for this example, the tiles are completely randomised to begin with, and our rules are the following: 

- if a WALL has more than 4 neighbours, it stays a wall
- if a FLOOR has more than 5 neighbours, or 0 neighbours, it becomes a wall

try hitting "step" to run another pass of automation over the tiles, and see how things generally smooth out over time

<iframe src="0/" scrolling="no" style="height: 450px;"></iframe>

### drunkard's walk
drunkard's walk maps begin as entirely walls, where they place down a drunk miner. the miner digs out the tile they're standing on, and randomly staggers for a number of steps, before passing out or leaving the edges of the map. the tiles that get dug out become floors, and this keeps happening until enough of the map is dug out. one big advantage with this one is that the whole map will always be traversable by default

### diffusion-limited aggregation
almost like the opposite of a drunkard's walk! it begins with a map of entirely walls once again, and carves out a few tiles to begin with. then, it places a walker randomly upon *any* tile on the map, and lets it randomly walk until it hits a floor tile. once it hits a floor tile, the *last* wall tile that the walker touched is dug out. or an alternate way of thinking about it: random tiles get picked until it finds a wall that borders a floor tile, and then that wall gets removed. same advantage here as with the drunkard's walk too - the map will always be fully traversable from any one tile to any other.

there's a lot of room for variation here. weighting the walkers to head towards the centre of the map and symmetry are two of the variants that thebracket's tutorial covers.

### mazes
not much to explain here!

### voronoi hive cells
voronoi maps work by randomly picking a number of tiles to be "seeds". every other tile then connects to its nearest seed to form a voronoi hive cell. what you do with the cells is where the maps can get really varied: by turning the cell boundaries into walls, and you can end up with a map that looks like a beehive; by having thick boundaries, and having them be the floors instead of the walls, you can end up with a great start for a set of interconnected tunnels; etc. 

[here's][redblob-voronoi] a great article by redblobgames that runs through how voronoi cells can be used to generate an interesting island map

### wave function collapse
wfc takes a source map, splits it into chunks, and then fits together those chunks to create a completely new map with elements resembling the source material. which chunks can fit with which other chunks is determined by a set of constraints; something like "a chunk edge with a floor must always connect to another chunk edge with a floor". but if you want a much better explanation, [here's][bfnightly-wfc] a link to thebracket's words on wfc.

## and that's it!

i'd like to come back to this some time after this game is in a more complete state, and go into detail on the methods here i end up making the most use of, and relate it back to that opening paragraph about how taking a systems-first approach can be beneficial. 

for the time being, this is probably how the maps will stay. it's enough to have an interesting backdrop for testing everything else as i run through making all the systems.

[redblob-voronoi]: http://www-cs-students.stanford.edu/~amitp/game-programming/polygon-map-generation/#source
[bfnightly-wfc]: https://bfnightly.bracketproductions.com/chapter_33.html

