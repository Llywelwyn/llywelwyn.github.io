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