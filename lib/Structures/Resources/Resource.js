const { World, Bodies } = require('matter-js');
const Entity = require('../../Entity');
class Resource extends Entity {
    constructor(body, health, game, manager, lifeSpan) {
        super(body, health, game);
        this.amount = 0
        this.manager = manager
        this.deathTimeout = setTimeout(() => this.die(), lifeSpan);
    }
    die(){
        if(!this.game) console.log(this)
        const { Entities, removePack, engine } = this.game;
        clearTimeout(this.deathTimeout)
        removePack[this.manager.name].push(this.id);
        this.manager.list.splice(
            this.manager.list.findIndex((element) => element.id === this.id),
            1,
        );
        World.remove(engine.world, this.body);
        Entities.splice(
            Entities.findIndex((e) => e.id === this.id),
            1,
        );
    }
    getPack() {
        var pack = {
            x: this.body.position.x,
            y: this.body.position.y,
            id: this.id,
        };
        return pack;
    }
}
module.exports = Resource;
