Game.Entity = function(properties) {
    properties = properties || {};
    // Call constructor with our properties
    Game.DynamicGlyph.call(this, properties);
    // Instantiate any properties from the passed object
    this._name = properties['name'] || '';
    this._x = properties['x'] || 0;
    this._y = properties['y'] || 0;
    this._z = properties['z'] || 0;
    this._map = null;
    this._alive = true;
};

// Inherit all functionality from dynamic glyphs
Game.Entity.extend(Game.DynamicGlyph);

// Getters
Game.Entity.prototype.x = function() { return this._x; };
Game.Entity.prototype.y = function() { return this._y; };
Game.Entity.prototype.z = function() { return this._z; };
Game.Entity.prototype.map = function() { return this._map; };
Game.Entity.prototype.is_alive = function() { return this._alive; };

// Setters
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

// kill()   -   call on death
Game.Entity.prototype.kill = function(message) {
    // Only kill once
    if (!this.is_alive()) {
        return;
    }
    this._alive = false;
    if (message) {
        Game.send_message(this, message);
    } else {
        Game.send_message(this, "You died!");
    }

    // Check if player died, if so call act method to prompt user
    if (this.has_mixin(Game.EntityMixins.PlayerActor)) {
        this.act();
    } else {
        this.map().remove_entity(this);
    }
};

// try_move(x, y, z, map)   -   Attempt to move
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
            (this.has_mixin(Game.EntityMixins.PlayerActor) || target.has_mixin(Game.EntityMixins.PlayerActor))
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
                Game.send_message(this, "You see %%c{%s}%s%%c{white}.", [items[0].foreground(), items[0].describe_a()]);
            } else {
                Game.send_message(this, "There are several objects here.");
            }
        }
        return true;
    } else if(tile.is_diggable() && this.has_mixin(Game.EntityMixins.Digger)) { // If tile is diggable, dig
        return this.try_dig(x, y, z, tile, map);
    }
    return false;
};