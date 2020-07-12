const { World, Bodies } = require('matter-js');
const Entity = require('../../Entity');
class Emerald extends Entity {
    constructor(x, y, game) {
        super(Bodies.circle(x, y, 50, { isStatic: true }), 175, game);
        this.rad = 50;
        const { Emeralds, Entities, initPack, removePack, engine } = this.game;
        this.deathTimeout = setTimeout(() => {
            removePack.emerald.push(this.id);
            Emeralds.list.splice(
                Emeralds.list.findIndex((element) => element.id === this.id),
                1,
            );
            World.remove(engine.world, this.body);
            Entities.splice(
                this.game.Entities.findIndex((e) => e.id === this.id),
                1,
            );
        }, 600000);
        var pack = {
            x: this.x,
            y: this.y,
            id: this.id,
        };
        Emeralds.list.push(this);
        initPack.emerald.push(pack);
    }
    getInitPack() {
        return {
            x: this.x,
            y: this.y,
            id: this.id,
        };
    }
}
module.exports = Emerald;
