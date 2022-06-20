Game.Item = function(properties) {
    properties = properties || {};
    // Call constructor with our properties
    Game.Glyph.call(this, properties);
    // Instantiate properties from passed object
    this._name = properties['name'] || '<unnamed>';
};

// Make items inherit glyphs
Game.Item.extend(Game.Glyph);

// Return info. Could do more than just name later.
Game.Item.prototype.describe = function() {
    return this._name;
};
// Helper function a/an
Game.Item.prototype.describe_a = function(capitalise) {
    // Optional param to capitalize a/an
    var prefixes = capitalise ? ['A', 'An'] : ['a', 'an'];
    var string = this.describe();
    var first_letter = string.charAt(0).toLowerCase();
    // If word starts with a vowel, use an, else use a. not perfect, but pretty good.
    var prefix = 'aeiou'.indexOf(first_letter) >= 0 ? 1 : 0;
    return prefixes[prefix] + ' ' + string;
};