Game.Tile = function (properties) {
    properties = properties || {}
    Game.Glyph.call(this, properties)

    this._name = properties["name"] || "unexplored area"
    this._desc = properties["desc"] || ""
    this._walkable = properties["walkable"] || false
    this._diggable = properties["diggable"] || false
    this._openable = properties["openable"] || false
    this._blocks_light = properties["blocks_light"] !== undefined ? properties["blocksLight"] : true
    this._bloody = properties["bloody"] || false
}

Game.Tile.extend(Game.DynamicGlyph)

// Getters
Game.Tile.prototype.character = function () {
    return this._character
}
Game.Tile.prototype.is_walkable = function () {
    return this._walkable
}
Game.Tile.prototype.is_diggable = function () {
    return this._diggable
}
Game.Tile.prototype.is_openable = function () {
    return this._openable
}
Game.Tile.prototype.is_blocking_light = function () {
    return this._blocks_light
}
Game.Tile.prototype.simple_desc = function () {
    return this._desc
}

// Tiles - https://www.w3.org/wiki/CSS/Properties/color/keywords

// Generic
Game.Tile.null_tile = new Game.Tile({})
Game.Tile.floor_tile = new Game.Tile({
    name: "floor",
    desc: "Covered in a layer of damp moss. It's soft to tread upon.",
    character: ".",
    foreground: ["grey", "dimgray", "slategrey"],
    walkable: true,
    blocks_light: false,
})
Game.Tile.cave_wall_tile = new Game.Tile({
    name: "cave wall",
    desc: "Mostly dirt and peat. With some rigorous effort, it could be bypassed.",
    character: "#",
    foreground: ["goldenrod", "darkgoldenrod", "brown"],
    diggable: true,
})
Game.Tile.dungeon_wall_tile = new Game.Tile({
    name: "wall",
    desc: "It's made of roughly-hewn stone blocks.",
    character: "#",
    foreground: "darkgrey",
})
Game.Tile.door_tile = new Game.Tile({
    name: "door",
    desc: "Complete with iron hinges and a brass handle.",
    character: "+",
    foreground: "brown",
    openable: true,
})
Game.Tile.open_door_tile = new Game.Tile({
    name: "open door",
    desc: "complete with iron hinges and a brass handle.",
    character: "-",
    foreground: "brown",
    walkable: true,
    blocks_light: false,
})
Game.Tile.stairs_up_tile = new Game.Tile({
    name: "stairs",
    desc: "It leads up, offering passage to a different level of the dungeon.",
    character: "<",
    foreground: "white",
    walkable: true,
    blocks_light: false,
})
Game.Tile.stairs_down_tile = new Game.Tile({
    name: "stairs",
    desc: "It leads down, offering passage to a different level of the dungeon.",
    character: ">",
    foreground: "white",
    walkable: true,
    blocks_light: false,
})
Game.Tile.hole_down_tile = new Game.Tile({
    name: "great dark hole",
    desc: "A cave floor.",
    character: "O",
    foreground: "white",
    walkable: true,
    blocks_light: false,
})
Game.Tile.water_tile = new Game.Tile({
    name: "water",
    desc: "Dark, murky, and unhygienic.",
    character: "~",
    foreground: "blue",
    background: "#060B44",
    swimmable: true,
    blocks_light: false,
})
Game.Tile.grass_tile = new Game.Tile({
    name: "grass",
    desc: "A rare sight this deep in the dungeon.",
    character: '"',
    foreground: "darkgreen",
    walkable: true,
    blocks_light: false,
})
