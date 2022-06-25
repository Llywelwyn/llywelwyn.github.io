Game.Tile = function(properties) {
    properties = properties || {};
    Game.Glyph.call(this, properties);

    this._name = properties['name'] || '<unnamed>';
    this._walkable = properties['walkable'] || false;
    this._diggable = properties['diggable'] || false;
    this._blocks_light = (properties['blocks_light'] !== undefined) ? properties['blocksLight'] : true;
    this._bloody = properties['bloody'] || false;
};

Game.Tile.extend(Game.DynamicGlyph);

// Getters
Game.Tile.prototype.character = function() { return this._character; };
Game.Tile.prototype.is_walkable = function() { return this._walkable; };
Game.Tile.prototype.is_diggable = function() { return this._diggable; };
Game.Tile.prototype.is_blocking_light = function() {return this._blocks_light; };

// Tiles - https://www.w3.org/wiki/CSS/Properties/color/keywords

// Generic
Game.Tile.null_tile = new Game.Tile({});
Game.Tile.floor_tile = new Game.Tile({
    name: 'floor',
    character: '.',
    foreground: ['grey', 'dimgray', 'slategrey'],
    walkable: true,
    blocks_light: false
});
Game.Tile.cave_wall_tile = new Game.Tile({
    name: 'wall',
    character: '#',
    foreground: ['goldenrod', 'darkgoldenrod', 'brown'],
    diggable: true
});
Game.Tile.dungeon_wall_tile = new Game.Tile({
    name: 'dungeon wall',
    character: '#',
    foreground: 'darkgrey',
});
Game.Tile.stairs_up_tile = new Game.Tile({
    name: 'stairs',
    character: '<',
    foreground: 'white',
    walkable: true,
    blocks_light: false
});
Game.Tile.stairs_down_tile = new Game.Tile({
    name: 'stairs',
    character: '>',
    foreground: 'white',
    walkable: true,
    blocks_light: false
});
Game.Tile.hole_down_tile = new Game.Tile({
    name: 'great dark hole',
    character: 'O',
    foreground: 'white',
    walkable: true,
    blocks_light: false
});
Game.Tile.water_tile = new Game.Tile({
    name: 'water',
    character: '~',
    foreground: 'blue',
    background: '#060B44',
    swimmable: true,
    blocks_light: false
})
