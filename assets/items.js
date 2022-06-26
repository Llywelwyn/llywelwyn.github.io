// Item repo for base templates
Game.ItemRepository = new Game.Repository('items', Game.Item);

// Item templates - https://www.w3.org/wiki/CSS/Properties/color/keywords

/*
Game.ItemRepository.define('name', 'group', {
    name: <string>,              -      the name of the item     
    character: <string>,         -      the glyph to represent the item as
    foreground: <string>,        -      foreground colour
    background: <string>,        -      background colour
    odour: <string>,             -      'It smells like <odour>.'
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
})
*/

// WEAPONS
Game.ItemRepository.define('dagger', 'equipment', {
    name: 'dagger',
    character: ')',
    foreground: 'gray',
    stats: {
        wieldable: true,
        attack_bonus: 10,
        strength_bonus: 4,
    },
    verb: {
        singular: ['slash', 'stab', 'slice'],
        plural: ['slashes', 'stabs', 'slices']
    },
    mixins: [Game.ItemMixins.Equippable]
});
Game.ItemRepository.define('shortsword', 'equipment', {
    name: 'shortsword',
    character: ')',
    foreground: 'white',
    stats: {
        wieldable: true,
        attack_bonus: 5,
        strength_bonus: 6
    },
    verb: {
        singular: ['slash', 'cut', 'slice'],
        plural: ['slashes', 'cuts', 'slices']
    },
    mixins: [Game.ItemMixins.Equippable]
});
Game.ItemRepository.define('longsword', 'equipment', {
    name: 'longsword',
    character: ')',
    foreground: 'beige',
    stats: {
        wieldable: true,
        attack_bonus: 0,
        strength_bonus: 8
    },
    verb: {
        singular: ['slash', 'cut', 'slice'],
        plural: ['slashes', 'cuts', 'slices']
    },
    mixins: [Game.ItemMixins.Equippable]
});
Game.ItemRepository.define('staff', 'equipment', {
    name: 'staff',
    character: ')',
    foreground: 'yellow',
    stats: {
        wieldable: true,
        attack_bonus: 5,
        strength_bonus: 4,
        defence_bonus: 5
    },
    verb: {
        singular: ['smack', 'crack', 'bonk'],
        plural: ['smacks', 'cracks', 'bonks']
    },
    mixins: [Game.ItemMixins.Equippable]
});

// WEARABLES
Game.ItemRepository.define('tunic', 'equipment', {
    name: 'tunic',
    character: '[',
    foreground: 'green',
    stats: {
        wearable: true,
        defence_bonus: 8
    },
    mixins: [Game.ItemMixins.Equippable]
});
Game.ItemRepository.define('chainmail', 'equipment', {
    name: 'chainmail',
    character: '[',
    foreground: 'white',
    stats: {
        wearable: true,
        defence_bonus: 12
    },
    mixins: [Game.ItemMixins.Equippable]
});
Game.ItemRepository.define('platemail', 'equipment', {
    name: 'platemail',
    character: '[',
    foreground: 'darkorange',
    stats: {
        wearable: true,
        defence_bonus: 16
    },
    mixins: [Game.ItemMixins.Equippable]
});

// FOOD
Game.ItemRepository.define('apple', 'food', {
    name: 'apple',
    character: 'a',
    foreground: 'red',
    description: {
        taste: 'overly ripe'
    },
    edible: {
        value: 50,
    },
    mixins: [Game.ItemMixins.Edible, Game.ItemMixins.HasDescription]
});
Game.ItemRepository.define('hardtack', 'food', {
    name: 'piece of hardtack',
    character: 'h',
    foreground: 'rosybrown',
    description: {
        smell: 'like yeast'
    },
    edible: {
        adjective: 'bland',
        value: 80,
        max_uses: 2
    },
    mixins: [Game.ItemMixins.Edible, Game.ItemMixins.HasDescription]
});
Game.ItemRepository.define('corpse', 'food', {
    name: 'corpse',
    character: '%',
    description: {
        smell: 'putrid',
        taste: 'unpalatable'
    },
    edible: {
        value: 120
    },
    mixins: [Game.ItemMixins.Edible, Game.ItemMixins.HasDescription]
}, {
    disable_random_creation: true
});

// MISC
Game.ItemRepository.define('rock', 'generic', {
    name: 'rock',
    character: '*',
    foreground: 'white',
    stats: {
        wieldable: true,
        attack_bonus: 1
    },
    mixins: [Game.ItemMixins.Equippable]
});