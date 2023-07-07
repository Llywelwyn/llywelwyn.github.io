Game.Map = function (tiles) {
    this._tiles = tiles
    this._depth = tiles.length
    this._width = tiles[0].length
    this._height = tiles[0][0].length
    // Setup fov
    this._fov = []
    this.setup_fov()
    // Creates table to hold entities
    this._entities = {}
    // Create a table to hold items
    this._items = {}
    // Create engine and scheduler
    this._scheduler = new ROT.Scheduler.Action()
    console.log("Created scheduler.")
    this._engine = new ROT.Engine(this._scheduler)
    console.log("Created engine.")
    this._explored = new Array(this._depth)
    this._setup_explored_array()
    this._bloody = new Array(this._depth)
    this._setup_bloody_array()
}

// Getters
Game.Map.prototype.width = function () {
    return this._width
}
Game.Map.prototype.height = function () {
    return this._height
}
Game.Map.prototype.depth = function () {
    return this._depth
}
Game.Map.prototype.is_in_bounds = function (x, y, z) {
    if (x < 0 || x >= this.width() || y < 0 || y >= this.height() || z < 0 || z >= this.depth()) {
        console.log(`Tried to do something out of bounds, so failed. [${x}, ${y}, ${z}]`)
        return false
    }
    return true
}
Game.Map.prototype.player = function () {
    return this._player
}
Game.Map.prototype.engine = function () {
    return this._engine
}
Game.Map.prototype.scheduler = function () {
    return this._scheduler
}
Game.Map.prototype.entities = function () {
    return this._entities
}
Game.Map.prototype.entity_at = function (x, y, z) {
    return this._entities[x + "," + y + "," + z]
}
Game.Map.prototype.tile = function (x, y, z) {
    if (x < 0 || x >= this._width || y < 0 || y >= this._height || z < 0 || z >= this._depth) {
        return Game.Tile.null_tile
    } else {
        return this._tiles[z][x][y] || Game.Tile.null_tile
    }
}
Game.Map.prototype.random_floor_position = function (z) {
    var x, y
    console.log(this._width, this._height)
    do {
        // Generate a random position which is floor & not occupied by an entity
        x = Math.floor(Math.random() * this._height)
        y = Math.floor(Math.random() * this._width)
    } while (!this.is_empty_floor(x, y, z))
    return { x: x, y: y, z: z }
}
Game.Map.prototype.entities_within_radius = function (centre_x, centre_y, centre_z, r) {
    results = []
    // Determine bounds
    var left_x = centre_x - r
    var right_x = centre_x + r
    var top_y = centre_y - r
    var bottom_y = centre_y + r
    // Iterate through entities, add those in bounds
    for (var key in this._entities) {
        var entity = this._entities[key]
        // TODO: Fix 'extend' prototype being added to entities.
        if (
            key !== "extend" &&
            entity.x() >= left_x &&
            entity.x() <= right_x &&
            entity.y() >= top_y &&
            entity.y() <= bottom_y &&
            entity.z() == centre_z
        ) {
            results.push(entity)
        }
    }
    return results
}
Game.Map.prototype.add_entity = function (entity) {
    entity.set_map(this)
    this.update_entity_position(entity)
    // If entity can act, add them to scheduler
    if (entity.has_mixin("Actor")) {
        this._scheduler.add(entity, true, 100)
    }
    if (entity.has_mixin(Game.EntityMixins.PlayerActor)) {
        this._player = entity
    }
}
Game.Map.prototype.add_entity_at_random_position = function (entity, z) {
    var position = this.random_floor_position(z)
    entity.set_x(position.x)
    entity.set_y(position.y)
    entity.set_z(position.z)
    this.add_entity(entity)
}
Game.Map.prototype.remove_entity = function (entity) {
    var key = entity.x() + "," + entity.y() + "," + entity.z()
    if (this._entities[key] == entity) {
        delete this._entities[key]
    }
    // If entity is an actor, remove from scheduler
    if (entity.has_mixin("Actor")) {
        this._scheduler.remove(entity)
    }
    if (entity.has_mixin(Game.EntityMixins.PlayerActor)) {
        this._player = undefined
    }
}
Game.Map.prototype.update_entity_position = function (entity, old_x, old_y, old_z) {
    // Delete old key if it is the same entity and old positions are stored
    if (typeof old_x === "number") {
        var old_key = old_x + "," + old_y + "," + old_z
        if (this._entities[old_key] == entity) {
            delete this._entities[old_key]
        }
    }
    // Make sure within bounds
    if (
        entity.x() < 0 ||
        entity.x() >= this._width ||
        entity.y() < 0 ||
        entity.y() >= this._height ||
        entity.z() < 0 ||
        entity.z() >= this._depth
    ) {
        console.log(entity.name(), entity.x(), entity.y(), entity.z())
        console.log("map: ", this._width, this._height, this._depth)
        throw new Error("Entity's position is out of bounds.")
    }
    // Sanity check
    var key = entity.x() + "," + entity.y() + "," + entity.z()
    if (this._entities[key]) {
        throw new Error("Tried to add an entity at an occupied position: " + key)
    }
    // Add the entity to the table.
    this._entities[key] = entity
}
Game.Map.prototype.is_empty_floor = function (x, y, z) {
    return this.tile(x, y, z) == Game.Tile.floor_tile && !this.entity_at(x, y, z)
}
Game.Map.prototype.dig = function (x, y, z) {
    if (this.tile(x, y, z).is_diggable()) {
        this._tiles[z][x][y] = Game.Tile.floor_tile
    }
}
Game.Map.prototype.open = function (x, y, z) {
    if (this.tile(x, y, z).is_openable()) {
        this._tiles[z][x][y] = Game.Tile.open_door_tile
    }
}
Game.Map.prototype.set_tile = function (x, y, z, tile) {
    this._tiles[z][x][y] = tile
}

// FOV and Fog of War
Game.Map.prototype.setup_fov = function () {
    // Keep this in 'map' so it isn't lost
    var map = this
    // Iterate through each depth
    for (var z = 0; z < this._depth; z++) {
        // Scope to prevent depth being hoisted out of loop
        ;(function () {
            // For each depth, callback to figure out if light can pass through given tile
            var depth = z
            //map._fov.push(new ROT.FOV.DiscreteShadowcasting(function(x, y) { return !map.tile(x, y, depth).is_blocking_light();}, {topology: 4}));
            map._fov.push(
                new ROT.FOV.PreciseShadowcasting(function (x, y) {
                    return !map.tile(x, y, depth).is_blocking_light()
                }),
            )
        })()
    }
}
Game.Map.prototype.fov = function (depth) {
    return this._fov[depth]
}
Game.Map.prototype._setup_explored_array = function () {
    for (var z = 0; z < this._depth; z++) {
        this._explored[z] = new Array(this._width)
        for (var x = 0; x < this._width; x++) {
            this._explored[z][x] = new Array(this._height)
            for (var y = 0; y < this._height; y++) {
                this._explored[z][x][y] = false
            }
        }
    }
}
Game.Map.prototype.set_explored = function (x, y, z, state) {
    // Only update if within bounds
    if (this.tile(x, y, z) !== Game.Tile.null_tile) {
        this._explored[z][x][y] = state
    }
}
Game.Map.prototype.is_explored = function (x, y, z) {
    // Only return if within bounds
    if (this.tile(x, y, z) !== Game.Tile.null_tile) {
        return this._explored[z][x][y]
    } else {
        return false
    }
}
Game.Map.prototype._setup_bloody_array = function () {
    for (var z = 0; z < this._depth; z++) {
        this._bloody[z] = new Array(this._width)
        for (var x = 0; x < this._width; x++) {
            this._bloody[z][x] = new Array(this._height)
            for (var y = 0; y < this._height; y++) {
                this._bloody[z][x][y] = false
            }
        }
    }
}
Game.Map.prototype.set_bloody = function (x, y, z, state) {
    this._bloody[z][x][y] = state
}
Game.Map.prototype.is_bloody = function (x, y, z) {
    return this._bloody[z][x][y]
}

// Item stuff
Game.Map.prototype.items_at = function (x, y, z) {
    return this._items[x + "," + y + "," + z]
}
Game.Map.prototype.set_items_at = function (x, y, z, items) {
    // If array is empty, delete key from table
    var key = x + "," + y + "," + z
    if (items.length === 0) {
        if (this._items[key]) {
            delete this._items[key]
        }
    } else {
        // Update items at key
        this._items[key] = items
    }
}
Game.Map.prototype.add_item = function (x, y, z, item) {
    // If items are in pos already, append
    var key = x + "," + y + "," + z
    if (this._items[key]) {
        this._items[key].push(item)
    } else {
        this._items[key] = [item]
    }
}
Game.Map.prototype.add_item_at_random_position = function (item, z) {
    var position = this.random_floor_position(z)
    this.add_item(position.x, position.y, position.z, item)
}
