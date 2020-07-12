const { World, Bodies } = require('matter-js');
const Resource = require('./Resource');
class Stone extends Resource {
    constructor(x, y, game) {
        const { Stones, Entities, initPack, removePack, engine } = game;
        super(Bodies.circle(x, y, 90, { isStatic: true }), 50, game, Stones, 300000);
        this.rad = 90;
        var pack = {
            x: this.body.position.x,
            y: this.body.position.y,
            id: this.id,
        };
        Stones.list.push(this);
        initPack.stone.push(pack);
    }
}
module.exports = Stone;
