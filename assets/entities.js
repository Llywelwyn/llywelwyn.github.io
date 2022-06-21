// Templates
Game.PlayerTemplate = {
    name: 'Hero',
    character: '@',
    foreground: 'white',
    background: 'black',
    max_hp: 40,
    attack_value: 10,
    sight_radius: 8,
    inventory_slots: 22,
    verb: {
        singular: ['punch', 'kick'],
        plural: ['punches', 'kicks']
    },
    hunger: {
        max_fullness: 1000,
        depletion_rate: 1
    },
    mixins: [Game.EntityMixins.PlayerActor, Game.EntityMixins.MessageRecipient, Game.EntityMixins.Sight, 
            Game.EntityMixins.Attacker, Game.EntityMixins.Destructible, Game.EntityMixins.Digger,
            Game.EntityMixins.HasInventory, Game.EntityMixins.HasHunger]
};

// Entity Repository stuff -- grouping entities together
// TODO: sub-groups, i.e. for spawning from 'goblins'
Game.EntityRepository = new Game.Repository('entities', Game.Entity);

// Entity templates

/*
Game.EntityRepository.define('generic', {
    name: <string>,              -       entity name
    noun: {
        plural: <bool>,          -       whether name should be pluralised
        proper: <bool>,          -       whether name is a proper noun
    }
    character: <string>,         -       glyph representation of entity in-game
    foreground: <string>,        -       entity colour (https://www.w3.org/wiki/CSS/Properties/color/keywords)
    background: <string>,        -       tile colour behind the entity
    weight: <int>,               -       weight in grams
    height: {
        full: <int>,             -       maximum height (standing, usually)
        crouching: <int>,        -       height when crouching
        crawling: <int>          -       height when crawling (minimum possible size)
    }
    max_hp: <int>,               -       maximum hp of entity
    hp: <int>,                   -       current hp of entity. defaults to max
    attack_value: <int>,         -       max damage dealt per attack
    defence_value: <int>,        -       raw damage reduction value
    sight_radius: <int>,         -       vision range if Sight mixin is present
    inventory_slots: <int>,      -       size of inventory if HasInventory mixin is present
    verb: {
        singular: [<string>]     -       array of verbs to be used on attack messages, singular form
        plural: [<string>]       -       plural form array, should correspond to singular at same index
    },
    hunger: {
        max_fullness: [<int>]    -       maximum fullness
        fullness: [<int>]        -       current fullness, used to specify starting at a specific hunger state
        depletion_rate: [<int>]  -       amount to reduce fullness per turn of hunger  
    },
    mixins: [<object>]           -       array of mixins - full list is @ /assets/mixins/entity.js
});
*/

Game.EntityRepository.define('vines', {
    name: 'vines',
    noun: {
        plural: true,
    },
    character: 'v',
    foreground: 'green',
    max_hp: 10,
    growth: {
        remaining: 3,
        chance: 0.01
    },
    mixins: [Game.EntityMixins.VinesActor, Game.EntityMixins.Destructible]
});
Game.EntityRepository.define('bat', {
    name: 'bat',
    character: 'b',
    foreground: 'beige',
    max_hp: 5,
    attack_value: 4,
    verb: {
        singular: ['bite', 'scratch', 'claw'],
        plural: ['bites', 'scratches', 'claws']
    },
    corpse_drop_rate: 75,
    mixins: [Game.EntityMixins.WanderActor, Game.EntityMixins.Attacker, Game.EntityMixins.Destructible,
            Game.EntityMixins.CorpseDropper]
});
Game.EntityRepository.define('newt', {
    name: 'newt',
    character: 'n',
    foreground: 'yellow',
    max_hp: 3,
    attack_value: 2,
    verb: {
        singular: ['scratch', 'nip'],
        plural: ['scratches', 'nips']
    },
    corpse_drop_rate: 25,
    mixins: [Game.EntityMixins.WanderActor, Game.EntityMixins.Attacker, Game.EntityMixins.Destructible,
            Game.EntityMixins.CorpseDropper]
});