Object.prototype.extend = function(a) {
    this.prototype=Object.create(a.prototype);
    this.prototype.constructor = this;
    return this;
};

var Game = {
    _display: null,
    _current_screen: null,
    _width: 80,
    _height: 40,

    //Getters
    display: function() { return this._display; },
    width: function() { return this._width; },
    height: function() { return this._height; },

    init: function() {
        this._display = new ROT.Display({
            width: this._width, 
            height: this._height
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
        //bind_event_to_screen('keypress');
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
}

window.onload = function() {
    Game.init();

    document.body.appendChild(Game.display().getContainer());

    Game.switch_screen(Game.Screen.start_screen);
}