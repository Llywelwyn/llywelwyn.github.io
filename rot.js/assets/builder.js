Game.Builder = function(width, height, depth) {
    this._width = width;
    this._height = height;
    this._depth = depth;
    this._tiles = new Array(depth);
    this._regions = new Array(depth);
    this._floor_type = [];

    // Instantiate arrays as multi-dimensional
    for (var z = 0; z < depth; z++) {
        // Create each level
        if (Math.random() < 0.6) {
            this._tiles[z] = this._generate_cave();
            this._floor_type.push('Cave');
            console.log(this._removes);
        } else {
            this._tiles[z] = this._generate_uniform();
            this._floor_type.push('Uniform')
        }
        // Setup regions array for each depth
        this._regions[z] = new Array(width);
        for (var x = 0; x < width; x++) {
            this._regions[z][x] = new Array(height);
            // Fill with zeroes
            for (var y = 0; y < height; y++) {
                this._regions[z][x][y] = 0;
            }
        }
    }
    for (var z = 0; z < this._depth; z++) {
        this._setup_regions(z, this._floor_type[z]);
    }
    this._connect_all_regions();
};

//Getters
Game.Builder.prototype.tiles = function() { return this._tiles; };
Game.Builder.prototype.depth = function() { return this._depth; };
Game.Builder.prototype.width = function() { return this._width; };
Game.Builder.prototype.height = function() { return this._height; };
Game.Builder.prototype._generate_empty_floor = function() {
        // Create empty map
        var map = new Array(this._width);
        for (var w = 0; w < this._width; w++) {
            map[w] = new Array(this._height);
        }
        return map;
}
Game.Builder.prototype._generate_cave = function() {
    var map = this._generate_empty_floor();
    // Cave generator
    var generator = new ROT.Map.Cellular(this._width, this._height);
    generator.randomize(0.5);
    var iterations = 3;
    for(var i = 0; i < iterations - 1; i++) {
        generator.create();
    }
    generator.create(function(x,y,v) {
        if(v === 1) {
            map[x][y] = Game.Tile.floor_tile;
        } else {
            map[x][y] = Game.Tile.cave_wall_tile;
        }
    });
    return map;
};
Game.Builder.prototype._generate_uniform = function() {
    // Create empty map for floor
    var map = this._generate_empty_floor();
    // Generate uniform
    var generator = new ROT.Map.Uniform(this._width, this._height, {roomDugPercentage: 0.2, timeLimit: 5000});
    generator.create(function(x,y,v) {
        if (v === 0) {
            map[x][y] = Game.Tile.floor_tile;
        } else {
            map[x][y] = Game.Tile.dungeon_wall_tile;
        }
    });

    var rooms = generator.getRooms();

    for (var i = 0; i < rooms.length; i++) {
        var room = rooms[i];
        room.getDoors( // Should reuse this. It's pretty good.
            function(x, y) {
                if(x && y) {
                    if (Math.random() < 0.7) {
                        if (
                            map[x+1][y] === Game.Tile.floor_tile && map[x-1][y] === Game.Tile.floor_tile &&
                            map[x][y+1] === Game.Tile.dungeon_wall_tile && map[x][y-1] === Game.Tile.dungeon_wall_tile
                        ) {
                            map[x][y] = Game.Tile.door_tile;
                        } else if (
                            map[x][y+1] === Game.Tile.floor_tile && map[x][y-1] === Game.Tile.floor_tile &&
                            map[x+1][y] === Game.Tile.dungeon_wall_tile && map[x-1][y] === Game.Tile.dungeon_wall_tile
                        ) {
                            map[x][y] = Game.Tile.door_tile;
                        }
                    }
                }
            }
        );
    }

    return map;
};

Game.Builder.prototype._can_fill_region = function(x, y, z) {
    // Check if tile is within bounds
    if (
        x < 0 || x >= this._width ||
        y < 0 || y >= this._height ||
        z < 0 || z >= this._depth
    ) {
        return false;
    }
    // Check if tile currently has a region
    if (this._regions[z][x][y] != 0) {
        return false;
    }
    // Check if tile is walkable
    return this._tiles[z][x][y].is_walkable();
};
Game.Builder.prototype._fill_region = function(region, x, y, z) {
    var tiles_filled = 1;
    var tiles = [{x:x, y:y}];
    var tile;
    var neighbours;
    // Update region of original tile
    this._regions[z][x][y] = region;
    // Loop while we still have tiles to process
    while (tiles.length > 0) {
        tile = tiles.pop();
        // Get neighbours
        neighbours = Game.neighbour_positions(tile.x, tile.y);
        // Iterate through each neighbour, attempting to fill
        while (neighbours.length > 0) {
            tile = neighbours.pop();
            if (this._can_fill_region(tile.x, tile.y, z)) {
                this._regions[z][tile.x][tile.y] = region;
                tiles.push(tile);
                tiles_filled++;
            }
        }
    }
    return tiles_filled;
};
Game.Builder.prototype._remove_region = function(region, z) {
    for (var x = 0; x < this._width; x++) {
        for (var y = 0; y < this._height; y++) {
            if (this._regions[z][x][y] == region) {
                // Clear region and set tiles to wall
                this._regions[z][x][y] = 0;
                this._tiles[z][x][y] = Game.Tile.cave_wall_tile;
            }
        }
    }
};
Game.Builder.prototype._setup_regions = function(z, floor_type, min_size = 20) {
    var region = 1;
    var tiles_filled;
    console.log(z, floor_type)
    // Iterate through each tile, searching for starting point
    for (var x = 0; x < this._width; x++) {
        for (var y = 0; y < this._height; y++) {
            if (this._can_fill_region(x, y, z)) {
                // Try to fill
                tiles_filled = this._fill_region(region, x, y, z);
                // If too small, remove it
                if (tiles_filled <= min_size && floor_type === 'Cave') {
                    this._remove_region(region, z);
                } else {
                    region++;
                }
            }
        }
    }
};
Game.Builder.prototype._find_region_overlaps = function(z, r1, r2) {
    var matches = [];
    // Iterate through all tiles, checking if they respect region constraints
    // and are floor tiles.
    for (var x = 0; x < this._width; x++) {
        for (var y = 0; y < this._height; y++) {
            if (
                this._tiles[z][x][y] == Game.Tile.floor_tile &&
                this._tiles[z+1][x][y] == Game.Tile.floor_tile &&
                this._regions[z][x][y] == r1 &&
                this._regions[z+1][x][y] == r2
            ) {
                matches.push({x: x, y: y});
            }
        }
    }
    // Shuffle to prevent bias
    return shuffle(matches);
};
Game.Builder.prototype._connect_regions = function(z, r1, r2) {
    var overlap = this._find_region_overlaps(z, r1, r2);
    // Make sure there was overlap
    if (overlap.length == 0) {
        return false;
    }
    // Select first tile from overlap
    var point = overlap[0];
    // Replace with stairs
    this._tiles[z][point.x][point.y] = Game.Tile.stairs_down_tile;
    this._tiles[z+1][point.x][point.y] = Game.Tile.stairs_up_tile;
    return true;
};
Game.Builder.prototype._connect_all_regions = function() {
    for (var z = 0; z < this._depth - 1; z++) {
        // Iterate through each tile, if we haven't tried
        // to connect the region then try. Store connected
        // properties as strings for quick lookups.
        var connected = {};
        var key;
        var connections = 0;
        do {
            for (var x = 0; x < this._width; x++) {
                for(var y = 0; y < this._height; y++) {
                    key = this._regions[z][x][y] + ',' + this._regions[z+1][x][y];
                    if (
                        this._tiles[z][x][y] == Game.Tile.floor_tile &&
                        this._tiles[z+1][x][y] == Game.Tile.floor_tile &&
                        !connected[key] && Math.random() < 0.05 // 5% chance
                    ) {
                        // Both tiles are floor, haven't already connected, try
                        this._connect_regions(z, this._regions[z][x][y],
                            this._regions[z+1][x][y]);
                        connected[key] = true;
                        connections++;
                    }
                }
            }
        } while (connections === 0);
    }
};
