Game.Screen = {}

// defines start screen
Game.Screen.start_screen = {
    enter: function () {
        console.log("Entered start screen.")
    },
    exit: function () {
        console.log("Exited start screen.")
    },
    render: function (display) {
        // renders prompt to screen
        // TODO: FUNCTIONS, FUNCTIONS, FUNCTIONS. OR JSON.
        tip = one_of(Game._tips)
        display.drawText(
            Game.width() / 2 - Game.title().length / 2,
            Game.height() / 2 - 2,
            "%c{yellow}" + Game.title(),
        )
        display.drawText(
            Game.width() / 2 - (Game.start_message().length - 22) / 2,
            Game.height() / 2,
            "%c{white}" + Game.start_message(),
        )

        // Render bottom box
        var top_bar = "╔"
        for (var i = 0; i < 29; i++) {
            top_bar += "═"
        }
        top_bar += "╗"
        display.drawText(Game.width() / 2 - 15, Game.height() / 2 + 2, top_bar)
        for (var i = 1; i < Game._bottom_bar_size; i++) {
            display.drawText(Game.width() / 2 - 15, Game.height() / 2 + 2 + i, "║")
            display.drawText(Game.width() / 2 + 15, Game.height() / 2 + 2 + i, "║")
        }
        var bottom_bar = "╚"
        for (var i = 0; i < 29; i++) {
            bottom_bar += "═"
        }
        bottom_bar += "╝"
        display.drawText(
            Game.width() / 2 - 15,
            Game.height() / 2 + 2 + Game._bottom_bar_size,
            bottom_bar,
        )

        display.drawText(Game.width() / 2 - 13, Game.height() / 2 + 2, "%c{white}MOTD")
        display.drawText(Game.width() / 2 - 13, Game.height() / 2 + 4, "%c{white}" + tip, 27)
    },
    handle_input: function (input_type, input_data) {
        if (input_type === "keydown") {
            if (input_data.key === "Enter") {
                Game.switch_screen(Game.Screen.play_screen)
            }
        }
    },
}

Game.Screen.play_screen = {
    _player: null,
    _help: false,
    _game_ended: false,
    _sub_screen: null,
    enter: function () {
        console.log("Entered play screen.")
        var width = CONFIG.GAME_WIDTH
        var height = CONFIG.GAME_HEIGHT
        var depth = CONFIG.GAME_DEPTH
        // Create map from the tiles and player
        this._player = new Game.Entity(Game.PlayerTemplate)
        var tiles = new Game.Builder(width, height, depth).tiles()
        var map = new Game.Map.Cave(tiles, this._player)
        Game.send_message(
            this._player,
            `You take your first step into ${Game.dungeon_name()} and the way is shut behind you. Your goal is to brave its depths and recover the ${Game.goal()}.`,
        )
        map.engine().start()
    },
    exit: function () {
        console.log("Exited play screen.")
    },
    render: function (display) {
        // Render subscreen if one exists
        if (this._sub_screen) {
            this._sub_screen.render(display)
            return
        }
        this.render_tiles(display)
        this.render_bottom_box(display)
        this.render_player_info(display)
        this.render_messages(display)
    },
    screen_offsets: function () {
        // Make sure we still have enough space to fit the game screen
        var top_left_x = Math.max(0, this._player.x() - Game.width() / 2)
        top_left_x = Math.min(top_left_x, this._player.map().width() - Game.width())
        var top_left_y = Math.max(0, this._player.y() - Game.height() / 2)
        top_left_y = Math.min(top_left_y, this._player.map().height() - Game.height())
        return {
            x: top_left_x,
            y: top_left_y,
        }
    },
    render_tiles: function (display) {
        var offsets = this.screen_offsets()
        top_left_x = offsets.x
        top_left_y = offsets.y
        // Object to store visible map cells
        var visible_cells = {}
        // Store this._player.map() and player-z to prevent losing in callback
        var map = this._player.map()
        var current_z = this._player.z()
        // Find all visible cells and update the object
        map.fov(current_z).compute(
            this._player.x(),
            this._player.y(),
            this._player.sight_radius(),
            function (x, y, radius, visibility) {
                visible_cells[x + "," + y] = true
                map.set_explored(x, y, current_z, true)
            },
        )
        // Render explored + visible tiles
        for (let x = top_left_x; x < top_left_x + Game.width(); x++) {
            for (let y = top_left_y; y < top_left_y + Game.height(); y++) {
                if (map.is_explored(x, y, current_z)) {
                    // Fetch glyph for tile and render at offset position
                    var glyph = map.tile(x, y, current_z)
                    var background = glyph.background()
                    // We are in a cell in FOV, check for items/entities
                    if (visible_cells[x + "," + y]) {
                        var items = map.items_at(x, y, current_z)
                        // if(items), render topmost
                        if (items) {
                            glyph = items[items.length - 1]
                        }
                        // Check for entities
                        if (map.entity_at(x, y, current_z)) {
                            glyph = map.entity_at(x, y, current_z)
                        }
                        // Update foreground in case of glyph change
                        foreground = glyph.foreground()
                        if (map.is_bloody(x, y, current_z)) {
                            background = "#2d0606"
                        }
                    } else {
                        // If tile is explored but !visible, darken foreground
                        // with an amount inverse to its brightness - prevents tiles becoming entirely black.
                        var darken_multiplier = 60
                        foreground = tinycolor(glyph.foreground()).darken(
                            (tinycolor(glyph.foreground()).getBrightness() / 255) *
                                darken_multiplier,
                        )
                    }
                    display.draw(
                        x - top_left_x,
                        y - top_left_y,
                        glyph.character(),
                        foreground,
                        background,
                    )
                }
            }
        }
        // Render entities
        // FIXME: Final entry of entities = [[Prototype]]: Object. Why?
        var entities = this._player.map().entities()
        for (var key in entities) {
            var entity = entities[key]
            // Render if entity would show up on screen
            if (
                key != "extend" && // FIXME: this is atrocious
                entity.x() >= top_left_x &&
                entity.x() < top_left_x + Game.width() &&
                entity.y() >= top_left_y &&
                entity.y() < top_left_y + Game.height() &&
                entity.z() == this._player.z()
            ) {
                var background_colour = entity.background()
                if (background_colour === "black") {
                    if (map.is_bloody(entity.x(), entity.y(), entity.z())) {
                        background_colour = "#2d0606"
                    }
                }
                if (visible_cells[entity.x() + "," + entity.y()]) {
                    display.draw(
                        entity.x() - top_left_x,
                        entity.y() - top_left_y,
                        entity.character(),
                        entity.foreground(),
                        background_colour,
                    )
                }
            }
        }
    },
    render_bottom_box: function (display) {
        // Render bottom box
        var top_bar = "╔"
        for (var i = 0; i < Game.width() - 4; i++) {
            if (i === 27) {
                top_bar += "╗╔"
            }
            top_bar += "═"
        }
        top_bar += "╗"
        display.drawText(0, Game.height(), top_bar)
        for (var i = 1; i < Game._bottom_bar_size; i++) {
            display.drawText(0, Game.height() + i, "║")
            display.drawText(28, Game.height() + i, "║║")
            display.drawText(Game.width() - 1, Game.height() + i, "║")
        }
        var bottom_bar = "╚"
        let help_text = `[?] for help`
        for (var i = 0; i < Game.width() - 5 - help_text.length; i++) {
            if (i === 27) {
                bottom_bar += "╝╚"
            }
            bottom_bar += "═"
        }
        bottom_bar += `[%c{seagreen}?%c{white}] for help═╝`
        display.drawText(0, Game.height() + Game._bottom_bar_size - 1, bottom_bar)
    },
    render_player_info: function (display) {
        // Render player stats - TODO: Actual functions, make all this modular instead of hardcoded terribleness
        var stats = "%c{white}%b{black}"
        var stats_x = 1
        var stats_y = Game.height() + 1
        stats += vsprintf("%%c{crimson}HP%%c{white}%d/%d", [
            this._player.hp(),
            this._player.max_hp(),
        ])
        display.drawText(stats_x, stats_y++, this._player.hp_state()[1])
        stats = vsprintf("%%c{cornflowerblue}LVL%%c{white}%d (%d%%)", [
            this._player.level(),
            Math.floor((this._player.experience() / this._player.next_level_experience()) * 100),
        ])
        display.drawText(stats_x, stats_y++, "%c{white}" + stats)
        if (this._player.weapon()) {
            var weapon = "%c{white}- %c"
            weapon += vsprintf("{%s}%s", [
                this._player.weapon().foreground(),
                this._player.weapon().describe_a(),
            ])
            weapon += " %c{white}(wielding)"
            display.drawText(stats_x, stats_y++ + 1, weapon)
        } else {
            display.drawText(stats_x, stats_y++ + 1, "%c{white}- unarmed")
        }
        if (this._player.armour()) {
            var armour = "%c{white}- %c"
            armour += vsprintf("{%s}%s", [
                this._player.armour().foreground(),
                this._player.armour().describe_a(),
            ])
            armour += " %c{white}(wearing)"
            display.drawText(stats_x, stats_y++ + 1, armour)
        } else {
            display.drawText(stats_x, stats_y++ + 1, "%c{white}- unarmoured")
        }

        // Render hunger
        if (this._player.has_mixin("HasHunger")) {
            var hunger_state = this._player.hunger_state()[0]
            var hunger_state_formatted = this._player.hunger_state()[1]
            display.drawText(28 - hunger_state.length, Game.height() + 1, hunger_state_formatted)
            display.drawText(28 - 8, Game.height() + 2, "%c{white}Quenched")
        }
    },
    render_messages: function (display) {
        var messages = this._player.messages()
        var message_x = 30
        var message_y = Game.height() + 1
        for (var i = 0; i < messages.length; i++) {
            message_y += display.drawText(
                message_x,
                message_y,
                "%c{white}%b{black}" + messages[i],
                Game.width() - message_x - 1,
            )
        }
    },
    handle_input: function (input_type, input_data) {
        // If the game is over, bring the user to the losing screen
        if (this._game_ended) {
            if (input_type === "keydown" && input_data.key === "Enter") {
                Game.switch_screen(Game.Screen.lose_screen)
            }
            return
        }
        if (this._sub_screen) {
            this._sub_screen.handle_input(input_type, input_data)
            return
        }
        if (input_type === "keydown") {
            // MOVEMENT KEYS
            if (input_data.key in MOVE_KEYS) {
                let dx = MOVE_KEYS[input_data.key][0]
                let dy = MOVE_KEYS[input_data.key][1]
                let dz = MOVE_KEYS[input_data.key][2]
                this.move(dx, dy, dz)
            } else if (WAIT_KEYS.includes(input_data.key)) {
                Game.send_message(this._player, "You wait.") // Pass
                // SUBSCREENS
                // OPEN THE INVENTORY
            } else if (input_data.key === "?") {
                this.set_sub_screen(Game.Screen.help_screen)
                return
            } else if (input_data.key === "k") {
                // Setup look
                var offsets = this.screen_offsets()
                Game.Screen.look_screen.setup(
                    this._player,
                    this._player.x(),
                    this._player.y(),
                    offsets.x,
                    offsets.y,
                )
                this.set_sub_screen(Game.Screen.look_screen)
                return
            } else if (input_data.key === "i") {
                this.show_item_sub_screen(
                    Game.Screen.inventory_screen,
                    this._player.items(),
                    "You aren't carrying anything.",
                )
                return
            } else if (input_data.key === "x") {
                this.show_item_sub_screen(
                    Game.Screen.examine_screen,
                    this._player.items(),
                    "You have nothing to examine.",
                )
                return
            } else if (input_data.key === "d") {
                this.show_item_sub_screen(
                    Game.Screen.drop_screen,
                    this._player.items(),
                    "You have nothing to drop.",
                )
                return
            } else if (input_data.key === "e" && this._player.has_mixin("HasHunger")) {
                this.show_item_sub_screen(
                    Game.Screen.eat_screen,
                    this._player.items(),
                    "You have nothing to eat.",
                )
                return
            } else if (input_data.key === "W") {
                this.show_item_sub_screen(
                    Game.Screen.wear_screen,
                    this._player.items(),
                    "You have nothing to wear.",
                )
                return
            } else if (input_data.key === "w") {
                this.show_item_sub_screen(
                    Game.Screen.wield_screen,
                    this._player.items(),
                    "You have nothing to wield.",
                )
                return
                // PICK UP
            } else if (input_data.key === "g") {
                var items = this._player
                    .map()
                    .items_at(this._player.x(), this._player.y(), this._player.z())
                // If no items, show a message
                if (items && items.length === 1) {
                    // If only one item, try to pick up
                    var item = items[0]
                    if (!this._player.pickup_items([0])) {
                        Game.send_message(
                            this._player,
                            "Your inventory is full. Nothing was picked up.",
                        )
                    }
                } else {
                    // Show the pickup screen
                    this.show_item_sub_screen(
                        Game.Screen.pickup_screen,
                        items,
                        "There is nothing here to pick up.",
                    )
                    return
                }
                let time =
                    (ACTION_SPEED.item_interact * this._player.speed()) / 100 ||
                    this._player.speed()
                console.log(`Player spent ${time} time units picking up an item.`)
                this._player.map().scheduler().setDuration(time)
            } else {
                // Invalid key
                return
            }
            // Unlock the engine
            this._player.map().engine().unlock()
        }
    },
    move: function (d_x, d_y, d_z) {
        var new_x = this._player.x() + d_x
        var new_y = this._player.y() + d_y
        var new_z = this._player.z() + d_z
        this._player.try_move(new_x, new_y, new_z, this._player.map())
    },
    show_item_sub_screen: function (sub_screen, items, empty_message) {
        if (items && sub_screen.setup(this._player, items) > 0) {
            this.set_sub_screen(sub_screen)
        } else {
            Game.send_message(this._player, empty_message)
            Game.refresh()
        }
    },
    set_sub_screen: function (sub_screen) {
        this._sub_screen = sub_screen
        // Refresh on change
        Game.refresh()
        console.log("Finished setting subscreen.")
    },
    set_game_ended: function (game_ended) {
        this._game_ended = game_ended
    },
}

Game.Screen.win_screen = {
    enter: function () {
        console.log("Entered win screen.")
    },
    exit: function () {
        console.log("Exited win screen.")
    },
    render: function (display) {
        for (var i = 0; i < 22; i++) {
            var r = Math.round(Math.random() * 255)
            var g = Math.round(Math.random() * 255)
            var b = Math.round(Math.random() * 255)
            var background = ROT.Color.toRGB([r, g, b])
            display.drawText(2, i + 1, "%b{" + background + "}You win!")
        }
    },
    handle_input: function (input_type, input_data) {},
}

Game.Screen.lose_screen = {
    enter: function () {
        console.log("Entered lose screen.")
    },
    exit: function () {
        console.log("Exited lose screen.")
    },
    render: function (display) {
        for (var i = 0; i < 22; i++) {
            display.drawText(2, i + 1, "%b{red}You lose.")
        }
    },
    handle_input: function (input_type, input_data) {},
}

// Item list stuff
Game.Screen.ItemListScreen = function (template) {
    // Setup based on template
    this._caption = template["caption"]
    this._ok_function = template["ok"]
    // By default, use the identity function
    this._is_acceptable_function =
        template["is_acceptable"] ||
        function (x) {
            return x
        }
    // Whether the user can select items
    this._can_select = template["can_select"]
    this._can_select_multiple = template["can_select_multiple"]
    this._has_no_item_option = template["has_no_item_option"]
}
Game.Screen.ItemListScreen.prototype.setup = function (player, items) {
    this._player = player
    // Call before switching screen
    var count = 0
    // Iterate over each item, keep only acceptable
    var that = this
    this._items = items.map(function (item) {
        // Transform item into null if unacceptable
        if (that._is_acceptable_function(item)) {
            count++
            return item
        } else {
            return null
        }
    })
    // Clean selected indices
    this._selected_indices = {}
    return count
}
Game.Screen.ItemListScreen.prototype.render = function (display) {
    Game.Screen.play_screen.render_bottom_box.call(Game.Screen.play_screen, display)
    Game.Screen.play_screen.render_player_info.call(Game.Screen.play_screen, display)
    Game.Screen.play_screen.render_messages.call(Game.Screen.play_screen, display)

    var letters = "abcdefghijklmnopqrstuvwxyz"
    // Render caption in top row
    var top_left_x = 1
    var top_left_y = 1
    display.drawText(top_left_x, top_left_y, "%c{white}" + this._caption)
    top_left_y += 2
    // Render no item row if enabled
    if (this._has_no_item_option) {
        display.drawText(top_left_x, top_left_y, "%c{white}0 - no item")
        top_left_y++
    }
    for (var i = 0; i < this._items.length; i++) {
        // If we have an item, we want to render it
        if (this._items[i]) {
            // Get letter matching index
            var letter = letters.substring(i, i + 1)
            // If selected, show a +, else show a dash
            var selection_state =
                this._can_select && this._can_select_multiple && this._selected_indices[i]
                    ? "%c{green}+%c{white}"
                    : "-"
            // Check for worn or wielded
            var suffix = " %c{white}"
            if (this._items[i] === this._player.armour()) {
                suffix += "(wearing)"
            } else if (this._items[i] === this._player.weapon()) {
                suffix += "(wielding)"
            }
            // Render at correct row, offset by two
            display.drawText(
                top_left_x,
                top_left_y,
                "%c{white}" +
                    letter +
                    " " +
                    selection_state +
                    " %c{" +
                    this._items[i].foreground() +
                    "}" +
                    this._items[i].describe() +
                    suffix,
            )
            top_left_y++
        }
    }
}
Game.Screen.ItemListScreen.prototype.execute_ok_function = function () {
    // Gather selected items
    var selected_items = {}
    for (var key in this._selected_indices) {
        selected_items[key] = this._items[key]
    }
    // Switch back to play screen
    Game.Screen.play_screen.set_sub_screen(undefined)
    // Call OK function, end player's turn if returns true
    if (this._ok_function(selected_items)) {
        let time = (ACTION_SPEED.item_interact * this._player.speed()) / 100 || this._player.speed()
        console.log(`Player spent ${time} time units interacting with an item.`)
        this._player.map().scheduler().setDuration(time)
        this._player.map().engine().unlock()
    }
}
Game.Screen.ItemListScreen.prototype.handle_input = function (input_type, input_data) {
    if (input_type === "keydown") {
        // If the user hit escape, hit enter and can't select, or hit enter
        // without any items selected, cancel out of the screen
        if (
            input_data.key === "Escape" ||
            (input_data.key === "Enter" &&
                (!this._can_select || Object.keys(this._selected_indices).length === 0))
        ) {
            Game.Screen.play_screen.set_sub_screen(undefined)
            // Handle pressing return with items selected
        } else if (input_data.key === "Enter") {
            this.execute_ok_function()
            // Handle pressing 0 when no item selection enabled
        } else if (this._can_select && this._has_no_item_option && input_data.key === "0") {
            this._selected_indices = {}
            this.execute_ok_function()
            // Handle pressing a letter if we can select
        } else if (
            this._can_select &&
            input_data.key.charCodeAt() >= "a".charCodeAt() &&
            input_data.key.charCodeAt() <= "z".charCodeAt()
        ) {
            // Check if it maps to a valid item by subtracting 'a' from
            // the character to check what letter of alphabet was pressed
            var index = input_data.key.charCodeAt() - "a".charCodeAt()
            if (this._items[index]) {
                // If multiple selection is allowed, toggle status,
                // else select item and exit the subscreen
                if (this._can_select_multiple) {
                    if (this._selected_indices[index]) {
                        delete this._selected_indices[index]
                    } else {
                        this._selected_indices[index] = true
                    }
                    // Redraw
                    Game.refresh()
                } else {
                    this._selected_indices[index] = true
                    this.execute_ok_function()
                }
            }
        }
    }
}

Game.Screen.inventory_screen = new Game.Screen.ItemListScreen({
    caption: "Inventory",
    can_select: false,
})
Game.Screen.pickup_screen = new Game.Screen.ItemListScreen({
    caption: "Get what?",
    can_select: true,
    can_select_multiple: false,
    ok: function (selected_items) {
        // Try to pick up all items
        if (!this._player.pickup_items(Object.keys(selected_items)[0])) {
            Game.send_message(this._player, "Your inventory is full. Not all items were picked up.")
        }
        return true
    },
})
Game.Screen.drop_screen = new Game.Screen.ItemListScreen({
    caption: "Drop what?",
    can_select: true,
    can_select_multiple: false,
    ok: function (selected_items) {
        // Drop selected item
        this._player.drop_item(Object.keys(selected_items)[0])
        return true
    },
})
Game.Screen.eat_screen = new Game.Screen.ItemListScreen({
    caption: "Eat what?",
    can_select: true,
    is_acceptable: function (item) {
        return item && item.has_mixin("Edible")
    },
    ok: function (selected_items) {
        // Eat the item, remove if no uses remaining
        var key = Object.keys(selected_items)[0]
        var item = selected_items[key]
        if (item.uses() > 1) {
            var message = "You eat some of %%c{%s}%s%%c{white}."
        } else {
            var message = "You eat %%c{%s}%s%%c{white}."
        }
        if (this._player.has_mixin("Senses") && this._player.has_taste() && item._taste) {
            message += " It tastes " + item._taste + "."
        }
        Game.send_message(this._player, message, [item.foreground(), item.describe_the()])
        item.eat(this._player)
        if (!item.has_remaining_uses()) {
            this._player.remove_item(key)
        }
        return true
    },
})
Game.Screen.wield_screen = new Game.Screen.ItemListScreen({
    caption: "Wield what?",
    can_select: true,
    can_select_multiple: false,
    has_no_item_option: true,
    is_acceptable: function (item) {
        return item && item.has_mixin("Equippable") && item.is_wieldable()
    },
    ok: function (selected_items) {
        // Check if we selected 'no item'
        var keys = Object.keys(selected_items)
        if (keys.length === 1) {
            this._player.unwield()
            Game.send_message(this._player, "You are empty-handed.")
        } else {
            // Unequip item first
            var item = selected_items[keys[0]]
            this._player.unequip(item)
            this._player.wield(item)
            Game.send_message(this._player, "You are wielding %%c{%s}%s%%c{white}.", [
                item.foreground(),
                item.describe_a(),
            ])
        }
        return true
    },
})
Game.Screen.wear_screen = new Game.Screen.ItemListScreen({
    caption: "Wear what?",
    can_select: true,
    can_select_multiple: false,
    has_no_item_option: true,
    is_acceptable: function (item) {
        return item && item.has_mixin("Equippable") && item.is_wearable()
    },
    ok: function (selected_items) {
        // Check if we selected 'no item'
        var keys = Object.keys(selected_items)
        if (keys.length === 1) {
            this._player.doff()
            Game.send_message(this._player, "You aren't wearing anything.")
        } else {
            // Unequip item first
            var item = selected_items[keys[0]]
            this._player.unequip(item)
            this._player.don(item)
            Game.send_message(this._player, "You are wearing %%c{%s}%s%%c{white}.", [
                item.foreground(),
                item.describe_a(),
            ])
        }
        return true
    },
})
Game.Screen.examine_screen = new Game.Screen.ItemListScreen({
    caption: "Examine what?",
    can_select: true,
    can_select_multiple: false,
    is_acceptable: function (item) {
        return true
    },
    ok: function (selected_items) {
        var keys = Object.keys(selected_items)
        if (keys.length > 0) {
            var item = selected_items[keys[0]]
            Game.send_message(this._player, "It's %%c{%s}%s%%c{white}. %s", [
                item.foreground(),
                item.describe_a(),
                item.details(),
            ])
        }
        return true
    },
})
Game.Screen.gain_stat_screen = {
    setup: function (entity) {
        // Call before rendering
        this._entity = entity
        this._options = entity.stat_options()
    },
    render: function (display) {
        Game.Screen.play_screen.render_bottom_box.call(Game.Screen.play_screen, display)
        Game.Screen.play_screen.render_player_info.call(Game.Screen.play_screen, display)
        Game.Screen.play_screen.render_messages.call(Game.Screen.play_screen, display)

        var letters = "abcdefghijklmnopqrstuvwxyz"
        var top_left_x = 1
        var top_left_y = 1
        display.drawText(top_left_x, top_left_y, "%c{white}Choose an attribute to increase: ")
        top_left_y += 2 // Offset between title and stat options

        // Iterate through options
        for (var i = 0; i < this._options.length; i++) {
            display.drawText(
                top_left_x,
                top_left_y + i,
                "%c{white}" + letters.substring(i, i + 1) + " - " + this._options[i][0],
            )
        }
        top_left_y++ // Offset between stat options and remaining points

        // Render remaining stat points
        display.drawText(
            top_left_x,
            top_left_y + this._options.length,
            "%c{white}Remaining points: " + this._entity.stat_points(),
        )
    },
    handle_input: function (input_type, input_data) {
        if (input_type === "keydown") {
            if (
                input_data.key.charCodeAt() >= "a".charCodeAt() &&
                input_data.key.charCodeAt() <= "z".charCodeAt()
            ) {
                // Check if it maps to a valid item by subtracting 'a' from
                // the character to check what letter of alphabet was pressed
                var index = input_data.key.charCodeAt() - "a".charCodeAt()
                if (this._options[index]) {
                    // Call stat increase function
                    console.log(this._options[index])
                    this._options[index][1].call(this._entity)
                    // Decrease stat points
                    this._entity.set_stat_points(this._entity.stat_points() - 1)
                    // If we have no points left, exit the screen, else refresh
                    if (this._entity.stat_points() == 0) {
                        Game.Screen.play_screen.set_sub_screen(undefined)
                    } else {
                        Game.refresh()
                    }
                }
            }
        }
    },
}

// TARGET BASED SCREENS
Game.Screen.TargetBasedScreen = function (template) {
    template = template || {}
    // by default do nothing and don't consume turn
    this._ok_function =
        template["ok"] ||
        function (x, y) {
            return false
        }
    this._caption_function =
        template["caption_function"] ||
        function (x, y) {
            return ""
        }
}
Game.Screen.TargetBasedScreen.prototype.setup = function (
    player,
    start_x,
    start_y,
    offset_x,
    offset_y,
) {
    this._player = player
    // Store original pos, minus offset to make life easy
    this._start_x = start_x - offset_x
    this._start_y = start_y - offset_y
    // Store current cursor pos
    this._cursor_x = this._start_x
    this._cursor_y = this._start_y
    // Store offsets
    this._offset_x = offset_x
    this._offset_y = offset_y
    // Cache fov
    var visible_cells = {}
    this._player
        .map()
        .fov(this._player.z())
        .compute(
            this._player.x(),
            this._player.y(),
            this._player.sight_radius(),
            function (x, y, radius, visibility) {
                visible_cells[x + "," + y] = true
            },
        )
    this._visible_cells = visible_cells
}
Game.Screen.TargetBasedScreen.prototype.render = function (display) {
    Game.Screen.play_screen.render_tiles.call(Game.Screen.play_screen, display)
    Game.Screen.play_screen.render_bottom_box.call(Game.Screen.play_screen, display)
    Game.Screen.play_screen.render_player_info.call(Game.Screen.play_screen, display)
    // Draw line from start to cursor
    var points = Game.Geometry.line(this._start_x, this._start_y, this._cursor_x, this._cursor_y)
    // Render line
    for (var i = 0, l = points.length; i < l; i++) {
        display.drawText(points[i].x, points[i].y, "%c{magenta}*")
    }
    // Render caption at bottom
    display.drawText(
        30,
        Game.height() + 1,
        this._caption_function(this._cursor_x + this._offset_x, this._cursor_y + this._offset_y),
        Game.width() - 31,
    )
}
Game.Screen.TargetBasedScreen.prototype.handle_input = function (input_type, input_data) {
    // Move cursor
    if (input_type === "keydown") {
        if (input_data.key in MOVE_KEYS) {
            let dx = MOVE_KEYS[input_data.key][0]
            let dy = MOVE_KEYS[input_data.key][1]
            this.move_cursor(dx, dy)
        } else if (ESCAPE_KEYS.includes(input_data.key)) {
            Game.Screen.play_screen.set_sub_screen(undefined)
        } else if (ENTER_KEYS.includes(input_data.key)) {
            this.execute_ok_function()
        }
    }
    Game.refresh()
}
Game.Screen.TargetBasedScreen.prototype.move_cursor = function (d_x, d_y) {
    // Stay within bounds
    this._cursor_x = Math.max(0, Math.min(this._cursor_x + d_x, Game.width()))
    this._cursor_y = Math.max(0, Math.min(this._cursor_y + d_y, Game.height()))
}
Game.Screen.TargetBasedScreen.prototype.execute_ok_function = function () {
    // Switch back to play screen
    Game.Screen.play_screen.set_sub_screen(undefined)
    // Call ok, end if true
    if (this._ok_function(this._cursor_x + this._offset_x, this._cursor_y + this._offset_y)) {
        this._player.map().engine().unlock()
    }
}

// TARGET BASED SCREENS
Game.Screen.look_screen = new Game.Screen.TargetBasedScreen({
    caption_function: function (x, y) {
        var z = this._player.z()
        var map = this._player.map()
        // If explored, give caption
        if (map.is_explored(x, y, z)) {
            if (this._visible_cells[x + "," + y]) {
                var items = map.items_at(x, y, z)
                // If items, render top most
                if (items) {
                    var item = items[items.length - 1]
                    return vsprintf("%s - %%c{%s}%s%%c{white}. %s", [
                        item.representation(),
                        item.foreground(),
                        item.describe_a(1),
                        item.details(),
                    ])
                } else if (map.entity_at(x, y, z)) {
                    var entity = map.entity_at(x, y, z)
                    return vsprintf("%s - %%c{%s}%s%%c{white}. %s", [
                        entity.representation(),
                        entity.foreground(),
                        entity.describe_a(1),
                        entity.details(),
                    ])
                }
            }
            // If no entity/item or not visible
            return vsprintf("%s - %%c{%s}%s%%c{white}. %s", [
                map.tile(x, y, z).representation(),
                map.tile(x, y, z).foreground(),
                map.tile(x, y, z).describe_a(1),
                map.tile(x, y, z).simple_desc(),
            ])
        } else {
            // If not explored, show null
            return vsprintf("%s - %%c{%s}%s%%c{white}. %s", [
                Game.Tile.null_tile.representation(),
                Game.Tile.null_tile.foreground(),
                Game.Tile.null_tile.describe_a(1),
                Game.Tile.null_tile.simple_desc(),
            ])
        }
    },
})
// Help screen
Game.Screen.help_screen = {
    render: function (display) {
        Game.Screen.play_screen.render_bottom_box.call(Game.Screen.play_screen, display)
        Game.Screen.play_screen.render_player_info.call(Game.Screen.play_screen, display)
        Game.Screen.play_screen.render_messages.call(Game.Screen.play_screen, display)

        var text = "How do stuff?"
        var x = 1
        var y = 1
        display.drawText(x, y++, "%c{white}" + text)
        y++
        display.drawText(x, y++, "%c{white}" + "MOVEMENT")
        display.drawText(x, y++, "%c{white}" + "[%c{seagreen}Arrow Keys%c{white}] to move")
        display.drawText(x, y++, "%c{white}" + "[%c{seagreen}<%c{white}] to ascend")
        display.drawText(x, y++, "%c{white}" + "[%c{seagreen}>%c{white}] to descend")
        y++
        display.drawText(x, y++, "%c{white}" + "ITEM INTERACTION")
        display.drawText(x, y++, "%c{white}" + "[%c{seagreen}i%c{white}] to view inventory")
        display.drawText(x, y++, "%c{white}" + "[%c{seagreen}x%c{white}] to examine item")
        display.drawText(x, y++, "%c{white}" + "[%c{seagreen}g%c{white}] to get item")
        display.drawText(x, y++, "%c{white}" + "[%c{seagreen}d%c{white}] to drop item")
        display.drawText(x, y++, "%c{white}" + "[%c{seagreen}e%c{white}] to eat item")
        display.drawText(x, y++, "%c{white}" + "[%c{seagreen}w%c{white}] to wield item")
        display.drawText(x, y++, "%c{white}" + "[%c{seagreen}W%c{white}] to wear item")
        y++
        display.drawText(x, y++, "%c{white}" + "MISCELLANEOUS")
        display.drawText(x, y++, "%c{white}" + "[%c{seagreen}k%c{white}] to look around")
        display.drawText(x, y++, "%c{white}" + "[%c{seagreen}?%c{white}] to open this page")
        y++
    },
    handle_input: function (input_type, input_data) {
        if (
            input_type === "keydown" &&
            (input_data.key === "Escape" || input_data.key === "Enter" || input_data.key === "?")
        ) {
            Game.Screen.play_screen.set_sub_screen(undefined)
        }
    },
}
