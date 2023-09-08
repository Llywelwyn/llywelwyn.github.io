:title RUST-RL does /r/roguelikedev follows the complete tutorial, week 4, part 1
:date 2023-08-01
:tags RUST-RL roguelikedev turn-systems
:desc running through the details of my own solution for variable entity speeds, and a look at the problems that i think are solved by deviating from thebracket's system

## handling entity speeds

to immediately preface this, the *problems* with the tutorial content are only problems insofar as they're simplified for the sake of being a tutorial. it's a great first look at how a system like this should be implemented, without being overly specific or complex and making it hard for the viewer to adapt (like i've chosen to do here). that is: no discredit to the content. it's great, and if you don't have a specific intent already in mind like i have, you could totally just rip the system from *roguelike tutorial in rust* directly into your game and do perfectly well with it.

## the speed system - thebracket's implementation, and why i differed

in thebracket's tutorial, he implements a system that goes roughly like this:

- every entity that can take turns has an `Initiative` component
- every tick, we iterate through every entity with an `Initiative`:
    - subtract one from the entity's current initiative score
    - if the new score is <=0, add a `MyTurn` component to give the entity a turn
    - re-roll a new initiative number for every entity who needs one; he uses `6 + 1d6 - Quickness bonus`

i like this system. it's great for the purposes of the tutorial. it introduces the reader to a simple system in which every entity may or may not take a turn on a given tick, and explains the purpose of the `1d6` of randomness when generating the initiative score in ensuring that you can't predict exactly when every entity will take a turn.

however, for my purposes, there's a few things that don't agree with the direction i wanted to go:

- the degree of randomness is too large - an entity of a neutral quickness score can have their turn delay be anywhere from 7-12 ticks. i think the player occasionally acting at almost half the speed (if they roll a 12) than they do on other turns (if they roll a 7) may lead to some instances of the system feeling pretty unfair.
- the impact of attributes (or in the case of the system i'm using, a dedicated speed stat) is too low, meaning less variation in entity speeds than i'd like
- using attributes here also necessities giving every entity attributes; i'd prefer for attributes to be something that largely defaults to neutral for most entities, and is modified only by special cases like entities under stat-changing effects, just for the sake of ease. i think an orc being stronger than an average person is easier seen in raws by increasing the damage of their swing, etc., than having to calculate a balanced strength score for them (as well as all 5 other stats).

## the speed system - my implementation

to solve the first issue of randomness, i'm going with a modified Nethack-style implementation of only randomising speeds that aren't a whole-number multiple of the standard speed, defined as `NORMAL_SPEED`. to solve the latter two issues, i'm giving every entity that needs one a specific speed stat. 

this method almost eliminates the problem of energy-counting for slower entities by making it completely random on which turns they will get to act, whilst keeping the average turns they get to take over their lifetime exactly the same. the problem does still exist if a given entity has a speed that is a whole multiple of `NORMAL_SPEED` less than the player's - e.g. the player has 2x the standard speed, and the entity has 1x. however, right now i think the idea is more interesting than a negative; if a player manages to reach such high speeds, and then faces off against an enemy significantly slower than them, *and* has the exact knowledge of what their speed is, i think the reward of being able to dance in and out of range of their enemy is well-earned.

### pseudocode

```rust
for every entity with a speed on the current map {
    let energy potential = entity speed * any modifiers (burdened, etc.)
    // Add to the entity's energy in whole increments of normal speed
    while energy potential >= NORMAL_SPEED {
        take NORMAL_SPEED away from the entity's potential
        add NORMAL_SPEED to the entity's current energy
    }
    // Roll to determine if we add the remainder
    while some energy potential is leftover {
        let roll = a dice-roll from 1 to NORMAL_SPEED
        if roll <= the leftover energy potential {
            add NORMAL_SPEED to the entity's current energy
        }
    }
    // Give the entity a turn, if their current energy is more than a turn's energy cost
    if current energy >= the TURN_COST {
        take TURN_COST away from the entity's current energy
        grant the entity a turn
        if the entity is the player {
            set the new runstate correctly
        }
    }
}
```
### explaining with arithmetic (feel free to skip this)

the system uses [Euclidean division][euclidean-division] to determine how much energy an entity gets per tick.

1. energy potential is the dividend; 
2. NORMAL_SPEED is the divisor;
3. the entity's current energy is incremented by the divisor * the integer quotient;
4. a divisor-sided die is rolled; if it's less than the remainder, the entity's current energy is incremented once more by the divisor 

```rust 
ENERGY_POTENTIAL = 40; NORMAL_SPEED = 12;
ENERGY_POTENTIAL / NORMAL_SPEED = 3 remainder 4

current energy += 3 * NORMAL_SPEED
current energy += NORMAL_SPEED, if 1d12 < the remainder of 4
```

### some plain-english examples

1. an entity has a speed of 2.3 * NORMAL_SPEED
    - on an energy tick, they always have 2 * NORMAL_SPEED added to their current energy; 
    - 30% of the time they get to add another NORMAL_SPEED to their current energy, and 70% of the time they do not. 
2. another entity has a speed of 0.5 * NORMAL_SPEED. 
    - on an energy tick, 50% of the time they add NORMAL_SPEED to their current energy
3. an entity has a speed of exactly NORMAL_SPEED
    - every energy tick, they increment their current energy by exactly NORMAL_SPEED

### the actual implementation in Rust

```rust
for (entity, energy, position) in (&entities, &mut energies, &positions).join() {
    let burden_modifier = get_burden_modifier(&burdens, entity);
    let overmap_modifier = get_overmap_modifier(&map);
    let mut energy_potential: i32 = ((energy.speed as f32) 
        * burden_modifier 
        * overmap_modifier) as i32;

    while energy_potential >= NORMAL_SPEED {
        energy_potential -= NORMAL_SPEED;
        energy.current += NORMAL_SPEED;
    }

    if energy_potential > 0 {
        if rng.roll_dice(1, NORMAL_SPEED) <= ENERGY_POTENTIAL {
            energy.current += NORMAL_SPEED;
        }
    }

    if energy.current >= TURN_COST {
        energy.current -= TURN_COST;
        if entity == *player {
           *runstate = RunState::AwaitingInput;
        } else if cull_turns_by_distance(&player_pos, pos) {
            continue;
        }
        turns.insert(entity, TakingTurn{}).expect("Unable to insert TakingTurn.");
    }
}
```

### helper functions

```rust
fn get_burden_modifier(burdens: &ReadStorage<Burden>, entity: Entity) -> f32 {
    return if let Some(burden) = burdens.get(entity) {
        match burden.level {
            BurdenLevel::Burdened => SPEED_MOD_BURDENED,
            BurdenLevel::Strained => SPEED_MOD_STRAINED,
            BurdenLevel::Overloaded => SPEED_MOD_OVERLOADED,
        }
    } else {
        1.0
    };
}
```

```rust
fn get_overmap_modifier(map: &ReadExpect<Map>) -> f32 {
    return if map.overmap { SPEED_MOD_OVERMAP_TRAVEL } else { 1.0 };
}
```

```rust
fn cull_turn_by_distance(player_pos: &Point, pos: &Position) -> bool {
    let distance = DistanceAlg::Pythagoras.distance2d(
        *player_pos, 
        Point::new(pos.x, pos.y));
    if distance > 20.0 {
        return true;
    }
    return false;
}
```

[euclidean-division]: https://en.wikipedia.org/wiki/Euclidean_division


