// Item repo for base templates
Game.ItemRepository = new Game.Repository('items', Game.Item);

// Item templates - https://www.w3.org/wiki/CSS/Properties/color/keywords

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
Game.ItemRepository.define('rock', {
    name: 'rock',
    character: '*',
    foreground: 'white'
});