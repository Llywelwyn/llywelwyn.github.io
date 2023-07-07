// Used to create items in a repository
Game.Repository = function (name, ctor) {
    this._name = name
    this._templates = {}
    this._ctor = ctor
    this._random_templates = {}
}

// Define a new named template
Game.Repository.prototype.define = function (name, template, options = {}) {
    var groups = options["groups"] || ["generic"]
    var disable_random_creation = options["disable_random_creation"]
    for (i = 0; i < groups.length; i++) {
        group_name = groups[i]

        if (!this._templates[group_name]) {
            this._templates[group_name] = {}
        }
        this._templates[group_name][name] = template
        console.log(`ADDED '${name}' TO '${group_name}'.`)
        console.log(template)
    }

    if (!disable_random_creation) {
        this._random_templates[name] = template
    }
}
// Create object based on template
Game.Repository.prototype.create = function (
    name,
    group_name,
    extra_properties,
) {
    if (group_name) {
        if (!this._templates[group_name]) {
            throw new Error(
                "No template group '" +
                    group_name +
                    "' in repository '" +
                    this._name +
                    "'",
            )
        }
        if (!this._templates[group_name][name]) {
            throw new Error(
                "No template '" +
                    name +
                    "' in '" +
                    group_name +
                    "' in '" +
                    this._name +
                    "'",
            )
        }
        // Copy the template
        var template = Object.create(this._templates[group_name][name])
    } else {
        var template = Object.create(this._random_templates[name])
    }
    // Apply any extra properties
    if (extra_properties) {
        for (var key in extra_properties) {
            template[key] = extra_properties[key]
        }
    }
    // Create the object, passing the template as argument
    return new this._ctor(template)
}
//Create object based on random template
Game.Repository.prototype.create_random = function (group_name) {
    // Pick a random key and create an object based off of it
    if (!group_name) {
        return this.create(one_of(Object.keys(this._random_templates)))
    }
    if (!this._templates[group_name]) {
        console.log(this._random_templates)
        throw new Error(
            "No template group '" +
                group_name +
                "' in '" +
                this._name +
                "._random_templates",
        )
    }
    return this.create(
        one_of(Object.keys(this._templates[group_name])),
        group_name,
    )
}
