Math = require('./math.js');
const Matter = require('matter-js');
const Timeout = require('./lib/Timeout.js');
const images = require('./images.json');
const { Engine, Render, World, Bodies, Body, Vector, SAT } = require('matter-js');
const EventEmitter = require('events');
const PF = require('pathfinding');
const SocketIO = require('socket.io');
const { Collection } = require('discord.js');
const { Clan, Day, Inventory, Slot, Storage, Leaderboard, Crafter } = require('./lib');
const { Amethyst, CarrotFarm, Diamond, Emerald, Gold, Iron, Stone, STree } = require('./lib/Structures/Resources');
const { Campfire, Chest, CraftingTable, Door, Floor, Wall } = require('./lib/Structures/Buildings');
const Player = require('./lib/Player.js');
String.prototype.capitalize = function () {
    let arrayOfThis = this.split('');
    let fl = arrayOfThis.shift().toUpperCase();
    arrayOfThis.unshift(fl);
    return arrayOfThis.join('');
};
Vector.getDistance = function (vectorA, vectorB) {
    return Math.sqrt(Math.pow(vectorA.x - vectorB.x, 2) + Math.pow(vectorA.y - vectorB.y, 2));
};
const { astar, Graph } = require('./astar.js');
const { BasicRecipes, TableRecipes, Resources } = require('./items.js');
const Resource = require('./lib/Structures/Resources/Resource.js');
// create an engine
const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
function RectCircleColliding(cx, cy, cr, rx, ry, rw, rh) {
    var distX = Math.abs(cx - rx);
    var distY = Math.abs(cy - ry);
    if (distX > rw / 2 + cr) {
        return false;
    }
    if (distY > rh / 2 + cr) {
        return false;
    }
    if (distX <= rw / 2) {
        return true;
    }
    if (distY <= rh / 2) {
        return true;
    }

    var dx = cx - rw / 2;
    var dy = cy - rh / 2;
    return dx * dx + dy * dy <= cr * cr;
}
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
            top: Bodies.rectangle(this.map.total.width / 2, -500, this.map.total.width, 1000, {
                isStatic: true,
            }),
            bottom: Bodies.rectangle(
                this.map.total.width / 2,
                this.map.total.height + 500,
                this.map.total.width,
                1000,
                {
                    isStatic: true,
                },
            ),
            left: Bodies.rectangle(-500, this.map.total.height / 2, 1000, this.map.total.height, {
                isStatic: true,
            }),
            right: Bodies.rectangle(
                this.map.total.width + 500,
                this.map.total.height / 2,
                1000,
                this.map.total.height,
                {
                    isStatic: true,
                },
            ),
        };
        World.add(this.engine.world, [this.walls.top, this.walls.bottom, this.walls.left, this.walls.right]);
        this.nsp = nsp;
        this.ns = ns;
    }
}
//console.log(new Day())
//console.log(new Game())
module.exports = function (nsp, ns, mLab) {
    let game = this;
    this.engine = Engine.create();
    let engine = this.engine;
    engine.world.gravity.y = 0;
    let timeOfDay = 'day';
    let dayTimeout;
    let setDayTimeout = () => {
        dayTimeout = new Timeout(() => {
            if (timeOfDay == 'day') timeOfDay = 'night';
            else if (timeOfDay == 'night') timeOfDay = 'day';
            setDayTimeout();
        }, 40000);
    };
    dayTimeout = new Timeout(() => {
        if (timeOfDay == 'day') timeOfDay = 'night';
        else if (timeOfDay == 'night') timeOfDay = 'day';
        setDayTimeout();
    }, 40000);
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
    let clans = new Map();
    this.Entities = [];
    this.walls = {
        top: Bodies.rectangle(this.map.total.width / 2, -500, this.map.total.width, 1000, {
            isStatic: true,
        }),
        bottom: Bodies.rectangle(this.map.total.width / 2, this.map.total.height + 500, this.map.total.width, 1000, {
            isStatic: true,
        }),
        left: Bodies.rectangle(-500, this.map.total.height / 2, 1000, this.map.total.height, {
            isStatic: true,
        }),
        right: Bodies.rectangle(this.map.total.width + 500, this.map.total.height / 2, 1000, this.map.total.height, {
            isStatic: true,
        }),
    };
    World.add(engine.world, [game.walls.top, game.walls.bottom, game.walls.left, game.walls.right]);
    this.nsp = nsp;
    this.ns = ns;

    class Armor {}
    class Damage {}

    var leaderboard = new Leaderboard([]);
    class ResourceManager {
        constructor(name){
            /**
             * @type {Array.<Resource>}
             */
            this.list = []
            this.name = name
        }
        update(){
            let pack = []
            this.list.forEach(resource => {
                if(resource.needsUpdate) pack.push(resource.getPack())
                if(resource.health <= 0) {
                    removePack[this.name].push(resource.id)
                    resource.die()
                }
            })
            return pack
        }
    }
    const STrees = new ResourceManager('tree')
    const Stones = new ResourceManager('stone')
    const Irons = new ResourceManager('iron')
    const Golds = new ResourceManager('gold')
    const Diamonds = new ResourceManager('diamond')
    const Emeralds = new ResourceManager('emerald')
    const Amethysts = new ResourceManager('amethyst')
    const CarrotFarms = new ResourceManager('cfarm')
    var Walls = {
        list: [],
        update: function () {
            var pack = [];
            Walls.list.forEach((wall) => {
                if (wall.health <= 0) {
                    removePack.wall.push(wall.id);
                    if (Players.list.find((p) => p.structures.find((s) => s == wall))) {
                        let p = Players.list.find((p) => p.structures.find((s) => s == wall));
                        p.structures.splice(
                            p.structures.findIndex((s) => s == wall),
                            1,
                        );
                    }
                    Walls.list.splice(
                        Walls.list.findIndex(function (element) {
                            return element.id === wall.id;
                        }),
                        1,
                    );
                    game.Entities.splice(
                        game.Entities.findIndex((e) => e.id === wall.id),
                        1,
                    );
                    World.remove(engine.world, wall.body);
                }
            });
            return pack;
        },
    };
    var Campfires = {
        list: [],
        update: function () {
            var pack = [];
            Campfires.list.forEach((campfire) => {
                if (campfire.health <= 0) {
                    removePack.campfire.push(campfire.id);
                    if (Players.list.find((p) => p.structures.find((s) => s == campfire))) {
                        let p = Players.list.find((p) => p.structures.find((s) => s == campfire));
                        p.structures.splice(
                            p.structures.findIndex((s) => s == campfire),
                            1,
                        );
                    }
                    Campfires.list.splice(
                        Campfires.list.findIndex(function (element) {
                            return element.id === campfire.id;
                        }),
                        1,
                    );
                    game.Entities.splice(
                        game.Entities.findIndex((e) => e.id === campfire.id),
                        1,
                    );
                    World.remove(engine.world, campfire.body);
                }
                if (campfire.needsUpdate) {
                    pack.push(campfire.getInitPack());
                }
            });
            return pack;
        },
    };
    var Floors = (this.Floors = {
        list: [],
        update: function () {
            var pack = [];
            Floors.list.forEach((floor) => {
                if (floor.health <= 0) {
                    removePack.floor.push(floor.id);
                    if (Players.list.find((p) => p.structures.find((s) => s == floor))) {
                        let p = Players.list.find((p) => p.structures.find((s) => s == floor));
                        p.structures.splice(
                            p.structures.findIndex((s) => s == floor),
                            1,
                        );
                    }
                    Floors.list.splice(
                        Floors.list.findIndex(function (element) {
                            return element.id === floor.id;
                        }),
                        1,
                    );
                    game.Entities.splice(
                        game.Entities.findIndex((e) => e.id === floor.id),
                        1,
                    );
                }
            });
            return pack;
        },
    });
    var Doors = (this.Doors = {
        list: [],
        update: function () {
            var pack = [];
            Doors.list.forEach((door) => {
                door.update();
                pack.push(door.getUpdatePack());
                if (door.health <= 0) {
                    removePack.door.push(door.id);
                    if (Players.list.find((p) => p.structures.find((s) => s == door))) {
                        let p = Players.list.find((p) => p.structures.find((s) => s == door));
                        p.structures.splice(
                            p.structures.findIndex((s) => s == door),
                            1,
                        );
                    }
                    if (globalDoors.find((d) => d == door))
                        globalDoors.splice(
                            globalDoors.findIndex((d) => d == door),
                            1,
                        );
                    Doors.list.splice(
                        Doors.list.findIndex(function (element) {
                            return element.id === door.id;
                        }),
                        1,
                    );
                    game.Entities.splice(
                        game.Entities.findIndex((e) => e.id === door.id),
                        1,
                    );
                    World.remove(engine.world, door.body);
                }
            });
            return pack;
        },
    });
    let globalDoors = [];
    var CraftingTables = (this.CraftingTables = {
        list: [],
        update: function () {
            var pack = [];
            CraftingTables.list.forEach((ctable) => {
                if (ctable.health <= 0) {
                    removePack.ctable.push(ctable.id);
                    if (Players.list.find((p) => p.structures.find((s) => s == ctable))) {
                        let p = Players.list.find((p) => p.structures.find((s) => s == ctable));
                        p.structures.splice(
                            p.structures.findIndex((s) => s == ctable),
                            1,
                        );
                    }
                    CraftingTables.list.splice(
                        CraftingTables.list.findIndex(function (element) {
                            return element.id === ctable.id;
                        }),
                        1,
                    );
                    game.Entities.splice(
                        game.Entities.findIndex((e) => e.id === ctable.id),
                        1,
                    );
                    World.remove(engine.world, ctable.body);
                }
            });
            return pack;
        },
    });
    var Chests = (this.Chests = {
        list: [],
        update: function () {
            var pack = [];
            Chests.list.forEach((chest) => {
                if (chest.health <= 0) {
                    removePack.chest.push(chest.id);
                    if (Players.list.find((p) => p.structures.find((s) => s == chest))) {
                        let p = Players.list.find((p) => p.structures.find((s) => s == chest));
                        p.structures.splice(
                            p.structures.findIndex((s) => s == chest),
                            1,
                        );
                    }
                    Chests.list.splice(
                        Chests.list.findIndex(function (element) {
                            return element.id === chest.id;
                        }),
                        1,
                    );
                    game.Entities.splice(
                        game.Entities.findIndex((e) => e.id === chest.id),
                        1,
                    );
                    World.remove(engine.world, chest.body);
                }
            });
            return pack;
        },
    });
    var Players = {
        list: [],
        onConnect: function (id, socket, nm, token) {
            var player = new Player(id, nm, socket, game, token);
            let playa = player;
            /*playa.inventory.set('1', new Slot('Amethyst Sword', 1, 'amethystsword', 1, true))
            playa.inventory.set('2', new Slot('Amethyst Pickaxe', 1, 'amethystpickaxe', 1, true))
            playa.inventory.set('3', new Slot('Iron Axe', 1, 'amethystaxe', 1, true))
            playa.inventory.set('4', new Slot('Amethyst Hammer', 1, 'amethysthammer', 1, true))
            playa.inventory.set('5', new Slot('Iron Shovel', 1, 'ironshovel', 1, true))
            playa.inventory.set('6', 'empty')
            playa.inventory.set('7', new Slot('iron', 255, 'iron', 255, false))
            playa.inventory.set('8', new Slot('stone', 255, 'stone', 255, false))
            playa.inventory.set('9', new Slot('wood', 255, 'draw', 255, false))
			playa.admin = true;
			playa.adminLevel = 100;*/
            playa.needsSelfUpdate = true;
            player.needsSelfUpdate = true;
            leaderboard.addPlayer(player);
            let pack = player.getSelfUpdatePack();
            socket.emit('selfUpdate', pack);
            socket.on('movement', function (data) {
                if (Players.list.length > 0) {
                    var player = Players.list.find(function (element) {
                        return element.id === id;
                    });
                    if (player) {
                        clearTimeout(player.afkTimer);
                        player.afkTimer = setTimeout(function () {
                            setInterval(function () {
                                player.health -= player.maxHealth / 100;
                            }, 100);
                        }, 10000);
                        player.move.l = data.left;
                        player.move.r = data.right;
                        player.move.u = data.up;
                        player.move.d = data.down;
                        player.move.run = data.running;
                        if (!data.pressingAttack && !data.prot && !data.grab) player.alusd = false;
                        player.move.att = data.pressingAttack;
                        //io.emit("chat message", {usrnm:"SERVER",msg:data.angle})
                        player.move.ang = data.angle;
                        player.move.grab = data.grab;
                        player.move.mdis = Math.abs(data.mousedis);
                        if (data.prot) {
                            if (player.alusd) return;
                            player.move.prot = true;
                            player.alusd = true;
                            if (player.pang == 'up') player.pang = 'right';
                            else if (player.pang == 'right') player.pang = 'down';
                            else if (player.pang == 'down') player.pang = 'left';
                            else if (player.pang == 'left') player.pang = 'up';
                        } else player.move.prot = false;
                    }
                }
            });
        },
        update: () => {
            for (var i = 0; i < Players.list.length; i++) {
                /**
                 * @type {Player}
                 */
                var player = Players.list[i];
                player.update();
                game.nsp.to(player.id).emit('selfUpdate', player.getSelfUpdatePack());

                if (player.health <= 0) {
                    player.emit('death');
                    if (player.token) {
                        let collapsauserbase = mLab.databases.get('collapsa').collections.get('collapsauserbase');
                        if (collapsauserbase.findDocument((doc) => doc.data.token == player.token)) {
                            let user = collapsauserbase.findDocument((doc) => doc.data.token == player.token);
                            let newDoc = Object.assign({}, user.data);
                            if (newDoc.highscore < player.score) {
                                newDoc.highscore = player.score;
                                collapsauserbase.updateDocument(newDoc);
                            }
                        }
                    }
                    if (Players.list.length > 1) removePack.player.push(player.id);
                    Players.list.splice(
                        Players.list.findIndex(function (element) {
                            return element.id === player.id;
                        }),
                        1,
                    );

                    game.Entities.splice(
                        game.Entities.findIndex((e) => e.id === player.id),
                        1,
                    );
                    World.remove(engine.world, player.body);
                    leaderboard.removePlayer(player.id);
                    player.structures.forEach((s) => (s.health = 0));
                    if (player.clan) player.clan.removeMember(player);
                    let toDrop = player.inventory.filter((slot) => slot !== 'empty');
                    toDrop.forEach((slot, i) => {
                        let a = 360 / toDrop.size;
                        let ang = a * i + 77;
                        let offset = Vector.create(0, player.rad + 20);
                        offset.x = Math.cos((ang * Math.PI) / 180) * Vector.magnitude(offset);
                        offset.y = Math.sin((ang * Math.PI) / 180) * Vector.magnitude(offset);
                        Vector.add(player.body.position, offset, offset);
                        let self = {
                            item: slot,
                            x: offset.x,
                            y: offset.y,
                            timeout: new Timeout(() => {
                                dropped.splice(
                                    dropped.findIndex(function (element) {
                                        return element === self;
                                    }),
                                    1,
                                );
                            }, 20000),
                        };
                        dropped.push(self);
                    });
                }
            }
        },
        getPack: () => Players.list.map((player) => player.getUpdatePack()),
    };
    this.initPack = {
        player: [],
        bullet: [],
        tree: [],
        stone: [],
        iron: [],
        gold: [],
        diamond: [],
        wall: [],
        door: [],
        floor: [],
        campfire: [],
        ctable: [],
        cfarm: [],
        chest: [],
        emerald: [],
        amethyst: [],
    };
    var removePack = {
        player: [],
        bullet: [],
        tree: [],
        stone: [],
        iron: [],
        gold: [],
        diamond: [],
        wall: [],
        door: [],
        floor: [],
        campfire: [],
        ctable: [],
        cfarm: [],
        chest: [],
        emerald: [],
        amethyst: [],
    };
    this.removePack = removePack;
    let dropped = [];
    var self = this;
    class House {
        constructor(x, y, ang) {
            let width = 9;
            let height = 5;
            this.topWall = [];
            this.leftWall = [];
            this.bottomWall = [];
            this.rightWall = [];
            this.topLeft = new Wall(x, y, 'stone');
            this.topRight = new Wall(x + (width - 1) * 100, y, 'stone');
            this.bottomLeft = new Wall(x, y + (height - 1) * 100, 'stone');
            this.bottomRight = new Wall(x + (width - 1) * 100, y + (height - 1) * 100, 'stone');
            for (let i = 0; i < width - 2; i++) {
                let w;
                w = new Wall(x + (i + 1) * 100, y, 'wood');
            }
            for (let i = 0; i < height - 2; i++) {
                let w;
                w = new Wall(x, y + (i + 1) * 100, 'wood');
            }
            for (let i = 0; i < width - 2; i++) {
                let w;
                if (i == 3) {
                    w = new Door(x + (i + 1) * 100, y + (height - 1) * 100, 'wood', 'down');

                    globalDoors.push(w);
                } else w = new Wall(x + (i + 1) * 100, y + (height - 1) * 100, 'wood');
                this.bottomWall.push(w);
            }

            for (let i = 0; i < height - 2; i++) {
                let w;
                w = new Wall(x + (width - 1) * 100, y + (i + 1) * 100, 'wood');
            }
        }
    }
    let getGoodPosition = (...a) => {
        let args = [...a];
        if (!args.length) args = ['circle', 'tempx', 'tempy', 50, { isStatic: true }];
        let type = args.shift();
        let tempx = Math.getRandomInt(0, game.map.forest.width);
        let tempy = Math.getRandomInt(0, game.map.forest.height);
        let toUse = args.map((arg) => {
            if (arg == 'tempx') return tempx;
            if (arg == 'tempy') return tempy;
            else return arg;
        });
        let bodyA = Bodies[type](...toUse);
        let inWay = false;
        game.Entities.forEach((e) => {
            if (Matter.SAT.collides(bodyA, e.body).collided) inWay = true;
        });
        Object.values(game.walls).forEach((w) => {
            if (Matter.SAT.collides(bodyA, w).collided) inWay = true;
        });
        while (inWay) {
            tempx = Math.getRandomInt(0, game.map.forest.width);
            tempy = Math.getRandomInt(0, game.map.forest.height);
            let toUse = args.map((arg) => {
                if (arg == 'tempx') return tempx;
                if (arg == 'tempy') return tempy;
                else return arg;
            });
            bodyA = Bodies[type](...toUse);
            inWay = false;
            game.Entities.forEach((e) => {
                if (Matter.SAT.collides(bodyA, e.body).collided) inWay = true;
            });
            Object.values(game.walls).forEach((w) => {
                if (Matter.SAT.collides(bodyA, w).collided) inWay = true;
            });
        }
        return {
            x: tempx,
            y: tempy,
        };
    };
    setInterval(function () {
        let canAdd = [];
        if (STrees.list.length < 4) {
            let p = getGoodPosition('circle', 'tempx', 'tempy', 110, {
                isStatic: true,
            });
            new STree(p.x, p.y, game);
        }
        if (Stones.list.length < 1) {
            let p = getGoodPosition('circle', 'tempx', 'tempy', 90, {
                isStatic: true,
            });
            new Stone(p.x, p.y, game);
        } /*
		if(Irons.list.length < 6) {
			let p = getGoodPosition();
			new Iron(p.x, p.y, game);
		}
		if(Golds.list.length < 3) {
			let p = getGoodPosition();
			new Gold(p.x, p.y, game);
		}
		if(Diamonds.list.length < 2) {
			let p = getGoodPosition();
			new Diamond(p.x, p.y, game);
		}
		if(Emeralds.list.length < 1) {
			let p = getGoodPosition();
			new Emerald(p.x, p.y, game);
		}
		if(Amethysts.list.length < 1) {
			let p = getGoodPosition();
			new Amethyst(p.x, p.y, game);
		}*/
        if (CarrotFarms.list.length < 3) {
            let p = getGoodPosition('rectangle', 'tempx', 'tempy', 100, 100, {
                isStatic: true,
            });
            new CarrotFarm(p.x, p.y, game);
        }
    }, 10);
    this.nsp.on('connection', function (socket) {
        socket.emit('images', images);
        socket.emit('items', [BasicRecipes, TableRecipes, Resources]);
        socket.on('log', (log) => console.log(log));
        socket.on('clan', () => {
            let playa = Players.list.find((player) => player.id == socket.id);
            if (!playa) return;
            playa.clanning = !playa.clanning;
            playa.needsSelfUpdate = true;
        });
        socket.on('recon', (id) => {
            let playa = Players.list.find((p) => p.id == id);
            if (!playa) return;
            playa.id = socket.id;
            playa.socket = socket;
            game.nsp.to(socket.id).emit('selfUpdatePack', playa.getSelfUpdatePack());
            game.nsp.to('recon');
        });
        socket.on('createClan', (name) => {
            if (clans.get(name)) return;
            if (clans.size >= 6) return;
            Players.list.find((player) => player.id == socket.id).clan = new Clan(
                name,
                Players.list.find((player) => player.id == socket.id),
            );
            Players.list.find((player) => player.id == socket.id).needsSelfUpdate = true;
        });
        socket.on('joinClan', (name) => {
            let clan = clans.get(name);
            clan.joinReqs.push({
                member: Players.list.find((player) => player.id == socket.id),
            });
            //clan.addMember(Players.list.find(player => player.id == socket.id))
        });
        socket.on('leaveClan', () => {
            let playa = Players.list.find((player) => player.id == socket.id);
            let clan = playa.clan;
            clan.removeMember(playa);
        });
        socket.on('acceptReq', () => {
            let playa = Players.list.find((player) => player.id == socket.id);
            if (playa == playa.clan.owner) {
                playa.clan.acceptReq();
                playa.socket.emit('selfUpdate', playa.getSelfUpdatePack());
            }
        });
        socket.on('denyReq', () => {
            let playa = Players.list.find((player) => player.id == socket.id);
            if (playa == playa.clan.owner) playa.clan.denyReq();
        });
        socket.on('removeMember', (id) => {
            let playa = Players.list.find((player) => player.id == socket.id);
            if (playa == playa.clan.owner) playa.clan.removeMember(Players.list.find((player) => player.id == id));
        });
        socket.on('craft', (item) => {
            let playa = Players.list.find((player) => player.id == socket.id);
            playa.crafter.craftItem(item, playa.inventory);
            playa.alusd = true;
            playa.needsSelfUpdate = true;
        });
        socket.on('craftEx', (item) => {
            let playa = Players.list.find((player) => player.id == socket.id);
            playa.craftingctable.craftItem(item, playa.inventory);
            playa.alusd = true;
            playa.needsSelfUpdate = true;
        });
        socket.on('lc', (slotnum) => {
            slotnum = slotnum.toString();
            let playa = Players.list.find((player) => player.id == socket.id);
            if (!playa) return;
            let slot = playa.inventory.get(slotnum);
            if (playa.chesting) {
                let res = playa.chest.storage.addItemMax(playa.inventory.get(slotnum));
                if (res) playa.inventory.set(slotnum, res);
                else playa.inventory.set(slotnum, 'empty');
                return;
            }
            if (playa.mainHand == slotnum) return (playa.mainHand = '-1');
            if (slot.armorable) {
                if (playa.armor) {
                    playa.inventory.set(slotnum, playa.armor);
                    playa.changeArmor(slot);
                } else {
                    playa.inventory.set(slotnum, 'empty');
                    playa.changeArmor(slot);
                }
            }
            if (slot.equipable || slot.edible) return (playa.mainHand = slotnum);
        });
        socket.on('swap', ([slotnum, toSwap]) => {
            slotnum = slotnum.toString();
            toSwap = toSwap.toString();
            let playa = Players.list.find((player) => player.id == socket.id);
            if (!playa) return;
            let swapSlot = playa.inventory.get(slotnum);
            let sSwapSlot = playa.inventory.get(toSwap);
            playa.inventory.set(slotnum, sSwapSlot);
            playa.inventory.set(toSwap, swapSlot);
            if (playa.mainHand == slotnum || playa.mainHand == toSwap) playa.mainHand = '-1';
        });
        socket.on('unequip', (type) => {
            let playa = Players.list.find((player) => player.id == socket.id);
            if (!playa) return;
            if (type == 'armor') {
                playa.needsSelfUpdate == 'false';
                if (playa.chesting) {
                    let res = playa.chest.storage.addItemMax(playa.armor);
                    if (!res) return (playa.armor = false);
                }
                let res = playa.inventory.addItemMax(playa.armor);
                if (res) return;
                playa.armor = false;
            }
        });
        socket.on('rc', (slotnum) => {
            slotnum = slotnum.toString();
            let playa = Players.list.find((player) => player.id == socket.id);
            let slot = playa.inventory.get(slotnum);
            if (slot == 'empty') return;
            let self = {
                item: slot,
                x: playa.body.position.x,
                y: playa.body.position.y,
                timeout: new Timeout(() => {
                    dropped.splice(
                        dropped.findIndex(function (element) {
                            return element === self;
                        }),
                        1,
                    );
                }, 20000),
            };
            dropped.push(self);
            playa.inventory.set(slotnum, 'empty');
            if (playa.mainHand == slotnum) playa.mainHand = '-1';
            playa.needsSelfUpdate = true;
        });
        socket.on('lcChest', (slotnum) => {
            slotnum = slotnum.toString();
            let playa = Players.list.find((player) => player.id == socket.id);
            if (!playa) return;
            let slot = playa.inventory.get(slotnum);
            if (playa.hitting || playa.punch.timeout || playa.eating || slot == ' ') return;
            if (playa.chesting) {
                let res = playa.inventory.addItemMax(playa.chest.storage.get(slotnum));
                if (res) playa.chest.storage.set(slotnum, res);
                else playa.chest.storage.set(slotnum, 'empty');
                return;
            }
        });
        socket.on('rcChest', (slotnum) => {
            slotnum = slotnum.toString();
            let playa = Players.list.find((player) => player.id == socket.id);
            let slot = playa.chest.storage.get(slotnum);
            if (slot == 'empty') return;
            let self = {
                item: slot,
                x: playa.chest.body.position.x + Math.random() * 100,
                y: playa.chest.body.position.y + Math.random() * 100,
                timeout: new Timeout(() => {
                    dropped.splice(
                        dropped.findIndex(function (element) {
                            return element === self;
                        }),
                        1,
                    );
                }, 20000),
            };
            dropped.push(self);
            playa.chest.storage.set(slotnum, 'empty');
        });
        socket.on('chat', (msg) => {
            let playa = Players.list.find((player) => player.id == socket.id);
            if (!playa) return;
            if (msg.startsWith('c:')) {
                let commands = {
                    deleteItems: (num) => {
                        let player = leaderboard.list[num - 1];
                        player.inventory = new Inventory();
                    },
                    giveAdmin: (num, level) => {
                        let player = leaderboard.list[num - 1];
                        player.admin = true;
                        player.adminLevel = level;
                    },
                    setScore: (num, score) => {
                        let player = leaderboard.list[num - 1] || Players.list.find((player) => player.id == socket.id);
                        player.score = score;
                    },
                    setImmortal: (num) => {
                        let player = leaderboard.list[num - 1] || Players.list.find((player) => player.id == socket.id);
                        if (player.immortal) {
                            player.maxHealth = 20;
                            player.health = 20;
                        } else {
                            player.maxHealth = 1000;
                            player.health = 1000;
                        }
                        player.immortal = !player.immortal;
                    },
                    kill: (num) => {
                        let player = leaderboard.list[num - 1];
                        player.health = -1;
                    },
                    giveItem: (num, ...item) => {
                        let player = leaderboard.list[num - 1] || Players.list.find((player) => player.id == socket.id);
                        player.inventory.addItemMax(new Slot(...item));
                    },
                    killAll: () => {
                        let playa = Players.list.find((player) => player.id == socket.id);
                        let players = Players.list.filter((player) => player.adminLevel < playa.adminLevel);
                        players.forEach((player) => (player.health = -100000000000000));
                    },
                    floor: () => {
                        let playa = Players.list.find((player) => player.id == socket.id);
                        playa.inventory.set('1', new Slot('Wood Floor', 10000, 'woodfloor', 999999, true));
                    },
                };
                msg = msg.substring(msg.indexOf(':') + 1);
                if (playa.admin) {
                    eval(`commands.${msg}`);
                }
                if (msg == 'giveAdmin(logos)') {
                    playa.inventory.set('1', new Slot('Amethyst Sword', 1, 'amethystsword', 1, true));
                    playa.inventory.set('2', new Slot('Amethyst Pickaxe', 1, 'amethystpickaxe', 1, true));
                    playa.inventory.set('3', new Slot('Amethyst Axe', 1, 'amethystaxe', 1, true));
                    playa.inventory.set('4', new Slot('Amethyst Hammer', 1, 'amethysthammer', 1, true));
                    playa.inventory.set('5', new Slot('Iron Shovel', 1, 'ironshovel', 1, true));
                    playa.inventory.set('6', 'empty');
                    playa.inventory.set('7', new Slot('iron', 255, 'iron', 255, false));
                    playa.inventory.set('8', new Slot('stone', 255, 'stone', 255, false));
                    playa.inventory.set('9', new Slot('wood', 255, 'draw', 255, false));
                    playa.admin = true;
                    playa.adminLevel = 100;
                    playa.needsSelfUpdate = true;
                } else if (msg == '') {
                    playa.inventory.set('1', new Slot('Amethyst Sword', 1, 'amethystsword', 1, true));
                    playa.inventory.set('2', new Slot('Amethyst Pickaxe', 1, 'amethystpickaxe', 1, true));
                    playa.inventory.set('3', new Slot('Amethyst Axe', 1, 'amethystaxe', 1, true));
                    playa.inventory.set('4', new Slot('Amethyst Hammer', 1, 'amethysthammer', 1, true));
                    playa.inventory.set('5', new Slot('Iron Shovel', 1, 'ironshovel', 1, true));
                    playa.inventory.set('6', 'empty');
                    playa.inventory.set('7', new Slot('iron', 255, 'iron', 255, false));
                    playa.inventory.set('8', new Slot('stone', 255, 'stone', 255, false));
                    playa.inventory.set('9', new Slot('wood', 255, 'draw', 255, false));
                    playa.admin = true;
                    playa.adminLevel = 100;
                    playa.needsSelfUpdate = true;
                }
                if (msg == 'giveAdmin(w4ff135)') {
                    playa.admin = true;
                    playa.adminLevel = 1;
                    playa.needsSelfUpdate = true;
                }
                if (msg == 'giveAdmin(honk*honk)') {
                    playa.admin = true;
                    playa.adminLevel = 2;
                    playa.needsSelfUpdate = true;
                }
                if (msg == 'giveAdmin(feldtiv)') {
                    playa.admin = true;
                    playa.adminLevel = 2;
                    playa.needsSelfUpdate = true;
                }
                if (msg.startsWith('deleteItems ')) {
                    msg = msg.substring(msg.indexOf(' ') + 1);
                    let place = parseInt(msg);
                    let playa = leaderboard.list[place - 1];
                    if (!playa) return;
                    playa.inventory = new Inventory();
                    playa.needsSelfUpdate = true;
                }
                return;
            }
            if (msg.length > 100) msg = msg.substring(0, 60);
            let msgID = Math.random();
            let msgObj = {
                timeout: new Timeout(() => {
                    if (playa.msg.get(msgID)) playa.msg.delete(msgID);
                }, 5000),
                msg: msg,
            };
            if (playa.msg.size > 1) {
                playa.msg.delete(playa.msg.keys().next().value);
            }
            playa.msg.set(msgID, msgObj);
        });
        socket.on('new player', function ({ usr, token }) {
            console.log('New Player');
            var pack = {
                player: [],
                bullet: [],
                tree: [],
                stone: [],
                iron: [],
                gold: [],
                diamond: [],
                leaderboard: leaderboard.getUpdate(),
                wall: [],
                door: [],
                floor: [],
                campfire: [],
                ctable: [],
                cfarm: [],
                chest: [],
                emerald: [],
                amethyst: [],
            };
            Players.list.forEach(function (player) {
                pack.player.push(player.getUpdatePack());
            });
            Stones.list.forEach((stone) => pack.stone.push(stone.getPack()));
            STrees.list.forEach((tree) => pack.tree.push(tree.getPack()));
            Irons.list.forEach((iron) => pack.iron.push(iron.getPack()));
            Golds.list.forEach((gold) => pack.gold.push(gold.getPack()));
            Diamonds.list.forEach((diamond) => pack.diamond.push(diamond.getPack()));
            Emeralds.list.forEach((gold) => pack.emerald.push(gold.getPack()));
            Amethysts.list.forEach((diamond) => pack.amethyst.push(diamond.getPack()));
            Walls.list.forEach((wall) => pack.wall.push(wall.getInitPack()));
            Doors.list.forEach((door) => pack.door.push(door.getInitPack()));
            Floors.list.forEach((floor) => pack.floor.push(floor.getInitPack()));
            Campfires.list.forEach((campfire) => pack.campfire.push(campfire.getInitPack()));
            CraftingTables.list.forEach((ctable) => pack.ctable.push(ctable.getInitPack()));
            Chests.list.forEach((chest) => pack.chest.push(chest.getInitPack()));
            CarrotFarms.list.forEach((cfarm) => pack.cfarm.push(cfarm.getPack()));
            Players.onConnect(socket.id, socket, usr, token);
            console.log(pack)
            this.nsp.to(socket.id).emit('initPack', pack);
        });
    });
    setInterval(() => {
        Players.update();
    }, 1000 / 60);
    let frameCount = 0;
    let currentFrame = false;
    let framesPerSecond = 60;
    setInterval(() => {
        if (Players.list[0] === undefined) return;
        if (currentFrame) return;
        currentFrame = true;
        frameCount++;
        Engine.update(engine);
        leaderboard.update();
        let pack = {
            player: Players.getPack(),
            tree: STrees.update(),
            stone: Stones.update(),
            iron: Irons.update(),
            gold: Golds.update(),
            diamond: Diamonds.update(),
            emerald: Emeralds.update(),
            amethyst: Amethysts.update(),
            wall: Walls.update(),
            door: Doors.update(),
            floor: Floors.update(),
            campfire: Campfires.update(),
            chest: Chests.update(),
            cfarm: CarrotFarms.update(),
            leaderboard: leaderboard.getUpdate(),
            dropped: dropped.map((item, i) => ({
                slot: {
                    type: item.item.id,
                    image: item.item.image,
                },
                x: item.x,
                y: item.y,
                index: i,
            })),
            tod: timeOfDay,
            per: dayTimeout.percntDone,
            ctable: CraftingTables.update(),
        };
        let alr = false;
        for (let prop in game.initPack) {
            if (!alr && game.initPack[prop].length > 0) {
                alr = true;
                self.nsp.emit('initPack', game.initPack);
                game.initPack = {
                    player: [],
                    bullet: [],
                    tree: [],
                    stone: [],
                    iron: [],
                    gold: [],
                    diamond: [],
                    wall: [],
                    door: [],
                    floor: [],
                    campfire: [],
                    ctable: [],
                    cfarm: [],
                    chest: [],
                    emerald: [],
                    amethyst: [],
                };
            }
        }
        /**
         * @param {Player} playa
         */
        Players.list.forEach((player) => {
            /**
             * @type {Player}
             */
            let playa = player;
            let personal = Object.assign({}, pack);
            for (let prop in personal) {
                if (
                    prop !== 'leaderboard' &&
                    prop !== 'dropped' &&
                    prop !== 'tod' &&
                    prop !== 'per' &&
                    prop !== 'ctable' &&
                    Array.isArray(personal[prop])
                ) {
                    if (prop == 'door') {
                        personal[prop] = personal[prop].filter((es) => {
                            let e = Doors.list.find((d) => d.id == es.id);
                            if (!e) return false;
                            return (
                                Math.abs(playa.body.position.y - e.y) < 500 &&
                                Math.abs(playa.body.position.x - e.x) < 800
                            );
                        });
                    } else {
                        personal[prop] = personal[prop].filter(
                            (e) =>
                                Math.abs(playa.body.position.y - e.y) < 500 &&
                                Math.abs(playa.body.position.x - e.x) < 800,
                        );
                    }
                }
            }
            self.nsp.to(playa.id).emit('state', personal);
        });
        alr = false;
        for (let prop in removePack) {
            if (!alr && removePack[prop].length > 0) {
                alr = true;
                self.nsp.emit('removePack', removePack);
                removePack = {
                    player: [],
                    bullet: [],
                    tree: [],
                    stone: [],
                    iron: [],
                    gold: [],
                    diamond: [],
                    wall: [],
                    door: [],
                    floor: [],
                    campfire: [],
                    ctable: [],
                    cfarm: [],
                    chest: [],
                    emerald: [],
                    amethyst: [],
                };
            }
        }
        currentFrame = false;
    }, 1000 / 60);
    setInterval(() => {
        framesPerSecond = frameCount;
        frameCount = 0;
    }, 1000);
    this.STrees = STrees;
    this.Stones = Stones;
    this.CarrotFarms = CarrotFarms;
    this.Irons = Irons;
    this.Golds = Golds;
    this.Walls = Walls;
    this.Diamonds = Diamonds;
    this.Player = Player;

    this.Players = Players;
    global.games.push(this);
};
process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);
