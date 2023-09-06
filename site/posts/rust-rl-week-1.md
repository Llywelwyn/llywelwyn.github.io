:title RUST-RL does /r/roguelikedev follows the complete tutorial, week 1
:date 2023-07-11
:tags RUST-RL roguelikedev
:desc setting up the basics, some simple colour offsets for a brogue-inspired visual flair, and a fast_fov() implementation from roguebasin

this week was fairly productive. i got the busywork out of the way. there's a boring, placeholder map, enemies that move around and attack the player (just goblins for now), field of view, etc. it was all pretty easy to get going with [bracket-lib][bracket-lib]. in terms of more interesting deviations to talk about:

## brogue-like colours

i was staring at a horrible-looking game for a while as i tried to figure out how to make it look nice, before deciding to try the brogue method of colour offsets. when a map is generated, it also generates a red, green, and blue offset value for every tile on the map, and applies them during rendering. after making that change i started to miss the previous hue, so i combined the two. as it stands, every tile starts off a subtle green/blue, has rgb offsets applied on top of that, and then has the actual tile colour applied. and it ends up making something like this

![image](/assets/broguelike-colours.png)

## fov

the visible viewshed is simple enough: i'm using bracket-lib's symmetric shadowcasting. (almost) everyone has one, so it's important that this is symmetrical. it's worth it.

on the other hand, there are some viewsheds that are really rare, and/or have additional stipulations that mean the chance of issues arising from assymetry are almost nil. for example, telepathy. extremely few creatures possess telepathy in the first place, ranges for telepathy aren't nearly as universal as vision, and extremely few tiles will ever *block* the viewshed from working - which is really where issues with asymmetry come from anyway; actors of varying distances to a corner which is blocking vision.

all this combined, i decided to use something leaner, and ended up porting [elig's fastfov pseudocode][eligloscode] from roguebasin, with a ray every 4 degrees - if my viewsheds end up getting bigger, this will probably need reducing down to 2 or 1, but for now no tiles are missed, and it's 4x faster

```rust
pub fn fast_fov(p_x: i32, p_y: i32, r: i32, map: &WriteExpect<Map>) -> Vec<Point> {
    let mut visible_tiles: Vec<Point> = Vec::new();
    let mut i = 0;
    while i <= 360 {
        let x: f32 = f32::cos((i as f32) * (0.01745 as f32));
        let y: f32 = f32::sin((i as f32) * (0.01745 as f32));
        let mut ox: f32 = (p_x as f32) + (0.5 as f32);
        let mut oy: f32 = (p_y as f32) + (0.5 as f32);
        for _i in 0..r {
            let (ox_i32, oy_i32) = (ox as i32, oy as i32);
            visible_tiles.push(Point::new(ox_i32, oy_i32));
            if
                ox_i32 >= 0 &&
                ox_i32 < map.width &&
                oy_i32 >= 0 &&
                oy_i32 < map.height &&
                tile_blocks_telepathy(map.tiles[map.xy_idx(ox_i32, oy_i32)])
            {
                break;
            }
            ox += x;
            oy += y;
        }
        i += 4;
    }
    visible_tiles
}
```

there's some dirty casting, and checking for bounds would probably be better-suited in its own function, but this works for now. it also comes with one big advantage, which is the ability to easily just toss in the `tile_blocks_telepathy()` check, instead of having to change up the BaseMap, which is what bracket-lib uses to decide what blocks a field of view. right now, no tiles exist that actually return true for `tile_blocks_telepathy()`, but here's an idea for how this will end up looking.


```rust
pub fn tile_blocks_telepathy(tt: TileType) -> bool {
    match tt {
        TileType::LeadWall => true,
        _ => false,
    }
}
```

when refactoring comes around, i'll probably want to be able to pass a function to `fast_fov()`, and be able to change how many rays shoot out. note-to-self.

[eligloscode]: https://www.roguebasin.com/index.php/Eligloscode
[bracket-lib]: https://github.com/amethyst/bracket-lib/