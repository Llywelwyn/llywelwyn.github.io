Game.EntityMixins = {}

//   Entity Mixins - 'words' indicate values given by a template. These default if not present.
//
// - Sight:             allows an Entity to see at a range given by 'sight_radius'.
// - Digger:            allows an Entity to dig through tiles with the is_diggable flag.
// - Destructible:      gives an Entity health and defence values, allowing them to take damage/die.
// - Attacker:          allows an Entity to attack the player using singular/plural verbs given by 'verb'.
// - MessageRecipient:  allows an Entity to use the message system.
// - HasInventory:      grants an Entity inventory functionality of capacity 'inventory_slots'.
// - HasHunger:         enforces hunger mechanics.
// - Equipper:          able to equip Game.ItemMixins.Equippable
// - CorpseDropper:     drops an edible corpse on death
// - ExperienceGainer:  level up mechanics, experience gain, etc.

Game.EntityMixins.Sight = {
    name: "Sight",
    group_name: "Sight",
    init: function (template) {
        this._sight_radius = template["sight_radius"] || 5
    },
    sight_radius: function () {
        return this._sight_radius
    },
    modify_sight_radius: function (value) {
        // If no value passed, default 0
        value = value || 1
        if (value > 0) {
            Game.send_message(this, "You're more aware of your surroundings!")
        } else if (value < 0) {
            Game.send_message(this, "You struggle to make out your surroundings...")
        }
        this._sight_radius += value
    },
    can_see: function (entity) {
        // If not on same map/floor, return false
        if (!entity || this._map !== entity.map() || this._z !== entity.z()) {
            return false
        }
        var found = false
        this.map()
            .fov(this.z())
            .compute(this.x(), this.y(), this.sight_radius(), function (x, y, radius, visibility) {
                if (x === entity.x() && y === entity.y()) {
                    found = true
                }
            })
        return found
    },
}
Game.EntityMixins.Digger = {
    name: "Digger",
    init: function (template) {},
    try_dig: function (x, y, z, tile, map) {
        // If tile isn't diggable, fail
        if (!tile.is_diggable()) {
            return false
        }
        // If diggable and strong enough, dig the tile and give a message to this
        map.dig(x, y, z)
        Game.send_message(this, "You dig through %%c{%s}%s%%c{white}.", [
            tile.foreground(),
            tile.describe_the(),
        ])
        return true
    },
}
Game.EntityMixins.CanOpen = {
    name: "CanOpen",
    init: function (template) {},
    try_open: function (x, y, z, tile, map) {
        if (!tile.is_openable()) {
            return false
        }
        map.open(x, y, z)
        Game.send_message(this, "You open %%c{%s}%s%%c{white}.", [
            tile.foreground(),
            tile.describe_the(),
        ])
        return true
    },
}
Game.EntityMixins.Destructible = {
    name: "Destructible",
    init: function (template) {
        this._stats = template["stats"] || {}
        this._max_hp = this._stats["max_hp"] || 10
        this._hp = this._stats["hp"] || this._max_hp
        this._def_bonus = this._stats["defence_bonus"] || 0
    },
    listeners: {
        on_gain_level: function () {
            // Heal
            this.set_hp(this.hp() + 5 < this.max_hp() ? this.hp() + 5 : this.max_hp())
        },
    },
    hp: function () {
        return this._hp
    },
    max_hp: function () {
        return this._max_hp
    },
    set_hp: function (hp) {
        this._hp = hp
    },
    defence_bonus: function () {
        var modifier = 0
        if (this.has_mixin(Game.EntityMixins.Equipper)) {
            if (this.weapon()) {
                modifier += this.weapon().defence_bonus()
            }
            if (this.armour()) {
                modifier += this.armour().defence_bonus()
            }
        }
        return this._def_bonus + modifier
    },
    modify_defence_bonus: function (value) {
        // If no value is passed, default 0
        value = value || 3
        if (value > 0) {
            Game.send_message(this, "You feel tougher.")
        } else if (value < 0) {
            Game.send_message(this, "You feel your toughness sapped...")
        }
        // Add to this' attack bonus
        this._def_bonus += value
    },
    modify_max_hp: function (value) {
        // If no value is passed, default 0
        value = value || 2
        if (value > 0) {
            Game.send_message(this, "You feel more durable.")
        } else if (value < 0) {
            Game.send_message(this, "You feel your endurance sapped...")
        }
        // Add to this' attack bonus
        this._max_hp += value
        this._hp += value
    },
    take_damage: function (attacker, damage) {
        this._hp -= damage
        // If 0 or less hp, kill
        if (damage > 1 && this.has_mixin(Game.EntityMixins.Bleeder)) {
            this.try_bleed()
        }
        if (this._hp <= 0) {
            Game.send_message(attacker, "You kill %%c{%s}%s%%c{white}!", [
                this.foreground(),
                this.describe_the(),
            ])

            this.raise_event("on_death", attacker)
            attacker.raise_event("on_kill", this)
            this.kill()
        }
    },
    hp_state: function () {
        // Hp points per percent of max
        var fullness_percent = this._hp / (this._max_hp / 100)

        // We hate magic numbers. Less than or equal to this
        // number gives the corresponding return message.
        const STARVING = 5
        const VERY_HUNGRY = 15
        const HUNGRY = 30
        const PECKISH = 50
        const NOT_HUNGRY = 70
        const FULL = 90

        if (fullness_percent <= STARVING) {
            return ["Dying", "%c{red}Dying"]
        } else if (fullness_percent <= VERY_HUNGRY) {
            return ["Very Bloodied", "%c{brown}Very Bloodied"]
        } else if (fullness_percent <= HUNGRY) {
            return ["Bloodied", "%c{indianred}Bloodied"]
        } else if (fullness_percent <= PECKISH) {
            return ["Very Injured", "%c{salmon}Very Injured"]
        } else if (fullness_percent <= NOT_HUNGRY) {
            return ["Injured", "%c{plum}Injured"]
        } else if (fullness_percent <= FULL) {
            return ["Bruised", "%c{green}Bruised"]
        } else {
            return ["Uninjured", "%c{white}Uninjured"]
        }
    },
}
Game.EntityMixins.Attacker = {
    name: "Attacker",
    group_name: "Attacker",
    init: function (template) {
        this._stats = template["stats"] || {}
        this._atk_bonus = this._stats["attack_bonus"] || 1
        this._str_bonus = this._stats["strength_bonus"] || 1
        this._verb = template["verb"] || {
            singular: ["strike"],
            plural: ["strikes"],
        }
    },
    attack_bonus: function () {
        var modifier = 0
        if (this.has_mixin(Game.EntityMixins.Equipper)) {
            if (this.weapon()) {
                modifier += this.weapon().attack_bonus()
            }
            if (this.armour()) {
                modifier += this.armour().attack_bonus()
            }
        }
        return this._atk_bonus + modifier
    },
    strength_bonus: function () {
        var modifier = 0
        if (this.has_mixin(Game.EntityMixins.Equipper)) {
            if (this.weapon()) {
                modifier += this.weapon().strength_bonus()
            }
            if (this.armour()) {
                modifier += this.armour().strength_bonus()
            }
        }
        return this._str_bonus + modifier
    },
    modify_attack_bonus: function (value) {
        // If no value is passed, default 0
        value = value || 3
        if (value > 0) {
            Game.send_message(this, "You feel more dexterous.")
        } else if (value < 0) {
            Game.send_message(this, "You feel your dexterity leave you.")
        }
        // Add to this' attack bonus
        this._atk_bonus += value
    },
    modify_strength_bonus: function (value) {
        // If no value is passed, default 0
        value = value || 1
        if (value > 0) {
            Game.send_message(this, "You feel stronger.")
        } else if (value < 0) {
            Game.send_message(this, "You feel your strength sapped...")
        }
        // Add to this' attack bonus
        this._str_bonus += value
    },
    refresh_verbs: function () {
        if (this.has_mixin(Game.EntityMixins.Equipper) && this.weapon()) {
            this._verb = this.weapon().verbs() || {
                singular: ["strike"],
                plural: ["strikes"],
            }
        }
        var random = Math.floor(Math.random() * this._verb["singular"].length)
        var selected_verbs = {
            singular: this._verb["singular"][random],
            plural: this._verb["plural"][random],
        }
        return selected_verbs
    },
    attack: function (target) {
        if (target.has_mixin("Destructible")) {
            if (this.attack_bonus() >= target.defence_bonus()) {
                // 2 algorithms to determine hit chance.
                var hit_chance = 1 - (target.defence_bonus() + 2) / (2 * (this.attack_bonus() + 1))
            } else {
                var hit_chance = 1 - this.attack_bonus() / (2 * (target.defence_bonus() + 1))
            }
            if (Math.random() <= hit_chance) {
                // On a hit, roll between 1 and max hit to determine damage.
                var max_hit = Math.max(0, this.strength_bonus())
                var damage = 1 + Math.floor(Math.random() * max_hit)
                var verb = this.refresh_verbs() // Get new verbs.
                Game.send_message(this, "You %s %%c{%s}%s%%c{white} for %d damage!", [
                    verb["singular"],
                    target.foreground(),
                    target.describe_the(),
                    damage,
                ])
                Game.send_message(target, "%%c{%s}%s%%c{white} %s you for %d damage!", [
                    this.foreground(),
                    this.describe_the(1),
                    verb["plural"],
                    damage,
                ])
                target.take_damage(this, damage) // Damage target.
                return true
            } else {
                Game.send_message(this, "You miss %%c{%s}%s%%c{white}!", [
                    target.foreground(),
                    target.describe_the(),
                ])
                Game.send_message(target, "%%c{%s}%s%%c{white} misses you!", [
                    this.foreground(),
                    this.describe_the(1),
                ])
                return false
            }
        }
    },
}
Game.EntityMixins.MessageRecipient = {
    name: "MessageRecipient",
    init: function (template) {
        this._messages = []
        this._buffer
        this._last_shown
        this._max_onscreen = Game.bottom_bar_size() - 2
    },
    messages: function () {
        return this._messages
    },
    receive_message: function (message) {
        this._messages.push(message)
        if (this._messages.length >= this._max_onscreen) {
            this._messages.splice(0, this._messages.length - this._max_onscreen) // TODO: Don't splice this, save every message for the message log.
        }
        // Check the total lines of all messages showing in the log
        // While the total lines are over the _max_onscreen, check the
        // first message in the array. If it's length is over one line,
        // cut the first line. If it's length is only one line, just
        // remove it from the array. Repeat until the lines are within
        // the max amount allowed onscreen.
        //
        // The '30' magic number comes from the size of the message box.
        // It's defined in screens. It should probably be made available
        // here to avoid using magic.
        do {
            var total_lines = 0
            for (var i = 0; i < this._messages.length; i++) {
                total_lines++
                if (this._messages[i].replace(/%[^}]*}?/gm, "").length > Game.width() - 31) {
                    console.log(
                        "Found a message over " +
                            (Game.width() - 31) +
                            ": " +
                            this._messages[i].substring(9),
                    )
                    total_lines++
                }
            }
            if (total_lines > this._max_onscreen) {
                if (this._messages[0].replace(/%[^}]*}?/gm, "").length > Game.width() - 31) {
                    this._messages[0] = this._messages[0].substring(Game.width() - 31)
                } else {
                    this._messages.shift()
                }
            }
        } while (total_lines > this._max_onscreen)
    },
    clear_messages: function () {
        this._messages = []
    },
}
Game.EntityMixins.HasInventory = {
    name: "HasInventory",
    init: function (template) {
        // Default to 10
        var inventory_slots = template["inventory_slots"] || 10
        this._items = new Array(inventory_slots)
    },
    items: function () {
        return this._items
    },
    item: function (i) {
        return this._items[i]
    },
    add_item: function (item) {
        // Search for free slot, return true if added successfully
        for (var i = 0; i < this._items.length; i++) {
            if (!this._items[i]) {
                this._items[i] = item
                return true
            }
        }
        return false
    },
    remove_item: function (i) {
        // If we can equip, make sure we unequip first
        if (this._items[i] && this.has_mixin(Game.EntityMixins.Equipper)) {
            this.unequip(this._items[i])
        }
        this._items[i] = null
    },
    can_add_item: function () {
        // Check for empty slot
        for (var i = 0; i < this._items.length; i++) {
            if (!this._items[i]) {
                return true
            }
        }
        return false
    },
    pickup_items: function (indices) {
        // Allows the user to pick up items from the map, where indices
        // is the indices for the array returned by map.items_at(x, y, z)
        var map_items = this._map.items_at(this.x(), this.y(), this.z())
        var added = 0
        // Iterate through indices
        for (var i = 0; i < indices.length; i++) {
            // Try to add item. If inventory is not full, then splice
            // the item out of the list of items. In order to fetch the
            // right item, offset the number of items already added.
            let current_item = map_items[indices[i] - added]
            if (this.add_item(current_item)) {
                Game.send_message(this, "You pick up %%c{%s}%s%%c{white}.", [
                    current_item.foreground(),
                    current_item.describe_a(),
                ])
                map_items.splice(indices[i] - added, 1)
                added++
            } else {
                // Inventory is full
                break
            }
        }
        // Update map items
        this._map.set_items_at(this.x(), this.y(), this.z(), map_items)
        // Return true if we added all items
        return added === indices.length
    },
    drop_item: function (i) {
        // Drops items to current map tile
        if (this._items[i]) {
            if (this._map) {
                this._map.add_item(this.x(), this.y(), this.z(), this._items[i])
            }
            Game.send_message(this, "You drop %%c{%s}%s%%c{white}.", [
                this._items[i].foreground(),
                this._items[i].describe_a(),
            ])
            this.remove_item(i)
        }
    },
}
Game.EntityMixins.HasHunger = {
    name: "HasHunger",
    init: function (template) {
        this._max_fullness = template["hunger"]["max_fullness"] || 1000
        // Start at half if no default value
        this._fullness = template["hunger"]["fullness"] || this._max_fullness / 2
        // Depletion rate
        this._depletion_rate = template["hunger"]["depletion_rate"] || 1
    },
    add_turn_hunger: function () {
        // Minus depletion rate
        this.modify_fullness(-this._depletion_rate)
        // If starving, give a message 5% of the time warning the player.
        if (this.hunger_state()[0] === "Starving") {
            if (Math.random() < 0.05) {
                Game.send_message(this, "%c{crimson}You really need to eat something...")
            }
        }
    },
    modify_fullness: function (points) {
        this._fullness = this._fullness + points
        if (this._fullness <= 0) {
            this.kill("You have died of %c{brown}starvation%c{white}!")
        } else if (this._fullness > this._max_fullness) {
            Game.send_message(this, "You struggle to force down any more!")
            this._fullness = this._max_fullness
        }
    },
    hunger_state: function () {
        // Fullness points per percent of max
        var fullness_percent = this._fullness / (this._max_fullness / 100)

        // We hate magic numbers. Less than or equal to this
        // number gives the corresponding return message.
        const STARVING = 5
        const VERY_HUNGRY = 15
        const HUNGRY = 30
        const PECKISH = 50
        const NOT_HUNGRY = 70
        const FULL = 90

        if (fullness_percent <= STARVING) {
            return ["Starving", "%c{red}Starving"]
        } else if (fullness_percent <= VERY_HUNGRY) {
            return ["Very Hungry", "%c{brown}Very Hungry"]
        } else if (fullness_percent <= HUNGRY) {
            return ["Hungry", "%c{indianred}Hungry"]
        } else if (fullness_percent <= PECKISH) {
            return ["Peckish", "%c{plum}Peckish"]
        } else if (fullness_percent <= NOT_HUNGRY) {
            return ["Satisfied", "%c{white}Satisfied"]
        } else if (fullness_percent <= FULL) {
            return ["Full", "%c{green}Full"]
        } else {
            return ["Oversatiated", "%c{blue}Oversatiated"]
        }
    },
}
Game.EntityMixins.CorpseDropper = {
    name: "CorpseDropper",
    init: function (template) {
        // Chance of creating a corpse
        this._corpse_drop_rate = template["corpse_drop_rate"] || 100
    },
    listeners: {
        on_death: function () {
            console.log("'on_death' called for " + this._name)
            if (Math.round(Math.random() * 100) < this._corpse_drop_rate) {
                // Create new corpse item and drop it
                var prefix = one_of([
                    ["corpse", false],
                    ["remains", true],
                    ["entrails", true],
                ])

                this._map.add_item(
                    this.x(),
                    this.y(),
                    this.z(),
                    Game.ItemRepository.create("corpse", "refuse", {
                        name: this._name + " " + prefix[0],
                        noun: {
                            plural: prefix[1],
                        },
                        foreground: one_of(["red", "crimson", "firebrick"]),
                    }),
                )
            }
        },
    },
}
Game.EntityMixins.Equipper = {
    name: "Equipper",
    init: function (template) {
        this._weapon = null
        this._armour = null
    },
    weapon: function () {
        return this._weapon
    },
    armour: function () {
        return this._armour
    },
    wield: function (item) {
        this._weapon = item
    },
    unwield: function () {
        this._weapon = null
    },
    don: function (item) {
        this._armour = item
    },
    doff: function () {
        this._armour = null
    },
    unequip: function (item) {
        // Helper function.
        if (this._weapon === item) {
            this.unwield()
        }
        if (this._armour === item) {
            this.doff()
        }
    },
}
Game.EntityMixins.ExperienceGainer = {
    name: "ExperienceGainer",
    init: function (template) {
        this._stats = template["stats"] || {}
        this._level = this._stats["level"] || 1
        this._experience = this._stats["experience"] || 0
        this._stat_points_per_level = this._stats["stat_gain_per_level"] || 1
        this._stat_points = 0
        // Determine what stats can be levelled up
        this._stat_options = []
        if (this.has_mixin(Game.EntityMixins.Attacker)) {
            this._stat_options.push(["%c{green}dexterity", this.modify_attack_bonus])
            this._stat_options.push(["%c{crimson}strength", this.modify_strength_bonus])
        }
        if (this.has_mixin(Game.EntityMixins.Destructible)) {
            this._stat_options.push(["%c{cyan}toughness", this.modify_defence_bonus])
            this._stat_options.push(["%c{red}constitution", this.modify_max_hp])
        }
        if (this.has_mixin(Game.EntityMixins.Sight)) {
            this._stat_options.push(["%c{plum}perception", this.modify_sight_radius])
        }
    },
    listeners: {
        on_kill: function (victim) {
            var exp = victim.max_hp() + victim.defence_bonus()
            if (victim.has_mixin("Attacker")) {
                exp += victim.attack_bonus()
            }
            exp = Math.floor(exp / 10)
            // Account for level diff
            if (victim.has_mixin("ExperienceGainer")) {
                exp -= (this.level() - victim.level()) * 3
            }
            if (exp > 0) {
                // exp = (target's max hp + defence + attack)/10 - (level difference * 3)
                // TODO: Refine levelling + experience gain algorithms a lot
                this.give_experience(exp)
            }
        },
    },
    level: function () {
        return this._level
    },
    experience: function () {
        return this._experience
    },
    next_level_experience: function () {
        return this.level() * this.level() * 10 + this.level() * 7
    },
    stat_points: function () {
        return this._stat_points
    },
    set_stat_points: function (stat_points) {
        this._stat_points = stat_points
    },
    stat_options: function () {
        return this._stat_options
    },
    give_experience: function (points) {
        var stat_points_gained = 0
        var levels_gained = 0
        // Loop until all points allocated
        while (points > 0) {
            // If adding points will level this up
            if (this._experience + points >= this.next_level_experience()) {
                // Fill experience until next threshold
                var used_points = this.next_level_experience() - this._experience
                points -= used_points
                // Levle up
                this._level++
                levels_gained++
                this._stat_points += this._stat_points_per_level
                stat_points_gained += this._stat_points_per_level
            } else {
                // No level up, just give exp
                this._experience += points
                points = 0
            }
        }
        // Check if we gained at least 1 level
        if (levels_gained > 0) {
            Game.send_message(this, "You advance to level %d.", [this._level])
            this.raise_event("on_gain_level")
        }
    },
}
Game.EntityMixins.RandomStatGainer = {
    name: "RandomStatGainer",
    group_name: "StatGainer",
    listeners: {
        on_gain_level: function () {
            var stat_options = this.stat_options()
            // Randomly select a stat option, callback for each point
            while (this.stat_options() > 0) {
                // Call increasing function w/ this as context
                one_of(stat_options)[1].call(this)
                this.set_stat_points(this.stat_points() - 1)
            }
        },
    },
}
Game.EntityMixins.PlayerStatGainer = {
    name: "PlayerStatGainer",
    group_name: "StatGainer",
    listeners: {
        on_gain_level: function () {
            // Setup stat screen and show it
            Game.Screen.gain_stat_screen.setup(this)
            Game.Screen.play_screen.set_sub_screen(Game.Screen.gain_stat_screen)
        },
    },
}
Game.EntityMixins.Bleeder = {
    // TODO: Should probably spawn an entity rather than change the tile? Blood sims would be cool.
    name: "Bleeder",
    init: function (template) {
        // Chance of creating a corpse
        this._bleed_rate = template["bleed_rate"] || 100
    },
    try_bleed: function () {
        if (Math.round(Math.random() * 100) < this._bleed_rate) {
            var x = this.x()
            var y = this.y()
            // If this tile isn't bloody, default to tile beneath entity
            if (!this._map.is_bloody(x, y, this.z())) {
                x = this.x()
                y = this.y()
                // Otherwise, randomly get an x- or y- offset
            } else {
                var offset = Math.round(Math.random()) === 1 ? 1 : -1
                // Determine x- or y-direction
                if (Math.round(Math.random()) === 1) {
                    x = this.x() + offset
                    if (
                        this._map.is_in_bounds(x, y, this.z()) &&
                        this._map.is_bloody(x, y, this.z())
                    ) {
                        y += Math.round(Math.random()) === 1 ? 1 : -1
                    }
                } else {
                    y = this.y() + offset
                    if (
                        this._map.is_in_bounds(x, y, this.z()) &&
                        this._map.is_bloody(x, y, this.z())
                    ) {
                        x += Math.round(Math.random()) === 1 ? 1 : -1
                    }
                }
            }
            if (this._map.is_in_bounds(x, y, this.z())) {
                this._map.set_bloody(x, y, this.z(), true)
            }
        }
    },
}
Game.EntityMixins.Senses = {
    name: "Senses",
    init: function (template) {
        this._senses = template["senses"] || undefined
        this._smell = this._senses["smell"] || false
        this._touch = this._senses["touch"] || false
        this._hear = this._senses["hearing"] || false
        this._taste = this._senses["taste"] || false
        this._sight = this._senses["sight"] || false
    },
    has_smell: function () {
        return this._smell
    },
    has_touch: function () {
        return this._touch
    },
    has_hearing: function () {
        return this._hear
    },
    has_taste: function () {
        return this._taste
    },
    has_sight: function () {
        return this._sight
    },
}
Game.EntityMixins.HasDescription = {
    name: "HasDescription",
    init: function (template) {
        this._senses = template["description"]
        this._smell = this._senses["smell"] || undefined
        this._sight = this._senses["sight"] || undefined
        this._taste = this._senses["taste"] || undefined
        this._speed_desc = this._senses["speed"] || undefined
    },
    listeners: {
        details: function (entity) {
            results = []

            if (entity.has_mixin(Game.EntityMixins.Senses)) {
                if (this._speed_desc) {
                    results.push({
                        key: "speed",
                        value: "It moves " + this._speed_desc + ".",
                    })
                }
                if (this._sight && entity.has_sight()) {
                    results.push({
                        key: "sight",
                        value: "It looks " + this._sight + ".",
                    })
                }
                if (this._smell && entity.has_smell()) {
                    results.push({
                        key: "smell",
                        value: "It smells " + this._smell + ".",
                    })
                }
            }
            return results
        },
    },
}

//   Actor Mixins - these determine which 'act' the Entity takes each turn.
//
// - PlayerActor:       Player functionality. Allows game-over, taking of the player's turn, etc.
// - VinesActor:        Spread randomly to a free adjacent square. Given by 'growths_remaining' and 'spread_chance'.
// - WanderActor:       Move randomly +/-1 on the x- or y-axis each turn.

Game.EntityMixins.PlayerActor = {
    name: "PlayerActor",
    group_name: "Actor",
    act: function () {
        this.map().scheduler().setDuration(this.speed())
        // If we're already taking an action (act was called by something during the hero's turn, don't act twice. Just return.)
        if (this._acting) {
            return
        }
        this._acting = true
        // If we're using hunger, add a turn of hunger.
        if (this.has_mixin(Game.EntityMixins.HasHunger)) {
            this.add_turn_hunger()
        }
        // Detect if game is over
        if (!this.is_alive()) {
            Game.Screen.play_screen.set_game_ended(true)
            // Send a last message to the player
            Game.send_message(this, "Press %c{seagreen}[Enter]%c{white} to continue.")
        }
        // Re-render screen
        Game.refresh()
        // Lock engine, wait for input
        this.map().engine().lock()
        this._acting = false
    },
}
Game.EntityMixins.VinesActor = {
    name: "VinesActor",
    group_name: "Actor",
    init: function (template) {
        this._growths_remaining = template["growth"]["remaining"] || 5
        this._spread_chance = template["growth"]["chance"] || 0.01
    },
    act: function () {
        this.map().scheduler().setDuration(this.speed())
        if (this._growths_remaining <= 0 || Math.random() > this._spread_chance) {
            return
        }

        // Generate coords of random adjacent square by generating offset from -1 to 1
        var x_offset = generate_offset(1, 0)
        var y_offset = generate_offset(1, 0)
        // But not the same time
        if (x_offset == 0 && y_offset == 0) {
            return
        }
        // Check if spawn loc is empty
        var x_loc = this.x() + x_offset
        var y_loc = this.y() + y_offset
        if (!this.map().is_empty_floor(x_loc, y_loc, this.z())) {
            return
        }
        // If spawnable, grow
        if (this.map().is_empty_floor(this.x() + x_offset, this.y() + y_offset, this.z())) {
            var entity = Game.EntityRepository.create("vines")
            entity.set_pos(this.x() + x_offset, this.y() + y_offset, this.z())
            this.map().add_entity(entity)
            this._growths_remaining--

            Game.send_message_nearby(
                this.map(),
                entity.x(),
                entity.y(),
                entity.z(),
                "%%c{%s}%s%%c{white} %s spreading!",
                [this.foreground(), this.describe_the(), this.is_are()],
            )
        }
    },
}
Game.EntityMixins.TaskActor = {
    name: "TaskActor",
    group_name: "Actor",
    init: function (template) {
        this._tasks = template["tasks"] || ["wander"]
    },
    act: function () {
        // Iterate through tasks
        for (var i = 0; i < this._tasks.length; i++) {
            if (this.can_do_task(this._tasks[i])) {
                // If we can do the task, execute the function for it
                let time = (this[this._tasks[i]]() * this.speed()) / 100 || this.speed()
                this.map().scheduler().setDuration(time)
                return
            }
        }
    },
    can_do_task: function (task) {
        if (task === "hunt") {
            return this.has_mixin("Sight") && this.can_see(this.map().player())
        } else if (task === "wander") {
            return true
        } else {
            throw new Error("Tried to perform undefined task " + task)
        }
    },
    hunt: function () {
        var player = this.map().player()
        // If adjacent, attack
        var offsets = Math.abs(player.x() - this.x()) + Math.abs(player.y() - this.y())
        if (offsets === 1) {
            if (this.has_mixin("Attacker")) {
                this.attack(player)
                return ACTION_SPEED.attack
            }
        }
        // Generate path and move to first tile
        var source = this
        var z = source.z()
        var path = new ROT.Path.AStar(
            player.x(),
            player.y(),
            function (x, y) {
                // If entity is present at tile, can't move
                var entity = source.map().entity_at(x, y, z)
                if (entity && entity !== player && entity !== source) {
                    return false
                }
                return source.map().tile(x, y, z).is_walkable()
            },
            { topology: 4 },
        )
        // Once we've gotten the path, move to the second cell passed in the
        // callback (first is the entity's starting point)
        var count = 0
        path.compute(source.x(), source.y(), function (x, y) {
            if (count == 1) {
                source.try_move(x, y, z)
            }
            count++
        })
    },
    wander: function () {
        // Determine positive or negative direction
        var offset = Math.round(Math.random()) === 1 ? 1 : -1
        // Determine x- or y-direction
        if (Math.round(Math.random()) === 1) {
            this.try_move(this.x() + offset, this.y(), this.z())
        } else {
            this.try_move(this.x(), this.y() + offset, this.z())
        }
        return ACTION_SPEED.move
    },
}
Game.EntityMixins.VampireActor = Game.extend(Game.EntityMixins.TaskActor, {
    init: function (template) {
        // Call task actor init with correct tasks
        Game.EntityMixins.TaskActor.init.call(
            this,
            Game.extend(template, {
                tasks: ["sharpen_teeth", "spawn_bat", "hunt", "wander"],
            }),
        )
        this._has_sharp_teeth = false
    },
    can_do_task: function (task) {
        // If haven't already sharpened teeth and HP <= half, sharpen
        if (task === "sharpen_teeth") {
            return this.hp() <= this.max_hp() / 2 && !this._has_sharp_teeth
        } else if (task === "spawn_bat") {
            return Math.round(Math.random() * 100) <= 10 && this.can_see(this.map().player())
        } else {
            return Game.EntityMixins.TaskActor.can_do_task.call(this, task)
        }
    },
    sharpen_teeth: function () {
        this._has_sharp_teeth = true
        this.modify_strength_bonus(4)
        this.modify_attack_bonus(30)
        this.modify_defence_bonus(-30)
        Game.send_message_nearby(
            this.map(),
            this.x(),
            this.y(),
            this.z(),
            "%%c{%s}%s%%c{white} grows more ferocious; sharp fangs elongate now, poking out from it's maw.",
            [this.foreground(), this.describe_the(1)],
        )
    },
    spawn_bat: function () {
        // Generate random pos nearby
        var x_offset = Math.floor(Math.random() * 3) - 1
        var y_offset = Math.floor(Math.random() * 3) - 1
        // Check if can spawn that pos
        if (!this.map().is_empty_floor(this.x() + x_offset, this.y() + y_offset, this.z())) {
            return
        }
        var vampire_bat = Game.EntityRepository.create("vampire bat", "vampire")
        vampire_bat.set_x(this.x() + x_offset)
        vampire_bat.set_y(this.y() + y_offset)
        vampire_bat.set_z(this.z())
        this.map().add_entity(vampire_bat)
    },
    listeners: {
        on_death: function (attacker) {
            // TODO: Win game
        },
    },
})
