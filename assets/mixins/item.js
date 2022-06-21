Game.ItemMixins = {};

//   Item Mixins - 'words' indicate values given by a template. These default if not present.
//
// - Edible:        Allows an item to be eaten to restore 'edible'{'value'} hunger, for 'edible'{'uses'/'max_uses'} uses.

Game.ItemMixins.Edible = {
    name: 'Edible',
    init: function(template) {
        // Number of points to add to hunger
        this._value = template['edible']['value'] || 10;
        // Uses
        this._max_uses = template['edible']['max_uses'] || 1;
        // Uses, defaults to max
        this._uses = template['edible']['uses'] || this._max_uses;
    },
    eat: function(entity) {
        if (entity.has_mixin('HasHunger')) {
            if (this.has_remaining_uses()) {
                entity.modify_fullness_by(this._value);
                this._uses--;
            }
        }
    },
    has_remaining_uses: function() { return this._uses > 0; },
    uses: function() { return this._uses; },
    describe: function() {
        if (this._uses < this._max_uses) {
            return 'partly eaten ' + Game.Item.prototype.describe.call(this);
        } else {
            return this._name;
        }
    }
};
Game.ItemMixins.Equippable = {
    name: 'Equippable',
    init: function(template) {
        this._verbs = template['verb'];
        this._stats = template['stats'] || {};
        this._atk_bonus = this._stats['attack_bonus'] || 0;
        this._str_bonus = this._stats['strength_bonus'] || 0;
        this._def_bonus = this._stats['defence_bonus'] || 0;
        this._wieldable = this._stats['wieldable'] || false;
        this._wearable = this._stats['wearable'] || false;
    },
    attack_bonus: function() { return this._atk_bonus; },
    strength_bonus: function() { return this._str_bonus; },
    defence_bonus: function() { return this._def_bonus; },
    is_wieldable: function() { return this._wieldable; },
    is_wearable: function() { return this._wearable; },
    verbs: function() { return this._verbs; }
};