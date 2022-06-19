Game.Mixins = {};

// Mixins
Game.Mixins.Moveable = {
    name: 'Moveable',
    try_move: function(x, y, map) {
        var tile = map.tile(x, y);
        var target = map.entity_at(x, y);
        // If entity is present at tile & this is an attacker, attack entity
        if(target) {
            if(this.has_mixin('Attacker')) {
                this.attack(target);
                return true;
            } else {
                return false;
            }
        } else if(tile.is_walkable()) { // If tile is walkable, move
            this._x = x;
            this._y = y;
            return true;
        } else if(tile.is_diggable()) { // If tile is diggable, dig
            map.dig(x, y);
            return true;
        }
        return false;
    }
};
Game.Mixins.Destructible = {
    name: 'Destructible',
    init: function(template) {
        this._max_hp = template['max_hp'] || 10;
        this._hp = template['hp'] || this._max_hp;
        this._defence_value = template['defence_value'] || 0
    },
    hp : function() { return this._hp; },
    max_hp : function() { return this._max_hp; },
    defence_value : function() { return this._defence_value; },
    take_damage: function(attacker, damage) {
        this._hp -= damage;
        // If hp <= 0, remove from map
        if (this._hp <= 0) {
            Game.send_message(attacker, 'You kill the %s.', [this.name()]);
            Game.send_message(this, 'You die!');
            this.map().remove_entity(this);
        }
    }
};
Game.Mixins.Attacker = {
    name: 'Attacker',
    group_name: 'Attacker',
    init: function(template) {
        this._attack_value = template['attack_value'] || 1;
        this._attacks_by = template['attacks_by'] || 'strike';
        this._attacks_by_pl = template['attacks_by_pl'] || 'strikes';
    },
    attack_value: function() { return this._attack_value; },
    attacks_by: function() { return this._attacks_by; },
    attacks_by_pl: function() { return this._attacks_by_pl; },
    attack: function(target) {
        if (target.has_mixin('Destructible')) {
            var attack = this.attack_value();
            var defence = target.defence_value();
            var max = Math.max(0, attack - defence);
            var damage = 1 + Math.floor(Math.random() * max);

            Game.send_message(this, 'You %s the %s for %d damage!',
                [this.attacks_by(), target.name(), damage]);
            Game.send_message(target, 'The %s %s you for %d damage!',
                [this.name(), this.attacks_by_pl(), damage]);

            target.take_damage(this, 1 + Math.floor(Math.random() * max));
        }
    }
};
Game.Mixins.MessageRecipient = {
    name: 'MessageRecipient',
    init: function(template) {
        this._messages = [];
    },
    messages: function() { return this._messages; },
    receive_message: function(message) {
        this._messages.push(message);
    },
    clear_messages: function() {
        this._messages = [];
    }
};

// Actors
Game.Mixins.PlayerActor = {
    name: 'PlayerActor',
    group_name: 'Actor',
    act: function() {
        // Re-render screen
        Game.refresh()
        // Lock engine, wait for input
        this.map().engine().lock();
        // Clear message queue
        this.clear_messages();
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
        if(!this.map().is_empty_floor(x_loc, y_loc)) {
            return;
        }
        // If spawnable, grow
        var entity = new Game.Entity(Game.FungusTemplate);
        entity.set_x(x_loc);
        entity.set_y(y_loc);
        this.map().add_entity(entity);
        this._growths_remaining--;

        Game.send_message_nearby(
            this.map(),
            entity.x(),
            entity.y(),
            'The %s is spreading!', [this.name()]
        );
    }
};

// Templates
Game.PlayerTemplate = {
    name: 'Hero',
    character: '@',
    foreground: 'white',
    background: 'black',
    max_hp: 40,
    attack_value: 10,
    attacks_by: 'strike',
    attacks_by_pl: 'strikes',
    mixins: [Game.Mixins.PlayerActor, Game.Mixins.Moveable, Game.Mixins.MessageRecipient,
            Game.Mixins.Attacker, Game.Mixins.Destructible]
};
Game.FungusTemplate = {
    name: 'fungus',
    character: 'f',
    foreground: 'green',
    max_hp: 10,
    mixins: [Game.Mixins.FungusActor, Game.Mixins.Destructible]
};