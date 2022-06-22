Object.prototype.extend = function(a) {
    this.prototype=Object.create(a.prototype);
    this.prototype.constructor = this;
    return this;
};

function shuffle(array) {
    var currentIndex = array.length, randomIndex;
    
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
    
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
    
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    
    return array;
 }

var Game = {
    _display: null,
    _current_screen: null,
    _title: "llywelwyn.github.io",
    _start_message: "Press %c{seagreen}[Enter]%c{white} to start.",
    _width: 80,
    _height: 40,

    //Getters
    display: function() { return this._display; },
    width: function() { return this._width; },
    height: function() { return this._height; },
    title: function() { return this._title; },
    start_message: function() { return this._start_message; },

    init: function() {
        this._display = new ROT.Display({
            width: this._width, 
            height: this._height + 1
        });

        var game = this;
        var bind_event_to_screen = function(event) {
            window.addEventListener(event, function(e) {
                // Send event to screen if one exists
                if(game._current_screen !== null) {
                    game._current_screen.handle_input(event, e);
                }
            });
        }
        bind_event_to_screen('keydown');
        //bind_event_to_screen('keyup');
        bind_event_to_screen('keypress');
    },

    refresh: function() {
        // Clear the screen
        this._display.clear();
        // Render the screen
        this._current_screen.render(this._display);
    },

    switch_screen: function(screen) {
        // if current screen exists, exit properly
        if(this._current_screen !== null) {
            this._current_screen.exit();
        }
        // clear current display
        this.display().clear();
        // updates current screen, enters properly and renders
        this._current_screen = screen;
        if(this._current_screen) {
            this._current_screen.enter();
            this.refresh();
        }
    }
};

window.onload = function() {
    Game.init();

    document.body.appendChild(Game.display().getContainer());

    Game.switch_screen(Game.Screen.start_screen);
};

// Message sending functions
Game.send_message = function(recipient, message, args) {
    if (recipient.has_mixin(Game.EntityMixins.MessageRecipient)) {
        if(args) {
            message = vsprintf(message, args);
        }
        recipient.receive_message("%c{white}" + message);
    }
};
Game.send_message_nearby = function(map, centre_x, centre_y, centre_z, message, args) {
    // If args passed, format message
    if (args) {
        message = vsprintf(message, args);
    }
    // Get nearby entities
    entities = map.entities_within_radius(centre_x, centre_y, centre_z, 5);
    // Iterate through entities, send message if they can receive it
    for(var i = 0; i < entities.length; i++) {
        if(entities[i].has_mixin(Game.EntityMixins.MessageRecipient)) {
            entities[i].receive_message(message);
        }
    }
}

Game.neighbour_positions = function(x, y, range = 1) {
    var tiles = [];   
    // Generate all possible offsets
    for (var d_x = -range; d_x < range+1; d_x++) {
        for (var d_y = -range; d_y < range+1; d_y++) {
            // Exclude the same tile
            if (d_x == 0 && d_y == 0) {
                continue;
            }
            tiles.push({x: x + d_x, y: y + d_y});
        }
    }
    return shuffle(tiles);
}