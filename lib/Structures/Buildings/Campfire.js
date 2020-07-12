const { Bodies } = require("matter-js");
const Entity = require("../../Entity");
class Campfire extends Entity {
  constructor(x, y, game) {
    super(Bodies.circle(x, y, 175 / 12, { isStatic: true }), 50, game);
    this.rad = 14.83;
    this.lit = false;
    const { Campfires, initPack } = this.game;
    var pack = {
      x: this.body.position.x,
      y: this.body.position.y,
      id: this.id,
      lit: false,
    };
    Campfires.list.push(this);
    initPack.campfire.push(pack);
  }
  getInitPack() {
    return {
      x: this.body.position.x,
      y: this.body.position.y,
      id: this.id,
      lit: this.lit,
    };
  }
}
module.exports = Campfire;
