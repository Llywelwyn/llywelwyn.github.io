Game.EntityMixins = {};

//   Mixins - 'words' indicate values given by a template. These default if not present.
//
// - Sight:             allows an Entity to see at a range given by 'sight_radius'.
// - Digger:            allows an Entity to dig through tiles with the is_diggable flag.
// - Destructible:      gives an Entity health and defence values, allowing them to take damage/die.
// - Attacker:          allows an Entity to attack the player using singular/plural verbs given by 'verb'.
// - MessageRecipient:  allows an Entity to use the message system.
// - HasInventory:      grants an Entity inventory functionality of capacity 'inventory_slots'.

Game.EntityMixins.Sight = {
    name: 'Sight',
    group_name: 'Sight',
    init: function(template) {
        this._sight_radius = template['sight_radius'] || 5;
    },
    sight_radius: function() { return this._sight_radius; }
};
Game.EntityMixins.Digger = {
    name: 'Digger',
    init: function(template) {},
    dig_strength: function() { return this._dig_strength; },
    try_dig: function(x, y, z, tile, map) {
        // If tile isn't diggable, fail
        if(!tile.is_diggable()) { return false; };
        // If diggable and strong enough, dig the tile and give a message to this
        map.dig(x, y, z);
        Game.send_message(this, "You dig through the dirt.");
        return true;
    }
}
Game.EntityMixins.Destructible = {
    name: 'Destructible',
    init: function(template) {
        this._max_hp = template['max_hp'] || 10;
        this._hp = template['hp'] || this._max_hp;
        this._defence_value = template['defence_value'] || 0;
    },
    hp : function() { return this._hp; },
    max_hp : function() { return this._max_hp; },
    defence_value : function() { return this._defence_value; },
    take_damage: function(attacker, damage) {
        this._hp -= damage;
        // If hp <= 0, remove from map
        if (this._hp <= 0) {
            Game.send_message(attacker, 'You kill the %s.', [this.name()]);
            if (this.has_mixin(Game.EntityMixins.PlayerActor)) {
                this.act();
            } else {
                this.map().remove_entity(this);
            }
        }
    }
};
Game.EntityMixins.Attacker = {
    name: 'Attacker',
    group_name: 'Attacker',
    init: function(template) {
        this._attack_value = template['attack_value'] || 1;
        this._verb = template['verb'] || {singular:['strike'], plural:['strikes']};
    },
    attack_value: function() { return this._attack_value; },
    refresh_verbs: function() {
        var random = Math.floor(Math.random() * this._verb['singular'].length);
        var selected_verbs = {
            'singular': this._verb['singular'][random],
            'plural': this._verb['plural'][random]}
        return selected_verbs;
    },
    attack: function(target) {
        if (target.has_mixin('Destructible')) {
            var attack = this.attack_value();
            var defence = target.defence_value();
            var max = Math.max(0, attack - defence);
            var damage = 1 + Math.floor(Math.random() * max);
            var verb = this.refresh_verbs();

            Game.send_message(this, 'You %s the %s for %d damage!',
                [verb['singular'], target.name(), damage]);
            Game.send_message(target, 'The %s %s you for %d damage!',
                [this.name(), verb['plural'], damage]);

            target.take_damage(this, 1 + Math.floor(Math.random() * max));
        }
    }
};
Game.EntityMixins.MessageRecipient = {
    name: 'MessageRecipient',
    init: function(template) {
        this._messages = [];
        this._buffer;
        this._last_shown;
        this._max_onscreen = 5;
    },
    messages: function() { return this._messages; },
    receive_message: function(message) {
        this._messages.push(message);
        if (this._messages.length >= this._max_onscreen) {
            this._messages.splice(0, this._messages.length - this._max_onscreen)
        };
    },
    clear_messages: function() {
            this._messages = [];
    }
};
Game.EntityMixins.HasInventory = {
    name: 'HasInventory',
    init: function(template) {
        // Default to 10
        var inventory_slots = template['inventory_slots'] || 10;
        this._items = new Array(inventory_slots);
    },
    items: function() { return this._items; },
    item: function(i) { return this._items[i]; },
    add_item: function(item) {
        // Search for free slot, return true if added successfully
        for (var i = 0; i < this._items.length; i++) {
            if (!this._items[i]) {
                this._items[i] = item;
                return true;
            }
        }
        return false;
    },
    remove_item: function(i) { this._items[i] = null; },
    can_add_item: function() {
        // Check for empty slot
        for (var i = 0; i < this._items.length; i++) {
            if (!this._items[i]) {
                return true;
            }
        }
        return false;
    },
    pickup_items: function(indices) {
        // Allows the user to pick up items from the map, where indices
        // is the indices for the array returned by map.items_at(x, y, z)
        var map_items = this._map.items_at(this.x(), this.y(), this.z());
        var added = 0;
        // Iterate through indices
        for (var i = 0; i < indices.length; i++) {
            // Try to add item. If inventory is not full, then splice
            // the item out of the list of items. In order to fetch the
            // right item, offset the number of items already added.
            if (this.add_item(map_items[indices[i] - added])) {
                map_items.splice(indices[i] - added, 1);
                added++;
            } else {
                // Inventory is full
                break;
            }
        }
        // Update map items
        this._map.set_items_at(this.x(), this.y(), this.z(), map_items);
        // Return true if we added all items
        return added === indices.length;
    },
    drop_item: function(i) {
        // Drops items to current map tile
        if (this._items[i]) {
            if (this._map) {
                this._map.add_item(this.x(), this.y(), this.z(), this._items[i]);
            }
            Game.send_message(this, "You drop %s.", [this._items[i].describe_a()]);
            this.remove_item(i);
        }
    }
};

//   Actor Mixins - these determine which 'act' the Entity takes each turn.
//
// - PlayerActor:       Player functionality. Allows game-over, taking of the player's turn, etc.
// - VinesActor:        Spread randomly to a free adjacent square. Given by 'growths_remaining' and 'spread_chance'.
// - WanderActor:       Move randomly +/-1 on the x- or y-axis each turn. 

Game.EntityMixins.PlayerActor = {
    name: 'PlayerActor',
    group_name: 'Actor',
    act: function() {
        // Detect if game is over
        if (this.hp() < 1) {
            Game.Screen.play_screen.set_game_ended(true);
            // Send a last message to the player
            Game.send_message(this, 'You have died... Press [Enter] to continue.');
        }
        // Re-render screen
        Game.refresh()
        // Lock engine, wait for input
        this.map().engine().lock();
        // Clear message queue
        //this.clear_messages();
    }
};
Game.EntityMixins.VinesActor = {
    name: 'VinesActor',
    group_name: 'Actor',
    init: function(template) {
        this._growths_remaining = template['growths_remaining'] || 5;
        this._spread_chance = template['spread_chance'] || 0.01;
    },
    act: function() {
        if (this._growths_remaining <= 0 || Math.random() > this._spread_chance) {
            return;
        }

        // Generate coords of random adjacent square by generating offset from -1 to 1
        var x_offset = generate_offset(1, 0);
        var y_offset = generate_offset(1, 0);
        // But not the same time
        if(x_offset == 0 && y_offset == 0) {
            return;
        }
        // Check if spawn loc is empty
        var x_loc = this.x() + x_offset;
        var y_loc = this.y() + y_offset;
        if(!this.map().is_empty_floor(x_loc, y_loc, this.z())) {
            return;
        }
        // If spawnable, grow
        if (this.map().is_empty_floor(
            this.x() + x_offset,
            this.y() + y_offset,
            this.z())
        ) {
            var entity = Game.EntityRepository.create('vines');
            entity.set_pos(
                this.x() + x_offset,
                this.y() + y_offset,
                this.z()
            );
            this.map().add_entity(entity);
            this._growths_remaining--;
    
            Game.send_message_nearby(
                this.map(),
                entity.x(),
                entity.y(),
                entity.z(),
                'The %s is spreading!', [this.name()]
            );
        }
    }
};
Game.EntityMixins.WanderActor = {
    name: 'WanderActor',
    group_name: 'Actor',
    act: function() {
        // Determine positive or negative direction
        var offset = (Math.round(Math.random()) === 1) ? 1 : -1;
        // Determine x- or y-direction
        if (Math.round(Math.random()) === 1) {
            this.try_move(this.x() + offset, this.y(), this.z());
        } else {
            this.try_move(this.x(), this.y() + offset, this.z());
        }
    }
};