Game.Map.Cave = function(tiles, player) {
    // Call map constructor
    Game.Map.call(this, tiles);
    // Add player 
    this.add_entity_at_random_position(player, 0);
    // Add random entities and items to each floor
    for (var z = 0; z < this._depth; z++) {
        // 20 entities per floor
        for (var i = 0; i < 20; i++) {
            var entity = Game.EntityRepository.create_random();
            // Add random entity
            this.add_entity_at_random_position(entity, z);
            // Level up based on floor
            if (entity.has_mixin('ExperienceGainer')) {
                for (var level = 0; level < z; level++) {
                    entity.give_experience(entity.next_level_experience() - entity.experience());
                }
            }
        }
        // 10 items per floor
        for (var i = 0; i < 15; i++) {
            // Add a random item
            this.add_item_at_random_position(Game.ItemRepository.create_random(), z);
        }
    }
    // Add specific items
    var templates = ['dagger', 'sword', 'staff', 'tunic', 'chainmail', 'platemail'];
    for (var i = 0; i < templates.length; i++) {
        this.add_item_at_random_position(Game.ItemRepository.create(templates[i]), Math.floor(this._depth * Math.random()));
    }
    // Add hole to cavern on last level
    var hole_position = this.random_floor_position(this._depth - 1);
    this._tiles[this._depth - 1][hole_position.x][hole_position.y] = Game.Tile.hole_down_tile;
};

Game.Map.Cave.extend(Game.Map);