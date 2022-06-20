// Used to create items in a repository
Game.Repository = function(name, ctor) {
    this._name = name;
    this._templates = {};
    this._ctor = ctor;
};

// Define a new named template
Game.Repository.prototype.define = function(name, template) {
    this._templates[name] = template;
};
// Create object based on template
Game.Repository.prototype.create = function(name) {
    var template = this._templates[name];
    if (!template) {
        throw new Error("No template '" + name + "' in repository '" + this._name + "'");
    }
    // Create new object
    return new this._ctor(template);
};
//Create object based on random template
Game.Repository.prototype.create_random = function() {
    // Pick a random key and create an object based off of it
    return this.create(one_of(Object.keys(this._templates)));
};