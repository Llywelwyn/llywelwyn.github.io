Game.Tile = function(properties) {
    properties = properties || {};
    Game.Glyph.call(this, properties);

    this._walkable = properties['walkable'] || false;
    this._diggable = properties['diggable'] || false;
    this._blocks_light = (properties['blocks_light'] !== undefined) ? properties['blocksLight'] : true;
};

Game.Tile.extend(Game.Glyph);

// Getters
Game.Tile.prototype.is_walkable = function() { return this._walkable; };
Game.Tile.prototype.is_diggable = function() { return this._diggable; };
Game.Tile.prototype.is_blocking_light = function() {return this._blocks_light; };

// Tiles - https://www.w3.org/wiki/CSS/Properties/color/keywords

// Generic
Game.Tile.null_tile = new Game.Tile({});
Game.Tile.floor_tile = new Game.Tile({
    character: '.',
    foreground: ['grey', 'dimgray', 'slategrey'],
    walkable: true,
    blocks_light: false
});
Game.Tile.cave_wall_tile = new Game.Tile({
    character: '#',
    foreground: ['goldenrod', 'darkgoldenrod', 'brown'],
    diggable: true
});
Game.Tile.dungeon_wall_tile = new Game.Tile({
    character: '#',
    foreground: 'darkgrey',
});
Game.Tile.stairs_up_tile = new Game.Tile({
    character: '<',
    foreground: 'white',
    walkable: true,
    blocks_light: false
});
Game.Tile.stairs_down_tile = new Game.Tile({
    character: '>',
    foreground: 'white',
    walkable: true,
    blocks_light: false
});
