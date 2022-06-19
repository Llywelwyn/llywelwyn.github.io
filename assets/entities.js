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
    init: function() {
        this._hp = 1;
    },
    take_damage: function(attacker, damage) {
        this._hp -= damage;
        // If hp <= 0, remove from map
        if (this._hp <= 0) {
            this.map().remove_entity(this);
        }
    }
};
Game.Mixins.SimpleAttacker = {
    name: 'SimpleAttacker',
    group_name: 'Attacker',
    attack: function(target) {
        if (target.has_mixin('Destructible')) {
            target.take_damage(this, 1);
        }
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
    }
};
Game.Mixins.FungusActor = {
    name: 'FungusActor',
    group_name: 'Actor',
    act: function() {}
};

// Templates
Game.PlayerTemplate = {
    character: '@',
    foreground: 'white',
    background: 'black',
    mixins: [Game.Mixins.PlayerActor, Game.Mixins.Moveable, Game.Mixins.SimpleAttacker]
};
Game.FungusTemplate = {
    character: 'f',
    foreground: 'green',
    mixins: [Game.Mixins.FungusActor]
};