// Item repo for base templates
Game.ItemRepository = new Game.Repository("items", Game.Item)

// WEAPONS
EQUIPMENT_DATA.forEach((index) => {
    let name = index["name"]
    let data = index
    Game.ItemRepository.define(name, data, {
        groups: ["equipment"],
    })
})

// FOOD
Game.ItemRepository.define(
    "apple",
    {
        name: "apple",
        character: "a",
        foreground: "red",
        description: {
            taste: "overly ripe",
        },
        edible: {
            value: 50,
        },
        mixins: [Game.ItemMixins.Edible, Game.ItemMixins.HasDescription],
    },
    {
        groups: ["food"],
    },
)
Game.ItemRepository.define(
    "hardtack",
    {
        name: "piece of hardtack",
        character: "h",
        foreground: "rosybrown",
        description: {
            smell: "like yeast",
        },
        edible: {
            value: 80,
            max_uses: 2,
        },
        mixins: [Game.ItemMixins.Edible, Game.ItemMixins.HasDescription],
    },
    {
        groups: ["food"],
    },
)
Game.ItemRepository.define(
    "corpse",
    {
        name: "corpse",
        character: "%",
        description: {
            smell: "putrid",
            taste: "unpalatable",
        },
        edible: {
            value: 120,
        },
        mixins: [Game.ItemMixins.Edible, Game.ItemMixins.HasDescription],
    },
    {
        disable_random_creation: true,
        groups: ["refuse"],
    },
)

// MISC
Game.ItemRepository.define(
    "rock",
    {
        name: "rock",
        character: "*",
        foreground: "white",
        stats: {
            wieldable: true,
            attack_bonus: 1,
        },
        mixins: [Game.ItemMixins.Equippable],
    },
    {
        groups: ["refuse"],
    },
)
