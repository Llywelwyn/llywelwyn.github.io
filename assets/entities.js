Game.Mixins = {};

// Mixins
Game.Mixins.Sight = {
    name: 'Sight',
    group_name: 'Sight',
    init: function(template) {
        this._sight_radius = template['sight_radius'] || 5;
    },
    sight_radius: function() { return this._sight_radius; }
};
Game.Mixins.Digger = {
    name: 'Digger',
    init: function(template) {
        this._dig_strength = template['dig_strength'] || 1;
    },
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
Game.Mixins.Destructible = {
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
            if (this.has_mixin(Game.Mixins.PlayerActor)) {
                this.act();
            } else {
                this.map().remove_entity(this);
            }
        }
    }
};
Game.Mixins.Attacker = {
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
Game.Mixins.MessageRecipient = {
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
Game.Mixins.HasInventory = {
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
            if (this.add_item(map_items[indices[i] - added, 1])) {
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
            this.remove_item(i);
        }
    }
};

// Actors
Game.Mixins.PlayerActor = {
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
Game.Mixins.FungusActor = {
    name: 'FungusActor',
    group_name: 'Actor',
    init: function() {
        this._growths_remaining = 5;
        this._spread_chance = 0.01
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
            var entity = Game.EntityRepository.create('fungus');
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
Game.Mixins.WanderActor = {
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
}

// Templates
Game.PlayerTemplate = {
    name: 'Hero',
    character: '@',
    foreground: 'white',
    background: 'black',
    max_hp: 40,
    attack_value: 10,
    sight_radius: 8,
    inventory_slots: 22,
    verb: {
        singular: ['punch', 'kick'],
        plural: ['punches', 'kicks']
    },
    mixins: [Game.Mixins.PlayerActor, Game.Mixins.MessageRecipient, Game.Mixins.Sight, 
            Game.Mixins.Attacker, Game.Mixins.Destructible, Game.Mixins.Digger,
            Game.Mixins.HasInventory]
};

// Entity Repository stuff -- grouping entities together
// TODO: sub-groups, i.e. for spawning from 'goblins'
Game.EntityRepository = new Game.Repository('entities', Game.Entity);

Game.EntityRepository.define('fungus', {
    name: 'fungus',
    character: 'f',
    foreground: 'green',
    max_hp: 10,
    mixins: [Game.Mixins.FungusActor, Game.Mixins.Destructible]
});
Game.EntityRepository.define('bat', {
    name: 'bat',
    character: 'b',
    foreground: 'beige',
    max_hp: 5,
    attack_value: 4,
    verb: {
        singular: ['bite', 'scratch', 'claw'],
        plural: ['bites', 'scratches', 'claws']
    },
    mixins: [Game.Mixins.WanderActor, Game.Mixins.Attacker, Game.Mixins.Destructible]
});
Game.EntityRepository.define('newt', {
    name: 'newt',
    character: 'n',
    foreground: 'yellow',
    max_hp: 3,
    attack_value: 2,
    verb: {
        singular: ['scratch', 'nip'],
        plural: ['scratches', 'nips']
    },
    mixins: [Game.Mixins.WanderActor, Game.Mixins.Attacker, Game.Mixins.Destructible]
});