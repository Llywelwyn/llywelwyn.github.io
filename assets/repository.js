// Used to create items in a repository
Game.Repository = function(name, ctor) {
    this._name = name;
    this._templates = {};
    this._ctor = ctor;
    this._random_templates = {};
};

// Define a new named template
Game.Repository.prototype.define = function(name, template, options) {
    this._templates[name] = template;
    // Apply any options
    var disable_random_creation = options && options['disable_random_creation'];
    if (!disable_random_creation) {
        this._random_templates[name] = template;
    }
};
// Create object based on template
Game.Repository.prototype.create = function(name, extra_properties) {
    if (!this._templates[name]) {
        throw new Error("No template '" + name + "' in repository '" + this._name + "'");
    }
    // Copy the template
    var template = Object.create(this._templates[name]);
    // Apply any extra properties
    if (extra_properties) {
        for (var key in extra_properties) {
            template[key] = extra_properties[key];
        }
    }
    // Create the object, passing the template as argument
    return new this._ctor(template);
};
//Create object based on random template
Game.Repository.prototype.create_random = function() {
    // Pick a random key and create an object based off of it
    return this.create(one_of(Object.keys(this._random_templates)));
};