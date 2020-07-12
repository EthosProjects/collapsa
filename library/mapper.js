/**
 * Map with added functionality
 */
module.exports = class Mapper extends Map {
  constructor(iterator) {
    super(iterator);
  }
  find(fn, thisArg) {
    if (typeof thisArg !== "undefined") fn = fn.bind(thisArg);
    for (const [key, val] of this) {
      if (fn(val, key, this)) return val;
    }
    return undefined;
  }
  findKey(fn, thisArg) {
    if (typeof thisArg !== "undefined") fn = fn.bind(thisArg);
    for (const [key, val] of this) {
      if (fn(val, key, this)) return key;
    }
    return undefined;
  }
  findAll(fn, thisArg) {
    if (typeof thisArg !== "undefined") fn = fn.bind(thisArg);
    const results = [];
    for (const [key, val] of this) {
      if (fn(val, key, this)) results.push(val);
    }
    return results;
  }
  keysArray(fn) {
    if (fn) return [...this.keys()].map(fn);
    else return [...this.keys()];
  }
  valuesArray(fn) {
    if (fn) return [...this.values()].map(fn);
    else return [...this.values()];
  }
};
