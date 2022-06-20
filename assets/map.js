Game.Map = function(tiles, player) {
    this._tiles = tiles;
    this._depth = tiles.length;
    this._width = tiles[0].length;
    this._height = tiles[0][0].length;
    // Setup fov
    this._fov = [];
    this.setup_fov();
    // Creates list to hold entities
    this._entities = [];
    // Create engine and scheduler
    this._scheduler = new ROT.Scheduler.Simple();
    console.log("Created scheduler.");
    this._engine = new ROT.Engine(this._scheduler);
    console.log("Created engine.");
    // Add the player
    this.add_entity_at_random_position(player, 0);
    console.log("Added player to start position.");
    // Add fungi
    for (var z = 0; z < this._depth; z++) {
        for(var i = 0; i < 30; i++) {
            this.add_entity_at_random_position(new Game.Entity(Game.FungusTemplate), z);
        }
    }
    console.log("Added fungi.");
    // Setup explored tiles
    this._explored = new Array(this._depth);
    this._setup_explored_array();
};

// Getters
Game.Map.prototype.width = function() { return this._width; };
Game.Map.prototype.height = function() { return this._height; };
Game.Map.prototype.depth = function() { return this._depth; };
Game.Map.prototype.engine = function() { return this._engine; };
Game.Map.prototype.entities = function() { return this._entities; };
Game.Map.prototype.tile = function(x, y, z) {
    if (
        x < 0 || x >= this._width ||
        y < 0 || y >= this._height ||
        z < 0 || z >= this._depth
    ) {
        return Game.Tile.null_tile;
    } else {
        return this._tiles[z][x][y] || Game.Tile.null_tile;
    }
};
Game.Map.prototype.random_floor_position = function(z) {
    var x, y;
    do {
        // Generate a random position which is floor & not occupied by an entity
        x = Math.floor(Math.random() * this._height);
        y = Math.floor(Math.random() * this._width);
    } while (!this.is_empty_floor(x, y, z));
    return {x: x, y: y, z: z};
};
Game.Map.prototype.entity_at = function(x, y, z) {
    for (var i = 0; i < this._entities.length; i++) {
        if (
            this._entities[i].x() == x &&
            this._entities[i].y() == y &&
            this._entities[i].z() == z
        ) {
            return this._entities[i];
        }
    }
    return false;
};
Game.Map.prototype.entities_within_radius = function(centre_x, centre_y, centre_z, r) {
    results = [];
    // Determine bounds
    var left_x = centre_x - r;
    var right_x = centre_x + r;
    var top_y = centre_y - r;
    var bottom_y = centre_y + r;
    // Iterate through entities, add those in bounds
    for (var i = 0; i < this._entities.length; i++) {
        if (
            this._entities[i].x() >= left_x &&
            this._entities[i].x() <= right_x &&
            this._entities[i].y() >= top_y &&
            this._entities[i].y() <= bottom_y &&
            this._entities[i].z() == centre_z
        ) {
            results.push(this._entities[i]);
        }
    }
    return results;
};
Game.Map.prototype.add_entity = function(entity) {
    if (
        entity.x() < 0 || entity.x() >= this._width ||
        entity.y() < 0 || entity.y() >= this._height ||
        entity.z() < 0 || entity.z() >= this._depth
    ) {
        throw new Error('Adding entity out of bounds.');
    }
    // Update entity's map and add to list of entities
    entity.set_map(this);
    this._entities.push(entity);
    // If entity can act, add them to scheduler
    if (entity.has_mixin('Actor')) {
        this._scheduler.add(entity, true);
    }
};
Game.Map.prototype.add_entity_at_random_position = function(entity, z) {
    var position = this.random_floor_position(z);
    entity.set_x(position.x);
    entity.set_y(position.y);
    entity.set_z(position.z);
    this.add_entity(entity);
};
Game.Map.prototype.remove_entity = function(entity) {
    for (var i = 0; i < this._entities.length; i++) {
        if (this._entities[i] == entity) {
            this._entities.splice(i, 1);
            break;
        }
    }
    if (entity.has_mixin('Actor')) {
        this._scheduler.remove(entity);
    }
};
Game.Map.prototype.is_empty_floor = function(x, y, z) {
    return this.tile(x, y, z) == Game.Tile.floor_tile && !this.entity_at(x, y, z);
};
Game.Map.prototype.dig = function(x, y, z) {
    if (this.tile(x, y, z).is_diggable()) {
        this._tiles[z][x][y] = Game.Tile.floor_tile;
    }
};

// FOV and Fog of War
Game.Map.prototype.setup_fov = function() {
    // Keep this in 'map' so it isn't lost
    var map = this;
    // Iterate through each depth
    for (var z = 0; z < this._depth; z++) {
        // Scope to prevent depth being hoisted out of loop
        (function() {
            // For each depth, callback to figure out if light can pass through given tile
            var depth = z;
            //map._fov.push(new ROT.FOV.DiscreteShadowcasting(function(x, y) { return !map.tile(x, y, depth).is_blocking_light();}, {topology: 4}));
            map._fov.push(new ROT.FOV.PreciseShadowcasting(function(x, y) { return !map.tile(x, y, depth).is_blocking_light();}))
        })();
    }
};
Game.Map.prototype.fov = function(depth) {
    return this._fov[depth];
};
Game.Map.prototype._setup_explored_array = function() {
    for (var z= 0; z < this._depth; z++) {
        this._explored[z] = new Array(this._width);
        for (var x = 0; x < this._width; x++) {
            this._explored[z][x] = new Array(this._height);
            for (var y = 0; y < this._height; y++) {
                this._explored[z][x][y] = false;
            }
        }
    }
};
Game.Map.prototype.set_explored = function(x, y, z, state) {
    // Only update if within bounds
    if (this.tile(x, y, z) !== Game.Tile.null_tile) {
        this._explored[z][x][y] = state;
    }
};
Game.Map.prototype.is_explored = function(x, y, z) {
    // Only return if within bounds
    if (this.tile(x, y, z) !== Game.Tile.null_tile) {
        return this._explored[z][x][y];
    } else {
        return false;
    }
};