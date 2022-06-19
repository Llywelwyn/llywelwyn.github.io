Game.Map = function(tiles, player) {
    this._tiles = tiles;
    this._width = tiles.length;
    this._height = tiles[0].length;
    // Creates list to hold entities
    this._entities = [];
    // Create engine and scheduler
    this._scheduler = new ROT.Scheduler.Simple();
    console.log("Created scheduler.");
    this._engine = new ROT.Engine(this._scheduler);
    console.log("Created engine.");
    // Add the player
    this.add_entity_at_random_position(player);
    console.log("Added player to start position.");
    for(var i = 0; i < 30; i++) {
        this.add_entity_at_random_position(new Game.Entity(Game.FungusTemplate));
    }
};

// Getters
Game.Map.prototype.width = function() { return this._width; };
Game.Map.prototype.height = function() { return this._height; };
Game.Map.prototype.engine = function() { return this._engine; };
Game.Map.prototype.entities = function() { return this._entities; };

Game.Map.prototype.random_floor_position = function() {
    var x, y;
    do {
        // Generate a random position which is floor & not occupied by an entity
        x = Math.floor(Math.random() * this._height);
        y = Math.floor(Math.random() * this._width);
    } while (!this.is_empty_floor(x, y));
    return {x: x, y: y};
};
Game.Map.prototype.entity_at = function(x, y) {
    for (var i = 0; i < this._entities.length; i++) {
        if (this._entities[i].x() == x && this._entities[i].y() == y) {
            return this._entities[i];
        }
    }
    return false;
};
Game.Map.prototype.add_entity = function(entity) {
    if (entity.x() < 0 || entity.x() >= this._width || entity.y() < 0 || entity.y() >= this._height) {
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
Game.Map.prototype.add_entity_at_random_position = function(entity) {
    var position = this.random_floor_position();
    entity.set_x(position.x);
    entity.set_y(position.y);
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
Game.Map.prototype.is_empty_floor = function(x, y) {
    return this.tile(x, y) == Game.Tile.floor_tile && !this.entity_at(x, y);
};
Game.Map.prototype.dig = function(x, y) {
    if (this.tile(x, y).is_diggable()) {
        this._tiles[x][y] = Game.Tile.floor_tile;
    }
};
Game.Map.prototype.tile = function(x, y) {
    if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
        return Game.Tile.null_tile;
    } else {
        return this._tiles[x][y] || Game.Tile.null_tile;
    }
};