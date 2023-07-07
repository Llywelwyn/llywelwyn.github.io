Game.Map.BossCavern = function() {
    // Call map constructor
    Game.Map.call(this, this._generate_tiles(30, 30));

    this.add_entity_at_random_position(Game.EntityRepository.create('vampire', 'elite'), 0);
};

Game.Map.BossCavern.extend(Game.Map);

Game.Map.BossCavern.prototype._fill_circle = function(tiles, centre_x, centre_y, radius, tile) {
    // DrawFilledCircle algorithm
    var x = radius;
    var y = 0;
    var x_change = 1 - (radius << 1);
    var y_change = 0;
    var radius_error = 0;

    while (x >= y) {
        for (var i = centre_x - x; i <= centre_x + x; i++) {
            tiles[i][centre_y + y] = tile;
            tiles[i][centre_y - y] = tile;
        }
        for (var i = centre_x - y; i <= centre_x + y; i++) {
            tiles[i][centre_y + x] = tile;
            tiles[i][centre_y - x] = tile;
        }

        y++;
        radius_error += y_change;
        y_change += 2;
        if (((radius_error << 1) + x_change) > 0) {
            x--;
            radius_error += x_change;
            x_change += 2;
        }
    }
};
Game.Map.BossCavern.prototype._generate_tiles = function(width, height) {
    // Create array of empty tiles
    var tiles = new Array(width);
    for (var x = 0; x < width; x++) {
        tiles[x] = new Array(height);
        for (var y = 0; y < height; y++) {
            tiles[x][y] = Game.Tile.cave_wall_tile;
        }
    }

    var generator = new ROT.Map.Uniform(width, height, {timeLimit: 5000});
    generator.create(function(x,y,v) {
        if (v === 0) {
            tiles[x][y] = Game.Tile.floor_tile;
        } else {
            tiles[x][y] = Game.Tile.dungeon_wall_tile;
        }
    });

    // Determine radius of cave to carve out
    var radius = (Math.min(width, height) - 2) / 2;
    this._fill_circle(tiles, width / 2, height / 2, radius, Game.Tile.floor_tile);

    // Randomly position water
    var lakes = Math.round(Math.random() * 3) + 5;
    var max_radius = 5;
    for (var i = 0; i < lakes; i++) {
        // Random position, taking into consideration radius to make sure we are within bounds
        var centre_x = Math.floor(Math.random() * (width - (max_radius * 2)));
        var centre_y = Math.floor(Math.random() * (height - (max_radius * 2)));
        centre_x += max_radius;
        centre_y += max_radius;
        // Random radius
        var radius = Math.floor(Math.random() * max_radius) + 1;
        // Position lake, adding grass half the time
        if (Math.random() < 0.5) {
            this._fill_circle(tiles, centre_x, centre_y, radius--, Game.Tile.grass_tile);
        }
        this._fill_circle(tiles, centre_x, centre_y, radius, Game.Tile.water_tile);
    }
    // Return tiles as array
    return [tiles];
};
Game.Map.BossCavern.prototype.add_entity = function(entity) {
    // Call super
    Game.Map.prototype.add_entity.call(this, entity);
    // If player place random
    if (this.player() === entity) {
        var position = this.random_floor_position(0);
        entity.set_pos(position.x, position.y, 0);
        Game.send_message(entity, "Your foot slips. You bang your head. And you find yourself in a damp cavern.")
        // Start engine
        this.engine().start();
    }
};