Game.Entity = function(properties) {
    properties = properties || {};
    // Call constructor with our properties
    Game.Glyph.call(this, properties);
    // Instantiate any properties from the passed object
    this._name = properties['name'] || '';
    this._x = properties['x'] || 0;
    this._y = properties['y'] || 0;
    this._z = properties['z'] || 0;
    this._map = null;
    // Object to track maxins attached to entity based on name
    this._attached_mixins = {};
    this._attached_mixin_groups = {};
    // Setup mixins
    var mixins = properties['mixins'] || [];
    for(var i = 0; i < mixins.length; i++) {
        // Copy properties of each mixin (minus name) without overriding existing properties
        for(var key in mixins[i]) {
            if(key != 'init' && key != 'name' && !this.hasOwnProperty(key)) {
                this[key] = mixins[i][key];
            }
        }
        // Add name to attached mixins
        this._attached_mixins[mixins[i].name] = true;
        // Add group name is present
        if(mixins[i].group_name) {
            this._attached_mixin_groups[mixins[i].group_name] = true;
        }
        // Call init if one exists
        if(mixins[i].init) {
            mixins[i].init.call(this, properties);
        }
    }
};

Game.Entity.extend(Game.Glyph);

// Getters
Game.Entity.prototype.name = function() { return this._name; };
Game.Entity.prototype.x = function() { return this._x; };
Game.Entity.prototype.y = function() { return this._y; };
Game.Entity.prototype.z = function() { return this._z; };
Game.Entity.prototype.map = function() { return this._map; };

// Setters
Game.Entity.prototype.set_name = function(name) { this._name = name; };
Game.Entity.prototype.set_x = function(x) { this._x = x; };
Game.Entity.prototype.set_y = function(y) { this._y = y; };
Game.Entity.prototype.set_z = function(z) { this._z = z; };
Game.Entity.prototype.set_map = function(map) { this._map = map; };
Game.Entity.prototype.set_pos = function(x, y, z) {
    this._x = x; this._y = y; this._z = z;
}

Game.Entity.prototype.has_mixin = function(o) {
    if(typeof o === 'object') {
        return this._attached_mixins[o.name];
    } else {
        return this._attached_mixins[o] || this._attached_mixin_groups[o];
    }
};