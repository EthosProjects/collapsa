const { World, Bodies } = require("matter-js");
const Entity = require("../../Entity");
class Stone extends Entity {
  constructor(x, y, game) {
    super(Bodies.circle(x, y, 90, { isStatic: true }), 50, game);
    this.rad = 90;
    const { Stones, Entities, initPack, removePack, engine } = this.game;
    this.deathTimeout = setTimeout(() => {
      removePack.tree.push(this.id);
      Stones.list.splice(
        Stones.list.findIndex((element) => element.id === this.id),
        1
      );
      World.remove(engine.world, this.body);
      Entities.splice(
        this.game.Entities.findIndex((e) => e.id === this.id),
        1
      );
    }, 300000);
    var pack = {
      x: this.body.position.x,
      y: this.body.position.y,
      id: this.id,
    };
    Stones.list.push(this);
    initPack.stone.push(pack);
  }
  getInitPack() {
    var pack = {
      x: this.body.position.x,
      y: this.body.position.y,
      id: this.id,
    };
    return pack;
  }
}
module.exports = Stone;
