const genSnowflake = require("../../util/genSnowflake.js");
class discordguildbaseGuild {
  constructor(options) {
    this._id =
      options.id || genSnowflake(process.reqCount.toString(2), "2", "0");
    this.id = this._id;
    this.mute = {
      role: false,
    };
    this.moderation = {
      channel: false,
    };
    this.welcome = {
      channel: false,
      role: false,
    };
    Object.assign(this, options);
  }
}
module.exports = discordguildbaseGuild;
