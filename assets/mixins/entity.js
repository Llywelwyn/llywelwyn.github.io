Game.EntityMixins = {};

//   Entity Mixins - 'words' indicate values given by a template. These default if not present.
//
// - Sight:             allows an Entity to see at a range given by 'sight_radius'.
// - Digger:            allows an Entity to dig through tiles with the is_diggable flag.
// - Destructible:      gives an Entity health and defence values, allowing them to take damage/die.
// - Attacker:          allows an Entity to attack the player using singular/plural verbs given by 'verb'.
// - MessageRecipient:  allows an Entity to use the message system.
// - HasInventory:      grants an Entity inventory functionality of capacity 'inventory_slots'.
// - HasHunger:         enforces hunger mechanics.

Game.EntityMixins.Sight = {
    name: 'Sight',
    group_name: 'Sight',
    init: function(template) {
        this._sight_radius = template['sight_radius'] || 5;
    },
    sight_radius: function() { return this._sight_radius; },
    can_see: function(entity) {
        // If not on same map/floor, return false
        if (
            !entity ||
            this._map !== entity.map() ||
            this._z !== entity.z()
        ) {
            return false;
        }
        console.log("1st check: true");
        var found = false;
        this.map().fov(this.z()).compute(
            this.x(),
            this.y(),
            this.sight_radius(),
            function(x, y, radius, visibility) {
                if (x === entity.x() && y === entity.y()) {
                    found = true;
                }
            }
        );
        console.log("computing fov");
        console.log('Found: ' + found);
        return found;
    }
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
        Game.send_message(this, "%%c{white}You dig through %%c{%s}%s%%c{white}.", [tile.foreground(), tile.describe_the()]);
        return true;
    }
}
Game.EntityMixins.Destructible = {
    name: 'Destructible',
    init: function(template) {
        this._stats = template['stats'] || {};
        this._max_hp = this._stats['max_hp'] || 10;
        this._hp = this._stats['hp'] || this._max_hp;
        this._def_bonus = this._stats['defence_bonus'] || 0;
    },
    hp : function() { return this._hp; },
    max_hp : function() { return this._max_hp; },
    defence_bonus: function() {
        var modifier = 0;
        if (this.has_mixin(Game.EntityMixins.Equipper)) {
            if (this.weapon()) {
                modifier += this.weapon().defence_bonus();
            }
            if (this.armour()) {
                modifier += this.armour().defence_bonus();
            }
        }
        return this._def_bonus + modifier;
    },
    take_damage: function(attacker, damage) {
        this._hp -= damage;
        // If 0 or less hp, kill
        if (this._hp <= 0) {
            Game.send_message(attacker, '%%c{white}You kill %%c{%s}%s%%c{white}!', [this.foreground(), this.describe_the()]);
            if (this.has_mixin(Game.EntityMixins.CorpseDropper)) {
                this.try_drop_corpse();
            }
            this.kill();
        }
    }
};
Game.EntityMixins.Attacker = {
    name: 'Attacker',
    group_name: 'Attacker',
    init: function(template) {
        this._stats = template['stats'] || {};
        this._atk_bonus = this._stats['attack_bonus'] || 1;
        this._str_bonus = this._stats['strength_bonus'] || 1;
        this._verb = template['verb'] || {singular:['strike'], plural:['strikes']};
    },
    attack_bonus: function() {
        var modifier = 0;
        if (this.has_mixin(Game.EntityMixins.Equipper)) {
            if (this.weapon()) {
                modifier += this.weapon().attack_bonus();
            }
            if (this.armour()) {
                modifier += this.armour().attack_bonus();
            }
        }
        return this._atk_bonus + modifier;
    },
    strength_bonus: function() {
        var modifier = 0;
        if (this.has_mixin(Game.EntityMixins.Equipper)) {
            if (this.weapon()) {
                modifier += this.weapon().strength_bonus();
            }
            if (this.armour()) {
                modifier += this.armour().strength_bonus();
            }
        }
        return this._str_bonus + modifier;
    },
    refresh_verbs: function() {
        if (this.has_mixin(Game.EntityMixins.Equipper) && this.weapon()) {
            this._verb = this.weapon().verbs();
        };
        var random = Math.floor(Math.random() * this._verb['singular'].length);
        var selected_verbs = {
            'singular': this._verb['singular'][random],
            'plural': this._verb['plural'][random]}
        return selected_verbs;
    },
    attack: function(target) {
        if (target.has_mixin('Destructible')) {
            if (this.attack_bonus() >= target.defence_bonus()) { // 2 algorithms to determine hit chance.
                var hit_chance = 1 - ((target.defence_bonus() + 2) / (2 * (this.attack_bonus() + 1)));
            } else {
                var hit_chance = 1 - (this.attack_bonus() / (2 * (target.defence_bonus() + 1)));
            }
            if (Math.random() <= hit_chance) { // On a hit, roll between 1 and max hit to determine damage.
                var max_hit = Math.max(0, this.strength_bonus());
                var damage = 1 + Math.floor(Math.random() * max_hit);
                var verb = this.refresh_verbs(); // Get new verbs.
                Game.send_message(this, '%%c{white}You %s %%c{%s}%s%%c{white} for %d damage!',
                    [verb['singular'], target.foreground(), target.describe_the(), damage]);
                Game.send_message(target, '%%c{%s}%s%%c{white} %s you for %d damage!',
                    [this.foreground(), this.describe_the(1), verb['plural'], damage]);
                target.take_damage(this, damage); // Damage target.
                return true;
            } else {
                Game.send_message(this, '%%c{white}You miss %%c{%s}%s%%c{white}!',
                    [target.foreground(), target.describe_the()]);
                Game.send_message(target, '%%c{%s}%s%%c{white} misses you!',
                    [this.foreground(), this.describe_the(1)]);
                return false;
            }
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
    remove_item: function(i) {
        // If we can equip, make sure we unequip first
        if (this._items[i] && this.has_mixin(Game.EntityMixins.Equipper)) {
            this.unequip(this._items[i]);
        }
        this._items[i] = null; 
    },
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
            Game.send_message(this, "%%c{white}You drop %%c{%s}%s%%c{white}.", [this._items[i].foreground(), this._items[i].describe_a()]);
            this.remove_item(i);
        }
    }
};
Game.EntityMixins.HasHunger = {
    name: 'HasHunger',
    init: function(template) {
        this._max_fullness = template['hunger']['max_fullness'] || 1000;
        // Start at half if no default value
        this._fullness = template['hunger']['fullness'] || (this._max_fullness /2 );
        // Depletion rate
        this._depletion_rate = template['hunger']['depletion_rate'] || 1;
    },
    add_turn_hunger: function() {
        // Minus depletion rate
        this.modify_fullness_by(-this._depletion_rate);
        // If starving, give a message 5% of the time warning the player.
        if (this.hunger_state()[0] === 'Starving') {
            if (Math.random() < 0.05) {
                Game.send_message(this, "%c{crimson}You really need to eat something...");
            }
        }
    },
    modify_fullness_by: function(points) {
        this._fullness = this._fullness + points;
        if (this._fullness <= 0) {
            this.kill("You have died of %c{brown}starvation%c{white}!");
        } else if (this._fullness > this._max_fullness) {
            Game.send_message(this, "%c{white}You struggle to force down any more!");
            this._fullness = this._max_fullness;
        }
    },
    hunger_state: function() {
        // Fullness points per percent of max
        var fullness_percent = this._fullness / (this._max_fullness / 100);

        // We hate magic numbers. Less than or equal to this
        // number gives the corresponding return message.
        const STARVING = 5;
        const VERY_HUNGRY = 15;
        const HUNGRY = 30;
        const PECKISH = 50;
        const NOT_HUNGRY = 70;
        const FULL = 90;

        if (fullness_percent <= STARVING) { return ['Starving', '%c{red}Starving']; } 
        else if (fullness_percent <= VERY_HUNGRY) { return ['Very Hungry', '%c{brown}Very Hungry']; } 
        else if (fullness_percent <= HUNGRY) { return ['Hungry', '%c{indianred}Hungry']; }
        else if (fullness_percent <= PECKISH) { return ['Peckish', '%c{plum}Peckish']; }
        else if (fullness_percent <= NOT_HUNGRY) { return ['Satisfied', '%c{white}Satisfied']; }
        else if (fullness_percent <= FULL) { return ['Full', '%c{green}Full']; } 
        else { return ['Oversatiated', '%c{blue}Oversatiated']; };
    }
};
Game.EntityMixins.CorpseDropper = {
    name: 'CorpseDropper',
    init: function(template) {
        // Chance of creating a corpse
        this._corpse_drop_rate = template['corpse_drop_rate'] || 100;
    },
    try_drop_corpse: function() {
        if (Math.round(Math.random() * 100) < this._corpse_drop_rate) {
            // Create new corpse item and drop it
            var prefix = one_of([
                ['corpse', false],
                ['remains', true],
                ['entrails', true]]);

            this._map.add_item(
                this.x(), this.y(), this.z(),
                Game.ItemRepository.create('corpse', {
                    name: this._name + ' ' + prefix[0],
                    noun: {
                        plural: prefix[1],
                    },
                    foreground: one_of(['red', 'crimson', 'firebrick'])
                })
            );
        }
    }
};
Game.EntityMixins.Equipper = {
    name: 'Equipper',
    init: function(template) {
        this._weapon = null;
        this._armour = null;
    },
    weapon: function() { return this._weapon; },
    armour: function() { return this._armour; },
    wield: function(item) { this._weapon = item; },
    unwield: function() { this._weapon = null; },
    don: function(item) { this._armour = item; },
    doff: function() { this._armour = null; },
    unequip: function(item) {
        // Helper function.
        if (this._weapon === item) {
            this.unwield();
        }
        if (this._armour === item) {
            this.doff();
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
        // If we're already taking an action (act was called by something during the hero's turn, don't act twice. Just return.)
        if (this._acting) { return; }
        this._acting = true;
        // If we're using hunger, add a turn of hunger.
        if (this.has_mixin(Game.EntityMixins.HasHunger)) {
            this.add_turn_hunger();
        }
        // Detect if game is over
        if (!this.is_alive()) {
            Game.Screen.play_screen.set_game_ended(true);
            // Send a last message to the player
            Game.send_message(this, '%c{white}Press %c{seagreen}[Enter]%c{white} to continue.');
        }
        // Re-render screen
        Game.refresh()
        // Lock engine, wait for input
        this.map().engine().lock();
        this._acting = false;
    }
};
Game.EntityMixins.VinesActor = {
    name: 'VinesActor',
    group_name: 'Actor',
    init: function(template) {
        this._growths_remaining = template['growth']['remaining'] || 5;
        this._spread_chance = template['growth']['chance'] || 0.01;
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
                '%%c{%s}%s%%c{white} %s spreading!', [this.foreground(), this.describe_the(), this.is_are()]
            );
        }
    }
};
Game.EntityMixins.TaskActor = {
    name: 'TaskActor',
    group_name: 'Actor',
    init: function(template) {
        this._tasks = template['tasks'] || ['wander'];
    },
    act: function() {
        // Iterate through tasks
        for (var i = 0; i < this._tasks.length; i++) {
            if (this.can_do_task(this._tasks[i])) {
                // If we can do the task, execute the function for it
                this[this._tasks[i]]();
                return;
            }
        }
    },
    can_do_task: function(task) {
        if (task === 'hunt') {
            return this.has_mixin('Sight') && this.can_see(this.map().player());
        } else if (task === 'wander') {
            return true;
        } else {
            throw new Error('Tried to perform undefined task ' + task);
        }
    },
    hunt: function() {
        console.log("Hunting.");
        var player = this.map().player();
        // If adjacent, attack
        var offsets = Math.abs(player.x() - this.x()) + Math.abs(player.y() - this.y());
        if (offsets === 1) {
            if (this.has_mixin('Attacker')) {
                this.attack(player);
                return;
            }
        }
        // Generate path and move to first tile
        var source = this;
        var z = source.z();
        var path = new ROT.Path.AStar(player.x(), player.y(), function(x, y) {
            // If entity is present at tile, can't move
            var entity = source.map().entity_at(x, y, z);
            if (entity && entity !== player && entity !== source) {
                return false;
            }
            return source.map().tile(x, y, z).is_walkable();
        }, {topology: 4});
        // Once we've gotten the path, move to the second cell passed in the
        // callback (first is the entity's starting point)
        var count = 0;
        path.compute(source.x(), source.y(), function(x, y) {
            if (count == 1) {
                source.try_move(x, y, z);
            }
            count++;
        });
    },
    wander: function() {
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