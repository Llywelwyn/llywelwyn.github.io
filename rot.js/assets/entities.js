// Templates
Game.PlayerTemplate = {
    name: "hero (you)",
    character: "@",
    foreground: "white",
    background: "black",
    senses: {
        sight: true,
        hearing: true,
        smell: true,
        taste: true,
        touch: true,
    },
    stats: {
        max_hp: 40,
        speed: 100,
        attack_bonus: 50,
        defence_bonus: 50,
        strength_bonus: 3,
    },
    sight_radius: 7,
    inventory_slots: 22,
    verb: {
        singular: ["punch", "kick"],
        plural: ["punches", "kicks"],
    },
    hunger: {
        max_fullness: 1000,
        depletion_rate: 1,
    },
    mixins: [
        Game.EntityMixins.PlayerActor,
        Game.EntityMixins.MessageRecipient,
        Game.EntityMixins.Sight,
        Game.EntityMixins.Attacker,
        Game.EntityMixins.Destructible,
        Game.EntityMixins.Digger,
        Game.EntityMixins.HasInventory,
        Game.EntityMixins.HasHunger,
        Game.EntityMixins.Equipper,
        Game.EntityMixins.ExperienceGainer,
        Game.EntityMixins.PlayerStatGainer,
        Game.EntityMixins.Bleeder,
        Game.EntityMixins.Senses,
        Game.EntityMixins.CanOpen,
    ],
}

// Entity Repository stuff -- grouping entities together
// TODO: sub-groups, i.e. for spawning from 'goblins'
Game.EntityRepository = new Game.Repository("entities", Game.Entity)

// Entity templates

/*
Game.EntityRepository.define('generic', 'generic', {
    name: <string>,              -       entity name
    noun: {
        plural: <bool>,          -       whether name should be pluralised
        proper: <bool>,          -       whether name is a proper noun
    }
    character: <string>,         -       glyph representation of entity in-game
    foreground: <string>,        -       entity colour (https://www.w3.org/wiki/CSS/Properties/color/keywords)
    background: <string>,        -       tile colour behind the entity
    weight: <int>,               -       weight in grams
    height: {
        full: <int>,             -       maximum height (standing, usually)
        crouching: <int>,        -       height when crouching
        crawling: <int>          -       height when crawling (minimum possible size)
    },
    stats: {
        max_hp: <int>,           -       maximum hp of entity
        hp: <int>,               -       current hp of entity. defaults to max
        speed: <int>,            -       how frequently this entity takes a turn. standard is 100. lower is faster.
        attack_bonus: <int>,     -       increases hit chance when attacking
        defence_bonus: <int>,    -       reduces hit chance against entity
        strength_bonus: <int>,   -       increases max hit when attacking (1:1)
        level: <int>             -       entity current level
    }
    sight_radius: <int>,         -       vision range if Sight mixin is present
    inventory_slots: <int>,      -       size of inventory if HasInventory mixin is present
    verb: {
        singular: [<string>],    -       array of verbs to be used on attack messages, singular form
        plural: [<string>]       -       plural form array, should correspond to singular at same index
    },
    hunger: {
        max_fullness: [<int>],   -       maximum fullness
        fullness: [<int>],       -       current fullness, used to specify starting at a specific hunger state
        depletion_rate: [<int>]  -       amount to reduce fullness per turn of hunger  
    },
    growth: {
        remaining: <int>,        -       remaining times this entity will replicate if GrowthActor
        chance: <int>            -       percent chance to grow per turn
    },
    bleed_rate: <int>,           -       percent chance to bleed on receiving damage
    corpse_drop_rate: <int>,     -       percent chance to drop an edible corpse
    tasks: [<string>]            -       array of strings defining tasks to complete
    mixins: [<object>]           -       array of mixins - full list is @ /assets/mixins/entity.js
});
*/

Game.EntityRepository.define("vines", {
    name: "vines",
    noun: {
        plural: true,
    },
    character: "v",
    foreground: "green",
    stats: {
        max_hp: 10,
        speed: 400,
        attack_bonus: 0,
        defence_bonus: 0,
        strength_bonus: 0,
    },
    growth: {
        remaining: 3,
        chance: 0.01,
    },
    mixins: [Game.EntityMixins.VinesActor, Game.EntityMixins.Destructible],
})

// Wandering
Game.EntityRepository.define(
    "bat",
    {
        name: "bat",
        character: "b",
        foreground: "beige",
        description: {
            speed: "quickly",
            sight: "unthreatening",
        },
        stats: {
            max_hp: 5,
            speed: 50,
            attack_bonus: 40,
            defence_bonus: 20,
            strength_bonus: 5,
        },
        verb: {
            singular: ["bite", "scratch", "claw"],
            plural: ["bites", "scratches", "claws"],
        },
        corpse_drop_rate: 75,
        mixins: [
            Game.EntityMixins.TaskActor,
            Game.EntityMixins.Attacker,
            Game.EntityMixins.Destructible,
            Game.EntityMixins.CorpseDropper,
            Game.EntityMixins.ExperienceGainer,
            Game.EntityMixins.RandomStatGainer,
            Game.EntityMixins.Bleeder,
            Game.EntityMixins.HasDescription,
        ],
    },
    {
        groups: ["wander"],
    },
)
Game.EntityRepository.define(
    "newt",
    {
        name: "newt",
        character: "n",
        foreground: "yellow",
        description: {
            sight: "unthreatening",
        },
        stats: {
            max_hp: 3,
            attack_bonus: 30,
            defence_bonus: 20,
            strength_bonus: 3,
        },
        verb: {
            singular: ["scratch", "nip"],
            plural: ["scratches", "nips"],
        },
        corpse_drop_rate: 25,
        mixins: [
            Game.EntityMixins.TaskActor,
            Game.EntityMixins.Attacker,
            Game.EntityMixins.Destructible,
            Game.EntityMixins.CorpseDropper,
            Game.EntityMixins.ExperienceGainer,
            Game.EntityMixins.RandomStatGainer,
            Game.EntityMixins.Bleeder,
            Game.EntityMixins.HasDescription,
        ],
    },
    {
        groups: ["wander"],
    },
)

// Hunters
Game.EntityRepository.define(
    "kobold",
    {
        name: "kobold",
        character: "k",
        foreground: "white",
        description: {
            sight: "clumsy",
        },
        stats: {
            max_hp: 12,
            speed: 110,
            attack_bonus: 50,
            defence_bonus: 40,
            strength_bonus: 5,
        },
        sight_radius: 7,
        tasks: ["hunt", "wander"],
        mixins: [
            Game.EntityMixins.TaskActor,
            Game.EntityMixins.Sight,
            Game.EntityMixins.Attacker,
            Game.EntityMixins.Destructible,
            Game.EntityMixins.ExperienceGainer,
            Game.EntityMixins.RandomStatGainer,
            Game.EntityMixins.Bleeder,
            Game.EntityMixins.HasDescription,
            Game.EntityMixins.CanOpen,
        ],
    },
    {
        groups: ["hunt"],
    },
)
Game.EntityRepository.define(
    "orc",
    {
        name: "orc",
        character: "o",
        foreground: "olive",
        description: {
            speed: "slowly",
            sight: "strong",
        },
        stats: {
            max_hp: 20,
            speed: 125,
            attack_bonus: 70,
            defence_bonus: 20,
            strength_bonus: 8,
        },
        sight_radius: 8,
        tasks: ["hunt", "wander"],
        mixins: [
            Game.EntityMixins.TaskActor,
            Game.EntityMixins.Sight,
            Game.EntityMixins.Attacker,
            Game.EntityMixins.Destructible,
            Game.EntityMixins.ExperienceGainer,
            Game.EntityMixins.RandomStatGainer,
            Game.EntityMixins.Bleeder,
            Game.EntityMixins.HasDescription,
            Game.EntityMixins.CanOpen,
        ],
    },
    {
        groups: ["hunt"],
    },
)
Game.EntityRepository.define(
    "vampire",
    {
        name: "vampire",
        character: "V",
        foreground: "purple",
        description: {
            speed: "gracefully",
            sight: "powerful",
        },
        stats: {
            max_hp: 40,
            speed: 100,
            attack_value: 60,
            defence_value: 60,
            strength_bonus: 10,
            level: 7,
        },
        verb: {
            singular: ["bite", "claw", "tear"],
            plural: ["bites", "claws", "tears"],
        },
        sight_radius: 8,
        mixins: [
            Game.EntityMixins.VampireActor,
            Game.EntityMixins.Sight,
            Game.EntityMixins.Attacker,
            Game.EntityMixins.Destructible,
            Game.EntityMixins.CorpseDropper,
            Game.EntityMixins.ExperienceGainer,
            Game.EntityMixins.RandomStatGainer,
            Game.EntityMixins.HasDescription,
            Game.EntityMixins.CanOpen,
        ],
    },
    {
        disable_random_creation: true,
        groups: ["vampire", "elite"],
    },
)
Game.EntityRepository.define(
    "vampire bat",
    {
        name: "vampire bat",
        character: "b",
        foreground: "purple",
        description: {
            speed: "quickly",
        },
        stats: {
            max_hp: 5,
            speed: 50,
            attack_bonus: 40,
            defence_bonus: 20,
            strength_bonus: 5,
        },
        verb: {
            singular: ["bite", "scratch", "claw"],
            plural: ["bites", "scratches", "claws"],
        },
        corpse_drop_rate: 75,
        tasks: ["hunt", "wander"],
        mixins: [
            Game.EntityMixins.TaskActor,
            Game.EntityMixins.Attacker,
            Game.EntityMixins.Destructible,
            Game.EntityMixins.CorpseDropper,
            Game.EntityMixins.ExperienceGainer,
            Game.EntityMixins.RandomStatGainer,
            Game.EntityMixins.Bleeder,
            Game.EntityMixins.Sight,
            Game.EntityMixins.HasDescription,
        ],
    },
    {
        disable_random_creation: true,
        groups: ["vampire"],
    },
)
