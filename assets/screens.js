Game.Screen = {}

// defines start screen
Game.Screen.start_screen = {
    enter: function() { console.log("Entered start screen."); },
    exit: function() { console.log("Exited start screen."); },
    render: function(display) {
        // renders prompt to screen
        display.drawText(1, 1, "%c{yellow}Rogues in Space");
        display.drawText(1, 2, "Press %c{green}[Enter] %c{}to start.");
    },
    handle_input: function(input_type, input_data) {
        if(input_type === 'keydown') {
            if(input_data.key === 'Enter') {
                Game.switch_screen(Game.Screen.play_screen);
            }
        }
    }
}

Game.Screen.play_screen = {
    _map: null,
    _player: null,
    enter: function() { 
        console.log("Entered play screen.");
        var map = [];
        var map_width = 100;
        var map_height = 100;

        for(var x = 0; x < map_width; x++) {
            map.push([]);
            for(var y = 0; y < map_height; y++) {
                map[x].push(Game.Tile.null_tile);
            }
        }
        var generator = new ROT.Map.Cellular(map_width, map_height);
        generator.randomize(0.5);
        var iterations = 3;
        for(var i = 0; i < iterations - 1; i++) {
            generator.create();
        }
        generator.create(function(x,y,v) {
            if(v === 1) {
                map[x][y] = Game.Tile.floor_tile;
            } else {
                map[x][y] = Game.Tile.wall_tile;
            }
        });
        // Print to console random section of the map for testing.
        for(var x = 0; x < 5; x++) {
            for(var y = 0; y < 5; y++) {
                console.log(map[x][y]);
            }
        }
        // Create player & map from tiles
        this._player = new Game.Entity(Game.PlayerTemplate);
        console.log("Created player template.")
        this._map = new Game.Map(map, this._player);
        console.log("Created map from tiles.");
        this._map.engine().start();
    },
    exit: function() { console.log("Exited play screen."); },
    render: function(display) {
        var top_left_x = Math.max(0, this._player.x() - (Game.width() / 2));
        top_left_x = Math.min(top_left_x, this._map.width() - Game.width());
        var top_left_y = Math.max(0, this._player.y() - (Game.height() / 2));
        top_left_y = Math.min(top_left_y, this._map.height() - Game.height());

        for(let x = top_left_x; x < top_left_x + Game.width(); x++) {
            for(let y = top_left_y; y < top_left_y + Game.height(); y++) {
                var tile = this._map.tile(x, y);
                display.draw(
                    x - top_left_x,
                    y - top_left_y,
                    tile.character(),
                    tile.foreground(),
                    tile.background())
            }
        }
        var entities = this._map.entities();
        for(var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            // Render only if onscreen
            if(entity.x() >= top_left_x && entity.x() < top_left_x + Game.width() &&
            entity.y() >= top_left_y && entity.y() < top_left_y + Game.height()) {
                display.draw(
                    entity.x() - top_left_x,
                    entity.y() - top_left_y,
                    entity.character(),
                    entity.foreground(),
                    entity.background(),
                )
            }
        }
    },
    handle_input: function(input_type, input_data) {
        if(input_type === 'keydown') {
            if(input_data.key === 'ArrowLeft') {
                this.move(-1, 0);
            } else if (input_data.key === 'ArrowRight') {
                this.move(1, 0);
            } else if(input_data.key === 'ArrowUp') {
                this.move(0, -1);
            } else if(input_data.key === 'ArrowDown') {
                this.move(0, 1);
            } else {
                console.log(input_data);
            }
            // Unlock the engine
            this._map.engine().unlock();
        }
    },
    move: function(d_x, d_y) {
        var new_x = this._player.x() + d_x;
        var new_y = this._player.y() + d_y;
        this._player.try_move(new_x, new_y, this._map);
    }
}

Game.Screen.win_screen = {
    enter: function() { console.log("Entered win screen."); },
    exit: function() { console.log("Exited win screen."); },
    render: function(display) {
        for(var i=0; i<22; i++) {
            var r = Math.round(Math.random() * 255);
            var g = Math.round(Math.random() * 255);
            var b = Math.round(Math.random() * 255);
            var background = ROT.Color.toRGB([r, g, b]);
            display.drawText(2, i+1, "%b{" + background + "}You win!");
        }
    },
    handle_input: function(input_type, input_data) {

    }
}

Game.Screen.lose_screen = {
    enter: function() { console.log("Entered lose screen."); },
    exit: function() { console.log("Exited lose screen."); },
    render: function(display) {
        for(var i=0; i<22; i++) {
            display.drawText(2, i+1, "%b{red}You lose.");
        }
    },
    handle_input: function(input_type, input_data) {

    }
}