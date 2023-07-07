Game.Map.Cave = function (tiles, player) {
    var random_items_per_floor = 15
    var random_entities_per_floor = 20
    var total_equipment = 5
    // Call map constructor
    Game.Map.call(this, tiles)
    // Add player
    this.add_entity_at_random_position(player, 0)
    // Add random entities and items to each floor
    for (var z = 0; z < this._depth; z++) {
        // 20 entities per floor
        for (var i = 0; i < random_entities_per_floor; i++) {
            var entity = Game.EntityRepository.create_random()
            // Add random entity
            this.add_entity_at_random_position(entity, z)
            // Level up based on floor
            if (entity.has_mixin("ExperienceGainer")) {
                for (var level = 0; level < z; level++) {
                    entity.give_experience(
                        entity.next_level_experience() - entity.experience(),
                    )
                }
            }
        }
        // 10 items per floor
        for (var i = 0; i < random_items_per_floor; i++) {
            // Add a random item
            this.add_item_at_random_position(
                Game.ItemRepository.create_random(),
                z,
            )
        }
    }
    // Add specific items
    for (var i = 0; i < total_equipment; i++) {
        var random_z = Math.floor(this._depth * Math.random())
        this.add_item_at_random_position(
            Game.ItemRepository.create_random("equipment"),
            random_z,
        )
    }
    // Add hole to cavern on last level
    var hole_position = this.random_floor_position(this._depth - 1)
    this._tiles[this._depth - 1][hole_position.x][hole_position.y] =
        Game.Tile.hole_down_tile
}

Game.Map.Cave.extend(Game.Map)
