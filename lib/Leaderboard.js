/**
 * The leaderboard class
 */
class Leaderboard {
    /**
     * Takes in players and spits out a leaderboard
     * @param {Array.<Player>} [players=[]] The array of the players
     */
    constructor(players = []) {
        /**
         * Sorts the players by their score
         * @type {Array.<Player>}
         */
        this.list =
            players.sort(function (a, b) {
                return b.score - a.score;
            }) || [];
    }
    /**
     * Adds a new player to the leaderboard
     * @param {Player} player The player to add
     */
    addPlayer(player) {
        this.list.push(player);
        this.list.sort(function (a, b) {
            return b.score - a.score;
        });
    }
    /**
     * Removes a player from the leaderboard
     * @param {String} id The ID of the player to remove
     */
    removePlayer(id) {
        this.list.splice(
            this.list.findIndex(function (element) {
                return element.id === id;
            }),
            1
        );
    }
    /**
     * Resorts the leaderboard
     */
    update() {
        this.list.sort(function (a, b) {
            return b.score - a.score;
        });
    }
    /**
     * Gets a listing of the players
     *
     */
    getUpdate() {
        var pack = [];
        this.list.forEach(player => {
            pack.push({
                name: player.usr,
                id: player.id,
                score: player.score,
            });
        });
        return pack;
    }
}
module.exports = Leaderboard