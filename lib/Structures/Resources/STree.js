const { World, Bodies } = require("matter-js");
const Entity = require("../../Entity");
class STree extends Entity {
  constructor(x, y, game) {
    super(Bodies.circle(x, y, 110, { isStatic: true }), 50, game);
    this.rad = 110;
    this.wood = 0;
    const { STrees, Entities, initPack, removePack, engine } = this.game;
    this.deathTimeout = setTimeout(() => {
      removePack.tree.push(this.id);
      STrees.list.splice(
        STrees.list.findIndex((element) => element.id === this.id),
        1
      );
      World.remove(engine.world, this.body);
      Entities.splice(
        Entities.findIndex((e) => e.id === this.id),
        1
      );
    }, 300000);
    var pack = {
      x: this.body.position.x,
      y: this.body.position.y,
      id: this.id,
    };
    STrees.list.push(this);
    initPack.tree.push(pack);
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
module.exports = STree;
