const Timeout = require('./Timeout.js');
const { Collection } = require('discord.js');
/**
 * Object containing data about what time it is
 * @typedef day
 * @property {string} times koo
 */
module.exports = class Day {
    /**
     * This is a constructor for a day
     * @param {Map.<string, number>} [states=new Map(['day', 20000], ['night', 20000])]
     */
    constructor(
        states = new Collection([
            ['day', 20000],
            ['night', 20000],
        ]),
    ) {
        /**
         * This is the different states the day can be.
         * @type {Map.<string, number>}
         */
        this.states = states;
        /**
         * This is how long the day is
         * @type {Number}
         */
        //It turns the map into a map iterator of it's values into an array and then it adds them all up
        this.length = [...this.states.values()].reduce((a, b) => a + b);
        /**
         * This is the current state
         * @type {Number}
         */
        this.index = 0;
        /**
         * This is the timeout defining the day
         * @type {Timeout}
         */
        this.timeout = new Timeout(() => this.setTimeout(), [...this.states.values()][this.index]);
    }
    get time() {
        return [...this.states.keys()][this.index];
    }
    setTimeout() {
        if (++this.index >= this.length) this.index = 0;
        this.timeout = new Timeout(() => this.setTimeout(), [...this.states.values()][this.index]);
    }
};
