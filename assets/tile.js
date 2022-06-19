Game.Tile = function(properties) {
    properties = properties || {};
    Game.Glyph.call(this, properties);

    this._is_walkable = properties['is_walkable'] || false;
    this._is_diggable = properties['is_diggable'] || false;
};

Game.Tile.extend(Game.Glyph);

// Getters
Game.Tile.prototype.is_walkable = function() { return this._is_walkable; };
Game.Tile.prototype.is_diggable = function() { return this._is_diggable; };

// Tiles - https://www.w3.org/wiki/CSS/Properties/color/keywords
Game.Tile.null_tile = new Game.Tile({});
Game.Tile.floor_tile = new Game.Tile({
    character: '.',
    foreground: 'grey',
    is_walkable: true
});
Game.Tile.wall_tile = new Game.Tile({
    character: '#',
    foreground: 'goldenrod',
    is_diggable: true
});
