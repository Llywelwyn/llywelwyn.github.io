// Item repo for base templates
Game.ItemRepository = new Game.Repository('items', Game.Item);

// Item templates - https://www.w3.org/wiki/CSS/Properties/color/keywords

Game.ItemRepository.define('apple', {
    name: 'apple',
    character: 'a',
    foreground: 'red',
    edible: {
        value: 10,
        max_uses: 1
    },
    mixins: []
});
Game.ItemRepository.define('hardtack', {
    name: 'piece of hardtack',
    character: 'h',
    foreground: 'rosybrown',
    edible: {
        value: 8,
        max_uses: 2
    },
    mixins: []
});
Game.ItemRepository.define('rock', {
    name: 'rock',
    character: '*',
    foreground: 'white'
});