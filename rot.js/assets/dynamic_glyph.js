Game.DynamicGlyph = function(properties) {
    properties = properties || {};
    // Call glyph constructor with our properties
    Game.Glyph.call(this, properties);
    // Instantiate properties from passed object
    this._name = properties['name'] || '';
    this._noun = properties['noun'] || {plural: false, proper: false};
    this._plural = this._noun['plural'] || false;
    this._proper = this._noun['proper'] || false;

    // Create obj to track mixins attached to this entity
    this._attached_mixins = {};
    this._attached_mixin_groups = {};
    this._listeners = {};
    // Setup object's mixins
    var mixins = properties['mixins'] || [];
    for (var i = 0; i < mixins.length; i++) {
        // Copy properties from each mixin as long
        // as its not the name or init property.
        // We also make sure not to override a
        // property that already exists on entity.
        for (var key in mixins[i]) {
            if (key != 'init' && key != 'name' && key != 'listeners' && !this.hasOwnProperty(key)) {
                this[key] = mixins[i][key];
            }
        }
        // Add name to attached_mixins
        this._attached_mixins[mixins[i].name] = true;
        // Add group name if present
        if (mixins[i].group_name) {
            this._attached_mixin_groups[mixins[i].group_name] = true;
        }
        // Add listeners
        if (mixins[i].listeners) {
            for (var key in mixins[i].listeners) {
                if (key !== 'extend') {
                // If we don't already have a key for this event in our listeners array, add it
                    if (!this._listeners[key]) {
                        this._listeners[key] = [];
                    }
                    // Add the listener
                    if (this._listeners[key].indexOf(mixins[i].listeners[key]) === -1) {
                        this._listeners[key].push(mixins[i].listeners[key]);
                    }
                }
            }
        }
    }
    // Finally call init functions if they exist
    for (var i = 0; i < mixins.length; i++) {
        if (mixins[i].init) {
            mixins[i].init.call(this, properties);
        }
    }
};
// Dynamic glyphs inherit all functionality from glyphs
Game.DynamicGlyph.extend(Game.Glyph);

// Setters/Getters
Game.DynamicGlyph.prototype.set_name = function(name) { this._name = name; };
Game.DynamicGlyph.prototype.name = function() { return this._name; };

Game.DynamicGlyph.prototype.has_mixin = function(object) {
    // Allow passing of mixin itself or the name/group name as string
    if (typeof object === 'object') {
        return this._attached_mixins[object.name];
    } else {
        return this._attached_mixins[object] || this._attached_mixin_groups[object];
    }
};
Game.DynamicGlyph.prototype.describe = function() { return this._name; }; // For now, for use in describe_a().
Game.DynamicGlyph.prototype.describe_a = function(capitalise) {
    if (this._proper || this._plural) {
        if (this._proper) {
            return this.describe();
        } else {
            return 'some ' + this.describe();
        }
    }
    // Optional param to capitalise a/an.
    var prefixes = capitalise ? ['A', 'An'] : ['a', 'an'];
    var string = this.describe();
    var first_letter = string.charAt(0).toLowerCase();
    // If starts w/ vowel use 'an', else use 'a'. Not perfect.
    var prefix = 'aeiou'.indexOf(first_letter) >= 0 ? 1 : 0;
    return prefixes[prefix] + ' ' + string;
};
// Returns correct 'the' usage for proper/improper nouns w/ an option for capitalisation.
Game.DynamicGlyph.prototype.describe_the = function(capitalise) {
    if(this._proper) {
        if (capitalise) {
            return this.describe()[0].toUpperCase() + this.describe().slice(1);
        } else {
            return this.describe();
            
        }
    } else {
        if (capitalise) {
            return 'The ' + this.describe();
        } else {
            return 'the ' + this.describe();
        }
    }
};
Game.DynamicGlyph.prototype.is_are = function() {
    if(this._plural) {
        return 'are';
    } else {
        return 'is';
    }
};
Game.DynamicGlyph.prototype.raise_event = function(event) {
    // Check if we have a listener
    if (!this._listeners[event]) {
        return;
    }
    // Extract arguments passed, remove event name
    var args = Array.prototype.slice.call(arguments, 1);
    
    // Invoke each listener with entity as context and args
    var results = [];
    for (var i = 0; i < this._listeners[event].length; i++) {
        results.push(this._listeners[event][i].apply(this, args));
    }
    return results;
};
Game.DynamicGlyph.prototype.details = function() {
    var details = [];
    var detail_groups = this.raise_event('details', Game.Screen.play_screen._player);
    // Iterate through each return, grabbing details
    if (detail_groups) {
        for (var i = 0, l = detail_groups.length; i < l; i++) {
            if (detail_groups[i]) {
                for (var j = 0; j < detail_groups[i].length; j++) {
                    details.push(detail_groups[i][j].value);
                }
            }
        }
    }
    return details.join(' ');
};
