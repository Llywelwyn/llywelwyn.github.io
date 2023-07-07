Game.Glyph = function(properties) {
    properties = properties || {};
    this._character = properties['character'] || ' ';
    this._foreground = one_of(properties['foreground']) || 'white';
    this._background = one_of(properties['background']) || 'black';
};

Game.Glyph.prototype.character = function() { return this._character; };
Game.Glyph.prototype.foreground = function() { return this._foreground; };
Game.Glyph.prototype.background = function() { return this._background; };
Game.Glyph.prototype.representation = function() { return '%c{' + this._foreground + '}%b{' + this._background + '}' + this._character + '%c{white}%b{black}'; }