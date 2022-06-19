Game.Screen = {}

// defines start screen
Game.Screen.start_screen = {
    enter: function() { console.log("Entered start screen."); },
    exit: function() { console.log("Exited start screen."); },
    render: function(display) {
        // renders prompt to screen
        // TODO: FUNCTIONS, FUNCTIONS, FUNCTIONS. OR JSON.
        display.drawText(Game.width()/2 - Game.title().length/2, Game.height()/2 - 3, "%c{yellow}" + Game.title());
        display.drawText(Game.width()/2 - (Game.start_message().length-22)/2, Game.height()/2 + 4, "%c{white}" + Game.start_message());
        display.drawText(Game.width()/2 - "╔═ CONTROLS ══════════════════════════╗".length/2, Game.height()/2 - 1,
            `%c{white}Movement           -       %c{seagreen}[Arrow Keys]
            %c{white}Ascend/Descend     -            %c{seagreen}[>]%c{white}/%c{seagreen}[<]
            %c{white}Wait               -                %c{seagreen}[.]
            %c{white}Controls           -                %c{seagreen}[?]`
                );
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
    _help: false,
    enter: function() { 
        console.log("Entered play screen.");
        var width = 80;
        var height = 80;
        var depth = 6;
        // Create map from the tiles and player
        var tiles = new Game.Builder(width, height, depth).tiles();
        this._player = new Game.Entity(Game.PlayerTemplate);
        this._map = new Game.Map(tiles, this._player);
        this._map.engine().start();
    },
    exit: function() { console.log("Exited play screen."); },
    render: function(display) {
        var top_left_x = Math.max(0, this._player.x() - (Game.width() / 2));
        top_left_x = Math.min(top_left_x, this._map.width() - Game.width());
        var top_left_y = Math.max(0, this._player.y() - (Game.height() / 2));
        top_left_y = Math.min(top_left_y, this._map.height() - Game.height());
        // Iterate through all visible tiles
        for(let x = top_left_x; x < top_left_x + Game.width(); x++) {
            for(let y = top_left_y; y < top_left_y + Game.height(); y++) {
                var tile = this._map.tile(x, y, this._player.z());
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
            entity.y() >= top_left_y && entity.y() < top_left_y + Game.height() &&
            entity.z() == this._player.z()) {
                display.draw(
                    entity.x() - top_left_x,
                    entity.y() - top_left_y,
                    entity.character(),
                    entity.foreground(),
                    entity.background(),
                )
            }
        }
        // Get messages in player queue and renders
        var messages = this._player.messages();
        var message_x = 0;
        var message_y = 0;
        for (var i = 0; i < messages.length; i++) {
            message_y += display.drawText(
                message_x,
                message_y,
                '%c{white}%b{black}' + messages[i]
            )
        }
        // Render player HP - TODO: Actual functions, make all this modular instead of hardcoded terribleness
        var stats = '%c{white}%b{black}';
        var stats_x = 1;
        var stats_y = Game.height();
        stats += vsprintf('HP: %d/%d ', [this._player.hp(), this._player.max_hp()]);
        stats += vsprintf('                         Floor: %d', [this._player.z()]);
        display.drawText(stats_x, stats_y, stats);
        var help_message = "%c{white}Press %c{green}[?]%c{white} for help"
        display.drawText(Game.width() - 19, Game.height(), help_message)

        var help_x;
        var help_y;
        if(this._help) { // TODO: Make a function for drawing boxes (w/ text)
            display.drawText(5, 5, `
            %c{yellow}╔═ %c{white}CONTROLS%c{yellow} ══════════════════════════════╗
            ║                                         ║
            ║ %c{white}Movement           -       %c{seagreen}[Arrow Keys]%c{yellow} ║
            ║ %c{white}Ascend/Descend     -            %c{seagreen}[>]%c{white}/%c{seagreen}[<]%c{yellow} ║
            ║ %c{white}Wait               -                %c{seagreen}[.]%c{yellow} ║
            ║ %c{white}Controls           -                %c{seagreen}[?]%c{yellow} ║
            ║                                         ║
            ╚════════════════════ %c{white}Press %c{seagreen}[?]%c{white} to close%c{yellow} ═╝`
                );
        }
    },
    handle_input: function(input_type, input_data) {
        if (input_type === 'keydown') {
            if (input_data.key === 'ArrowLeft') {
                this.move(-1, 0, 0);
            } else if (input_data.key === 'ArrowRight') {
                this.move(1, 0, 0);
            } else if(input_data.key === 'ArrowUp') {
                this.move(0, -1, 0);
            } else if(input_data.key === 'ArrowDown') {
                this.move(0, 1, 0);
            } else if(input_data.key == '.') {
                this.wait(); // Pass
            } else if(input_data.key == '>') {
                this.move(0, 0, 1);
            } else if(input_data.key == '<') {
                this.move(0, 0, -1);
            } else if(input_data.key == '?') {
                this._help = !this._help;
                Game.refresh();
                return;
            } else {
                console.log(input_data);
                return;
            }
            // Close the help menu
            this._help = false;
            // Unlock the engine
            this._map.engine().unlock();
        }
    },
    move: function(d_x, d_y, d_z) {
        var new_x = this._player.x() + d_x;
        var new_y = this._player.y() + d_y;
        var new_z = this._player.z() + d_z;
        this._player.try_move(new_x, new_y, new_z, this._map);
    },
    wait: function() { this._player.wait(); }
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