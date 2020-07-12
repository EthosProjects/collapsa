Math = require('./math.js');
const Matter = require('matter-js');
const Timeout = require('./timeout.js');
const images = require('./images.json');
const { Engine, Render, World, Bodies, Body, Vector, SAT } = require('matter-js');
const EventEmitter = require('events');
const PF = require('pathfinding');
const SocketIO = require('socket.io');
const { Collection } = require('discord.js')
const { Clan, Day, Inventory, Slot, Storage } = require('./lib')
const { BasicRecipes, TableRecipes, Resources } = require('./items.js');
global.games = [];

/**
 * Container function for games. The method for maintaining which game a player is in and making the games is handled in the server file
 */
class Game extends EventEmitter {
    /**
     *
     * @param {SocketIO.Server} nsp This is the SocketIO server that manages the sockets
     * @param {String} ns This is the name of the server
     */
    constructor(nsp, ns) {
        super();
        /**
         * This is the math engine that's used to keep track of all the objects
         * @type {Matter.Engine}
         */
        this.engine = Engine.create();
        this.engine.world.gravity.y = 0;
        /**
         * This is the object specific to this game
         * @type {Day}
         */
        this.day = new Day();
        this.Clans = new Collection();
        this.Entities = new Collection();
        this.map = {
            forest: {
                width: 3000,
                height: 1400,
            },
            total: {
                width: 3000,
                height: 2000,
            },
        };
        this.walls = {
            top: Bodies.rectangle(this.map.total.width / 2, -500, this.map.total.width, 1000, { isStatic: true }),
            bottom: Bodies.rectangle(
                this.map.total.width / 2,
                this.map.total.height + 500,
                this.map.total.width,
                1000,
                {
                    isStatic: true,
                }
            ),
            left: Bodies.rectangle(-500, this.map.total.height / 2, 1000, this.map.total.height, { isStatic: true }),
            right: Bodies.rectangle(
                this.map.total.width + 500,
                this.map.total.height / 2,
                1000,
                this.map.total.height,
                {
                    isStatic: true,
                }
            ),
        };
        World.add(this.engine.world, [this.walls.top, this.walls.bottom, this.walls.left, this.walls.right]);
        this.nsp = nsp;
        this.ns = ns;
        global.games.push(this);
    }
}
module.exports = Game