const { Bodies } = require('matter-js');
const Entity = require('../../Entity');
class Floor extends Entity {
    constructor(x, y, material, game) {
        let h;
        if (material == 'wood') h = 75;
        if (material == 'stone') h = 150;
        if (material == 'iron') h = 275;
        super(Bodies.rectangle(x, y, 100, 100, { isStatic: true }), h, game);
        this.material = material;
        const { Floors, initPack } = this.game;
        var pack = {
            x: this.body.position.x,
            y: this.body.position.y,
            id: this.id,
            material: this.material,
        };
        Floors.list.push(this);
        initPack.floor.push(pack);
    }
    getInitPack() {
        return {
            x: this.body.position.x,
            y: this.body.position.y,
            id: this.id,
            material: this.material,
        };
    }
}
module.exports = Floor;
