Game.Glyph = function(properties) {
    properties = properties || {};
    this._character = properties['character'] || ' ';
    this._foreground = properties['foreground'] || 'white';
    this._background = properties['background'] || 'black';
};

Game.Glyph.prototype.character = function() { return this._character; };
Game.Glyph.prototype.foreground = function() { return this._foreground; };
Game.Glyph.prototype.background = function() { return this._background; };