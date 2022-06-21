// Item repo for base templates
Game.ItemRepository = new Game.Repository('items', Game.Item);

// Item templates - https://www.w3.org/wiki/CSS/Properties/color/keywords

// WEAPONS
Game.ItemRepository.define('dagger', {
    name: 'dagger',
    character: ')',
    foreground: 'gray',
    equip: {
        wieldable: true,
        attack_bonus: 10
    },
    mixins: [Game.ItemMixins.Equippable]
}, {
    disable_random_creation: true
});
Game.ItemRepository.define('sword', {
    name: 'sword',
    character: ')',
    foreground: 'white',
    equip: {
        wieldable: true,
        attack_bonus: 5,
        strength_bonus: 5
    },
    mixins: [Game.ItemMixins.Equippable]
}, {
    disable_random_creation: true
});
Game.ItemRepository.define('staff', {
    name: 'staff',
    character: ')',
    foreground: 'gray',
    equip: {
        wieldable: true,
        attack_bonus: 3,
        defence_bonus: 3
    },
    mixins: [Game.ItemMixins.Equippable]
}, {
    disable_random_creation: true
});

// FOOD
Game.ItemRepository.define('apple', {
    name: 'apple',
    character: 'a',
    foreground: 'red',
    edible: {
        value: 50,
    },
    mixins: [Game.ItemMixins.Edible]
});
Game.ItemRepository.define('hardtack', {
    name: 'piece of hardtack',
    character: 'h',
    foreground: 'rosybrown',
    edible: {
        value: 80,
        max_uses: 2
    },
    mixins: [Game.ItemMixins.Edible]
});
Game.ItemRepository.define('corpse', {
    name: 'corpse',
    character: '%',
    edible: {
        value: 120
    },
    mixins: [Game.ItemMixins.Edible]
}, {
    disable_random_creation: true
});

// MISC
Game.ItemRepository.define('rock', {
    name: 'rock',
    character: '*',
    foreground: 'white'
});