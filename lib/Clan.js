/**
 * An object containintg the clan methods
 */
class Clan {
  /**
   * Creates a new clan instance
   * @param {Game} game
   * @param {String} name
   * @param {Player} owner
   */
  constructor(game, name, owner) {
    /**
     * @type {Game}
     */
    this.game = game;
    /**
     * The owner of the clan
     * @type {Player}
     */
    this.owner = owner;
    /**
     * The name of the clan
     * @type {String}
     */
    this.name = name;
    /**
     * The leaderboard of the clan
     */
    this.leaderboard = new Leaderboard([owner]);
    /**
     * The list of members of the clan
     */
    this.members = [owner];
    /**
     * The requests to join the clan
     */
    this.joinReqs = [];
    game.clans.set(this.name, this);
  }
  /**
   * Adds a member to the clan
   * @param {Player} member
   */
  addMember(member) {
    if (!member) return;
    this.leaderboard.addPlayer(member);
    this.members.push(member);
    this.members.forEach((mem) => (mem.needsUpdate = true));
    member.clan = this;
  }
  /**
   * Removes a member from the clan
   * @param {Player} member
   */
  removeMember(member) {
    if (!member) return;
    if (this.owner == member) {
      this.game.clans.delete(this.name);
      this.members.forEach((mem) => {
        mem.clan = null;
        mem.needsSelfUpdate = true;
      });
    }
    this.leaderboard.removePlayer(member.id);
    this.members.splice(
      this.members.findIndex((player) => player.id == member.id),
      1
    );
    member.clan = null;
    member.needsSelfUpdate = null;
  }
  /**
   * Accepts a request to join the clan
   */
  acceptReq() {
    let req = this.joinReqs[0];
    if (!req || this.members.length >= 9) return;
    this.addMember(req.member);
    this.joinReqs = this.joinReqs.filter(
      (request) => request.member.id != req.member.id
    );
  }
  /**
   * Denies a request to join the clan
   */
  denyReq() {
    let req = this.joinReqs[0];
    if (!req) return;
    this.joinReqs = this.joinReqs.filter(
      (request) => request.member.id != req.member.id
    );
  }
}
module.exports = Clan;
