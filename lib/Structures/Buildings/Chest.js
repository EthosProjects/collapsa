const { Bodies } = require('matter-js');
const Entity = require('../../Entity');
class Chest extends Entity {
    constructor(x, y, ang, game) {
        let w, h;
        if (ang == 'left' || ang == 'right') {
            w = 50;
            h = 95;
        } else {
            w = 95;
            h = 50;
        }
        super(Bodies.rectangle(x, y, w, h, { isStatic: true }), 50, game);
        this.ang = ang;
        const { Chests, Entities, initPack } = this.game;
        this.storage = new Storage(null, 9);
        var pack = {
            x: this.x,
            y: this.y,
            id: this.id,
            ang: this.ang,
        };
        Chests.list.push(this);
        initPack.chest.push(pack);
    }
    getInitPack() {
        return {
            x: this.x,
            y: this.y,
            id: this.id,
            ang: this.ang,
        };
    }
}
module.exports = Chest;
