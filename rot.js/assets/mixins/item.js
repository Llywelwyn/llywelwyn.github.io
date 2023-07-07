Game.ItemMixins = {}

//   Item Mixins - 'words' indicate values given by a template. These default if not present.
//
// - Edible:        Allows an item to be eaten to restore 'edible'{'value'} hunger, for 'edible'{'uses'/'max_uses'} uses.

Game.ItemMixins.Edible = {
    name: "Edible",
    init: function (template) {
        // Number of points to add to hunger
        this._value = template["edible"]["value"] || 10
        // Uses
        this._max_uses = template["edible"]["max_uses"] || 1
        // Uses, defaults to max
        this._uses = template["edible"]["uses"] || this._max_uses
        this._desc_colour = template["edible"]["colour"] || undefined
    },
    eat: function (entity) {
        if (entity.has_mixin("HasHunger")) {
            if (this.has_remaining_uses()) {
                entity.modify_fullness(this._value)
                this._uses--
            }
        }
    },
    has_remaining_uses: function () {
        return this._uses > 0
    },
    uses: function () {
        return this._uses
    },
    describe: function () {
        if (this._uses < this._max_uses) {
            return "partly eaten " + Game.Item.prototype.describe.call(this)
        } else {
            return this._name
        }
    },
}
Game.ItemMixins.Equippable = {
    name: "Equippable",
    init: function (template) {
        this._verbs = template["verb"]
        this._stats = template["stats"] || {}
        this._atk_bonus = this._stats["attack_bonus"] || 0
        this._str_bonus = this._stats["strength_bonus"] || 0
        this._def_bonus = this._stats["defence_bonus"] || 0
        this._wieldable = this._stats["wieldable"] || false
        this._wearable = this._stats["wearable"] || false
    },
    listeners: {
        details: function () {
            /* TODO: Replace this stuff with description. For a large weapon: It's slow. A dagger: It's fast. etc.
            var results = [];
            if (this.attack_bonus() !== 0) {
                results.push({key: 'attack', value: this.attack_bonus()});
            }
            if (this.strength_bonus() !== 0) {
                results.push({key: 'strength', value: this.strength_bonus()});
            }
            if (this.defence_bonus() !== 0) {
                results.push({key: 'defence', value: this.defence_bonus()});
            }
            */
        },
    },
    attack_bonus: function () {
        return this._atk_bonus
    },
    strength_bonus: function () {
        return this._str_bonus
    },
    defence_bonus: function () {
        return this._def_bonus
    },
    is_wieldable: function () {
        return this._wieldable
    },
    is_wearable: function () {
        return this._wearable
    },
    verbs: function () {
        return this._verbs
    },
}
Game.ItemMixins.HasDescription = {
    name: "HasDescription",
    init: function (template) {
        this._senses = template["description"]
        this._smell = this._senses["smell"] || undefined
        this._taste = this._senses["taste"] || undefined
        this._touch = this._senses["touch"] || undefined
        this._sight = this._senses["sight"] || undefined
    },
    listeners: {
        details: function (entity) {
            results = []

            if (entity.has_mixin(Game.EntityMixins.Senses)) {
                if (this._smell && entity.has_smell()) {
                    results.push({
                        key: "smell",
                        value: "It smells " + this._smell + ".",
                    })
                }
                if (this._touch && entity.has_touch()) {
                    results.push({
                        key: "touch",
                        value: "It feels " + this._feel + ".",
                    })
                }
                if (this._sight && entity.has_sight()) {
                    results.push({
                        key: "sight",
                        value: "It looks " + this._sight + ".",
                    })
                }
            }
            return results
        },
    },
}
