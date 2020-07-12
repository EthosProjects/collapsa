const { Bodies } = require("matter-js");
const Entity = require("../../Entity");
class Wall extends Entity {
  constructor(x, y, material, game) {
    let h;
    if (material == "wood") h = 100;
    if (material == "stone") h = 225;
    if (material == "iron") h = 375;
    super(
      Bodies.rectangle(this.x, this.y, 100, 100, { isStatic: true }),
      h,
      game
    );
    this.rad = 50;
    this.material = material;
    const { Walls, initPack } = this.game;
    this.needsUpdate = false;
    var pack = {
      x: this.x,
      y: this.y,
      id: this.id,
      material: this.material,
    };
    Walls.list.push(this);
    initPack.wall.push(pack);
  }
  getInitPack() {
    return {
      x: this.x,
      y: this.y,
      id: this.id,
      material: this.material,
    };
  }
}
module.exports = Wall;
