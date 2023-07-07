Game.Item = function(properties) {
    properties = properties || {};
    // Call constructor with our properties
    Game.DynamicGlyph.call(this, properties);
    // Instantiate properties from passed object
};

// Make items inherit functionality from dynamic glyphs
Game.Item.extend(Game.DynamicGlyph);

// Return info. Could do more than just name later.
Game.Item.prototype.describe = function() {
    return this._name;
};