/*
    ======================================
    ! TO CREATE AN ITEM:
        1. Make a copy of the format below.
        2. Fill in any fields you want ("name" and "character" are mandatory).
        3. Delete any of the fields you don't want.
        4. End up with something like this:
            {
                name: "example item",
                character: "e",
                description: {
                    sight: "like it does nothing"
                }
            },
        5. Paste the finished item onto the end of the list.
    ======================================
{
    name: <string>,              -      the name of the item     
    character: <string>,         -      the glyph to represent the item as
    foreground: <string>,        -      foreground colour (https://www.w3.org/wiki/CSS/Properties/color/keywords)
    background: <string>,        -      background colour
    description: {
        smell: <string>          -      "It smells <string>"
        taste: <string>          -      "It tastes <string>", when eating it
        touch: <string>          -      "It feels <string>"
        sight: <string>          -      "It looks <string>"
    stats: {            
        wieldable: <bool>,       -      if it can be wielded in hands
        wearable: <bool>,        -      if it can be worn on body
        attack_bonus: <int>,     -      bonus to attack on equip
        strength_bonus: <int>,   -      bonus to strength on equip
        defence_bonus: <int>     -      bonus to defence on equip
    },
    verb: {
        singular: [<string>],    -      singular verbs to use when attacking
        plural: [<string>]       -      plural verbs to use when attacking
    },
    mixins: [<Object>]           -      attached components - full list is @ /assets/mixins/item.js
},
*/

const EQUIPMENT_DATA = [
    /* 
    ======================================
    ! WEAPONS START HERE                 !
    ======================================
    */
    {
        name: "dagger",
        character: ")",
        foreground: "gray",
        stats: {
            wieldable: true,
            attack_bonus: 14,
            strength_bonus: 4,
            defence_bonus: 0,
        },
        verb: {
            singular: ["slash", "stab", "slice"],
            plural: ["slashes", "stabs", "slices"],
        },
        mixins: [Game.ItemMixins.Equippable],
    },
    {
        name: "shortsword",
        character: ")",
        foreground: "white",
        stats: {
            wieldable: true,
            attack_bonus: 6,
            strength_bonus: 7,
            defence_bonus: 2,
        },
        verb: {
            singular: ["slash", "cut", "slice"],
            plural: ["slashes", "cuts", "slices"],
        },
        mixins: [Game.ItemMixins.Equippable],
    },
    {
        name: "longsword",
        character: ")",
        foreground: "beige",
        stats: {
            wieldable: true,
            attack_bonus: 8,
            strength_bonus: 10,
            defence_bonus: 3,
        },
        verb: {
            singular: ["slash", "cut", "slice"],
            plural: ["slashes", "cuts", "slices"],
        },
        mixins: [Game.ItemMixins.Equippable],
    },
    {
        name: "staff",
        character: ")",
        foreground: "yellow",
        stats: {
            wieldable: true,
            attack_bonus: 7,
            strength_bonus: 3,
            defence_bonus: 3,
        },
        verb: {
            singular: ["smack", "crack", "bonk"],
            plural: ["smacks", "cracks", "bonks"],
        },
        mixins: [Game.ItemMixins.Equippable],
    },
    {
        name: "halberd",
        character: ")",
        foreground: "cadetblue",
        stats: {
            wieldable: true,
            attack_bonus: 6,
            strength_bonus: 10,
            defence_bonus: 7,
        },
        verb: {
            singular: ["jab", "swipe", "fend"],
            plural: ["jabs", "swipes", "fends"],
        },
        mixins: [Game.ItemMixins.Equippable],
    },
    /* 
    ======================================
    ! WEARABLES START HERE               !
    ======================================
    */
    {
        name: "tunic",
        character: "[",
        foreground: "green",
        stats: {
            wearable: true,
            defence_bonus: 8,
        },
        mixins: [Game.ItemMixins.Equippable],
    },
    {
        name: "chainmail",
        character: "[",
        foreground: "white",
        stats: {
            wearable: true,
            defence_bonus: 12,
        },
        mixins: [Game.ItemMixins.Equippable],
    },
    {
        name: "platemail",
        character: "[",
        foreground: "darkorange",
        stats: {
            wearable: true,
            defence_bonus: 16,
        },
        mixins: [Game.ItemMixins.Equippable],
    },
]
