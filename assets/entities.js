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
    mixins: [Game.EntityMixins.PlayerActor, Game.EntityMixins.MessageRecipient, Game.EntityMixins.Sight, 
            Game.EntityMixins.Attacker, Game.EntityMixins.Destructible, Game.EntityMixins.Digger,
            Game.EntityMixins.HasInventory]
};

// Entity Repository stuff -- grouping entities together
// TODO: sub-groups, i.e. for spawning from 'goblins'
Game.EntityRepository = new Game.Repository('entities', Game.Entity);

Game.EntityRepository.define('vines', {
    name: 'vines',
    character: 'v',
    foreground: 'green',
    max_hp: 10,
    growths_remaining: 3,
    spread_chance: 0.01,
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
    mixins: [Game.EntityMixins.WanderActor, Game.EntityMixins.Attacker, Game.EntityMixins.Destructible]
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
    mixins: [Game.EntityMixins.WanderActor, Game.EntityMixins.Attacker, Game.EntityMixins.Destructible]
});