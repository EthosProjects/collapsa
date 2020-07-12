class Slot {
  /**
   * A generic inventory slot
   * @param {String} type
   * @param {Number} count
   * @param {String} image
   * @param {Number} [stackSize=255] - fick
   * @param {boolean} [equipable=false]
   * @param {boolean} [edible=false]
   * @param {boolean} [armorable=false]
   * @param {boolean} [hatables=false]
   */
  constructor(
    type,
    count,
    image,
    stackSize = 255,
    equipable = false,
    edible = false,
    armorable = false,
    hatables = false
  ) {
    this.id = type;
    this.count = count;
    this.image = image;
    this.stackSize = stackSize;
    this.equipable = equipable;
    this.edible = edible;
    this.armorable = armorable;
    this.hatables = hatables;
  }
}
module.exports = Slot;
