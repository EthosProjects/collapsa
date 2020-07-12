class Event {
  constructor(options) {
    this._name = Math.random().toString(16);
    Object.assign(this, options);
  }
}
module.exports = Event;
