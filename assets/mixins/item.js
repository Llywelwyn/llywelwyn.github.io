Game.ItemMixins = {};

//   Item Mixins - 'words' indicate values given by a template. These default if not present.
//
// - Edible:        Allows an item to be eaten to restore 'edible'{'value'} hunger, for 'edible'{'uses'/'max_uses'} uses.

Game.ItemMixins.Edible = {
    name: 'Edible',
    init: function(template) {
        this._edible = template['edible'] || {value: 5, max_uses: 1};
        // Number of points to add to hunger
        this._value = this._edible['value'];
        // Uses
        this._max_uses = this._edible['max_uses'] || 1;
        // Uses, defaults to max
        this.uses = this._edible['uses'] || this._max_uses;
    },
    eat: function(entity) {
        if (entity.has_mixin('Consume')) {
            if (this.has_remaining_uses()) {
                entity.modify_fullness_by(this._value);
                this._remaining_uses--;
            }
        }
    },
    has_remaining_uses: function() { return this._remaining_uses > 0; },
    describe: function() {
        if (this._max_uses != this._remaining_uses) {
            return 'partly eaten ' + Game.Item.prototype.describe.call(this);
        } else {
            return this._name;
        }
    }
};