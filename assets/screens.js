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
    _game_ended: false,
    _sub_screen: null,
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
        // Render subscreen if one exists
        if (this._sub_screen) {
            this._sub_screen.render(display);
            return;
        }
        // Make sure we still have enough space to fit the game screen
        var top_left_x = Math.max(0, this._player.x() - (Game.width() / 2));
        top_left_x = Math.min(top_left_x, this._map.width() - Game.width());
        var top_left_y = Math.max(0, this._player.y() - (Game.height() / 2));
        top_left_y = Math.min(top_left_y, this._map.height() - Game.height());
        // Object to store visible map cells
        var visible_cells = {};
        // Store this._map and player-z to prevent losing in callback
        var map = this._map;
        var current_z = this._player.z();
        // Find all visible cells and update the object
        map.fov(current_z).compute(
            this._player.x(), this._player.y(),
            this._player.sight_radius(),
            function(x, y, radius, visibility) {
                visible_cells[x + "," + y] = true;
                map.set_explored(x, y, current_z, true);
            });
        // Render explored + visible tiles
        for(let x = top_left_x; x < top_left_x + Game.width(); x++) {
            for(let y = top_left_y; y < top_left_y + Game.height(); y++) {
                if (map.is_explored(x, y, current_z)) {
                    // Fetch glyph for tile and render at offset position
                    var glyph = this._map.tile(x, y, this._player.z());
                    // We are in a cell in FOV, check for items/entities
                    if (visible_cells[x + ',' + y]) {
                        var items = map.items_at(x, y, current_z);
                        // if(items), render topmost
                        if (items) {
                            glyph = items[items.length - 1];
                        }
                        // Check for entities
                        if (map.entity_at(x, y, current_z)) {
                            glyph = map.entity_at(x, y, current_z);
                        }
                        // Update foreground in case of glyph change
                        foreground = glyph.foreground();
                    } else {
                        // If tile is explored but !visible, darken foreground
                        // with an amount inverse to its brightness - prevents tiles becoming entirely black. 
                        var darken_multiplier = 60;
                        foreground = tinycolor(glyph.foreground()).darken((tinycolor(glyph.foreground()).getBrightness() / 255) * darken_multiplier);
                    }
                    display.draw(
                        x - top_left_x,
                        y - top_left_y,
                        glyph.character(),
                        foreground,
                        glyph.background()
                    );
                }
            }
        }
        // Render entities
        // FIXME: Final entry of entities = [[Prototype]]: Object. Why?
        var entities = this._map.entities();
        for (var key in entities) {
            var entity = entities[key];
            // Render if entity would show up on screen
            if(
                key != 'extend' && // FIXME: this is atrocious
                entity.x() >= top_left_x && entity.x() < top_left_x + Game.width() &&
                entity.y() >= top_left_y && entity.y() < top_left_y + Game.height() &&
                entity.z() == this._player.z()
            ) {
                if(visible_cells[entity.x() + ',' + entity.y()]) {
                    display.draw(
                        entity.x() - top_left_x,
                        entity.y() - top_left_y,
                        entity.character(),
                        entity.foreground(),
                        entity.background()
                    );
                }
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
        // Render player stats - TODO: Actual functions, make all this modular instead of hardcoded terribleness
        var stats = '%c{white}%b{black}';
        var stats_x = 1;
        var stats_y = Game.height();
        stats += vsprintf('HP: %d/%d ', [this._player.hp(), this._player.max_hp()]);
        display.drawText(stats_x, stats_y, stats);

        // Render hunger
        if (this._player.has_mixin('HasHunger')) {
            var hunger_state = this._player.hunger_state()[0];
            var hunger_state_formatted = this._player.hunger_state()[1];
            display.drawText(Game.width() - 1 - hunger_state.length, Game.height(), hunger_state_formatted);
        }

        // Render all this other shit
        //var help_message = "%c{white}Press %c{seagreen}[?]%c{white} for help"
        //display.drawText(Game.width() - 19, Game.height(), help_message)
        if(this._help) { // TODO: Make a function for drawing boxes (w/ text)
            display.drawText(Game.width()/2 - 21, Game.height()/2 + 10, `
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
        // If the game is over, bring the user to the losing screen
        if (this._game_ended) {
            if (input_type === 'keydown' && input_data.key === 'Enter') {
                Game.switch_screen(Game.Screen.lose_screen);
            }
            return;
        }
        if (this._sub_screen) {
            this._sub_screen.handle_input(input_type, input_data);
            return;
        }
        if (input_type === 'keydown') {
            // If unpaused
            if(!this._help) {
                // MOVEMENT KEYS
                if (input_data.key === 'ArrowLeft') {
                    this.move(-1, 0, 0);
                } else if (input_data.key === 'ArrowRight') {
                    this.move(1, 0, 0);
                } else if(input_data.key === 'ArrowUp') {
                    this.move(0, -1, 0);
                } else if(input_data.key === 'ArrowDown') {
                    this.move(0, 1, 0);
                } else if(input_data.key === '.') {
                    Game.send_message(this._player, "%c{white}You wait."); // Pass
                } else if(input_data.key === '>') {
                    this.move(0, 0, 1);
                } else if(input_data.key === '<') {
                    this.move(0, 0, -1);
                // OPEN HELP SCREEN - REFACTOR THIS
                } else if(input_data.key === '?') {
                    this._help = true;
                    Game.refresh();
                    return;
                // SUBSCREENS
                // OPEN THE INVENTORY
                } else if (input_data.key === 'i') {
                    if (Game.Screen.inventory_screen.setup(this._player, this._player.items())) {
                        this.set_sub_screen(Game.Screen.inventory_screen);
                    } else {
                        Game.send_message(this._player, "%c{white}You aren't carrying anything.");
                        Game.refresh()
                    }
                    return;
                // OPEN THE DROP SCREEN
                } else if (input_data.key === 'd') {
                    if (Game.Screen.drop_screen.setup(this._player, this._player.items())) {
                        this.set_sub_screen(Game.Screen.drop_screen);
                    } else {
                        Game.send_message(this._player, "%c{white}You don't have anything to drop.");
                        Game.refresh()
                    }
                    return;
                // OPEN THE EAT SCREEN
                } else if (input_data.key === 'e' && this._player.has_mixin('HasHunger')) {
                    if (Game.Screen.eat_screen.setup(this._player, this._player.items())) {
                        this.set_sub_screen(Game.Screen.eat_screen);
                    } else {
                        Game.send_message(this._player, "%c{white}You don't have anything to eat.");
                        Game.refresh();
                    }
                // PICK UP
                } else if (input_data.key === 'g') {
                    var items = this._map.items_at(this._player.x(), this._player.y(), this._player.z());
                    // If no items, show a message
                    if (!items) {
                        Game.send_message(this._player, "%c{white}There's nothing to pick up.");
                    } else if (items.length === 1) {
                        // If only one item, try to pick up
                        var item = items[0];
                        if (this._player.pickup_items([0])) {
                            Game.send_message(this._player, "%%c{white}You pick up %%c{%s}%s%%c{white}.", [item.foreground(), item.describe_a()]);
                        } else {
                            Game.send_message(this._player, "%c{white}Your inventory is full. Nothing was picked up.");
                        }
                    } else {
                        // Show the pickup screen
                        Game.Screen.pickup_screen.setup(this._player, items);
                        this.set_sub_screen(Game.Screen.pickup_screen);
                        return;
                    }
                } else {
                    // Invalid key
                    return;
                }
                // Unlock the engine
                this._map.engine().unlock();
            } else if (input_data.key === '?') {
                this._help = false;
                this._map.engine().unlock();
            }
        }
    },
    move: function(d_x, d_y, d_z) {
        var new_x = this._player.x() + d_x;
        var new_y = this._player.y() + d_y;
        var new_z = this._player.z() + d_z;
        this._player.try_move(new_x, new_y, new_z, this._map);
    },
    set_sub_screen: function(sub_screen) {
        this._sub_screen = sub_screen;
        // Refresh on change
        Game.refresh();
        console.log("Finished setting subscreen.");
    },
    set_game_ended: function(game_ended) {
        this._game_ended = game_ended;
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
    handle_input: function(input_type, input_data) {}
}

Game.Screen.lose_screen = {
    enter: function() { console.log("Entered lose screen."); },
    exit: function() { console.log("Exited lose screen."); },
    render: function(display) {
        for(var i=0; i<22; i++) {
            display.drawText(2, i+1, "%b{red}You lose.");
        }
    },
    handle_input: function(input_type, input_data) {}
};

// Item list stuff
Game.Screen.ItemListScreen = function(template) {
    // Setup based on template
    this._caption = template['caption'];
    this._ok_function = template['ok'];
    // By default, use the identity function
    this._is_acceptable_function = template['is_acceptable'] || function(x) { return x; };
    // Whether the user can select items
    this._can_select = template['can_select'];
    this._can_select_multiple = template['can_select_multiple'];
};
Game.Screen.ItemListScreen.prototype.setup = function(player, items) {
    this._player = player;
    // Call before switching screen
    var count = 0;
    // Iterate over each item, keep only acceptable
    var that = this;
    this._items = items.map(function(item) {
        // Transform item into null if unacceptable
        if (that._is_acceptable_function(item)) {
            count++;
            return item;
        } else {
            return null;
        }
    });
    // Clean selected indices
    this._selected_indices = {};
    return count;
};
Game.Screen.ItemListScreen.prototype.render = function(display) {
    var letters = 'abcdefghijklmnopqrstuvwxyz';
    // Render caption in top row
    display.drawText(0, 0, this._caption);
    var row = 0;
    for (var i = 0; i < this._items.length; i++) {
        // If we have an item, we want to render it
        if (this._items[i]) {
            // Get letter matching index
            var letter = letters.substring(i, i + 1);
            // If selected, show a +, else show a dash
            var selection_state = (this._can_select && this._can_select_multiple && this._selected_indices[i]) ? '+' : '-';
            // Render at correct row, offset by two
            display.drawText(0, 2 + row, letter + ' ' + selection_state + ' ' + this._items[i].describe());
            row++;
        }
    }
};
Game.Screen.ItemListScreen.prototype.execute_ok_function = function() {
    // Gather selected items
    var selected_items = {};
    for (var key in this._selected_indices) {
        selected_items[key] = this._items[key];
    }
    // Switch back to play screen
    Game.Screen.play_screen.set_sub_screen(undefined);
    // Call OK function, end player's turn if returns true
    if (this._ok_function(selected_items)) {
        this._player.map().engine().unlock();
    }
};
Game.Screen.ItemListScreen.prototype.handle_input = function(input_type, input_data) {
    if (input_type === 'keydown') {
        // If the user hit escape, hit enter and can't select, or hit enter
        // without any items selected, cancel out of the screen
        if (
            input_data.key === 'Escape' ||
            (input_data.key === 'Enter' && (!this._can_select || Object.keys(this._selected_indices).length === 0))
        ) {
            Game.Screen.play_screen.set_sub_screen(undefined);
        // Handle pressing return with items selected
        } else if (input_data.key === 'Enter') {
            this.execute_ok_function();
        // Handle pressing a letter if we can select
        } else if(
            this._can_select &&
            input_data.key.charCodeAt() >= 'a'.charCodeAt() &&
            input_data.key.charCodeAt() <= 'z'.charCodeAt()
        ) {
            // Check if it maps to a valid item by subtracting 'a' from
            // the character to check what letter of alphabet was pressed
            var index = input_data.key.charCodeAt() - 'a'.charCodeAt();
            if (this._items[index]) {
                // If multiple selection is allowed, toggle status,
                // else select item and exit the subscreen
                if (this._can_select_multiple) {
                    if (this._selected_indices[index]) {
                        delete this._selected_indices[index];
                    } else {
                        this._selected_indices[index] = true;
                    }
                    // Redraw
                    Game.refresh();
                } else {
                    this._selected_indices[index] = true;
                    this.execute_ok_function();
                }
            }
        }
    }
};

Game.Screen.inventory_screen = new Game.Screen.ItemListScreen({
    caption: '%c{white}Inventory',
    can_select: false
});
Game.Screen.pickup_screen = new Game.Screen.ItemListScreen({
    caption: '%c{white}Choose the items you wish to pickup',
    can_select: true,
    can_select_multiple: true,
    ok: function(selected_items) {
        // Try to pick up all items
        if (this._player.pickup_items(Object.keys(selected_items))) { // TODO: Maybe list the items picked up?
            Game.send_message(this._player, "%c{white}You pick up multiple objects.");
        } else {
            Game.send_message(this._player, "%c{white}Your inventory is full. Not all items were picked up.");
        }
        return true;
    }
});
Game.Screen.drop_screen = new Game.Screen.ItemListScreen({
    caption: '%c{white}Choose the item you wish to drop',
    can_select: true,
    can_select_multiple: false,
    ok: function(selected_items) {
        // Drop selected item
        this._player.drop_item(Object.keys(selected_items)[0]);
        return true;
    }
});
Game.Screen.eat_screen = new Game.Screen.ItemListScreen({
    caption: '%c{white}What do you want to eat?',
    can_select: true,
    is_acceptable: function(item) {
        return item && item.has_mixin('Edible');
    },
    ok: function(selected_items) {
        // Eat the item, remove if no uses remaining
        var key = Object.keys(selected_items)[0];
        var item = selected_items[key];
        if (item.uses() > 1) {
            Game.send_message(this._player, "%%c{white}You eat some of %%c{%s}%s%%c{white}.", [item.foreground(), item.describe_the()]);
        } else {
            Game.send_message(this._player, "%%c{white}You eat %%c{%s}%s%%c{white}.", [item.foreground(), item.describe_the()]);
        }
        item.eat(this._player);
        if (!item.has_remaining_uses()) {
            this._player.remove_item(key);
        }
        return true;
    }
});