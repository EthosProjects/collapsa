const { World, Bodies } = require('matter-js');
const Resource = require('./Resource');
class CarrotFarm extends Resource {
    constructor(x, y, game) {
        const { CarrotFarms, Entities, initPack, removePack, engine } = game;
        super(Bodies.rectangle(x, y, 100, 100, { isStatic: true }), 100, game, CarrotFarms, 400000);
        var pack = {
            x: this.body.position.x,
            y: this.body.position.y,
            id: this.id,
        };
        CarrotFarms.list.push(this);
        initPack.cfarm.push(pack);
    }
}
module.exports = CarrotFarm;
