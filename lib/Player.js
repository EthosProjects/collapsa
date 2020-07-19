Math = require('../math.js');
const Entity = require('./Entity');
const { Bodies, Body, Vector, SAT } = require('matter-js');
const { Amethyst, CarrotFarm, Diamond, Emerald, Gold, Iron, Stone, STree } = require('./Structures/Resources');
const { Campfire, CraftingTable, Chest, Door, Floor, Wall } = require('./Structures/Buildings');
const { Collection } = require('discord.js');
const { Crafter, Inventory, Timeout, Slot } = require('./');
class Player extends Entity {
    /**
     * @param {String} id
     * @param {String} usr
     * @param {SocketIO.Socket} socket
     * @param {Game} game
     * @param {String} token
     */
    constructor(id, usr, socket, game, token) {
        const { Players, initPack, walls, map, nsp, Entities } = game;
        let getGoodPosition = (...a) => {
            let args = [...a];
            if (!args.length) args = ['circle', 'tempx', 'tempy', 150, { isStatic: true }];
            let type = args.shift();
            let tempx = Math.getRandomInt(150, map.forest.width - 150);
            let tempy = Math.getRandomInt(150, map.forest.height - 150);
            let toUse = args.map((arg) => {
                if (arg == 'tempx') return tempx;
                else if (arg == 'tempy') return tempy;
                else return arg;
            });
            let bodyA = Bodies[type](...toUse);
            let inWay = false;
            Entities.forEach((e) => {
                if (SAT.collides(bodyA, e.body).collided) inWay = true;
            });
            Object.values(walls).forEach((w) => {
                if (SAT.collides(bodyA, w).collided) inWay = true;
            });
            while (inWay) {
                tempx = Math.getRandomInt(0, map.forest.width);
                tempy = Math.getRandomInt(0, map.forest.height);
                let toUse = args.map((arg) => {
                    if (arg == 'tempx') return tempx;
                    if (arg == 'tempy') return tempy;
                    else return arg;
                });
                bodyA = Bodies[type](...toUse);
                inWay = false;
                Entities.forEach((e) => {
                    if (SAT.collides(bodyA, e.body).collided) inWay = true;
                });
                Object.values(walls).forEach((w) => {
                    if (SAT.collides(bodyA, w).collided) inWay = true;
                });
            }
            return {
                x: tempx,
                y: tempy,
            };
        };
        let p = getGoodPosition();
        super(
            Bodies.circle(p.x, p.y, 30, {
                frictionAir: 0.02,
                restitution: 0.15,
            }),
            20,
            game,
        );
        //User data
        /**
         * @type {string}
         */
        this.id = id;
        /**
         * @type {SocketIO.Socket}
         */
        this.socket = socket;
        /**
         * @type {string}
         */
        this.usr = usr;
        /**
         * @type {string|null}
         */
        this.token = token || null;
        /**
         * @type {null|Clan}
         */
        this.clan = null;
        /**
         * @typedef PlayerMessage
         * @property {Timeout} timeout
         * @property {String} message
         */
        /**
         * @type {Collection.<number, PlayerMessage>}
         */
        this.msg = new Collection();
        //Body
        /**
         * @type {Number}
         */
        this.rad = 30;
        //Inventory
        /**
         * @type {Inventory}
         */
        this.inventory = new Inventory();
        /**
         * @type {Crafter} Contains crafting recipes
         */
        this.crafter = new Crafter();
        /**
         * @type {String} Contains the current index of the item being hend
         */
        this.mainHand = '-1';
        /**
         * @type {String} Contains the current name of the item being held
         */
        this.mainHands = 'hand';
        //Admin
        /**
         * @type {Boolean} Whether or not the given player is an admin
         */
        this.admin = false;
        /**
         * @type {Number} The player's level of admin
         */
        this.adminLevel = 0;
        //Leaderboard
        /**
         * @type {Number} The player's score
         */
        this.score = 0;
        /**
         * @type {Number} The player's kill count
         */
        this.kills = 0;
        //Armour
        /**
         * @type {Armour} The player's Armour
         */
        this.armor = null;
        /**
         * @type {Hat} The player's Hat
         */
        this.hat = null;
        //Usables
        /**
         * @type {Boolean} Whether or not the player has already used an item
         */
        this.alusd = false;
        /**
         * @typedef PlayerHands
         * @property {Object} l
         * @property {Boolean} l.hit
         * @property {Object} r
         * @property {Boolean} r.hit
         * @property {Boolean} ready
         * @property {Timeout} timeout
         * @property {Number} damage
         * @property {Number} speed
         */
        /**
         * The player's hand object
         * @type {PlayerHands}
         */
        this.hands = {
            next: 'l',
            l: {
                hit: false,
            },
            r: {
                hit: false,
            },
            ready: true,
            timeout: null,
            damage: 1,
            speed: 1500 / 3,
        };
        /**
         * @typedef PlayerMineable
         * @property {"wood"|"stone"|"iron"|"gold"|"diamond"|"emerald"|"amethyst"|"sand"} item
         * @property {Number} count
         */
        /**
         * @typedef PlayerToolResourceLevel
         * @property {Number} damage
         * @property {Number} walldam
         * @property {Array.<PlayerMineable>} mines
         * @property {Number} speed
         */
        /**
         * @typedef PlayerTool
         * @property {PlayerToolResourceLevel} stone
         * @property {PlayerToolResourceLevel} iron
         * @property {PlayerToolResourceLevel} gold
         * @property {PlayerToolResourceLevel} diamond
         * @property {PlayerToolResourceLevel} emerald
         * @property {PlayerToolResourceLevel} amethyst
         */
        /**
         * @type {PlayerTool}
         */
        this.axe = {
            ready: true,
            timeout: null,
            stone: {
                damage: 3.75,
                walldam: 3,
                mines: [{ item: 'wood', count: 3 }],
                speed: 5000 / 3,
            },
            iron: {
                damage: 4.5,
                walldam: 9,
                mines: [{ item: 'wood', count: 5 }],
                speed: 5000 / 3,
            },
            gold: {
                damage: 6,
                walldam: 19,
                mines: [{ item: 'wood', count: 8 }],
                speed: 5000 / 3,
            },
            diamond: {
                damage: 7,
                walldam: 25,
                mines: [{ item: 'wood', count: 12 }],
                speed: 5000 / 3,
            },
            emerald: {
                damage: 6.5,
                walldam: 20,
                mines: [{ item: 'wood', count: 10 }],
                speed: 2000 / 3,
            },
            amethyst: {
                damage: 6.5,
                walldam: 20,
                mines: [{ item: 'wood', count: 10 }],
                speed: 2000 / 3,
            },
        };
        /**
         * @type {PlayerTool}
         */
        this.pickaxe = {
            ready: true,
            timeout: null,
            stone: {
                damage: 3.75,
                walldam: 2,
                mines: [
                    { item: 'stone', count: 3 },
                    { item: 'iron', count: 2 },
                ],
            },
            iron: {
                damage: 4,
                walldam: 6,
                mines: [
                    { item: 'stone', count: 5 },
                    { item: 'iron', count: 3 },
                    { item: 'gold', count: 2 },
                    { item: 'diamond', count: 1 },
                ],
            },
            gold: {
                damage: 4.5,
                walldam: 8,
                mines: [
                    { item: 'stone', count: 9 },
                    { item: 'iron', count: 5 },
                    { item: 'gold', count: 3 },
                    { item: 'diamond', count: 2 },
                ],
            },
            diamond: {
                damage: 5,
                walldam: 15,
                mines: [
                    { item: 'stone', count: 20 },
                    { item: 'iron', count: 9 },
                    { item: 'gold', count: 5 },
                    { item: 'diamond', count: 4 },
                    { item: 'emerald', count: 2 },
                    { item: 'amethyst', count: 1 },
                ],
            },
            emerald: {
                damage: 4.75,
                walldam: 12,
                mines: [
                    { item: 'stone', count: 15 },
                    { item: 'iron', count: 7 },
                    { item: 'gold', count: 4 },
                    { item: 'diamond', count: 3 },
                    { item: 'emerald', count: 3 },
                    { item: 'amethyst', count: 1 },
                ],
            },
            amethyst: {
                damage: 4.75,
                walldam: 12,
                mines: [
                    { item: 'stone', count: 15 },
                    { item: 'iron', count: 7 },
                    { item: 'gold', count: 4 },
                    { item: 'diamond', count: 3 },
                    { item: 'emerald', count: 2 },
                    { item: 'amethyst', count: 2 },
                ],
            },
        };
        /**
         * @type {PlayerTool}
         */
        this.shovel = {
            ready: true,
            timeout: null,
            stone: {
                damage: 3.75,
                walldam: 2,
                mines: [{ item: 'sand', count: 3 }],
            },
            iron: {
                damage: 4,
                walldam: 6,
                mines: [{ item: 'sand', count: 5 }],
            },
        };
        /**
         * @type {PlayerTool}
         */
        this.sword = {
            ready: true,
            timeout: null,
            stone: {
                damage: 5,
                walldam: 1,
            },
            iron: {
                damage: 7,
                walldam: 5,
            },
            gold: {
                damage: 8,
                walldam: 7,
            },
            diamond: {
                damage: 9,
                walldam: 10,
            },
            emerald: {
                damage: 8.75,
                walldam: 9,
            },
            amethyst: {
                damage: 8.75,
                walldam: 9,
            },
        };
        /**
         * @type {PlayerTool}
         */
        this.hammer = {
            ready: true,
            timeout: null,
            stone: {
                damage: 4,
                walldam: 25,
            },
            iron: {
                damage: 6,
                walldam: 30,
            },
            gold: {
                damage: 7,
                walldam: 37.5,
            },
            diamond: {
                damage: 8,
                walldam: 50,
            },
            emerald: {
                damage: 9.5,
                walldam: 70,
            },
            amethyst: {
                damage: 11.5,
                walldam: 100,
            },
        };
        //Building
        /**
         * @type {Vector}
         */
        this.posPlace = null;
        /**
         * @type {Boolean}
         */
        this.canPlace = true;
        /**
         * @type {Array.<Wall|Door|Floor|CraftingTable|Campfire|Chest>}
         */
        this.structures = [];
        /**
         * @type {"left"|"up"|"right"|"down"}
         */
        this.pang = 'left';
        //Custom Menus
        /**
         * @type {Boolean}
         */
        this.crafting = false;
        this.clanning = false;
        /**
         * @type {Boolean}
         */
        this.clans = null;

        this.move = {
            r: false,
            l: false,
            u: false,
            d: false,
            att: false,
            run: false,
            ang: 0,
            mdis: 0,
        };
        this.carrot = {
            food: 3,
            timeout: null,
            ready: true,
            speed: 1000,
        };
        this.hrad = (this.rad / 25) * 7.5;
        this.hposfl = Vector.create(0, (-35.34119409414458 * this.rad) / 25);
        this.hposfl.x = Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfl);
        this.hposfl.y = Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfl);
        Vector.add(this.body.position, this.hposfl, this.hposfl);

        this.hposfr = Vector.create(0, (-35.34119409414458 * this.rad) / 25);
        this.hposfr.x = Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfr);
        this.hposfr.y = Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfr);
        Vector.add(this.body.position, this.hposfr, this.hposfr);
        this.lhit = false;
        this.rhit = false;
        this._maxSpd = 2;
        this.maxSpd = this._maxSpd;
        //Stats
        this.stamina = 20;
        this.maxStamina = 20;
        this.food = 20;
        this.maxFood = 20;
        this.damages = [];
        //Extra Stats
        this.needsSelfUpdate = false;
        this.afkTimer = setTimeout(() => {
            this.dead = true;
            let t = setInterval(function () {
                this.health -= this.maxHealth / 100;
            }, 100);
            setTimeout(() => clearInterval(t));
        }, 10000);
        this.dead = false;
        initPack.player.push({
            usr: this.usr,
            x: this.body.position.x,
            y: this.body.position.y,
            health: 20,
            food: 20,
            mainHand: 'hand',
            id: this.id,
            maxHp: this.maxHealth,
            maxFood: this.maxFood,
            angle: this.move.ang,
            lhit: this.lhit,
            rhit: this.rhit,
        });
        Players.list.push(this);
        this.on('unable', function (msg) {
            nsp.to(this.id).emit('unable', msg);
        });
        this.on('death', function () {
            nsp.to(this.id).emit('death');
        });
        this.immortal = false;
    }
    updateSpd() {
        var m = this.move;
        this.acc = Vector.create(0, 0);
        if (m.r) this.acc.x += this._maxSpd / 3500;
        if (m.l) this.acc.x -= this._maxSpd / 3500;
        if (m.d) this.acc.y += this._maxSpd / 3500;
        if (m.u) this.acc.y -= this._maxSpd / 3500;
        Body.applyForce(this.body, this.body.position, this.acc);
    }
    update() {
        const { Entities, Clans, dropped } = this.game;
        if (
            this.move.run &&
            this.stamina > 0.5 &&
            Vector.magnitude(this.acc) > 0 &&
            this.food > this.maxFood * (30 / 100)
        ) {
            this.maxSpd = this._maxSpd * 1.5;
            this.stamina -= this.maxStamina / 5 / 60;
            this.needsSelfUpdate = true;
        } else if (this.stamina < this.maxStamina && this.food > this.maxFood * (30 / 100)) {
            this.maxSpd = this._maxSpd * 1.5;
            if (Vector.magnitude(this.acc) <= 0) this.stamina += this.maxStamina / 25 / 60;
            else this.stamina += this.maxStamina / 100 / 60;
            this.needsSelfUpdate = true;
        }
        if (this.food > 0 && this.stamina > 0) this.health += this.maxHealth / 50 / 60;
        else this.health -= this.maxHealth / 50 / 60;
        if (this.food > 0) this.food -= this.maxFood / 300 / 60;
        else this.food = 0;
        if (this.crafter.checkCraft(this.inventory)) this.needsUpdate = true;
        if (this.crafting) {
            if (this.craftingctable.health <= 0) this.crafting = false;
            this.craftablesEx = this.craftingctable.checkCraft(this.inventory);
            this.needsSelfUpdate = true;
            //if()
        }
        this.damages.forEach((d) => this.handleDamage(d));
        if (this.chesting) {
            if (this.chest.health <= 0) this.chesting = false;
            if (Vector.getDistance(this.chest.body.position, this.body.position) > 150) this.chesting = false;
            this.chestables = this.chest.storage.listItems();
            this.needsSelfUpdate = true;
            //if()
        }
        if (this.clan && this.clan.owner == this && this.clan.joinReqs[0]) this.needsSelfUpdate = true;
        if (
            this.crafting &&
            (this.craftingctable.health <= 0 ||
                Vector.getDistance(this.craftingctable.body.position, this.body.position) > 150)
        )
            this.crafting = false;
        if (this.clanning) {
            this.crafting = false;
            this.needsSelfUpdate = true;
            this.clans = Array.from(Clans, ([clanName, clan]) => clanName);
            //if()
        }
        this.updateSpd();
        if (Vector.magnitude(this.body.velocity) > this.maxSpd)
            Vector.mult(Vector.normalise(this.body.velocity), { x: this.maxSpd, y: this.maxSpd }, this.body.velocity);
        this.targets = [];
        this.treetargs = [];
        this.stonetargs = [];
        this.setHands();
        this.canPlace = true;
        //const { globalDoors, CraftingTables, Chests } = this.game
        if (this.move.grab) {
            if (
                (dropped.length ||
                    this.structures.find((s) => s instanceof Door) ||
                    globalDoors.length ||
                    CraftingTables.list.length ||
                    Chests.list.length ||
                    (this.clan &&
                        this.clan.members.find((member) => member.structures.find((s) => s instanceof Door)))) &&
                !this.alusd
            ) {
                let possible = new Collection();
                dropped.forEach((item, i) => {
                    if (Vector.getDistance(item, this.body.position) < 32 + this.rad) possible.set(i, item);
                });
                let dis;
                let nearest;
                if (possible.size) {
                    possible.forEach((item, index) => {
                        if (!nearest) {
                            nearest = index;
                            dis = Vector.getDistance(item, this.body.position);
                            return;
                        }
                        if (Vector.getDistance(item, this.body.position) < dis) {
                            dis = Vector.getDistance(item, this.body.position);
                            nearest = index;
                        }
                    });
                }
                let posd = new Collection();
                this.structures.forEach((s, i) => {
                    if (s instanceof Door && Vector.getDistance(s, this.body.position) < 70.7 + this.rad)
                        posd.set(Math.random(), s);
                });
                if (this.clan) {
                    this.clan.members.forEach((member) => {
                        member.structures.forEach((s) => {
                            if (
                                s instanceof Door &&
                                Vector.getDistance(s, this.body.position) < 70.7 + this.rad &&
                                member != this
                            )
                                posd.set(Math.random(), s);
                        });
                    });
                }
                if (globalDoors.length) {
                    globalDoors.forEach((d) => {
                        if (d instanceof Door && Vector.getDistance(d, this.body.position) < 70.7 + this.rad)
                            posd.set(Math.random(), d);
                    });
                }
                let disd;
                let nearestd;
                if (posd.size) {
                    posd.forEach((door, index) => {
                        if (!nearestd) {
                            nearestd = index;
                            disd = Vector.getDistance(door, this.body.position);
                            return;
                        }
                        if (Vector.getDistance(door, this.body.position) < disd) {
                            disd = Vector.getDistance(door, this.body.position);
                            nearestd = index;
                        }
                    });
                }
                let posctable = new Collection();
                CraftingTables.list.forEach((ctable, i) => {
                    if (Vector.getDistance(ctable, this.hposfr) < 70.7 + this.hrad) posctable.set(i, ctable);
                });
                let disctable;
                let nearestctable;
                if (posctable.size) {
                    posctable.forEach((ctable, index) => {
                        if (!nearestctable) {
                            nearestctable = index;
                            disctable = Vector.getDistance(ctable, this.body.position);
                            return;
                        }
                        if (Vector.getDistance(ctable, this.body.position) < disctable) {
                            disctable = Vector.getDistance(ctable, this.body.position);
                            nearestctable = index;
                        }
                    });
                }
                let poschest = new Collection();
                Chests.list.forEach((ctable, i) => {
                    if (Vector.getDistance(ctable, this.hposfr) < 70.7 + this.hrad) poschest.set(i, ctable);
                });
                let dischest;
                let nearestchest;
                if (poschest.size) {
                    poschest.forEach((chest, index) => {
                        if (!nearestchest) {
                            nearestchest = index;
                            dischest = Vector.getDistance(chest, this.body.position);
                            return;
                        }
                        if (Vector.getDistance(chest, this.body.position) < dischest) {
                            dischest = Vector.getDistance(chest, this.body.position);
                            nearestchest = index;
                        }
                    });
                }
                if (!posd.size && !possible.size && !posctable.size && !poschest.size) return;
                //console.log(poschest)
                if (
                    !this.crafting &&
                    ((dis == undefined && disctable == undefined && dischest == undefined && disd != undefined) ||
                        (disd > dis && disd > disctable && disd > dischest)) &&
                    !posd.get(nearestd).opening
                ) {
                    let door = posd.get(nearestd);
                    door.openFun();
                    this.alusd = true;
                } else if (
                    !this.crafting &&
                    ((disd == undefined && disctable == undefined && dischest == undefined && dis != undefined) ||
                        (dis > disctable && dis > disd && dis > dischest))
                ) {
                    let res = this.inventory.addItemMax(dropped[nearest].item);
                    if (!res) {
                        clearTimeout(dropped[nearest].timeout.timeout);
                        dropped.splice(nearest, 1);
                    }
                    this.needsSelfUpdate = true;
                    this.alusd = true;
                } else if (
                    !this.crafting &&
                    ((disd == undefined && disctable == undefined && dis == undefined && dischest != undefined) ||
                        (dischest > dis && dischest > disd && dischest > disctable))
                ) {
                    this.chest = poschest.get(nearestchest);
                    console.log('wtf');
                    this.chesting = !this.chesting;
                    this.needsSelfUpdate = true;
                    this.alusd = true;
                } else if ((!disd && !dis && !dischest) || (dis > disctable && dis > disctable) || this.crafting) {
                    this.craftingctable = posctable.get(nearestctable);
                    this.crafting = !this.crafting;
                    this.needsSelfUpdate = true;
                    this.alusd = true;
                }
            }
        }
        if (this.inventory.get(this.mainHand) == undefined) {
            this.mainHands = 'hand';
        } else {
            this.mainHands = this.inventory.get(this.mainHand).id;
            let toolReg = /\w+\s(Axe|Pickaxe|Shovel|Sword|Hammer)/;
            if (
                toolReg.test(this.mainHands) &&
                this.move.att &&
                this[this.mainHands.split(' ')[1].toLowerCase()].ready
            ) {
                let u;
                this.tool = this.mainHands.split(' ')[1].toLowerCase();
                if (/^Stone/.test(this.mainHands)) u = 'stone';
                else if (/^Iron/.test(this.mainHands)) u = 'iron';
                else if (/^Gold/.test(this.mainHands)) u = 'gold';
                else if (/^Diamond/.test(this.mainHands)) u = 'diamond';
                else if (/^Emerald/.test(this.mainHands)) u = 'emerald';
                else if (/^Amethyst/.test(this.mainHands)) u = 'amethyst';
                let targs = [];
                let rtargs = [];
                let walltargs = [];
                let camptargs = [];
                let filterTargets = (toolBody) => {
                    Entities.forEach((e) => {
                        if (!SAT.collides(toolBody, e.body).collided) return;
                        if (e instanceof Player) {
                            targs.push(e);
                        }
                        if (
                            e instanceof STree ||
                            e instanceof Stone ||
                            e instanceof Iron ||
                            e instanceof Gold ||
                            e instanceof Diamond ||
                            e instanceof Emerald ||
                            e instanceof Amethyst
                        ) {
                            rtargs.push(e);
                        }
                        if (
                            e instanceof Wall ||
                            e instanceof Door ||
                            e instanceof Floor ||
                            e instanceof CraftingTable ||
                            e instanceof CarrotFarm ||
                            e instanceof Campfire ||
                            e instanceof Chest
                        ) {
                            walltargs.push(e);
                        }
                        if (e instanceof Campfire) camptargs.push(e);
                    });
                };
                if (/Axe/.test(this.mainHands)) {
                    if (this[this.tool].timeout) clearTimeout(this[this.tool].timeout.timeout);
                    let axerad = (this.rad / 25) * 15;
                    let axep = Vector.create(0, 0);
                    axep.x = (Math.cos((this.move.ang * Math.PI) / 180) * 70 * this.rad) / 25;
                    axep.y = (Math.sin((this.move.ang * Math.PI) / 180) * 70 * this.rad) / 25;
                    Vector.add(this.body.position, axep, axep);
                    let toolBody = Bodies.circle(axep.x, axep.y, axerad);
                    this.axe.ready = false;
                    this.hitting = true;
                    let speed = this.axe[u].speed;
                    this.axe.timeout = new Timeout(() => {
                        this.hitting = false;
                        this.axe.timeout = null;
                        this.axe.ready = true;
                        this.tool = null;
                    }, speed);
                    filterTargets(toolBody);
                    new Timeout(() => {
                        rtargs.forEach((r) => {
                            let rem;
                            if (r instanceof STree) {
                                rem = this.inventory.addItemMax(
                                    new Slot('wood', this.axe[u].mines[0].count, 'draw', 255, false),
                                );
                                this.score += this.axe[u].mines[0].count * 1;
                                this.needsSelfUpdate = true;
                            }
                            if (rem) {
                                let ang = Math.getRandomNum(0, 360);
                                let offset = Vector.create(0, 50 + 20);
                                offset.x = Math.cos((ang * Math.PI) / 180) * Vector.magnitude(offset);
                                offset.y = Math.sin((ang * Math.PI) / 180) * Vector.magnitude(offset);
                                Vector.add(r.body.position, offset, offset);
                                let self = {
                                    item: rem,
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
                            }
                            r.health -= this.axe[u].walldam;
                        });

                        targs.forEach((t) => {
                            t.takeDamage({
                                damage: this.axe[u].damage,
                                type: 'melee',
                                length: speed / 2,
                            });
                            if (t.health - this.axe[u].damage < 0) {
                                if (t instanceof Player) this.score += t.score / 2 + 10;
                            }
                        });
                        walltargs.forEach((w) => {
                            w.health -= this.axe[u].walldam;
                        });
                    }, speed / 2);
                }
                if (/Pickaxe/.test(this.mainHands)) {
                    let u;
                    let un;
                    this.tool = 'pickaxe';
                    if (/^Stone/.test(this.mainHands)) {
                        u = 'stone';
                        un = 0;
                    } else if (/^Iron/.test(this.mainHands)) {
                        u = 'iron';
                        un = 1;
                    } else if (/^Gold/.test(this.mainHands)) {
                        u = 'gold';
                        un = 2;
                    } else if (/^Diamond/.test(this.mainHands)) {
                        u = 'diamond';
                        un = 3;
                    } else if (/^Emerald/.test(this.mainHands)) {
                        u = 'emerald';
                        un = 4;
                    } else if (/^Amethyst/.test(this.mainHands)) {
                        u = 'amethyst';
                        un = 5;
                    }
                    if (this.pickaxe.timeout) clearTimeout(this.pickaxe.timeout.timeout);
                    let paxerad = (this.rad / 25) * 30;
                    let paxep = Vector.create(0, (70 * this.rad) / 25);
                    paxep.x = Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(paxep);
                    paxep.y = Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(paxep);
                    Vector.add(this.body.position, paxep, paxep);
                    let toolBody = Bodies.circle(paxep.x, paxep.y, paxerad);
                    this.pickaxe.ready = false;
                    this.hitting = true;
                    this.pickaxe.timeout = new Timeout(() => {
                        this.hitting = false;
                        this.pickaxe.timeout = null;
                        this.pickaxe.ready = true;
                        this.tool = null;
                    }, 5000 / 3);
                    filterTargets(toolBody);
                    new Timeout(() => {
                        rtargs.forEach((r) => {
                            let rem;
                            let restype = '';
                            let resnum = null;
                            if (r instanceof Stone) {
                                restype = 'stone';
                                resnum = 0;
                            }
                            if (r instanceof Iron) {
                                restype = 'iron';
                                resnum = 1;
                            }
                            if (r instanceof Gold) {
                                restype = 'gold';
                                resnum = 2;
                            }
                            if (r instanceof Diamond) {
                                restype = 'diamond';
                                resnum = 3;
                            }
                            if (r instanceof Emerald) {
                                restype = 'emerald';
                                resnum = 4;
                            }
                            if (r instanceof Amethyst) {
                                restype = 'amethyst';
                                resnum = 5;
                            }
                            if (
                                r instanceof Stone ||
                                r instanceof Iron ||
                                r instanceof Gold ||
                                r instanceof Diamond ||
                                r instanceof Amethyst ||
                                r instanceof Emerald
                            ) {
                                if (
                                    un >= 3 ||
                                    (un > 0 && un < 3 && resnum <= 3) ||
                                    resnum == un ||
                                    un == 0 ||
                                    resnum == 1
                                ) {
                                    rem = this.inventory.addItemMax(
                                        new Slot(restype, this.pickaxe[u].mines[resnum].count, restype, 255, false),
                                    );
                                    this.score += this.pickaxe[u].mines[resnum].count * resnum + 2;
                                }
                                this.needsSelfUpdate = true;
                            }
                            if (rem) {
                                let ang = Math.getRandomNum(0, 360);
                                let offset = Vector.create(0, 50 + 20);
                                offset.x = Math.cos((ang * Math.PI) / 180) * Vector.magnitude(offset);
                                offset.y = Math.sin((ang * Math.PI) / 180) * Vector.magnitude(offset);
                                Vector.add(r.body.position, offset, offset);
                                let self = {
                                    item: rem,
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
                            }
                            r.health -= this.pickaxe[u].walldam;
                        });
                        targs.forEach((t) => {
                            t.takeDamage({
                                damage: this.pickaxe[u].damage,
                                type: 'melee',
                                length: 5000 / 6,
                            });
                            if (t.health - this.pickaxe[u].damage < 0) {
                                if (t instanceof Player) this.score += t.score / 2 + 10;
                            }
                        });
                        walltargs.forEach((w) => {
                            w.health -= this.pickaxe[u].walldam;
                        });
                    }, 2500 / 3);
                }
                if (/Sword/.test(this.mainHands)) {
                    let u;
                    let un;
                    this.tool = 'sword';

                    if (/^Stone/.test(this.mainHands)) {
                        u = 'stone';
                        un = 0;
                    } else if (/^Iron/.test(this.mainHands)) {
                        u = 'iron';
                        un = 1;
                    } else if (/^Gold/.test(this.mainHands)) {
                        u = 'gold';
                        un = 2;
                    } else if (/^Diamond/.test(this.mainHands)) {
                        u = 'diamond';
                        un = 3;
                    } else if (/^Emerald/.test(this.mainHands)) {
                        u = 'emerald';
                        un = 4;
                    } else if (/^Amethyst/.test(this.mainHands)) {
                        u = 'amethyst';
                        un = 5;
                    }
                    if (this.sword.timeout) clearTimeout(this.swor.timeout.timeout);
                    let saxerad = (this.rad / 25) * 30;
                    let saxep = Vector.create(0, (70 * this.rad) / 25);
                    saxep.x = (Math.cos((this.move.ang * Math.PI) / 180) * 60 * this.rad) / 25;
                    saxep.y = (Math.sin((this.move.ang * Math.PI) / 180) * 60 * this.rad) / 25;
                    Vector.add(this.body.position, saxep, saxep);
                    let toolBody = Bodies.circle(saxep.x, saxep.y, saxerad);
                    this.sword.ready = false;
                    this.hitting = true;
                    this.sword.timeout = new Timeout(
                        () => {
                            this.hitting = false;
                            this.sword.timeout = null;
                            this.sword.ready = true;
                            this.tool = null;
                        },
                        un >= 3 ? 3000 / 3 : 5000 / 3,
                    );
                    filterTargets(toolBody);
                    new Timeout(
                        () => {
                            targs.forEach((t) => {
                                t.takeDamage({
                                    damage: this.sword[u].damage,
                                    type: 'melee',
                                    length: un >= 3 ? 3000 / 3 : 5000 / 3,
                                });
                                if (t.health - this.sword[u].damage < 0) {
                                    if (t instanceof Player) this.score += t.score / 2 + 10;
                                }
                            });
                            camptargs.forEach((c) => {
                                if (!c.lit) {
                                    c.lit = true;
                                    c.needsUpdate = true;
                                    console.log('ass');
                                }
                            });
                        },
                        un >= 3 ? 1500 / 3 : 2500 / 3,
                    );
                }
                if (/Hammer/.test(this.mainHands)) {
                    let u;
                    this.tool = 'hammer';
                    if (/^Stone/.test(this.mainHands)) u = 'stone';
                    else if (/^Iron/.test(this.mainHands)) u = 'iron';
                    else if (/^Gold/.test(this.mainHands)) u = 'gold';
                    else if (/^Diamond/.test(this.mainHands)) u = 'diamond';
                    else if (/^Amethyst/.test(this.mainHands)) u = 'amethyst';
                    else if (/^Emerald/.test(this.mainHands)) u = 'emerald';
                    if (this.hammer.timeout) clearTimeout(this.hammer.timeout.timeout);
                    let axerad = (this.rad / 25) * 15;
                    let axep = Vector.create(0, (70 * this.rad) / 25);
                    axep.x = Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(axep);
                    axep.y = Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(axep);
                    Vector.add(this.body.position, axep, axep);
                    let toolBody = Bodies.circle(axep.x, axep.y, axerad);
                    this.hammer.ready = false;
                    this.hitting = true;
                    this.hammer.timeout = new Timeout(() => {
                        this.hitting = false;
                        this.hammer.timeout = null;
                        this.hammer.ready = true;
                        this.tool = null;
                    }, 6000 / 3);
                    filterTargets(toolBody);
                    new Timeout(() => {
                        rtargs.forEach((r) => {
                            r.health -= this.hammer[u].walldam;
                        });
                        targs.forEach((t) => {
                            t.takeDamage({
                                damage: this.hammer[u].damage,
                                type: 'melee',
                                length: 6000 / 6,
                            });
                            if (t.health - this.hammer[u].damage < 0) {
                                if (t instanceof Player) this.score += t.score / 2 + 10;
                            }
                        });
                        walltargs.forEach((w) => {
                            w.health -= this.hammer[u].walldam;
                        });
                    }, 2500 / 3);
                }
                if (/Shovel/.test(this.mainHands)) {
                    let u;
                    let un;
                    this.tool = 'shovel';
                    if (/^Stone/.test(this.mainHands)) {
                        u = 'stone';
                        un = 0;
                    } else if (/^Iron/.test(this.mainHands)) {
                        u = 'iron';
                        un = 1;
                    } else if (/^Gold/.test(this.mainHands)) {
                        u = 'gold';
                        un = 2;
                    } else if (/^Diamond/.test(this.mainHands)) {
                        u = 'diamond';
                        un = 3;
                    } else if (/^Emerald/.test(this.mainHands)) {
                        u = 'emerald';
                        un = 4;
                    } else if (/^Amethyst/.test(this.mainHands)) {
                        u = 'amethyst';
                        un = 5;
                    }
                    if (this.shovel.timeout) clearTimeout(this.shovel.timeout.timeout);
                    let paxerad = (this.rad / 25) * 30;
                    let paxep = Vector.create(0, (70 * this.rad) / 25);
                    paxep.x = Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(paxep);
                    paxep.y = Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(paxep);
                    Vector.add(this.body.position, paxep, paxep);
                    let toolBody = Bodies.circle(paxep.x, paxep.y, paxerad);
                    this.shovel.ready = false;
                    this.hitting = true;
                    this.shovel.timeout = new Timeout(() => {
                        this.hitting = false;
                        this.shovel.timeout = null;
                        this.shovel.ready = true;
                        this.tool = null;
                    }, 5000 / 3);
                    filterTargets(toolBody);
                    new Timeout(() => {
                        console.log(this.shovel[u].mines);
                        if (this.body.position.y > 1000 + this.rad) {
                            this.inventory.addItemMax(new Slot('sand', this.shovel[u].mines[0].count, 'sand', 255));
                            this.score += this.shovel[u].mines[0].count * 2;
                        }
                        rtargs.forEach((r) => {
                            r.health -= this.shovel[u].walldam;
                        });
                        targs.forEach((t) => {
                            t.takeDamage({
                                damage: this.shovel[u].damage,
                                type: 'melee',
                                length: 5000 / 6,
                            });
                            if (t.health - this.shovel[u].damage < 0) {
                                if (t instanceof Player) this.score += t.score / 2 + 10;
                            }
                        });
                        walltargs.forEach((w) => {
                            w.health -= this.shovel[u].walldam;
                        });
                    }, 2500 / 3);
                }
            }
            if (/Wall|Campfire|Floor|Door|Crafting Table|Chest/.test(this.mainHands)) {
                let mvect;
                if (this.move.mdis > 141.42 + this.rad) {
                    mvect = Vector.create();
                    mvect.x = Math.cos((this.move.ang * Math.PI) / 180) * 141.42;
                    mvect.y = Math.sin((this.move.ang * Math.PI) / 180) * 141.42;
                    Vector.add(mvect, this.body.position, mvect);
                } else {
                    mvect = Vector.create();
                    mvect.x = Math.cos((this.move.ang * Math.PI) / 180) * this.move.mdis;
                    mvect.y = Math.sin((this.move.ang * Math.PI) / 180) * this.move.mdis;
                    Vector.add(mvect, this.body.position, mvect);
                }
                mvect.y = Math.floor(mvect.y / 100) * 100 + 50;
                mvect.x = Math.floor(mvect.x / 100) * 100 + 50;

                this.posPlace = mvect;
                this.needsSelfUpdate = true;
                if (/Wall|Floor|Door|Crafting Table/.test(this.mainHands)) {
                    let testBody = new Bodies.rectangle(mvect.x, mvect.y, 100, 100, {
                        isStatic: true,
                    });
                    let material = this.mainHands.split(' ')[0].toLowerCase();
                    let type = this.mainHands.split(' ')[1];
                    if (
                        /Wall|Floor|Door|Crafting Table/.test(this.mainHands) &&
                        Entities.some(
                            (e) =>
                                (SAT.collides(testBody, e.body).collided &&
                                    !(type == 'Floor'
                                        ? this.structures.find(
                                              (s) => e == s && type == 'Floor' && !(e instanceof Floor),
                                          ) ||
                                          (this.clan &&
                                              this.clan.members.find((member) =>
                                                  member.structures.find(
                                                      (s) => e == s && type == 'Floor' && !(e instanceof Floor),
                                                  ),
                                              ))
                                        : this.structures.some((s) => e == s && e instanceof Floor) ||
                                          (this.clan &&
                                              this.clan.members.some((member) =>
                                                  member.structures.some((s) => e == s && s instanceof Floor),
                                              )))) ||
                                mvect.x < 50 ||
                                mvect.y < 50 ||
                                mvect.x > map.forest.width ||
                                mvect.y > map.forest.height,
                        )
                    )
                        this.canPlace = false;

                    if (this.canPlace && this.move.att && !this.alusd) {
                        console.log(type);
                        let slot = this.inventory.get(this.mainHand);
                        slot.count -= 1;
                        if (slot.count == 0) {
                            this.inventory.set(this.mainHand, 'empty');
                            this.mainHand = '-1';
                        }
                        this.needsSelfUpdate = true;
                        if (/Wall|Floor|Door/.test(this.mainHands)) {
                            eval(
                                `this.structures.push(new ${type}(mvect.x, mvect.y, '${material}',${
                                    type == 'Door' ? 'this.pang, ' : ''
                                } this.game))`,
                            );
                        } else {
                            this.structures.push(new CraftingTable(game, mvect.x, mvect.y, this.game));
                        }
                        this.alusd = true;
                    }
                } else if (/Chest/.test(this.mainHands)) {
                    let testBody;
                    if (this.pang == 'left' || this.pang == 'right') {
                        testBody = Bodies.rectangle(mvect.x, mvect.y, 50, 95, {
                            isStatic: true,
                        });
                    } else {
                        testBody = Bodies.rectangle(mvect.x, mvect.y, 95, 50, {
                            isStatic: true,
                        });
                    }
                    new Bodies.rectangle(mvect.x, mvect.y, 100, 100, { isStatic: true });
                    if (
                        Entities.some(
                            (e) =>
                                (SAT.collides(testBody, e.body).collided &&
                                    !(
                                        this.structures.some((s) => e == s && e instanceof Floor) ||
                                        (this.clan &&
                                            this.clan.members.some((member) =>
                                                member.structures.some((s) => e == s && s instanceof Floor),
                                            ))
                                    )) ||
                                mvect.x < 50 ||
                                mvect.y < 50 ||
                                mvect.x > map.forest.width ||
                                mvect.y > map.forest.height,
                        )
                    )
                        this.canPlace = false;
                    if (this.canPlace && this.move.att && !this.alusd) {
                        let slot = this.inventory.get(this.mainHand);
                        slot.count -= 1;
                        if (slot.count == 0) {
                            this.inventory.set(this.mainHand, 'empty');
                            this.mainHand = '-1';
                        }
                        this.needsSelfUpdate = true;
                        this.structures.push(new Chest(mvect.x, mvect.y, this.pang, this.game));
                        this.alusd = true;
                    }
                } else if (/Campfire/.test(this.mainHands)) {
                    let testBody = Bodies.circle(mvect.x, mvect.y, 175 / 12, {
                        isStatic: true,
                    });
                    if (
                        Entities.some(
                            (e) =>
                                (SAT.collides(testBody, e.body).collided &&
                                    !(
                                        this.structures.some((s) => e == s && e instanceof Floor) ||
                                        (this.clan &&
                                            this.clan.members.some((member) =>
                                                member.structures.some((s) => e == s && s instanceof Floor),
                                            ))
                                    )) ||
                                mvect.x < 50 ||
                                mvect.y < 50 ||
                                mvect.x > map.forest.width ||
                                mvect.y > map.forest.height,
                        )
                    )
                        this.canPlace = false;
                    if (this.canPlace && this.move.att && !this.alusd) {
                        let slot = this.inventory.get(this.mainHand);
                        slot.count -= 1;
                        if (slot.count == 0) {
                            this.inventory.set(this.mainHand, 'empty');
                            this.mainHand = '-1';
                        }
                        this.needsSelfUpdate = true;
                        this.structures.push(new Campfire(mvect.x, mvect.y, this.game));
                        this.alusd = true;
                    }
                }
            }
            if (this.mainHands == 'carrot' && this.carrot.ready && this.move.att) {
                //this.food += this.carrot.food
                this.edi = 'carrot';
                this.carrot.ready = false;
                this.eating = true;
                this.carrot.timeout = new Timeout(() => {
                    this.eating = false;
                    this.carrot.timeout = null;
                    this.carrot.ready = true;
                    this.edi = null;
                    let slot = this.inventory.get(this.mainHand);
                    console.log(slot);
                    slot.count -= 1;
                    if (slot.count == 0) {
                        this.inventory.set(this.mainHand, 'empty');
                        this.mainHand = '-1';
                    }
                    this.needsSelfUpdate = true;
                }, 5000 / 3);
                let eatInterval = setInterval(() => {
                    this.food += this.carrot.food / 50;
                }, 1000 / 60);
                setTimeout(() => {
                    clearInterval(eatInterval);
                }, (50 * 1000) / 60);
            }
        }
        if (this.move.att) {
            if (this.inventory.get(this.mainHand) == undefined) {
                this.hit();
            }
        }
        if (this.stamina > this.maxStamina) this.stamina = this.maxStamina;
        if (this.health > this.maxHealth) this.health = this.maxHealth;
        if (this.food > this.maxFood) this.food = this.maxFood;
    }
    hit() {
        if (this.hands.ready) {
            this.hands.ready = false;
            let targs = [];
            let rtargs = [];
            let walltargs = [];
            this.hands.timeout = new Timeout(() => {
                this.hands.timeout = null;
                this.hands.ready = true;
                this.lhit = false;
                this.rhit = false;
            }, this.hands.speed);
            let handBody = Bodies.circle(this.hposfr.x, this.hposfr.y, this.hrad, {
                isStatic: true,
            });
            const { Entities, dropped } = this.game;
            Entities.forEach((e) => {
                if (!SAT.collides(e.body, handBody).collided) return;
                if (
                    e instanceof STree ||
                    e instanceof Stone ||
                    e instanceof Iron ||
                    e instanceof Gold ||
                    e instanceof Diamond ||
                    e instanceof Emerald ||
                    e instanceof Amethyst ||
                    e instanceof CarrotFarm
                ) {
                    rtargs.push(e);
                }
                if (
                    e instanceof Wall ||
                    e instanceof Door ||
                    e instanceof Floor ||
                    e instanceof CraftingTable ||
                    e instanceof CarrotFarm
                ) {
                    walltargs.push(e);
                }
            });

            if (this.hands.next == 'l' && this.lhit == false && this.rhit == false) {
                this.lhit = true;
                this.hands.next = 'r';
            } else if (this.hands.next == 'r' && this.lhit == true) {
                this.lhit = false;
            } else if (this.hands.next == 'r' && this.rhit == false) {
                this.rhit = true;
                this.hands.next = 'l';
            } else if (this.hands.next == 'l' && this.rhit == true) {
                this.rhit = false;
            }

            new Timeout(() => {
                rtargs.forEach((r) => {
                    let rem;
                    if (r instanceof STree) {
                        rem = this.inventory.addItemMax(new Slot('wood', 1, 'draw', 255, false));
                        this.score++;
                        this.needsSelfUpdate = true;
                    }
                    if (r instanceof Stone) {
                        rem = this.inventory.addItemMax(new Slot('stone', 1, 'stone', 255, false));
                        this.score += 2;
                        this.needsSelfUpdate = true;
                    }
                    if (r instanceof CarrotFarm) {
                        rem = this.inventory.addItemMax(new Slot('carrot', 1, 'carrot', 255, false, true));
                        this.score += 3;
                        this.needsSelfUpdate = true;
                    }
                    if (rem) {
                        let ang = Math.getRandomNum(0, 360);
                        let offset = Vector.create(0, 50 + 20);
                        offset.x = Math.cos((ang * Math.PI) / 180) * Vector.magnitude(offset);
                        offset.y = Math.sin((ang * Math.PI) / 180) * Vector.magnitude(offset);
                        Vector.add(r.body.position, offset, offset);
                        let self = {
                            item: rem,
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
                    }
                    r.health -= 3;
                });
                targs.forEach((t) => {
                    t.takeDamage({
                        damage: this.hands.damage,
                        type: 'melee',
                        length: 1500 / 6,
                    });
                    if (t.health < 0) {
                        if (t instanceof Player) this.score += t.score / 2 + 10;
                    }
                });
                walltargs.forEach((w) => {
                    w.health -= 5;
                });
            }, this.hands.speed);
        }
    }
    changeArmor(armor) {
        this.armor = armor;
        this.armorParts = this.armor.id.toLowerCase().split(' ');
        if (this.armorParts[1] == 'armor') this._maxSpd *= 0.7;
    }
    getUpdatePack() {
        var pack = {
            usr: this.usr,
            x: this.body.position.x,
            y: this.body.position.y,
            health: this.health,
            food: this.food,
            mainHand: this.mainHands,
            id: this.id,
            maxHp: this.maxHealth,
            maxFood: this.maxFood,
            angle: this.move.ang,
            lhit: this.lhit,
            rhit: this.rhit,
            hitting: this.hitting,
            msg: Array.from(this.msg).map(([key, value]) => {
                return {
                    msg: value.msg,
                    per: value.timeout.percntDone,
                };
            }),
        };
        if (this.hands.timeout)
            pack.punchper =
                Math.roundToDeci(this.hands.timeout.percntDone, 1000) > 0.95
                    ? 1
                    : Math.roundToDeci(this.hands.timeout.percntDone, 1000);
        if (this.hitting && this.mainHands != 'hand')
            pack.per =
                Math.roundToDeci(this[this.tool].timeout.percntDone, 1000) > 0.97
                    ? 1
                    : Math.roundToDeci(this[this.tool].timeout.percntDone, 1000);
        if (this.eating && this.mainHands != 'hand')
            pack.per =
                Math.roundToDeci(this[this.edi].timeout.percntDone, 1000) > 0.97
                    ? 1
                    : Math.roundToDeci(this[this.edi].timeout.percntDone, 1000);
        if (this.clan) {
            pack.clan = this.clan.name;
            pack.owner = this.clan.owner == this;
        }
        if (this.armor) {
            pack.armor = this.armor.image;
        }
        return pack;
    }
    getSelfUpdatePack() {
        let pack = {
            inventory: this.inventory.listItems(),
            stamina: this.stamina,
            maxStamina: this.maxStamina,
            craftables: this.crafter.checkCraft(this.inventory),
            crafting: this.crafting,
            posPlace: this.posPlace,
            canPlace: this.canPlace,
            craftablesEx: this.craftablesEx,
            chestables: this.chestables,
            clanning: this.clanning,
            chesting: this.chesting,
            clans: this.clans,
            admin: this.admin,
        };
        if (this.clan) {
            pack.clanMembers = this.clan.members.map((player) => ({
                usr: player.usr,
                id: player.id,
            }));
            if (this.clan.owner == this && this.clan.joinReqs[0])
                pack.req = {
                    id: this.clan.joinReqs[0].member.id,
                    usr: this.clan.joinReqs[0].member.usr,
                };
        }
        return pack;
    }
    setHands() {
        this.hrad = (this.rad / 25) * 7.5;
        this.hposfl = Vector.create(0, (-35.34119409414458 * this.rad) / 25);
        this.hposfl.x = Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfl);
        this.hposfl.y = Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfl);
        Vector.add(this.body.position, this.hposfl, this.hposfl);

        this.hposfr = Vector.create(0, (-35.34119409414458 * this.rad) / 25);
        this.hposfr.x = Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfr);
        this.hposfr.y = Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfr);
        Vector.add(this.body.position, this.hposfr, this.hposfr);
    }
    takeDamage(damObj) {
        damObj.timer = new Timeout(() => {
            this.damages.splice(
                this.damages.findIndex((d) => d == damObj),
                1,
            );
        }, damObj.length);
        this.damages.push(damObj);
    }
    handleDamage(dam) {
        let toTake;
        if (this.armor) {
            let removePer;
            if (this.armorParts[1] == 'armor') {
                if (this.armorParts[0] == 'iron') removePer = 0.85;
            } else if (this.armorParts[1] == 'garment') {
            }
            this.health -= (dam.damage / (dam.length / (1000 / 60))) * removePer;
        } else {
            this.health -= dam.damage / (dam.length / (1000 / 60));
        }
    }
}
module.exports = Player;
