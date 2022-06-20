// Item repo for base templates
Game.ItemRepository = new Game.Repository('items', Game.Item);

Game.ItemRepository.define('apple', {
    name: 'apple',
    character: 'a',
    foreground: 'red'
});
Game.ItemRepository.define('rock', {
    name: 'rock',
    character: '*',
    foreground: 'white'
});