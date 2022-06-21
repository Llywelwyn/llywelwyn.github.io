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
    // Save current position
    var old_x = this._x;
    var old_y = this._y;
    var old_z = this._z;
    // Update position
    this._x = x;
    this._y = y;
    this._z = z;
    // If entity is on a map, notify the map of new position
    if (this._map) {
        this._map.update_entity_position(this, old_x, old_y, old_z);
    }
}
Game.Entity.prototype.try_move = function(x, y, z, map) {
    var map = this.map();
    var tile = map.tile(x, y, this.z());
    var target = map.entity_at(x, y, this.z());
    // If z-level changed, check if we are on stairs
    if (z < this.z()) {
        if (tile != Game.Tile.stairs_up_tile) {
            Game.send_message(this, "You can't go up here!");
            return false;
        } else {
            Game.send_message(this, "You ascend up to level %d!", [z]); // TODO: ?? [z+1]?
        }
    } else if ( z > this.z()) {
        if (tile != Game.Tile.stairs_down_tile) {
            Game.send_message(this, "You can't go down here!");
            return false;
        } else {
            Game.send_message(this, "You descend to level %d.", [z]);
        }
    }
    // If entity is present at tile, try attack
    if(target && target != this) {
        // this must be an Attacker, and either be the PlayerActor or be attacking the PlayerActor
        if(
            this.has_mixin('Attacker') &&
            (this.has_mixin(Game.Mixins.PlayerActor) || target.has_mixin(Game.Mixins.PlayerActor))
        ) {
            this.attack(target);
            return true;
        } else {
            return false;
        }
    } else if(tile.is_walkable()) { // If tile is walkable, move
        this.set_pos(x, y, z)
        // Check for items on this position
        var items = this.map().items_at(x, y, z);
        if (items) {
            if (items.length === 1) {
                Game.send_message(this, "You see %s.", [items[0].describe_a()]);
            } else {
                Game.send_message(this, "There are several objects here.");
            }
        }
        return true;
    } else if(tile.is_diggable() && this.has_mixin(Game.Mixins.Digger)) { // If tile is diggable, dig
        return this.try_dig(x, y, z, tile, map);
    }
    return false;
};
Game.Entity.prototype.has_mixin = function(o) {
    if(typeof o === 'object') {
        return this._attached_mixins[o.name];
    } else {
        return this._attached_mixins[o] || this._attached_mixin_groups[o];
    }
};