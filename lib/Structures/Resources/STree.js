const { World, Bodies } = require('matter-js');
const Resource = require('./Resource');
class STree extends Resource {
    constructor(x, y, game) {
        const { STrees, Entities, initPack, removePack, engine } = game;
        super(Bodies.circle(x, y, 110, { isStatic: true }), 50, game, STrees, 300000);
        this.rad = 110;
        var pack = {
            x: this.body.position.x,
            y: this.body.position.y,
            id: this.id,
        };
        STrees.list.push(this);
        initPack.tree.push(pack);
    }
}
module.exports = STree;
