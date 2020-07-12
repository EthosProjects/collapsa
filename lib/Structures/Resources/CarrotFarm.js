const { World, Bodies } = require('matter-js')
const Entity = require('../../Entity')
class CarrotFarm extends Entity {
    constructor(x, y, game) {
        super(Bodies.rectangle(x, y, 100, 100, { isStatic: true }), 100, game)
        const { CarrotFarms, Entities, initPack, removePack, engine } = this.game
        this.deathTimeout = setTimeout(() => {
            clearTimeout(this.growInterval);
            removePack.cfarm.push(this.id);
            CarrotFarms.list.splice(
                CarrotFarms.list.findIndex(element => element.id === this.id),
                1
            );
            World.remove(engine.world, this.body);
        }, 400000);
        var pack = {
            x: this.body.position.x,
            y: this.body.position.y,
            id: this.id,
        };
        CarrotFarms.list.push(this);
        initPack.cfarm.push(pack);
    }
    getInitPack() {
        return {
            x: this.body.position.x,
            y: this.body.position.y,
            id: this.id,
        };
    }
}
module.exports = CarrotFarm