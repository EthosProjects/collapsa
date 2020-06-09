Math = require('./math.js');
const Matter = require('matter-js');
const Timeout = require('./timeout.js');
const images = require('./images.json');
const { Engine, Render, World, Bodies, Body, Vector } = require('matter-js');
const EventEmitter = require('events');
const PF = require('pathfinding');
const socketIO = require('socket.io');
const Day = require('./library/day.js');
const Mapper = require('./library/mapper.js');
Vector.getDistance = function (vectorA, vectorB) {
	return Math.sqrt(
		Math.pow(vectorA.x - vectorB.x, 2) + Math.pow(vectorA.y - vectorB.y, 2)
	);
};
const { astar, Graph } = require('./astar.js');
const { BasicRecipes, TableRecipes, Resources } = require('./items.js');
// create an engine
const sleep = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};
function RectCircleColliding(cx, cy, cr, rx, ry, rw, rh) {
	var distX = Math.abs(cx - rx);
	var distY = Math.abs(cy - ry);
	if(distX > rw / 2 + cr) {
		return false;
	}
	if(distY > rh / 2 + cr) {
		return false;
	}
	if(distX <= rw / 2) {
		return true;
	}
	if(distY <= rh / 2) {
		return true;
	}

	var dx = cx - rw / 2;
	var dy = cy - rh / 2;
	return dx * dx + dy * dy <= cr * cr;
}
global.games = [];
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
		if(!member) return;
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
		if(!member) return;
		if(this.owner == member) {
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
		if(!req || this.members.length >= 9) return;
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
		if(!req) return;
		this.joinReqs = this.joinReqs.filter(
			(request) => request.member.id != req.member.id
		);
	}
}
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
		this.list.forEach((player) => {
			pack.push({
				name: player.usr,
				id: player.id,
				score: player.score,
			});
		});
		return pack;
	}
}
class Slot {
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
class Crafter extends Mapper {
	constructor() {
		super(BasicRecipes);
	}
	checkCraft(inventory) {
		let craftables = [];
		for (const [key, val] of this) {
			let craftable = true;
			val.recipe.forEach((supply) => {
				if(
					!inventory.find(
						(slot) => slot.count >= supply.count && slot.id == supply.id
					)
				)
					return (craftable = false);
			});
			if(craftable) craftables.push(key);
		}
		return craftables;
	}
	craftItem(item, inventory) {
		if(!this.checkCraft(inventory).find((craftable) => craftable == item))
			return console.log('Not found');
		var recipe = this.get(item).recipe;
		let output = this.get(item).output;
		recipe.forEach((req) => {
			let r = JSON.parse(JSON.stringify(req));
			inventory.forEach((slot, num) => {
				if(slot == 'empty') return;
				if(r.count == 0) return;
				if(slot.id != req.id) return;
				if(r.count < slot.count) {
					slot.count -= r.count;
					r.count = 0;
				} else if(r.count > slot.count) {
					r.count -= slot.count;
					slot.count = 0;
				} else {
					r.count = 0;
					slot.count = 0;
				}
				if(slot.count == 0) inventory.set(num, 'empty');
			});
		});
		inventory.addItemMax(
			new Slot(
				item,
				output.count,
				output.image,
				output.stackSize,
				output.equipable
			)
		);
		//if(inventory.findKey(slot => slot == 'empty')) inventory.set(inventory.findKey(slot => slot == 'empty'), {id: 'Axe', count:1, image:'draw'})\
	}
}

class CraftingTable extends Mapper {
	constructor(game, x, y) {
		super(TableRecipes);
		this.game = game;
		this.x = x;
		this.y = y;this.rad = 50;
		this.id = Math.random();
		this.health = 100;
		this.body = Bodies.rectangle(this.x, this.y, 100, 100, { isStatic: true });
		World.addBody(this.game.engine.world, this.body);
		this.needsUpdate = false;
		var pack = {
			x: this.x,
			y: this.y,
			id: this.id,
		};
		game.CraftingTables.list.push(this);
		game.Entities.push(this);
		game.initPack.ctable.push(pack);
		console.log(game.initPack, 'aaaa');
	}
	checkCraft(inventory) {
		let craftables = [];
		for (const [key, val] of this) {
			let craftable = true;
			val.recipe.forEach((supply) => {
				if(
					!inventory.find(
						(slot) => slot.count >= supply.count && slot.id == supply.id
					)
				)
					return (craftable = false);
			});
			if(craftable) craftables.push({ craft: key, craftable: true });
			else craftables.push({ craft: key, craftable: false });
		}

		return craftables;
	}
	craftItem(item, inventory) {
		if(!this.checkCraft(inventory).find((craftable) => craftable.craft == item))
			return console.log('Not found');
		var recipe = this.get(item).recipe;
		let output = this.get(item).output;
		recipe.forEach((req) => {
			let r = JSON.parse(JSON.stringify(req));
			inventory.forEach((slot, num) => {
				if(slot == 'empty') return;
				if(r.count == 0) return;
				if(slot.id != req.id) return;
				if(r.count < slot.count) {
					slot.count -= r.count;
					r.count = 0;
				} else if(r.count > slot.count) {
					r.count -= slot.count;
					slot.count = 0;
				} else {
					r.count = 0;
					slot.count = 0;
				}
				console.log(item, output);
				if(slot.count == 0) inventory.set(num, 'empty');
			});
		});
		inventory.addItem(
			new Slot(
				item,
				output.count,
				output.image,
				output.stackSize,
				output.equipable,
				output.edible,
				output.armorable,
				output.hatable
			)
		);
		//if(inventory.findKey(slot => slot == 'empty')) inventory.set(inventory.findKey(slot => slot == 'empty'), {id: 'Axe', count:1, image:'draw'})\
	}
	getInitPack() {
		return {
			x: this.x,
			y: this.y,
			id: this.id,
		};
	}
}
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
		this.Clans = new Mapper();
		this.Entities = new Mapper();
		this.map = {
			forest: {
				width: 2000,
				height: 1000,
			},
			total: {
				width: 2000,
				height: 1500,
			},
		};
		this.walls = {
			top: Bodies.rectangle(
				this.map.total.width / 2,
				-500,
				this.map.total.width,
				1000,
				{ isStatic: true }
			),
			bottom: Bodies.rectangle(
				this.map.total.width / 2,
				this.map.total.height + 500,
				this.map.total.width,
				1000,
				{ isStatic: true }
			),
			left: Bodies.rectangle(
				-500,
				this.map.total.height / 2,
				1000,
				this.map.total.height,
				{ isStatic: true }
			),
			right: Bodies.rectangle(
				this.map.total.width + 500,
				this.map.total.height / 2,
				1000,
				this.map.total.height,
				{ isStatic: true }
			),
		};
		World.add(this.engine.world, [
			this.walls.top,
			this.walls.bottom,
			this.walls.left,
			this.walls.right,
		]);
		this.nsp = nsp;
		this.ns = ns;
	}
}
//console.log(new Day())
//console.log(new Game())
module.exports = function (nsp, ns, mLab) {
	this.engine = Engine.create();
	let engine = this.engine;
	let sunlight = 1;
	let sunpertree = 1;
	engine.world.gravity.y = 0;
	let timeOfDay = 'night';
	let dayTimeout;
	let setDayTimeout = () => {
		dayTimeout = new Timeout(() => {
			if(timeOfDay == 'day') timeOfDay = 'night';
			else if(timeOfDay == 'night') timeOfDay = 'day';
			setDayTimeout();
		}, 40000);
	};
	dayTimeout = new Timeout(() => {
		if(timeOfDay == 'day') timeOfDay = 'night';
		else if(timeOfDay == 'night') timeOfDay = 'day';
		setDayTimeout();
	}, 40000);
	this.map = {
		forest: {
			width: 2000,
			height: 1000,
		},
		total: {
			width: 2000,
			height: 1500,
		},
	};
	let clans = new Map();
	let Entities = (this.Entities = []);

	class Clan {
		constructor(name, owner) {
			this.owner = owner;
			this.name = name;
			this.leaderboard = new Leaderboard([owner]);
			this.members = [owner];
			this.joinReqs = [];
			clans.set(this.name, this);
		}
		addMember(member) {
			if(!member) return;
			this.leaderboard.addPlayer(member);
			this.members.push(member);
			this.members.forEach((mem) => (mem.needsUpdate = true));
			member.clan = this;
		}
		removeMember(member) {
			if(!member) return;
			if(this.owner == member) {
				clans.delete(this.name);
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
		acceptReq() {
			let req = this.joinReqs[0];
			if(!req || this.members.length >= 9) return;
			this.addMember(req.member);
			this.joinReqs = this.joinReqs.filter(
				(request) => request.member.id != req.member.id
			);
		}
		denyReq() {
			let req = this.joinReqs[0];
			if(!req) return;
			this.joinReqs = this.joinReqs.filter(
				(request) => request.member.id != req.member.id
			);
		}
	}
	let walls = {
		top: Bodies.rectangle(
			this.map.total.width / 2,
			-500,
			this.map.total.width,
			1000,
			{ isStatic: true }
		),
		bottom: Bodies.rectangle(
			this.map.total.width / 2,
			this.map.total.height + 500,
			this.map.total.width,
			1000,
			{ isStatic: true }
		),
		left: Bodies.rectangle(
			-500,
			this.map.total.height / 2,
			1000,
			this.map.total.height,
			{ isStatic: true }
		),
		right: Bodies.rectangle(
			this.map.total.width + 500,
			this.map.total.height / 2,
			1000,
			this.map.total.height,
			{ isStatic: true }
		),
	};
	World.add(engine.world, [walls.top, walls.bottom, walls.left, walls.right]);
	this.nsp = nsp;
	this.ns = ns;
	let game = this;

	class mover {
		constructor(id, x, y) {
			this.position = Vector.create(x, y);
			this.id = id;
			this.velocity = Vector.create(0, 0);
			this.acceleration = Vector.create(0, 0);
		}
		updatePosition() {
			Vector.add(this.position, this.velocity, this.position);
		}
	}

	class Storage extends Mapper {
		constructor(base, length) {
			if(!base) {
				base = [];
				for (let i = 1; i < length + 1; i++) {
					base.push([i.toString(), 'empty']);
				}
				super(base);
			} else {
				super(base);
			}
		}
		listItems() {
			let itemArray = [];
			this.forEach((item) => {
				if(item == 'empty') return itemArray.push(' ');
				else
					return itemArray.push({
						type: item.id,
						image: item.image,
						count: item.count,
					});
			});
			return itemArray;
		}
		addItem(toAdd) {
			let found = false;
			let posSlots = this.findAll((item) => item.id == toAdd.id);
			posSlots.forEach((item) => {
				if(found) return;
				if(item.id == toAdd.id) {
					if(item.count >= item.stackSize) {
						found = false;
					} else {
						if(
							item.count + toAdd.count > item.stackSize &&
							this.find((item) => {
								if(item == 'empty') return true;
								if(item.id == toAdd.id && item.count != item.stackSize) return true;
								return false;
							})
						) {
							toAdd.count -= item.stackSize - item.count;
							item.count = item.stackSize;
							found = true;
							this.addItem(toAdd);
							return;
						} else if(item.count + toAdd.count > item.stackSize) {
							item.count = item.stackSize;
							found = true;
							return;
						}
						item.count += toAdd.count;
						found = true;
					}
				}
			});
			if(found) return;
			if(this.find((item) => item == 'empty'))
				return this.set(
					this.findKey((item) => item == 'empty'),
					toAdd
				);
		}
		addItemMax(toAdd) {
			let found = false;
			let posSlots = this.findAll((item) => item.id == toAdd.id);
			let ret = true;
			if(!ret) return;
			while (
				this.find((item) => {
					if(item == 'empty') return true;
					if(item.id == toAdd.id && item.count !== item.stackSize) return true;
					return false;
				}) &&
				toAdd.count &&
				ret
			) {
				let i = this.find((item) => {
					if(item == 'empty') return true;
					if(item.id == toAdd.id && item.count !== item.stackSize) return true;
					return false;
				});
				if(i == 'empty') {
					ret = false;
					this.set(
						this.findKey((item) => item == 'empty'),
						toAdd
					);
					return;
				}
				if(toAdd.count + i.count > i.stackSize) {
					toAdd.count -= i.stackSize - i.count;
					i.count = i.stackSize;
				} else {
					i.count += toAdd.count;
					ret = false;
				}
			}
			if(ret) return toAdd;
		}
	}
	class Inventory extends Storage {
		constructor() {
			super([
				/*
                ['1', new Slot('Wood Wall', 255, 'woodwall', 255, true)],
                ['2', new Slot('Stone Wall', 255, 'stonewall', 255, true)],
                ['3', new Slot('Iron Wall', 255, 'ironwall', 255, true)],
                ['4', new Slot('Wood Door', 255, 'wooddoor', 255, true)],
                ['5', new Slot('Wood Floor', 255, 'woodfloor', 255, true)],
                ['6', new Slot('Chest', 255, 'chest', 255, true)],
                ['7', new Slot('Leather', 255, 'leather', 255)],
                ['8', 'empty'],
                ['9', 'empty'],*/

				['1', 'empty'],
				['2', 'empty'],
				['3', 'empty'],
				['4', 'empty'],
				['5', 'empty'],
				['6', 'empty'],
				['7', 'empty'],
				['8', 'empty'],
				['9', 'empty'],
			]);
		}
		listItems() {
			let itemArray = [];
			this.forEach((item) => {
				if(item == 'empty') return itemArray.push(' ');
				else
					return itemArray.push({
						type: item.id,
						image: item.image,
						count: item.count,
					});
			});
			return itemArray;
		}
		addItem(toAdd) {
			let found = false;
			let posSlots = this.findAll((item) => item.id == toAdd.id);
			posSlots.forEach((item) => {
				if(found) return;
				if(item.id == toAdd.id) {
					if(item.count >= item.stackSize) {
						found = false;
					} else {
						if(
							item.count + toAdd.count > item.stackSize &&
							this.find((item) => {
								if(item == 'empty') return true;
								if(item.id == toAdd.id && item.count != item.stackSize) return true;
								return false;
							})
						) {
							toAdd.count -= item.stackSize - item.count;
							item.count = item.stackSize;
							found = true;
							this.addItem(toAdd);
							return;
						} else if(item.count + toAdd.count > item.stackSize) {
							item.count = item.stackSize;
							found = true;
							return;
						}
						item.count += toAdd.count;
						found = true;
					}
				}
			});
			if(found) return;
			if(this.find((item) => item == 'empty'))
				return this.set(
					this.findKey((item) => item == 'empty'),
					toAdd
				);
		}
		addItemMax(toAdd) {
			let found = false;
			let posSlots = this.findAll((item) => item.id == toAdd.id);
			let ret = true;
			if(!ret) return;
			while (
				this.find((item) => {
					if(item == 'empty') return true;
					if(item.id == toAdd.id && item.count !== item.stackSize) return true;
					return false;
				}) &&
				toAdd.count &&
				ret
			) {
				let i = this.find((item) => {
					if(item == 'empty') return true;
					if(item.id == toAdd.id && item.count !== item.stackSize) return true;
					return false;
				});
				if(i == 'empty') {
					ret = false;
					this.set(
						this.findKey((item) => item == 'empty'),
						toAdd
					);
					return;
				}
				if(toAdd.count + i.count > i.stackSize) {
					toAdd.count -= i.stackSize - i.count;
					i.count = i.stackSize;
				} else {
					i.count += toAdd.count;
					ret = false;
				}
			}
			if(ret) return toAdd;
		}
	}
	class Armor {}
	class Damage {}
	class Player extends EventEmitter {
		/**
		 * @param {String} id
		 * @param {String} usr
		 */
		constructor(id, usr, socket, game, token) {
			super();
			this.game = game;
			this.id = id;
			this.socket = socket;
			this.rad = 30;
			this.crafting = false;
			this.clanning = false;
			this.clan = null;
			this.clans = null;
			this.msg = new Map();
			this.adminLevel = 0;
			let tempx = Math.getRandomInt(0, game.map.forest.width / 100 - 1) * 100 + 50;
			let tempy =
				Math.getRandomInt(0, game.map.forest.height / 100 - 1) * 100 + 50;
			let inWay = false;
			Entities.forEach((e) => {
				if(
					(e.body.position.x == tempx && e.body.position.y == tempy) ||
					(e instanceof Player &&
						Vector.getDistance({ x: tempx, y: tempy }, e.body.position) <= 150)
				)
					inWay = true;
			});
			while (inWay) {
				tempx = Math.getRandomInt(0, game.map.forest.width / 100 - 1) * 100 + 50;
				tempy = Math.getRandomInt(0, game.map.forest.height / 100 - 1) * 100 + 50;
				inWay = false;
				Entities.forEach((e) => {
					if(
						(e.body.position.x == tempx && e.body.position.y == tempy) ||
						(e instanceof Player &&
							Vector.getDistance({ x: tempx, y: tempy }, e.body.position) <= 150)
					)
						inWay = true;
				});
			}
			this.token = token;
			this.body = Bodies.circle(tempx, tempy, this.rad, {
				frictionAir: 0.02,
				restitution: 0.15,
			});
			Entities.push(this);
			World.addBody(this.game.engine.world, this.body);
			//new Guns.types['pistol'](getRandomNum(25, 2090), getRandomNum(25,1463))
			this.inventory = new Inventory();
			this.crafter = new Crafter();
			this.mainHand = '-1';
			this.admin = false;
			this.bullets = [];
			this.score = 0;
			this.alusd = false;
			this.walls = [];
			this.doors = [];
			this.floors = [];
			this.ctables = [];
			this.structures = [];
			this.pang = 'left';
			this.armor = null;

			this.punch = {
				speed: 3,
				ready: true,
				reload: {
					speed: 20,
					timer: 0,
				},
				damage: 1 / 2,
				health: 1,
			};
			this.axe = {
				ready: true,
				timeout: null,
				stone: {
					damage: 3.75,
					walldam: 3,
					mines: [{ item: 'wood', count: 3 }],
				},
				iron: {
					damage: 4.5,
					walldam: 9,
					mines: [{ item: 'wood', count: 5 }],
				},
				gold: {
					damage: 6,
					walldam: 19,
					mines: [{ item: 'wood', count: 8 }],
				},
				diamond: {
					damage: 7,
					walldam: 25,
					mines: [{ item: 'wood', count: 12 }],
				},
				emerald: {
					damage: 6.5,
					walldam: 20,
					mines: [{ item: 'wood', count: 10 }],
				},
				amethyst: {
					damage: 6.5,
					walldam: 20,
					mines: [{ item: 'wood', count: 10 }],
				},
			};
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
					damage: 7.5,
					walldam: 45,
				},
				amethyst: {
					damage: 7.5,
					walldam: 45,
				},
			};
			this.hands = {
				l: {
					hit: false,
				},
				r: {
					hit: false,
				},
				damage: 1,
			};
			this.ram = 1;
			this.usr = usr;
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
			};
			this.hrad = (this.rad / 25) * 7.5;
			this.hposfl = Vector.create(0, (-35.34119409414458 * this.rad) / 25);
			this.hposfl.x =
				Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfl);
			this.hposfl.y =
				Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfl);
			Vector.add(this.body.position, this.hposfl, this.hposfl);

			this.hposfr = Vector.create(0, (-35.34119409414458 * this.rad) / 25);
			this.hposfr.x =
				Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfr);
			this.hposfr.y =
				Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfr);
			Vector.add(this.body.position, this.hposfr, this.hposfr);
			this.next = 'l';
			this.lhit = false;
			this.rhit = false;
			this._maxSpd = 2;
			this.health = 20;
			this.maxHealth = 20;
			this.stamina = 20;
			this.maxStamina = 20;
			this.food = 20;
			this.maxFood = 20;
			var self = this;
			this.bulletSpeed = 1;
			this.damages = [];
			this.kills = 0;
			this.needsUpdate = false;
			this.needsSelfUpdate = false;
			this.mainHands = 'hand';
			this.afkTimer = setTimeout(function () {
				self.dead = true;
				setInterval(function () {
					self.health -= self.maxHealth / 100;
				}, 100);
			}, 10000);
			this.dead = false;
			game.initPack.player.push({
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
			this.game.Players.list.push(this);
			this.on('unable', function (msg) {
				game.nsp.to(this.id).emit('unable', msg);
			});
			this.on('death', function () {
				game.nsp.to(this.id).emit('death');
			});
			this.immortal = false;
		}
		updateSpd() {
			var m = this.move;
			this.acc = Vector.create(0, 0);
			if(m.r) this.acc.x += this._maxSpd / 3500;
			if(m.l) this.acc.x -= this._maxSpd / 3500;
			if(m.d) this.acc.y += this._maxSpd / 3500;
			if(m.u) this.acc.y -= this._maxSpd / 3500;
			Body.applyForce(this.body, this.body.position, this.acc);
		}
		update() {
			if(
				this.move.run &&
				this.stamina > 0.5 &&
				Vector.magnitude(this.acc) > 0 &&
				this.food > (this.maxFood * 30) / 100
			) {
				this._maxSpd = 3;
				this.stamina -= this.maxStamina / 5 / 60;
				this.needsSelfUpdate = true;
			} else if(
				this.stamina < this.maxStamina &&
				this.food > (this.maxFood * 30) / 100
			) {
				this._maxSpd = 2;
				if(Vector.magnitude(this.acc) <= 0)
					this.stamina += this.maxStamina / 25 / 60;
				else this.stamina += this.maxStamina / 100 / 60;
				this.needsSelfUpdate = true;
			}
			if(this.food > 0 && this.stamina > 0)
				this.health += this.maxHealth / 50 / 60;
			else this.health -= this.maxHealth / 50 / 60;
			if(this.food > 0) this.food -= this.maxFood / 300 / 60;
			else this.food = 0;
			if(this.crafter.checkCraft(this.inventory)) this.needsUpdate = true;
			if(this.crafting) {
				if(this.craftingctable.health <= 0) this.crafting = false;
				this.craftablesEx = this.craftingctable.checkCraft(this.inventory);
				this.needsSelfUpdate = true;
				//if()
			}
			this.damages.forEach((d) => this.handleDamage(d));
			if(this.chesting) {
				if(this.chest.health <= 0) this.crafting = false;
				this.chestables = this.chest.storage.listItems();
				this.needsSelfUpdate = true;
				//if()
			}
			if(this.clan && this.clan.owner == this && this.clan.joinReqs[0])
				this.needsSelfUpdate = true;
			if(this.crafting && this.craftingctable.health <= 0) this.crafting = false;
			if(this.clanning) {
				this.crafting = false;
				this.needsSelfUpdate = true;
				this.clans = Array.from(clans, ([clanName, clan]) => clanName);
				//if()
			}
			this.updateSpd();
			if(Vector.magnitude(this.body.velocity) > this._maxSpd)
				Vector.mult(
					Vector.normalise(this.body.velocity),
					{ x: this._maxSpd, y: this._maxSpd },
					this.body.velocity
				);
			this.targets = [];
			this.treetargs = [];
			this.stonetargs = [];
			this.setHands();
			if(this.move.grab) {
				if(
					(dropped.length ||
						this.structures.find((s) => s instanceof Door) ||
						globalDoors.length ||
						CraftingTables.list.length ||
						Chests.list.length ||
						(this.clan &&
							this.clan.members.find((member) =>
								member.structures.find((s) => s instanceof Door)
							))) &&
					!this.alusd
				) {
					let possible = new Mapper();
					dropped.forEach((item, i) => {
						if(Vector.getDistance(item, this.body.position) < 32 + this.rad)
							possible.set(i, item);
					});
					let dis;
					let nearest;
					if(possible.size) {
						possible.forEach((item, index) => {
							if(!nearest) {
								nearest = index;
								dis = Vector.getDistance(item, this.body.position);
								return;
							}
							if(Vector.getDistance(item, this.body.position) < dis) {
								dis = Vector.getDistance(item, this.body.position);
								nearest = index;
							}
						});
					}
					let posd = new Mapper();
					this.structures.forEach((s, i) => {
						if(
							s instanceof Door &&
							Vector.getDistance(s, this.body.position) < 70.7 + this.rad
						)
							posd.set(Math.random(), s);
					});
					if(this.clan) {
						this.clan.members.forEach((member) => {
							member.structures.forEach((s) => {
								if(
									s instanceof Door &&
									Vector.getDistance(s, this.body.position) < 70.7 + this.rad &&
									member != this
								)
									posd.set(Math.random(), s);
							});
						});
					}
					if(globalDoors.length) {
						globalDoors.forEach((d) => {
							if(
								d instanceof Door &&
								Vector.getDistance(d, this.body.position) < 70.7 + this.rad
							)
								posd.set(Math.random(), d);
						});
					}
					let disd;
					let nearestd;
					if(posd.size) {
						posd.forEach((door, index) => {
							if(!nearestd) {
								nearestd = index;
								disd = Vector.getDistance(door, this.body.position);
								return;
							}
							if(Vector.getDistance(door, this.body.position) < disd) {
								disd = Vector.getDistance(door, this.body.position);
								nearestd = index;
							}
						});
					}
					let posctable = new Mapper();
					CraftingTables.list.forEach((ctable, i) => {
						if(Vector.getDistance(ctable, this.hposfr) < 70.7 + this.hrad)
							posctable.set(i, ctable);
					});
					let disctable;
					let nearestctable;
					if(posctable.size) {
						posctable.forEach((ctable, index) => {
							if(!nearestctable) {
								nearestctable = index;
								disctable = Vector.getDistance(ctable, this.body.position);
								return;
							}
							if(Vector.getDistance(ctable, this.body.position) < disctable) {
								disctable = Vector.getDistance(ctable, this.body.position);
								nearestctable = index;
							}
						});
					}
					let poschest = new Mapper();
					Chests.list.forEach((ctable, i) => {
						if(Vector.getDistance(ctable, this.hposfr) < 70.7 + this.hrad)
							poschest.set(i, ctable);
					});
					let dischest;
					let nearestchest;
					if(poschest.size) {
						poschest.forEach((chest, index) => {
							if(!nearestchest) {
								nearestchest = index;
								dischest = Vector.getDistance(chest, this.body.position);
								return;
							}
							if(Vector.getDistance(chest, this.body.position) < dischest) {
								dischest = Vector.getDistance(chest, this.body.position);
								nearestchest = index;
							}
						});
					}
					if(!posd.size && !possible.size && !posctable.size && !poschest.size)
						return;
					//console.log(poschest)
					if(
						!this.crafting &&
						((dis == undefined &&
							disctable == undefined &&
							dischest == undefined &&
							disd != undefined) ||
							(disd > dis && disd > disctable && disd > dischest)) &&
						!posd.get(nearestd).opening
					) {
						let door = posd.get(nearestd);
						door.openFun();
						this.alusd = true;
					} else if(
						!this.crafting &&
						((disd == undefined &&
							disctable == undefined &&
							dischest == undefined &&
							dis != undefined) ||
							(dis > disctable && dis > disd && dis > dischest))
					) {
						let res = this.inventory.addItemMax(dropped[nearest].item);
						if(!res) {
							clearTimeout(dropped[nearest].timeout.timeout);
							dropped.splice(nearest, 1);
						}
						this.needsSelfUpdate = true;
						this.alusd = true;
					} else if(
						!this.crafting &&
						((disd == undefined &&
							disctable == undefined &&
							dis == undefined &&
							dischest != undefined) ||
							(dischest > dis && dischest > disd && dischest > disctable))
					) {
						this.chest = poschest.get(nearestchest);
						console.log('wtf');
						this.chesting = !this.chesting;
						this.needsSelfUpdate = true;
						this.alusd = true;
					} else if(
						(!disd && !dis && !dischest) ||
						(dis > disctable && dis > disctable) ||
						this.crafting
					) {
						this.craftingctable = posctable.get(nearestctable);
						this.crafting = !this.crafting;
						this.needsSelfUpdate = true;
						this.alusd = true;
					}
				}
			}
			if(this.punch.reload.timer > 0) {
				this.punch.reload.timer--;
			}
			if(this.inventory.get(this.mainHand) == undefined) {
				this.mainHands = 'hand';
			} else {
				this.mainHands = this.inventory.get(this.mainHand).id;
				let toolReg = /\w+\s(Axe|Pickaxe|Shovel|Sword|Hammer)/;
				if(toolReg.test(this.mainHands)) {
					if(/Axe/.test(this.mainHands) && this.axe.ready && this.move.att) {
						let u;
						this.tool = 'axe';
						if(/^Stone/.test(this.mainHands)) u = 'stone';
						else if(/^Iron/.test(this.mainHands)) u = 'iron';
						else if(/^Gold/.test(this.mainHands)) u = 'gold';
						else if(/^Diamond/.test(this.mainHands)) u = 'diamond';
						else if(/^Emerald/.test(this.mainHands)) u = 'emerald';
						else if(/^Amethyst/.test(this.mainHands)) u = 'amethyst';
						if(this.axe.timeout) clearTimeout(this.axe.timeout.timeout);
						let axerad = (this.rad / 25) * 15;
						let axep = Vector.create(0, 0);
						axep.x = (Math.cos((this.move.ang * Math.PI) / 180) * 70 * this.rad) / 25;
						axep.y = (Math.sin((this.move.ang * Math.PI) / 180) * 70 * this.rad) / 25;
						Vector.add(this.body.position, axep, axep);
						let treetargs = [];
						let targs = [];
						let rtargs = [];
						let walltargs = [];
						this.axe.ready = false;
						this.hitting = true;
						this.axe.timeout = new Timeout(() => {
							this.hitting = false;
							this.axe.timeout = null;
							this.axe.ready = true;
							this.tool = null;
						}, 5000 / 3);
						Entities.forEach((e) => {
							if(
								e instanceof Player ||
								e instanceof Demon ||
								e instanceof Destroyer ||
								e instanceof Rabbit
							) {
								if(Vector.getDistance(axep, e.body.position) < e.rad + axerad)
									targs.push(e);
							}
							if(
								e instanceof STree ||
								e instanceof Stone ||
								e instanceof Iron ||
								e instanceof Gold ||
								e instanceof Diamond ||
								e instanceof Emerald ||
								e instanceof Amethyst
							) {
								if(Vector.getDistance(axep, e.body.position) < 50 + axerad)
									rtargs.push(e);
							}
							if(
								e instanceof Wall ||
								e instanceof Door ||
								e instanceof Floor ||
								e instanceof CraftingTable ||
								e instanceof CarrotFarm
							) {
								if(
									e instanceof Chest &&
									RectCircleColliding(
										axep.x,
										axep.y,
										axerad,
										e.body.position.x,
										e.body.position.y,
										e.width,
										e.height
									)
								)
									walltargs.push(e);
								else if(
									!(e instanceof Chest) &&
									RectCircleColliding(
										axep.x,
										axep.y,
										axerad,
										e.body.position.x,
										e.body.position.y,
										100,
										100
									)
								)
									walltargs.push(e);
							}
						});
						new Timeout(() => {
							rtargs.forEach((r) => {
								let rem;
								if(r instanceof STree) {
									rem = this.inventory.addItemMax(
										new Slot('wood', this.axe[u].mines[0].count, 'draw', 255, false)
									);
									this.score += this.axe[u].mines[0].count * 1;
									this.needsSelfUpdate = true;
								}
								if(rem) {
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
												1
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
									length: 5000 / 6,
								});
								if(
									(t instanceof Demon || t instanceof Destroyer) &&
									!t.agro.find((p) => p == this)
								)
									t.agro.push(this);
								if(t.health - this.axe[u].damage < 0) {
									if(t instanceof Demon && timeOfDay == 'night') this.score += 300;
									if(t instanceof Demon && timeOfDay == 'day') this.score += 100;
									if(t instanceof Destroyer && timeOfDay == 'night') this.score += 600;
									if(t instanceof Destroyer && timeOfDay == 'day') this.score += 50;
									if(t instanceof Player) this.score += t.score / 2 + 10;
									if(t instanceof Rabbit) this.score += 25;
								}
							});
							walltargs.forEach((w) => {
								w.health -= this.axe[u].walldam;
							});
						}, 2500 / 3);
					}
					if(
						/Pickaxe/.test(this.mainHands) &&
						this.pickaxe.ready &&
						this.move.att
					) {
						let u;
						let un;
						this.tool = 'pickaxe';

						if(/^Stone/.test(this.mainHands)) {
							u = 'stone';
							un = 0;
						} else if(/^Iron/.test(this.mainHands)) {
							u = 'iron';
							un = 1;
						} else if(/^Gold/.test(this.mainHands)) {
							u = 'gold';
							un = 2;
						} else if(/^Diamond/.test(this.mainHands)) {
							u = 'diamond';
							un = 3;
						} else if(/^Emerald/.test(this.mainHands)) {
							u = 'emerald';
							un = 4;
						} else if(/^Amethyst/.test(this.mainHands)) {
							u = 'amethyst';
							un = 5;
						}
						if(this.pickaxe.timeout) clearTimeout(this.pickaxe.timeout.timeout);
						let paxerad = (this.rad / 25) * 30;
						let paxep = Vector.create(0, (70 * this.rad) / 25);
						paxep.x =
							Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(paxep);
						paxep.y =
							Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(paxep);
						Vector.add(this.body.position, paxep, paxep);
						let targs = [];
						let rtargs = [];
						let walltargs = [];
						this.pickaxe.ready = false;
						this.hitting = true;
						this.pickaxe.timeout = new Timeout(() => {
							this.hitting = false;
							this.pickaxe.timeout = null;
							this.pickaxe.ready = true;
							this.tool = null;
						}, 5000 / 3);
						Entities.forEach((e) => {
							if(
								e instanceof Player ||
								e instanceof Demon ||
								e instanceof Destroyer ||
								e instanceof Rabbit
							) {
								if(Vector.getDistance(paxep, e.body.position) < e.rad + paxerad)
									targs.push(e);
							}
							if(
								e instanceof STree ||
								e instanceof Stone ||
								e instanceof Iron ||
								e instanceof Gold ||
								e instanceof Diamond ||
								e instanceof Emerald ||
								e instanceof Amethyst
							) {
								if(Vector.getDistance(paxep, e.body.position) < 50 + paxerad)
									rtargs.push(e);
							}
							if(
								e instanceof Wall ||
								e instanceof Door ||
								e instanceof Floor ||
								e instanceof CraftingTable ||
								e instanceof CarrotFarm
							) {
								if(
									e instanceof Chest &&
									RectCircleColliding(
										paxep.x,
										paxep.y,
										paxerad,
										e.body.position.x,
										e.body.position.y,
										e.width,
										e.height
									)
								)
									walltargs.push(e);
								else if(
									!(e instanceof Chest) &&
									RectCircleColliding(
										paxep.x,
										paxep.y,
										paxerad,
										e.body.position.x,
										e.body.position.y,
										100,
										100
									)
								)
									walltargs.push(e);
							}
						});
						new Timeout(() => {
							rtargs.forEach((r) => {
								let rem;
								let restype = '';
								let resnum = null;
								if(r instanceof Stone) {
									restype = 'stone';
									resnum = 0;
								}
								if(r instanceof Iron) {
									restype = 'iron';
									resnum = 1;
								}
								if(r instanceof Gold) {
									restype = 'gold';
									resnum = 2;
								}
								if(r instanceof Diamond) {
									restype = 'diamond';
									resnum = 3;
								}
								if(r instanceof Emerald) {
									restype = 'emerald';
									resnum = 4;
								}
								if(r instanceof Amethyst) {
									restype = 'amethyst';
									resnum = 5;
								}
								if(
									r instanceof Stone ||
									r instanceof Iron ||
									r instanceof Gold ||
									r instanceof Diamond ||
									r instanceof Amethyst ||
									r instanceof Emerald
								) {
									if(
										un >= 3 ||
										(un > 0 && un < 3 && resnum <= 3) ||
										resnum == un ||
										un == 0 ||
										resnum == 1
									) {
										rem = this.inventory.addItemMax(
											new Slot(
												restype,
												this.pickaxe[u].mines[resnum].count,
												restype,
												255,
												false
											)
										);
										this.score += this.pickaxe[u].mines[resnum].count * resnum + 2;
									}
									this.needsSelfUpdate = true;
								}
								if(rem) {
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
												1
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
								if(
									(t instanceof Demon || t instanceof Destroyer) &&
									!t.agro.find((p) => p == this)
								)
									t.agro.push(this);
								if(t.health - this.pickaxe[u].damage < 0) {
									if(t instanceof Demon && timeOfDay == 'night') this.score += 300;
									if(t instanceof Demon && timeOfDay == 'day') this.score += 100;
									if(t instanceof Destroyer && timeOfDay == 'night') this.score += 600;
									if(t instanceof Destroyer && timeOfDay == 'day') this.score += 50;
									if(t instanceof Player) this.score += t.score / 2 + 10;
									if(t instanceof Rabbit) this.score += 25;
								}
							});
							walltargs.forEach((w) => {
								w.health -= this.pickaxe[u].walldam;
							});
						}, 2500 / 3);
					}
					if(/Sword/.test(this.mainHands) && this.sword.ready && this.move.att) {
						let u;
						let un;
						this.tool = 'sword';

						if(/^Stone/.test(this.mainHands)) {
							u = 'stone';
							un = 0;
						} else if(/^Iron/.test(this.mainHands)) {
							u = 'iron';
							un = 1;
						} else if(/^Gold/.test(this.mainHands)) {
							u = 'gold';
							un = 2;
						} else if(/^Diamond/.test(this.mainHands)) {
							u = 'diamond';
							un = 3;
						} else if(/^Emerald/.test(this.mainHands)) {
							u = 'emerald';
							un = 4;
						} else if(/^Amethyst/.test(this.mainHands)) {
							u = 'amethyst';
							un = 5;
						}
						if(this.sword.timeout) clearTimeout(this.swor.timeout.timeout);
						let saxerad = (this.rad / 25) * 30;
						let saxep = Vector.create(0, (70 * this.rad) / 25);
						saxep.x =
							(Math.cos((this.move.ang * Math.PI) / 180) * 60 * this.rad) / 25;
						saxep.y =
							(Math.sin((this.move.ang * Math.PI) / 180) * 60 * this.rad) / 25;
						Vector.add(this.body.position, saxep, saxep);
						let targs = [];
						let camptargs = [];
						this.sword.ready = false;
						this.hitting = true;
						this.sword.timeout = new Timeout(
							() => {
								this.hitting = false;
								this.sword.timeout = null;
								this.sword.ready = true;
								this.tool = null;
							},
							un >= 3 ? 3000 / 3 : 5000 / 3
						);
						Entities.forEach((e) => {
							if(
								e instanceof Player ||
								e instanceof Demon ||
								e instanceof Destroyer ||
								e instanceof Rabbit
							) {
								if(Vector.getDistance(saxep, e.body.position) < e.rad + saxerad)
									targs.push(e);
							}
							if(e instanceof Campfire) {
								console.log('woah');
								if(Vector.getDistance(saxep, e.body.position) < 14.83 + saxerad) {
									console.log('lighting');
									camptargs.push(e);
								}
							}
						});
						new Timeout(
							() => {
								targs.forEach((t) => {
									t.takeDamage({
										damage: this.sword[u].damage,
										type: 'melee',
										length: un >= 3 ? 3000 / 3 : 5000 / 3,
									});
									if(
										(t instanceof Demon || t instanceof Destroyer) &&
										!t.agro.find((p) => p == this)
									)
										t.agro.push(this);

									if(t.health - this.sword[u].damage < 0) {
										if(t instanceof Demon && timeOfDay == 'night') this.score += 300;
										if(t instanceof Demon && timeOfDay == 'day') this.score += 100;
										if(t instanceof Destroyer && timeOfDay == 'night') this.score += 600;
										if(t instanceof Destroyer && timeOfDay == 'day') this.score += 50;
										if(t instanceof Player) this.score += t.score / 2 + 10;
										if(t instanceof Rabbit) this.score += 25;
									}
								});
								camptargs.forEach((c) => {
									if(!c.lit) {
										c.lit = true;
										c.needsUpdate = true;
										console.log('ass');
									}
								});
							},
							un >= 3 ? 1500 / 3 : 2500 / 3
						);
					}
					if(/Hammer/.test(this.mainHands) && this.hammer.ready && this.move.att) {
						let u;
						this.tool = 'hammer';
						if(/^Stone/.test(this.mainHands)) u = 'stone';
						else if(/^Iron/.test(this.mainHands)) u = 'iron';
						else if(/^Gold/.test(this.mainHands)) u = 'gold';
						else if(/^Diamond/.test(this.mainHands)) u = 'diamond';
						else if(/^Amethyst/.test(this.mainHands)) u = 'amethyst';
						else if(/^Emerald/.test(this.mainHands)) u = 'emerald';
						if(this.hammer.timeout) clearTimeout(this.hammer.timeout.timeout);
						let axerad = (this.rad / 25) * 15;
						let axep = Vector.create(0, (70 * this.rad) / 25);
						axep.x =
							Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(axep);
						axep.y =
							Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(axep);
						Vector.add(this.body.position, axep, axep);
						let targs = [];
						let rtargs = [];
						let walltargs = [];
						this.hammer.ready = false;
						this.hitting = true;
						this.hammer.timeout = new Timeout(() => {
							this.hitting = false;
							this.hammer.timeout = null;
							this.hammer.ready = true;
							this.tool = null;
						}, 6000 / 3);
						Entities.forEach((e) => {
							if(
								e instanceof Player ||
								e instanceof Demon ||
								e instanceof Destroyer ||
								e instanceof Rabbit
							) {
								if(Vector.getDistance(axep, e.body.position) < e.rad + axerad)
									targs.push(e);
							}
							if(
								e instanceof STree ||
								e instanceof Stone ||
								e instanceof Iron ||
								e instanceof Gold ||
								e instanceof Diamond ||
								e instanceof Emerald ||
								e instanceof Amethyst
							) {
								if(Vector.getDistance(axep, e.body.position) < 50 + axerad)
									rtargs.push(e);
							}
							if(
								e instanceof Wall ||
								e instanceof Door ||
								e instanceof Floor ||
								e instanceof CraftingTable ||
                                e instanceof CarrotFarm ||
                                e instanceof Campfire ||
								e instanceof Chest
							) {
								if(
									e instanceof Chest &&
									RectCircleColliding(
										axep.x,
										axep.y,
										axerad,
										e.body.position.x,
										e.body.position.y,
										e.width,
										e.height
									)
								)
                                    walltargs.push(e);
                                else if(
                                    e instanceof Campfire &&
                                    Vector.getDistance(axep, e.body.position) < 14.83 + axerad
                                ) walltargs.push(e)
								else if(
									RectCircleColliding(
										axep.x,
										axep.y,
										axerad,
										e.body.position.x,
										e.body.position.y,
										100,
										100
									)
								)
									walltargs.push(e);
							}
						});
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
								if(
									(t instanceof Demon || t instanceof Destroyer) &&
									!t.agro.find((p) => p == this)
								)
									t.agro.push(this);
								if(t.health - this.hammer[u].damage < 0) {
									if(t instanceof Demon && timeOfDay == 'night') this.score += 300;
									if(t instanceof Demon && timeOfDay == 'day') this.score += 100;
									if(t instanceof Destroyer && timeOfDay == 'night') this.score += 600;
									if(t instanceof Destroyer && timeOfDay == 'day') this.score += 50;
									if(t instanceof Player) this.score += t.score / 2 + 10;
									if(t instanceof Rabbit) this.score += 25;
								}
							});
							walltargs.forEach((w) => {
								w.health -= this.hammer[u].walldam;
							});
						}, 2500 / 3);
					}
					if(/Shovel/.test(this.mainHands) && this.shovel.ready && this.move.att) {
						let u;
						let un;
						this.tool = 'shovel';
						if(/^Stone/.test(this.mainHands)) {
							u = 'stone';
							un = 0;
						} else if(/^Iron/.test(this.mainHands)) {
							u = 'iron';
							un = 1;
						} else if(/^Gold/.test(this.mainHands)) {
							u = 'gold';
							un = 2;
						} else if(/^Diamond/.test(this.mainHands)) {
							u = 'diamond';
							un = 3;
						} else if(/^Emerald/.test(this.mainHands)) {
							u = 'emerald';
							un = 4;
						} else if(/^Amethyst/.test(this.mainHands)) {
							u = 'amethyst';
							un = 5;
						}
						if(this.shovel.timeout) clearTimeout(this.shovel.timeout.timeout);
						let paxerad = (this.rad / 25) * 30;
						let paxep = Vector.create(0, (70 * this.rad) / 25);
						paxep.x =
							Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(paxep);
						paxep.y =
							Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(paxep);
						Vector.add(this.body.position, paxep, paxep);
						let targs = [];
						let rtargs = [];
						let walltargs = [];
						this.shovel.ready = false;
						this.hitting = true;
						this.shovel.timeout = new Timeout(() => {
							this.hitting = false;
							this.shovel.timeout = null;
							this.shovel.ready = true;
							this.tool = null;
						}, 5000 / 3);
						Entities.forEach((e) => {
							if(
								e instanceof Player ||
								e instanceof Demon ||
								e instanceof Destroyer ||
								e instanceof Rabbit
							) {
								if(Vector.getDistance(paxep, e.body.position) < e.rad + paxerad)
									targs.push(e);
							}
							if(
								e instanceof STree ||
								e instanceof Stone ||
								e instanceof Iron ||
								e instanceof Gold ||
								e instanceof Diamond ||
								e instanceof Emerald ||
								e instanceof Amethyst
							) {
								if(Vector.getDistance(paxep, e.body.position) < 50 + paxerad)
									rtargs.push(e);
							}
							if(
								e instanceof Wall ||
								e instanceof Door ||
								e instanceof Floor ||
								e instanceof CraftingTable ||
								e instanceof CarrotFarm
							) {
								if(
									e instanceof Chest &&
									RectCircleColliding(
										paxep.x,
										paxep.y,
										paxerad,
										e.body.position.x,
										e.body.position.y,
										e.width,
										e.height
									)
								)
									walltargs.push(e);
								else if(
									!(e instanceof Chest) &&
									RectCircleColliding(
										paxep.x,
										paxep.y,
										paxerad,
										e.body.position.x,
										e.body.position.y,
										100,
										100
									)
								)
									walltargs.push(e);
							}
						});
						new Timeout(() => {
							console.log(this.shovel[u].mines);
							if(this.body.position.y > 1000 + this.rad) {
								this.inventory.addItemMax(
									new Slot('sand', this.shovel[u].mines[0].count, 'sand', 255)
								);
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
								if(
									(t instanceof Demon || t instanceof Destroyer) &&
									!t.agro.find((p) => p == this)
								)
									t.agro.push(this);
								if(t.health - this.shovel[u].damage < 0) {
									if(t instanceof Demon && timeOfDay == 'night') this.score += 300;
									if(t instanceof Demon && timeOfDay == 'day') this.score += 100;
									if(t instanceof Destroyer && timeOfDay == 'night') this.score += 600;
									if(t instanceof Destroyer && timeOfDay == 'day') this.score += 50;
									if(t instanceof Player) this.score += t.score / 2 + 10;
									if(t instanceof Rabbit) this.score += 25;
								}
							});
							walltargs.forEach((w) => {
								w.health -= this.shovel[u].walldam;
							});
						}, 2500 / 3);
					}
				}
				if(/Wall|Campfire|Floor|Door|Crafting Table|Chest/.test(this.mainHands)) {
					let mvect;
					if(this.move.mdis > 141.42 + this.rad) {
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
					if(/Wall/.test(this.mainHands) && this.move.att && !this.alusd) {
						if(
							Entities.some(
								(e) =>
									(((e.body.position.x == mvect.x && e.body.position.y == mvect.y) ||
										((e instanceof Player ||
											e instanceof Demon ||
											e instanceof Destroyer ||
											e instanceof Rabbit) &&
											RectCircleColliding(
												e.body.position.x,
												e.body.position.y,
												e.rad,
												mvect.x,
												mvect.y,
												100,
												100
											))) &&
										!(
											this.structures.some((s) => e == s && e instanceof Floor) ||
											(this.clan &&
												this.clan.members.some((member) =>
													member.structures.some((s) => e == s && s instanceof Floor)
												))
										)) ||
									mvect.x < 50 ||
									mvect.y < 50 ||
									mvect.x > game.map.forest.width ||
									mvect.y > game.map.forest.height
							)
						) {
							return (this.canPlace = false);
						}
						let slot = this.inventory.get(this.mainHand);
						slot.count -= 1;
						if(slot.count == 0) {
							this.inventory.set(this.mainHand, 'empty');
							this.mainHand = '-1';
						}
						this.needsSelfUpdate = true;
						if(/Wood/.test(this.mainHands))
							this.structures.push(new Wall(mvect.x, mvect.y, 'wood'));
						if(/Stone/.test(this.mainHands))
							this.structures.push(new Wall(mvect.x, mvect.y, 'stone'));
						if(/Iron/.test(this.mainHands))
							this.structures.push(new Wall(mvect.x, mvect.y, 'iron'));
						this.alusd = true;
					}
					if(/Door/.test(this.mainHands) && this.move.att && !this.alusd) {
						if(
							Entities.some(
								(e) =>
									(((e.body.position.x == mvect.x && e.body.position.y == mvect.y) ||
										((e instanceof Player ||
											e instanceof Demon ||
											e instanceof Destroyer ||
											e instanceof Rabbit) &&
											RectCircleColliding(
												e.body.position.x,
												e.body.position.y,
												e.rad,
												mvect.x,
												mvect.y,
												100,
												100
											))) &&
										!(
											this.structures.find((s) => e == s && e instanceof Floor) ||
											(this.clan &&
												this.clan.members.find((member) =>
													member.structures.find((s) => e == s && s instanceof Floor)
												))
										)) ||
									mvect.x < 50 ||
									mvect.y < 50 ||
									mvect.x > game.map.forest.width ||
									mvect.y > game.map.forest.height
							)
						)
							return (this.canPlace = false);
						let slot = this.inventory.get(this.mainHand);
						slot.count -= 1;
						if(slot.count == 0) {
							this.inventory.set(this.mainHand, 'empty');
							this.mainHand = '-1';
						}
						this.needsSelfUpdate = true;
						if(/Wood/.test(this.mainHands))
							this.structures.push(new Door(mvect.x, mvect.y, 'wood', this.pang));
						if(/Stone/.test(this.mainHands))
							this.structures.push(new Door(mvect.x, mvect.y, 'stone', this.pang));
						if(/Iron/.test(this.mainHands))
							this.structures.push(new Door(mvect.x, mvect.y, 'iron', this.pang));
						this.alusd = true;
					}
					if(
						/Crafting Table/.test(this.mainHands) &&
						this.move.att &&
						!this.alusd
					) {
						if(
							Entities.find(
								(e) =>
									(((e.body.position.x == mvect.x && e.body.position.y == mvect.y) ||
										((e instanceof Player ||
											e instanceof Demon ||
											e instanceof Destroyer ||
											e instanceof Rabbit) &&
											RectCircleColliding(
												e.body.position.x,
												e.body.position.y,
												e.rad,
												mvect.x,
												mvect.y,
												100,
												100
											))) &&
										!(
											this.structures.find((s) => e == s && e instanceof Floor) ||
											(this.clan &&
												this.clan.members.find((member) =>
													member.structures.find((s) => e == s && s instanceof Floor)
												))
										)) ||
									mvect.x < 50 ||
									mvect.y < 50 ||
									mvect.x > game.map.forest.width ||
									mvect.y > game.map.forest.height
							)
						)
							return (this.canPlace = false);
						let slot = this.inventory.get(this.mainHand);
						slot.count -= 1;
						if(slot.count == 0) {
							this.inventory.set(this.mainHand, 'empty');
							this.mainHand = '-1';
						}
						this.needsSelfUpdate = true;
						this.structures.push(new CraftingTable(game, mvect.x, mvect.y));
						this.alusd = true;
					}
					if(/Floor/.test(this.mainHands) && this.move.att && !this.alusd) {
						if(
							Entities.find(
								(e) =>
									(e.id != this.id &&
										((e.body.position.x == mvect.x && e.body.position.y == mvect.y) ||
											((e instanceof Player ||
												e instanceof Demon ||
												e instanceof Destroyer ||
												e instanceof Rabbit) &&
												RectCircleColliding(
													e.body.position.x,
													e.body.position.y,
													e.rad,
													mvect.x,
													mvect.y,
													100,
													100
												))) &&
										!(
											this.structures.find(
												(s) =>
													e == s &&
													(e instanceof Wall ||
														e instanceof Door ||
														e instanceof CraftingTable)
											) ||
											(this.clan &&
												this.clan.members.find((member) =>
													member.structures.find(
														(s) =>
															e == s &&
															(e instanceof Wall ||
																e instanceof Door ||
																e instanceof CraftingTable)
													)
												))
										)) ||
									mvect.x < 50 ||
									mvect.y < 50 ||
									mvect.x > game.map.forest.width ||
									mvect.y > game.map.forest.height
							)
						)
							return (this.canPlace = false);
						let slot = this.inventory.get(this.mainHand);
						slot.count -= 1;
						if(slot.count == 0) {
							this.inventory.set(this.mainHand, 'empty');
							this.mainHand = '-1';
						}
						this.needsSelfUpdate = true;
						if(/Wood/.test(this.mainHands))
							this.structures.push(new Floor(mvect.x, mvect.y, 'wood'));
						if(/Stone/.test(this.mainHands))
							this.structures.push(new Floor(mvect.x, mvect.y, 'stone'));
						if(/Iron/.test(this.mainHands))
							this.structures.push(new Floor(mvect.x, mvect.y, 'iron'));
						this.alusd = true;
					}
					if(/Chest/.test(this.mainHands) && this.move.att && !this.alusd) {
						if(
							Entities.find(
								(e) =>
									(e.id != this.id &&
										((e.body.position.x == mvect.x && e.body.position.y == mvect.y) ||
											((e instanceof Player ||
												e instanceof Demon ||
												e instanceof Destroyer ||
												e instanceof Rabbit) &&
												RectCircleColliding(
													e.body.position.x,
													e.body.position.y,
													e.rad,
													mvect.x,
													mvect.y,
													95,
													50
												))) &&
										!(
											this.structures.find(
												(s) =>
													e == s &&
													(e instanceof Wall ||
														e instanceof Door ||
														e instanceof CraftingTable)
											) ||
											(this.clan &&
												this.clan.members.find((member) =>
													member.structures.find(
														(s) =>
															e == s &&
															(e instanceof Wall ||
																e instanceof Door ||
																e instanceof CraftingTable)
													)
												))
										)) ||
									mvect.x < 50 ||
									mvect.y < 50 ||
									mvect.x > game.map.forest.width ||
									mvect.y > game.map.forest.height
							)
						)
							return (this.canPlace = false);
						let slot = this.inventory.get(this.mainHand);
						slot.count -= 1;
						if(slot.count == 0) {
							this.inventory.set(this.mainHand, 'empty');
							this.mainHand = '-1';
						}
						this.needsSelfUpdate = true;
						this.structures.push(new Chest(mvect.x, mvect.y, this.pang));
						this.alusd = true;
					}
					if(/Campfire/.test(this.mainHands) && this.move.att && !this.alusd) {
						if(
							Entities.find(
								(e) =>
									(((e.body.position.x == mvect.x && e.body.position.y == mvect.y) ||
										((e instanceof Player ||
											e instanceof Demon ||
											e instanceof Destroyer ||
											e instanceof Rabbit) &&
											RectCircleColliding(
												e.body.position.x,
												e.body.position.y,
												e.rad,
												mvect.x,
												mvect.y,
												100,
												100
											))) &&
										!(
											this.structures.find((s) => e == s && e instanceof Floor) ||
											(this.clan &&
												this.clan.members.find((member) =>
													member.structures.find((s) => e == s && s instanceof Floor)
												))
										)) ||
									mvect.x < 50 ||
									mvect.y < 50 ||
									mvect.x > game.map.forest.width ||
									mvect.y > game.map.forest.height
							)
						)
							return (this.canPlace = false);
						let slot = this.inventory.get(this.mainHand);
						slot.count -= 1;
						if(slot.count == 0) {
							this.inventory.set(this.mainHand, 'empty');
							this.mainHand = '-1';
						}
						this.needsSelfUpdate = true;
						this.structures.push(new Campfire(mvect.x, mvect.y));
						this.alusd = true;
					}
				}
				if(this.mainHands == 'carrot' && this.carrot.ready && this.move.att) {
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
						if(slot.count == 0) {
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
					}, 2500 / 3);
				}
			}
			if(this.move.att) {
				if(this.inventory.get(this.mainHand) == undefined) {
					this.hit();
				}
			}
			if(this.stamina > this.maxStamina) this.stamina = this.maxStamina;
			if(this.health > this.maxHealth) this.health = this.maxHealth;
			if(this.food > this.maxFood) this.food = this.maxFood;
		}
		hit() {
			if(this.punch.ready) {
				//if(this.punch.timeout) clearTimeout(this.punch.timeout.timeout)
				this.punch.ready = false;
				let targs = [];
				let rtargs = [];
				let walltargs = [];
				this.punch.timeout = new Timeout(() => {
					this.punch.timeout = null;
					this.punch.ready = true;
					this.lhit = false;
					this.rhit = false;
				}, 1500 / 3);
				Entities.forEach((e) => {
					if(
						e instanceof Player ||
						e instanceof Demon ||
						e instanceof Destroyer ||
						e instanceof Rabbit
					) {
						if(Vector.getDistance(this.hposfr, e.body.position) < e.rad + this.hrad)
							targs.push(e);
					}
					if(
						e instanceof STree ||
						e instanceof Stone ||
						e instanceof Iron ||
						e instanceof Gold ||
						e instanceof Diamond ||
						e instanceof Emerald ||
						e instanceof Amethyst ||
						e instanceof CarrotFarm
					) {
						if(Vector.getDistance(this.hposfr, e.body.position) < 50 + this.hrad)
							rtargs.push(e);
					}
					if(
						e instanceof Wall ||
						e instanceof Door ||
						e instanceof Floor ||
						e instanceof CraftingTable ||
						e instanceof CarrotFarm
					) {
						if(
							e instanceof Chest &&
							RectCircleColliding(
								this.hposfr.x,
								this.hposfr.y,
								this.hrad,
								e.body.position.x,
								e.body.position.y,
								e.width,
								e.height
							)
						)
							walltargs.push(e);
						else if(
							!(e instanceof Chest) &&
							RectCircleColliding(
								this.hposfr.x,
								this.hposfr.y,
								this.hrad,
								e.body.position.x,
								e.body.position.y,
								100,
								100
							)
						)
							walltargs.push(e);
					}
				});

				if(this.next == 'l' && this.lhit == false && this.rhit == false) {
					this.lhit = true;
					this.next = 'r';
				} else if(this.next == 'r' && this.lhit == true) {
					this.lhit = false;
				} else if(this.next == 'r' && this.rhit == false) {
					this.rhit = true;
					this.next = 'l';
				} else if(this.next == 'l' && this.rhit == true) {
					this.rhit = false;
				}

				new Timeout(() => {
					rtargs.forEach((r) => {
						let rem;
						if(r instanceof STree) {
							rem = this.inventory.addItemMax(new Slot('wood', 1, 'draw', 255, false));
							this.score++;
							this.needsSelfUpdate = true;
						}
						if(r instanceof Stone) {
							rem = this.inventory.addItemMax(
								new Slot('stone', 1, 'stone', 255, false)
							);
							this.score += 2;
							this.needsSelfUpdate = true;
						}
						if(r instanceof CarrotFarm) {
							rem = this.inventory.addItemMax(
								new Slot('carrot', 1, 'carrot', 255, false, true)
							);
							this.score += 3;
							this.needsSelfUpdate = true;
						}
						if(rem) {
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
										1
									);
								}, 20000),
							};
							dropped.push(self);
						}
						r.health -= 5;
					});
					targs.forEach((t) => {
						t.takeDamage({
							damage: this.hands.damage,
							type: 'melee',
							length: 1500 / 6,
						});
						if(
							(t instanceof Demon || t instanceof Destroyer) &&
							!t.agro.find((p) => p == this)
						)
							t.agro.push(this);
						if(t.health < 0) {
							if(t instanceof Demon && timeOfDay == 'night') this.score += 300;
							if(t instanceof Demon && timeOfDay == 'day') this.score += 100;
							if(t instanceof Destroyer && timeOfDay == 'night') this.score += 600;
							if(t instanceof Destroyer && timeOfDay == 'day') this.score += 50;
							if(t instanceof Player) this.score += t.score / 2 + 10;
							if(t instanceof Rabbit) this.score += 25;
						}
					});
					walltargs.forEach((w) => {
						w.health -= 5;
					});
				}, 2500 / 3);
			}
		}
		changeArmor(armor) {
			this.armor = armor;
			this.armorParts = this.armor.id.toLowerCase().split(' ');
			if(this.armorParts[1] == 'armor') this._maxSpd *= 0.7;
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
			if(this.punch.timeout)
				pack.punchper =
					Math.roundToDeci(this.punch.timeout.percntDone, 1000) > 0.95
						? 1
						: Math.roundToDeci(this.punch.timeout.percntDone, 1000);
			if(this.hitting && this.mainHands != 'hand')
				pack.per =
					Math.roundToDeci(this[this.tool].timeout.percntDone, 1000) > 0.97
						? 1
						: Math.roundToDeci(this[this.tool].timeout.percntDone, 1000);
			if(this.eating && this.mainHands != 'hand')
				pack.per =
					Math.roundToDeci(this[this.edi].timeout.percntDone, 1000) > 0.97
						? 1
						: Math.roundToDeci(this[this.edi].timeout.percntDone, 1000);
			if(this.clan) {
				pack.clan = this.clan.name;
				pack.owner = this.clan.owner == this;
			}
			if(this.armor) {
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
				craftablesEx: this.craftablesEx,
				chestables: this.chestables,
				clanning: this.clanning,
				chesting: this.chesting,
				clans: this.clans,
				admin: this.admin,
			};
			if(this.clan) {
				pack.clanMembers = this.clan.members.map((player) => ({
					usr: player.usr,
					id: player.id,
				}));
				if(this.clan.owner == this && this.clan.joinReqs[0])
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
			this.hposfl.x =
				Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfl);
			this.hposfl.y =
				Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfl);
			Vector.add(this.body.position, this.hposfl, this.hposfl);

			this.hposfr = Vector.create(0, (-35.34119409414458 * this.rad) / 25);
			this.hposfr.x =
				Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfr);
			this.hposfr.y =
				Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfr);
			Vector.add(this.body.position, this.hposfr, this.hposfr);
		}
		takeDamage(damObj) {
			damObj.timer = new Timeout(() => {
				this.damages.splice(
					this.damages.findIndex((d) => d == damObj),
					1
				);
			}, damObj.length);
			this.damages.push(damObj);
		}
		handleDamage(dam) {
			let toTake;
			if(this.armor) {
				let removePer;
				if(this.armorParts[1] == 'armor') {
					if(this.armorParts[0] == 'iron') removePer = 0.85;
				} else if(this.armorParts[1] == 'garment') {
				}
				this.health -= (dam.damage / (dam.length / (1000 / 60))) * removePer;
			} else {
				this.health -= dam.damage / (dam.length / (1000 / 60));
			}
		}
	}
	class Destroyer extends EventEmitter {
		/**
		 * @param {String} id
		 * @param {String} usr
		 */
		constructor(x, y) {
			super();
			this.rad = 50;
			this.id = Math.random();
			this.body = Bodies.circle(x, y, this.rad, {
				frictionAir: 0.02,
				restitution: 0.15,
			});
			Entities.push(this);
			World.addBody(engine.world, this.body);
			this.bullets = [];
			this.agro = [];
			this.punch = {
				speed: 3,
				ready: true,
				reload: {
					speed: 20,
					timer: 0,
				},
				damage: 6,
				health: 1,
			};
			this.hands = {
				l: {
					hit: false,
				},
				r: {
					hit: false,
				},
				damage: 4,
			};
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
			this.damages = [];
			this.hlen = (35.34119409414458 * this.rad) / 30;
			this.hrad = (this.rad / 25) * 7.5;
			this.hposfl = Vector.create(0, (-35.34119409414458 * this.rad) / 25);
			this.hposfl.x =
				Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfl);
			this.hposfl.y =
				Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfl);
			Vector.add(this.body.position, this.hposfl, this.hposfl);

			this.hposfr = Vector.create(0, (-35.34119409414458 * this.rad) / 25);
			this.hposfr.x =
				Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfr);
			this.hposfr.y =
				Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfr);
			Vector.add(this.body.position, this.hposfr, this.hposfr);
			this.next = 'l';
			this.lhit = false;
			this.rhit = false;
			this._maxSpd = 2.75;
			this.health = 5;
			this.maxHealth = 30;
			this.stamina = 20;
			this.maxStamina = 20;
			var self = this;
			this.bulletSpeed = 1;
			this.targets = [];
			this.treetargs = [];
			this.stonetargs = [];
			this.kills = 0;
			this.needsUpdate = false;
			this.needsSelfUpdate = false;
			this.mainHands = 'hand';
			/*this.afkTimer = setTimeout(function () {
                self.dead = true
                setInterval(function () {
                    self.health -= self.maxHealth / 100
                }, 100)
            }, 10000);*/
			this.dead = false;
			this.pathTimer = null;
			game.initPack.destroyer.push({
				x: this.body.position.x,
				y: this.body.position.y,
				id: this.id,
				angle: this.move.ang,
				lhit: this.lhit,
				rhit: this.rhit,
			});
			Destroyers.list.push(this);
		}
		updatePath(pos) {
			if(this.pathTimer) clearTimeout(this.pathTimer);
			if(!pos) {
				this.pos = null;
				this.path = null;
				if(this.agro.length == 1) {
					this.pos = this.agro[0];
				} else if(this.agro.length) {
					let possible = new Mapper();
					this.agro.forEach((player, i) => {
						if(
							Vector.getDistance(player.body.position, this.body.position) <
							1000 + this.rad
						)
							possible.set(i, player);
					});
					let dis;
					let nearest;
					if(possible.size) {
						possible.forEach((player, index) => {
							if(!nearest) {
								nearest = index;
								dis = Vector.getDistance(player.body.position, this.body.position);
								return;
							}
							if(Vector.getDistance(player.body.position, this.body.position) < dis) {
								dis = Vector.getDistance(player.body.position, this.body.position);
								nearest = index;
							}
						});
					}
					this.pos = possible.get(nearest);
				} else if(
					Players.list.find(
						(player) =>
							Vector.getDistance(player.body.position, this.body.position) <
                                700 + this.rad && player.score > 1500 && 
                            !Campfires.list.some(
                                campfire => 
                                    campfire.lit && 
                                    Vector.getDistance(campfire.body.position, player.body.position) < 150
                            )
                    )
				) {
					let possible = new Mapper();
					Players.list.forEach((player, i) => {
						if(
							Vector.getDistance(player.body.position, this.body.position) <
								700 + this.rad &&
                            player.score > 1500 && !Campfires.list.some(
                                campfire => 
                                    campfire.lit && 
                                    Vector.getDistance(campfire.body.position, player.body.position) < 150 + player.rad
                                ))
							possible.set(i, player);
					});
					let dis;
					let nearest;
					if(possible.size) {
						possible.forEach((player, index) => {
							if(!nearest) {
								nearest = index;
								dis = Vector.getDistance(player.body.position, this.body.position);
								return;
							}
							if(Vector.getDistance(player.body.position, this.body.position) < dis) {
								dis = Vector.getDistance(player.body.position, this.body.position);
								nearest = index;
							}
						});
					}
					this.pos = possible.get(nearest);
				} else if(
					Stones.list.length ||
					Irons.list.length ||
					Golds.list.length ||
					Diamonds.list.length ||
					Emeralds.list.length ||
					Amethysts.list.length
				) {
					let canReach = [];
					if(Stones.list.length) canReach.push('stone');
					if(Irons.list.length) canReach.push('iron');
					if(Golds.list.length) canReach.push('gold');
					if(Diamonds.list.length) canReach.push('diamond');
					if(Emeralds.list.length) canReach.push('emerald');
					if(Amethysts.list.length) canReach.push('amethyst');
					let willAdd = canReach[Math.getRandomInt(0, canReach.length - 1)];
					if(willAdd == 'stone')
						this.pos = Stones.list[Math.getRandomInt(0, Stones.list.length - 1)];
					if(willAdd == 'iron')
						this.pos = Irons.list[Math.getRandomInt(0, Irons.list.length - 1)];
					if(willAdd == 'gold')
						this.pos = Golds.list[Math.getRandomInt(0, Golds.list.length - 1)];
					if(willAdd == 'diamond')
						this.pos = Diamonds.list[Math.getRandomInt(0, Diamonds.list.length - 1)];
					if(willAdd == 'emerald')
						this.pos = Emeralds.list[Math.getRandomInt(0, Golds.list.length - 1)];
					if(willAdd == 'amethyst')
						this.pos = Amethysts.list[Math.getRandomInt(0, Diamonds.list.length - 1)];
				}
				if(!this.pos) return (this.path = null);
			}
			let grid = new PF.Grid(
				game.map.forest.width / 100,
				game.map.forest.width / 100
			);
			let finder = new PF.AStarFinder();
			let Stationaries = [...STrees.list, ...Stones.list, ...Irons.list, ...Golds.list, ...Diamonds.list, ...Emeralds.list, ...Amethysts.list, ...CarrotFarms.list]
            Stationaries.forEach(stationary => grid.setWalkableAt((stationary.x - 50) / 100, (stationary.y - 50) / 100, false))
            Demons.list.filter(e => e != this.pos && e != this).forEach(e => {
                grid.setWalkableAt(Math.roundToDeca(e.body.position.x - 50, 100)/100, Math.roundToDeca(e.body.position.y - 50, 100)/100, false)
            })
            Destroyers.list.filter(e => e != this.pos && e != this).forEach(e => {
                grid.setWalkableAt(Math.roundToDeca(e.body.position.x - 50, 100)/100, Math.roundToDeca(e.body.position.y - 50, 100)/100, false)
            })
            Players.list.filter(e => e != this.pos && e != this).forEach(e => {
                grid.setWalkableAt(Math.roundToDeca(e.body.position.x - 50, 100)/100, Math.roundToDeca(e.body.position.y - 50, 100)/100, false)
            })
			if(this.pos.x)
				grid.setWalkableAt((this.pos.x - 50) / 100, (this.pos.y - 50) / 100, true);
			let x = Math.roundToDeca(this.body.position.x - 50, 100) / 100;
			let y = Math.roundToDeca(this.body.position.y - 50, 100) / 100;
			let fx = Math.roundToDeca(this.pos.body.position.x - 50, 100) / 100;
			let fy = Math.roundToDeca(this.pos.body.position.y - 50, 100) / 100;
			if(
				x > game.map.forest.width / 100 - 1 ||
				y > game.map.forest.width / 100 - 1 ||
				fx > game.map.forest.width / 100 - 1 ||
				fy > game.map.forest.width / 100 - 1 ||
				x < 0 ||
				y < 0 ||
				fx < 0 ||
				fy < 0
			)
				return (this.path = null);
			this.path = finder.findPath(x, y, fx, fy, grid);
			setTimeout(() => {
				if(Vector.magnitude(this.body.velocity) < 1) this.updatePath(this.pos);
			}, 10000);
			this.curr = 0;
		}
		updateSpd() {
			this.move.att = false;
			if(
				!this.path ||
				!this.path.length ||
				(this.agro.length && !this.agro.find((agro) => agro == this.pos)) ||
				Players.list.find(
					(player) =>
						Vector.getDistance(player.body.position, this.body.position) <
							700 + this.rad &&
						player.score > 1500 &&
						!this.pos instanceof Player
				)
            )this.updatePath();
            if(
                Campfires.list.some(
                    campfire => 
                        this.agro.indexOf(this.pos) == -1 && 
                        campfire.lit &&
                        Vector.getDistance(campfire.body.position, this.pos.body.position) < 150 + this.pos.rad)
            ) this.updatePath()
			if(!this.path || !this.path.length) return;
			this.move.ang =
				(Math.atan2(
					this.pos.body.position.y - this.body.position.y,
					this.pos.body.position.x - this.body.position.x
				) *
					180) /
				Math.PI;
			while (this.agro.find((player) => player.health <= 0)) {
				this.agro.splice(
					this.agro.findIndex((element) => element.health <= 0),
					1
				);
			}
			var m = this.move;
			let path = this.path.map((pos) => ({
				x: 100 * pos[0] + 50,
				y: 100 * pos[1] + 50,
			}));
			let n = path[this.curr];
			if(
				!n ||
				this.pos.health <= 0 ||
				Vector.getDistance(this.pos.body.position, path[path.length - 1]) > 500
			)
				this.updatePath();
			if(!this.path || !this.path.length) return;
			path = this.path.map((pos) => ({
				x: 100 * pos[0] + 50,
				y: 100 * pos[1] + 50,
			}));
			n = path[this.curr];
			if(
				Players.list.find(
					(player) =>
						Vector.getDistance(this.hposfr, player.body.position) <
						this.hrad + player.rad
				)
			)
				this.move.att = true;
			else if(
				Walls.list.find(
					(wall) =>
						Vector.getDistance(this.hposfr, wall.body.position) < this.hrad + 50
				)
			)
				this.move.att = true;
			else this.move.att = false;
			if(!n) return;
			this.acc = Vector.create(0, 0);

			if(this.body.position.x < n.x) this.acc.x += this._maxSpd / 3500;
			if(this.body.position.x > n.x) this.acc.x -= this._maxSpd / 3500;
			if(this.body.position.y < n.y) this.acc.y += this._maxSpd / 3500;
			if(this.body.position.y > n.y) this.acc.y -= this._maxSpd / 3500;
			if(Vector.getDistance(this.body.position, n) < 70.7 + this.rad) this.curr++;
			Body.applyForce(this.body, this.body.position, this.acc);
		}
		update() {
			if(this.move.run && this.stamina > 0.5 && Vector.magnitude(this.acc) > 0) {
				this._maxSpd = 3;
				this.stamina -= this.maxStamina / 5 / 60;
				this.needsSelfUpdate = true;
			} else if(this.stamina < this.maxStamina) {
				this._maxSpd = 2;
				if(Vector.magnitude(this.acc) <= 0)
					this.stamina += this.maxStamina / 25 / 60;
				else this.stamina += this.maxStamina / 100 / 60;
				this.needsSelfUpdate = true;
			}
			this.setHands();
			this.health += this.maxStamina / 50 / 60;
			this.damages.forEach((d) => this.handleDamage(d));
			if(this.stamina > this.maxStamina) this.stamina = this.maxStamina;
			if(this.health > this.maxHealth) this.health = this.maxHealth;
			this.updateSpd();
			if(Vector.magnitude(this.body.velocity) > this._maxSpd)
				Vector.mult(
					Vector.normalise(this.body.velocity),
					{ x: this._maxSpd, y: this._maxSpd },
					this.body.velocity
				);
			this.targets = [];
			if(this.punch.reload.timer > 0) {
				this.punch.reload.timer--;
			}
			if(this.move.att) {
				this.hit();
			}
		}
		hit() {
			if(this.punch.ready) {
				//if(this.punch.timeout) clearTimeout(this.punch.timeout.timeout)
				this.punch.ready = false;
				let targs = [];
				let rtargs = [];
				let walltargs = [];
				this.punch.timeout = new Timeout(() => {
					this.punch.timeout = null;
					this.punch.ready = true;
					this.lhit = false;
					this.rhit = false;
				}, 1500 / 3);
				Entities.forEach((e) => {
					if(e == this) return;
					if(e instanceof Player || e instanceof Rabbit) {
						if(Vector.getDistance(this.hposfr, e.body.position) < e.rad + this.hrad)
							targs.push(e);
					}
					if(
						e instanceof STree ||
						e instanceof Stone ||
						e instanceof Iron ||
						e instanceof Gold ||
						e instanceof Diamond ||
						e instanceof Emerald ||
						e instanceof Amethyst
					) {
						if(Vector.getDistance(this.hposfr, e.body.position) < 50 + this.hrad)
							rtargs.push(e);
					}
					if(
						e instanceof Wall ||
						e instanceof Door ||
						e instanceof Floor ||
						e instanceof CraftingTable ||
						e instanceof CarrotFarm
					) {
						if(
							e instanceof Chest &&
							RectCircleColliding(
								this.hposfr.x,
								this.hposfr.y,
								this.hrad,
								e.body.position.x,
								e.body.position.y,
								e.width,
								e.height
							)
						)
							walltargs.push(e);
						else if(
							!(e instanceof Chest) &&
							RectCircleColliding(
								this.hposfr.x,
								this.hposfr.y,
								this.hrad,
								e.body.position.x,
								e.body.position.y,
								100,
								100
							)
						)
							walltargs.push(e);
					}
				});

				if(this.next == 'l' && this.lhit == false && this.rhit == false) {
					this.lhit = true;
					this.next = 'r';
				} else if(this.next == 'r' && this.lhit == true) {
					this.lhit = false;
				} else if(this.next == 'r' && this.rhit == false) {
					this.rhit = true;
					this.next = 'l';
				} else if(this.next == 'l' && this.rhit == true) {
					this.rhit = false;
				}

				new Timeout(() => {
					walltargs.forEach((w) => {
						w.health -= 50;
					});
					targs.forEach((t) => {
						t.takeDamage({
							damage: this.hands.damage,
							type: 'melee',
							length: 1500 / 6,
						});
						if(t.health < 0) {
							if(t instanceof Player) this.kills++;
						}
					});
				}, 2500 / 3);
			}
		}
		getUpdatePack() {
			var pack = {
				x: this.body.position.x,
				y: this.body.position.y,
				id: this.id,
				angle: this.move.ang,
				lhit: this.lhit,
				rhit: this.rhit,
			};
			if(this.punch.timeout)
				pack.punchper =
					Math.roundToDeci(this.punch.timeout.percntDone, 1000) > 0.95
						? 1
						: Math.roundToDeci(this.punch.timeout.percntDone, 1000);
			return pack;
		}
		setHands() {
			this.hrad = (this.rad / 25) * 7.5;
			this.hposfl = Vector.create(0, (-35.34119409414458 * this.rad) / 25);
			this.hposfl.x = Math.cos((this.move.ang * Math.PI) / 180) * this.hlen;
			this.hposfl.y = Math.sin((this.move.ang * Math.PI) / 180) * this.hlen;

			Vector.add(this.body.position, this.hposfl, this.hposfl);

			this.hposfr = Vector.create(0, (-35.34119409414458 * this.rad) / 25);
			this.hposfr.x = Math.cos((this.move.ang * Math.PI) / 180) * this.hlen;
			this.hposfr.y = Math.sin((this.move.ang * Math.PI) / 180) * this.hlen;
			Vector.add(this.body.position, this.hposfr, this.hposfr);
		}
		takeDamage(damObj) {
			damObj.timer = new Timeout(() => {
				this.damages.splice(
					this.damages.findIndex((d) => d == damObj),
					1
				);
			}, damObj.length);
			this.damages.push(damObj);
		}
		handleDamage(dam) {
			let toTake;
			if(this.armor) {
				let removePer;
				if(this.armorParts[1] == 'armor') {
					if(this.armorParts[0] == 'iron') removePer = 0.7;
				} else if(this.armorParts[1] == 'garment') {
				}
				this.health -= (dam.damage / (dam.length / (1000 / 60))) * removePer;
			} else {
				this.health -= dam.damage / (dam.length / (1000 / 60));
			}
		}
	}
	class Demon extends EventEmitter {
		/**
		 * @param {String} id
		 * @param {String} usr
		 */
		constructor(x, y) {
			super();
			this.rad = 30;
			this.id = Math.random();
			this.body = Bodies.circle(x, y, this.rad, {
				frictionAir: 0.02,
				restitution: 0.15,
			});
			Entities.push(this);
			World.addBody(engine.world, this.body);
			this.bullets = [];
			this.agro = [];
			this.damages = [];
			this.punch = {
				speed: 3,
				ready: true,
				reload: {
					speed: 20,
					timer: 0,
				},
				damage: 1.25,
				health: 1,
			};
			this.hands = {
				l: {
					hit: false,
				},
				r: {
					hit: false,
				},
				damage: 3,
			};
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
			this.hrad = (this.rad / 25) * 7.5;
			this.hposfl = Vector.create(0, (-35.34119409414458 * this.rad) / 25);
			this.hposfl.x =
				Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfl);
			this.hposfl.y =
				Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfl);
			Vector.add(this.body.position, this.hposfl, this.hposfl);

			this.hposfr = Vector.create(0, (-35.34119409414458 * this.rad) / 25);
			this.hposfr.x =
				Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfr);
			this.hposfr.y =
				Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfr);
			Vector.add(this.body.position, this.hposfr, this.hposfr);
			this.next = 'l';
			this.lhit = false;
			this.rhit = false;
			this._maxSpd = 4;
			this.health = 20;
			this.maxHealth = 20;
			this.stamina = 20;
			this.maxStamina = 20;
			var self = this;
			this.bulletSpeed = 1;
			this.targets = [];
			this.treetargs = [];
			this.stonetargs = [];
			this.kills = 0;
			this.needsUpdate = false;
			this.needsSelfUpdate = false;
			this.mainHands = 'hand';
			/*this.afkTimer = setTimeout(function () {
                self.dead = true
                setInterval(function () {
                    self.health -= self.maxHealth / 100
                }, 100)
            }, 10000);*/
			this.dead = false;
			game.initPack.demon.push({
				x: this.body.position.x,
				y: this.body.position.y,
				id: this.id,
				angle: this.move.ang,
				lhit: this.lhit,
				rhit: this.rhit,
			});
			Demons.list.push(this);
			this.pathTimer = null;
		}
		updatePath(pos) {
			if(this.pathTimer) clearTimeout(this.pathTimer);
			if(!pos) {
				this.pos = null;
				this.path = null;
				if(this.agro.length == 1) {
					this.pos = this.agro[0];
				} else if(this.agro.length) {
					let possible = new Mapper();
					this.agro.forEach((player, i) => {
						if(
							Vector.getDistance(player.body.position, this.body.position) <
							1000 + this.rad
						)
							possible.set(i, player);
					});
					let dis;
					let nearest;
					if(possible.size) {
						possible.forEach((player, index) => {
							if(!nearest) {
								nearest = index;
								dis = Vector.getDistance(player.body.position, this.body.position);
								return;
							}
							if(Vector.getDistance(player.body.position, this.body.position) < dis) {
								dis = Vector.getDistance(player.body.position, this.body.position);
								nearest = index;
							}
						});
					}
					this.pos = possible.get(nearest);
				} else if(
					Players.list.some(
						(player) =>
							Vector.getDistance(player.body.position, this.body.position) <
								700 + this.rad &&
							player.score > 7000
                            && !Campfires.list.some(
                                campfire => 
                                    campfire.lit && 
                                    Vector.getDistance(campfire.body.position, player.body.position) < 150
                                )
					) 
				) {
					let possible = new Mapper();
					Players.list.forEach((player, i) => {
						if(
							Vector.getDistance(player.body.position, this.body.position) <
								700 + this.rad &&
                            player.score > 700 
                            && !Campfires.list.some(
                                campfire => 
                                    campfire.lit && 
                                    Vector.getDistance(campfire.body.position, player.body.position) < 150 + player.rad
                                )
                        )
							possible.set(i, player);
					});
					let dis;
					let nearest;
					if(possible.size) {
						possible.forEach((player, index) => {
							if(!nearest) {
								nearest = index;
								dis = Vector.getDistance(player.body.position, this.body.position);
								return;
							}
							if(Vector.getDistance(player.body.position, this.body.position) < dis) {
								dis = Vector.getDistance(player.body.position, this.body.position);
								nearest = index;
							}
						});
					}
					this.pos = possible.get(nearest);
				} else if(
					Stones.list.length ||
					Irons.list.length ||
					Golds.list.length ||
					Diamonds.list.length ||
					Emeralds.list.length ||
					Amethysts.list.length
				) {
					let canReach = [];
					if(Stones.list.length) canReach.push('stone');
					if(Irons.list.length) canReach.push('iron');
					if(Golds.list.length) canReach.push('gold');
					if(Diamonds.list.length) canReach.push('diamond');
					if(Emeralds.list.length) canReach.push('emerald');
					if(Amethysts.list.length) canReach.push('amethyst');
					let willAdd = canReach[Math.getRandomInt(0, canReach.length - 1)];
					if(willAdd == 'stone')
						this.pos = Stones.list[Math.getRandomInt(0, Stones.list.length - 1)];
					if(willAdd == 'iron')
						this.pos = Irons.list[Math.getRandomInt(0, Irons.list.length - 1)];
					if(willAdd == 'gold')
						this.pos = Golds.list[Math.getRandomInt(0, Golds.list.length - 1)];
					if(willAdd == 'diamond')
						this.pos = Diamonds.list[Math.getRandomInt(0, Diamonds.list.length - 1)];
					if(willAdd == 'emerald')
						this.pos = Emeralds.list[Math.getRandomInt(0, Golds.list.length - 1)];
					if(willAdd == 'amethyst')
						this.pos = Amethysts.list[Math.getRandomInt(0, Diamonds.list.length - 1)];
				}
				if(!this.pos) return (this.path = null);
			}
			let grid = new PF.Grid(
				game.map.forest.width / 100,
				game.map.forest.width / 100
			);
            let finder = new PF.AStarFinder();
            let Stationaries = [...STrees.list, ...Stones.list, ...Irons.list, ...Golds.list, ...Diamonds.list, ...Emeralds.list, ...Amethysts.list, ...CarrotFarms.list, ...CraftingTables.list, ...Walls.list]
            Stationaries.forEach(stationary => grid.setWalkableAt((stationary.x - 50) / 100, (stationary.y - 50) / 100, false))
            Demons.list.filter(e => e != this.pos && e != this).forEach(e => {
                grid.setWalkableAt(Math.roundToDeca(e.body.position.x - 50, 100)/100, Math.roundToDeca(e.body.position.y - 50, 100)/100, false)
            })
            Destroyers.list.filter(e => e != this.pos && e != this).forEach(e => {
                grid.setWalkableAt(Math.roundToDeca(e.body.position.x - 50, 100)/100, Math.roundToDeca(e.body.position.y - 50, 100)/100, false)
            })
            Players.list.filter(e => e != this.pos && e != this).forEach(e => {
                grid.setWalkableAt(Math.roundToDeca(e.body.position.x - 50, 100)/100, Math.roundToDeca(e.body.position.y - 50, 100)/100, false)
            })
			if(this.pos.x) grid.setWalkableAt((this.pos.x - 50) / 100, (this.pos.y - 50) / 100, true);
			let x = Math.roundToDeca(this.body.position.x - 50, 100) / 100;
			let y = Math.roundToDeca(this.body.position.y - 50, 100) / 100;
			let fx = Math.roundToDeca(this.pos.body.position.x - 50, 100) / 100;
			let fy = Math.roundToDeca(this.pos.body.position.y - 50, 100) / 100;
			if(
				x > game.map.forest.width / 100 - 1 ||
				y > game.map.forest.width / 100 - 1 ||
				fx > game.map.forest.width / 100 - 1 ||
				fy > game.map.forest.width / 100 - 1 ||
				x < 0 ||
				y < 0 ||
				fx < 0 ||
				fy < 0
			)
				return (this.path = null);
			this.path = finder.findPath(x, y, fx, fy, grid);
			setTimeout(() => {
				if(Vector.magnitude(this.body.velocity) < 1) this.updatePath(this.pos);
			}, 10000);
			this.curr = 0;
		}
		updateSpd() {
			this.move.att = false;
			if(
				!this.path ||
				!this.path.length ||
				(this.agro.length && !this.agro.find((agro) => agro == this.pos)) ||
				Players.list.find(
					(player) =>
						Vector.getDistance(player.body.position, this.body.position) <
							600 + this.rad &&
						player.score > 700 &&
						!this.pos instanceof Player
				)
			)this.updatePath();
            if(
                Campfires.list.some(
                    campfire => 
                        this.agro.indexOf(this.pos) == -1 && 
                        campfire.lit &&
                        Vector.getDistance(campfire.body.position, this.pos.body.position) < 150 + this.pos.rad)
            ) this.updatePath()
			if(!this.path || !this.path.length) return;
			this.move.ang =
				(Math.atan2(
					this.pos.body.position.y - this.body.position.y,
					this.pos.body.position.x - this.body.position.x
				) *
					180) /
				Math.PI;
			while (this.agro.find((player) => player.health <= 0)) {
				this.agro.splice(
					this.agro.findIndex((element) => element.health <= 0),
					1
				);
			}
			var m = this.move;
			let path = this.path.map((pos) => ({
				x: 100 * pos[0] + 50,
				y: 100 * pos[1] + 50,
			}));
			let n = path[this.curr];
			if(
				!n ||
				this.pos.health <= 0 ||
				Vector.getDistance(this.pos.body.position, path[path.length - 1]) > 500
			)
				this.updatePath();
			if(!this.path || !this.path.length) return;
			path = this.path.map((pos) => ({
				x: 100 * pos[0] + 50,
				y: 100 * pos[1] + 50,
			}));
			n = path[this.curr];
			if(
				Players.list.find(
					(player) =>
						Vector.getDistance(this.hposfr, player.body.position) <
						this.hrad + player.rad
				)
			)
				this.move.att = true;
			else this.move.att = false;
			if(!n) return;
			this.acc = Vector.create(0, 0);

			if(this.body.position.x < n.x) this.acc.x += this._maxSpd / 3500;
			if(this.body.position.x > n.x) this.acc.x -= this._maxSpd / 3500;
			if(this.body.position.y < n.y) this.acc.y += this._maxSpd / 3500;
			if(this.body.position.y > n.y) this.acc.y -= this._maxSpd / 3500;
			if(Vector.getDistance(this.body.position, n) < 70.7 + this.rad) this.curr++;
			Body.applyForce(this.body, this.body.position, this.acc);
		}
		update() {
			if(this.move.run && this.stamina > 0.5 && Vector.magnitude(this.acc) > 0) {
				this._maxSpd = 3;
				this.stamina -= this.maxStamina / 5 / 60;
				this.needsSelfUpdate = true;
			} else if(this.stamina < this.maxStamina) {
				this._maxSpd = 2;
				if(Vector.magnitude(this.acc) <= 0)
					this.stamina += this.maxStamina / 25 / 60;
				else this.stamina += this.maxStamina / 100 / 60;
				this.needsSelfUpdate = true;
			}
			this.health += this.maxStamina / 50 / 60;
			this.damages.forEach((d) => this.handleDamage(d));
			if(this.stamina > this.maxStamina) this.stamina = this.maxStamina;
			if(this.health > this.maxHealth) this.health = this.maxHealth;
			this.updateSpd();
			this.setHands();
			if(Vector.magnitude(this.body.velocity) > this._maxSpd)
				Vector.mult(
					Vector.normalise(this.body.velocity),
					{ x: this._maxSpd, y: this._maxSpd },
					this.body.velocity
				);
			this.targets = [];
			if(this.punch.reload.timer > 0) {
				this.punch.reload.timer--;
			}
			if(this.move.att) {
				this.hit();
			}
		}
		hit() {
			if(this.punch.ready) {
				//if(this.punch.timeout) clearTimeout(this.punch.timeout.timeout)
				this.punch.ready = false;
				let targs = [];
				let rtargs = [];
				let walltargs = [];
				this.punch.timeout = new Timeout(() => {
					this.punch.timeout = null;
					this.punch.ready = true;
					this.lhit = false;
					this.rhit = false;
				}, 1500 / 3);
				Entities.forEach((e) => {
					if(
						e instanceof Player ||
						e instanceof Demon ||
						e instanceof Destroyer ||
						e instanceof Rabbit
					) {
						if(Vector.getDistance(this.hposfr, e.body.position) < e.rad + this.hrad)
							targs.push(e);
					}
					if(
						e instanceof STree ||
						e instanceof Stone ||
						e instanceof Iron ||
						e instanceof Gold ||
						e instanceof Diamond ||
						e instanceof Emerald ||
						e instanceof Amethyst
					) {
						if(Vector.getDistance(this.hposfr, e.body.position) < 50 + this.hrad)
							rtargs.push(e);
					}
					if(
						e instanceof Wall ||
						e instanceof Door ||
						e instanceof Floor ||
						e instanceof CraftingTable ||
						e instanceof CarrotFarm
					) {
						if(
							e instanceof Chest &&
							RectCircleColliding(
								this.hposfr.x,
								this.hposfr.y,
								this.hrad,
								e.body.position.x,
								e.body.position.y,
								e.width,
								e.height
							)
						)
							walltargs.push(e);
						else if(
							!(e instanceof Chest) &&
							RectCircleColliding(
								this.hposfr.x,
								this.hposfr.y,
								this.hrad,
								e.body.position.x,
								e.body.position.y,
								100,
								100
							)
						)
							walltargs.push(e);
					}
				});

				if(this.next == 'l' && this.lhit == false && this.rhit == false) {
					this.lhit = true;
					this.next = 'r';
				} else if(this.next == 'r' && this.lhit == true) {
					this.lhit = false;
				} else if(this.next == 'r' && this.rhit == false) {
					this.rhit = true;
					this.next = 'l';
				} else if(this.next == 'l' && this.rhit == true) {
					this.rhit = false;
				}

				new Timeout(() => {
					targs.forEach((t) => {
						t.takeDamage({
							damage: this.hands.damage,
							type: 'melee',
							length: 1500 / 6,
						});
						if(t.health < 0) {
							if(t instanceof Player) this.kills++;
						}
					});
				}, 2500 / 3);
			}
		}
		getUpdatePack() {
			var pack = {
				x: this.body.position.x,
				y: this.body.position.y,
				id: this.id,
				angle: this.move.ang,
				lhit: this.lhit,
				rhit: this.rhit,
				kills: this.kills,
			};
			if(this.punch.timeout)
				pack.punchper =
					Math.roundToDeci(this.punch.timeout.percntDone, 1000) > 0.95
						? 1
						: Math.roundToDeci(this.punch.timeout.percntDone, 1000);
			return pack;
		}
		setHands() {
			this.hrad = (this.rad / 25) * 7.5;
			this.hposfl = Vector.create(0, (-35.34119409414458 * this.rad) / 25);
			this.hposfl.x =
				Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfl);
			this.hposfl.y =
				Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfl);
			Vector.add(this.body.position, this.hposfl, this.hposfl);

			this.hposfr = Vector.create(0, (-35.34119409414458 * this.rad) / 25);
			this.hposfr.x =
				Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfr);
			this.hposfr.y =
				Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfr);
			Vector.add(this.body.position, this.hposfr, this.hposfr);
		}
		takeDamage(damObj) {
			damObj.timer = new Timeout(() => {
				this.damages.splice(
					this.damages.findIndex((d) => d == damObj),
					1
				);
			}, damObj.length);
			this.damages.push(damObj);
		}
		handleDamage(dam) {
			let toTake;
			if(this.armor) {
				let removePer;
				if(this.armorParts[1] == 'armor') {
					if(this.armorParts[0] == 'iron') removePer = 0.7;
				} else if(this.armorParts[1] == 'garment') {
				}
				this.health -= (dam.damage / (dam.length / (1000 / 60))) * removePer;
			} else {
				this.health -= dam.damage / (dam.length / (1000 / 60));
			}
		}
	}
	class Rabbit extends EventEmitter {
		/**
		 * @param {String} id
		 * @param {String} usr
		 */
		constructor(x, y) {
			super();
			this.rad = 25;
			this.id = Math.random();
			this.body = Bodies.circle(x, y, this.rad, {
				frictionAir: 0.02,
				restitution: 0.15,
			});
			Entities.push(this);
			World.addBody(engine.world, this.body);
			this.bullets = [];
			this.agro = [];
			this.damages = [];
			this.punch = {
				speed: 3,
				ready: true,
				reload: {
					speed: 20,
					timer: 0,
				},
				damage: 1.25,
				health: 1,
			};
			this.hands = {
				l: {
					hit: false,
				},
				r: {
					hit: false,
				},
				damage: 1.25,
			};
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
			this.hrad = (this.rad / 25) * 7.5;
			this.hposfl = Vector.create(0, (-35.34119409414458 * this.rad) / 25);
			this.hposfl.x =
				Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfl);
			this.hposfl.y =
				Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfl);
			Vector.add(this.body.position, this.hposfl, this.hposfl);

			this.hposfr = Vector.create(0, (-35.34119409414458 * this.rad) / 25);
			this.hposfr.x =
				Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfr);
			this.hposfr.y =
				Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfr);
			Vector.add(this.body.position, this.hposfr, this.hposfr);
			this.next = 'l';
			this.lhit = false;
			this.rhit = false;
			this._maxSpd = 2;
			this.health = 5;
			this.maxHealth = 5;
			this.stamina = 20;
			this.maxStamina = 20;
			var self = this;
			this.bulletSpeed = 1;
			this.targets = [];
			this.treetargs = [];
			this.stonetargs = [];
			this.kills = 0;
			this.needsUpdate = false;
			this.needsSelfUpdate = false;
			this.mainHands = 'hand';
			/*this.afkTimer = setTimeout(function () {
                self.dead = true
                setInterval(function () {
                    self.health -= self.maxHealth / 100
                }, 100)
            }, 10000);*/
			this.dead = false;
			game.initPack.rabbit.push({
				x: this.body.position.x,
				y: this.body.position.y,
				id: this.id,
				angle: this.move.ang,
				lhit: this.lhit,
				rhit: this.rhit,
			});
			Rabbits.list.push(this);
			this.pathTimer = null;
		}
		updatePath(pos) {
			if(this.pathTimer) clearTimeout(this.pathTimer);
			if(!pos) {
				this.pos = null;
				this.path = null;
				if(
					CarrotFarms.list.find(
						(cfarm) =>
							Vector.getDistance(cfarm.body.position, this.body.position) <
							700 + this.rad
					)
				) {
					let possible = new Mapper();
					CarrotFarms.list.forEach((cfarm, i) => {
						if(
							Vector.getDistance(cfarm.body.position, this.body.position) <
							700 + this.rad
						)
							possible.set(i, cfarm);
					});
					let dis;
					let nearest;
					if(possible.size) {
						possible.forEach((cfarm, index) => {
							if(!nearest) {
								nearest = index;
								dis = Vector.getDistance(cfarm.body.position, this.body.position);
								return;
							}
							if(Vector.getDistance(cfarm.body.position, this.body.position) < dis) {
								dis = Vector.getDistance(cfarm.body.position, this.body.position);
								nearest = index;
							}
						});
					}
					this.pos = possible.get(nearest);
				} else if(
					Stones.list.length ||
					Irons.list.length ||
					Golds.list.length ||
					Diamonds.list.length ||
					Emeralds.list.length ||
					Amethysts.list.length
				) {
					let canReach = [];
					if(Stones.list.length) canReach.push('stone');
					if(Irons.list.length) canReach.push('iron');
					if(Golds.list.length) canReach.push('gold');
					if(Diamonds.list.length) canReach.push('diamond');
					if(Emeralds.list.length) canReach.push('emerald');
					if(Amethysts.list.length) canReach.push('amethyst');
					let willAdd = canReach[Math.getRandomInt(0, canReach.length - 1)];
					if(willAdd == 'stone')
						this.pos = Stones.list[Math.getRandomInt(0, Stones.list.length - 1)];
					if(willAdd == 'iron')
						this.pos = Irons.list[Math.getRandomInt(0, Irons.list.length - 1)];
					if(willAdd == 'gold')
						this.pos = Golds.list[Math.getRandomInt(0, Golds.list.length - 1)];
					if(willAdd == 'diamond')
						this.pos = Diamonds.list[Math.getRandomInt(0, Diamonds.list.length - 1)];
					if(willAdd == 'emerald')
						this.pos = Emeralds.list[Math.getRandomInt(0, Golds.list.length - 1)];
					if(willAdd == 'amethyst')
						this.pos = Amethysts.list[Math.getRandomInt(0, Diamonds.list.length - 1)];
				}
				if(!this.pos) return (this.path = null);
			}
			let grid = new PF.Grid(
				game.map.forest.width / 100,
				game.map.forest.width / 100
			);
            let finder = new PF.AStarFinder();
            let Stationaries = [...STrees.list, ...Stones.list, ...Irons.list, ...Golds.list, ...Diamonds.list, ...Emeralds.list, ...Amethysts.list, ...CarrotFarms.list, ...CraftingTables.list, ...Walls.list]
            Stationaries.forEach(stationary => grid.setWalkableAt((stationary.x - 50) / 100, (stationary.y - 50) / 100, false))
            Demons.list.filter(e => e != this.pos && e != this).forEach(e => {
                grid.setWalkableAt(Math.roundToDeca(e.body.position.x - 50, 100)/100, Math.roundToDeca(e.body.position.y - 50, 100)/100, false)
            })
            Destroyers.list.filter(e => e != this.pos && e != this).forEach(e => {
                grid.setWalkableAt(Math.roundToDeca(e.body.position.x - 50, 100)/100, Math.roundToDeca(e.body.position.y - 50, 100)/100, false)
            })
            Players.list.filter(e => e != this.pos && e != this).forEach(e => {
                grid.setWalkableAt(Math.roundToDeca(e.body.position.x - 50, 100)/100, Math.roundToDeca(e.body.position.y - 50, 100)/100, false)
            })
			if(this.pos.x)
				grid.setWalkableAt((this.pos.x - 50) / 100, (this.pos.y - 50) / 100, true);
			let x = Math.roundToDeca(this.body.position.x - 50, 100) / 100;
			let y = Math.roundToDeca(this.body.position.y - 50, 100) / 100;
			let fx = Math.roundToDeca(this.pos.body.position.x - 50, 100) / 100;
			let fy = Math.roundToDeca(this.pos.body.position.y - 50, 100) / 100;
			if(
				x > game.map.forest.width / 100 - 1 ||
				y > game.map.forest.width / 100 - 1 ||
				fx > game.map.forest.width / 100 - 1 ||
				fy > game.map.forest.width / 100 - 1 ||
				x < 0 ||
				y < 0 ||
				fx < 0 ||
				fy < 0
			)
				return (this.path = null);
			this.path = finder.findPath(x, y, fx, fy, grid);
			setTimeout(() => {
				if(Vector.magnitude(this.body.velocity) < 0.06) this.updatePath(this.pos);
			}, 10000);
			this.curr = 0;
		}
		updateSpd() {
			this.move.att = false;
			if(
				!this.path ||
				!this.path.length ||
				(this.agro.length && !this.agro.find((agro) => agro == this.pos)) ||
				CarrotFarms.list.find(
					(cfarm) =>
						Vector.getDistance(cfarm.body.position, this.body.position) <
							700 + this.rad && !this.pos instanceof CarrotFarm
				)
			)this.updatePath();
			if(!this.path || !this.path.length) return;
			this.move.ang =
				(Math.atan2(
					this.pos.body.position.y - this.body.position.y,
					this.pos.body.position.x - this.body.position.x
				) *
					180) /
				Math.PI;
			while (this.agro.find((player) => player.health <= 0)) {
				this.agro.splice(
					this.agro.findIndex((element) => element.health <= 0),
					1
				);
			}
			var m = this.move;
			let path = this.path.map((pos) => ({
				x: 100 * pos[0] + 50,
				y: 100 * pos[1] + 50,
			}));
			let n = path[this.curr];
			if(
				!n ||
				this.pos.health <= 0 ||
				Vector.getDistance(this.pos.body.position, path[path.length - 1]) > 500
			)
				this.updatePath();
			if(!this.path || !this.path.length) return;
			path = this.path.map((pos) => ({
				x: 100 * pos[0] + 50,
				y: 100 * pos[1] + 50,
			}));
			n = path[this.curr];
			if(
				CarrotFarms.list.find(
					(cfarm) =>
						Vector.getDistance(this.hposfr, cfarm.body.position) < this.hrad + 70.7
				)
			)
				this.move.att = true;
			else this.move.att = false;
			if(!n) return;
			this.acc = Vector.create(0, 0);

			if(this.body.position.x < n.x) this.acc.x += this._maxSpd / 3500;
			if(this.body.position.x > n.x) this.acc.x -= this._maxSpd / 3500;
			if(this.body.position.y < n.y) this.acc.y += this._maxSpd / 3500;
			if(this.body.position.y > n.y) this.acc.y -= this._maxSpd / 3500;
			if(Vector.getDistance(this.body.position, n) < 70.7 + this.rad) this.curr++;
			Body.applyForce(this.body, this.body.position, this.acc);
		}
		update() {
			if(this.move.run && this.stamina > 0.5 && Vector.magnitude(this.acc) > 0) {
				this._maxSpd = 3;
				this.stamina -= this.maxStamina / 5 / 60;
				this.needsSelfUpdate = true;
			} else if(this.stamina < this.maxStamina) {
				this._maxSpd = 2;
				if(Vector.magnitude(this.acc) <= 0)
					this.stamina += this.maxStamina / 25 / 60;
				else this.stamina += this.maxStamina / 100 / 60;
				this.needsSelfUpdate = true;
			}
			this.damages.forEach((d) => this.handleDamage(d));
			this.health += this.health / 50 / 60;
			if(this.stamina > this.maxStamina) this.stamina = this.maxStamina;
			if(this.health > this.maxHealth) this.health = this.maxHealth;
			this.updateSpd();
			this.setHands();
			if(Vector.magnitude(this.body.velocity) > this._maxSpd)
				Vector.mult(
					Vector.normalise(this.body.velocity),
					{ x: this._maxSpd, y: this._maxSpd },
					this.body.velocity
				);
			this.targets = [];
			if(this.punch.reload.timer > 0) {
				this.punch.reload.timer--;
			}
			if(this.move.att) {
				this.hit();
			}
		}
		hit() {
			if(this.punch.ready) {
				//if(this.punch.timeout) clearTimeout(this.punch.timeout.timeout)
				this.punch.ready = false;
				this.punch.timeout = new Timeout(() => {
					this.punch.timeout = null;
					this.punch.ready = true;
					this.lhit = false;
					this.rhit = false;
				}, 1500 / 3);
				let targs = [];
				CarrotFarms.list.forEach((cfarm) => {
					if(
						Vector.getDistance(cfarm.body.position, this.hposfr) <
						70.7 + this.hrad
					)
						targs.push(cfarm);
				});

				if(this.next == 'l' && this.lhit == false && this.rhit == false) {
					this.lhit = true;
					this.next = 'r';
				} else if(this.next == 'r' && this.lhit == true) {
					this.lhit = false;
				} else if(this.next == 'r' && this.rhit == false) {
					this.rhit = true;
					this.next = 'l';
				} else if(this.next == 'l' && this.rhit == true) {
					this.rhit = false;
				}
				this.punch.reload.timer = this.punch.reload.speed;
				targs.forEach((cfarm) => {
					cfarm.health -= 2.5;
				});
			}
		}
		getUpdatePack() {
			var pack = {
				x: this.body.position.x,
				y: this.body.position.y,
				id: this.id,
				angle: this.move.ang,
				lhit: this.lhit,
				rhit: this.rhit,
			};
			if(this.punch.timeout)
				pack.punchper =
					Math.roundToDeci(this.punch.timeout.percntDone, 1000) > 0.95
						? 1
						: Math.roundToDeci(this.punch.timeout.percntDone, 1000);
			return pack;
		}
		setHands() {
			this.hrad = (this.rad / 25) * 7.5;
			this.hposfl = Vector.create(0, (-35.34119409414458 * this.rad) / 25);
			this.hposfl.x =
				Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfl);
			this.hposfl.y =
				Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfl);
			Vector.add(this.body.position, this.hposfl, this.hposfl);

			this.hposfr = Vector.create(0, (-35.34119409414458 * this.rad) / 25);
			this.hposfr.x =
				Math.cos((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfr);
			this.hposfr.y =
				Math.sin((this.move.ang * Math.PI) / 180) * Vector.magnitude(this.hposfr);
			Vector.add(this.body.position, this.hposfr, this.hposfr);
		}
		takeDamage(damObj) {
			damObj.timer = new Timeout(() => {
				this.damages.splice(
					this.damages.findIndex((d) => d == damObj),
					1
				);
			}, damObj.length);
			this.damages.push(damObj);
		}
		handleDamage(dam) {
			let toTake;
			if(this.armor) {
				let removePer;
				if(this.armorParts[1] == 'armor') {
					if(this.armorParts[0] == 'iron') removePer = 0.85;
				} else if(this.armorParts[1] == 'garment') {
				}
				this.health -= (dam.damage / (dam.length / (1000 / 60))) * removePer;
			} else {
				this.health -= dam.damage / (dam.length / (1000 / 60));
			}
		}
	}

	class Bullet extends mover {
		constructor(id, x, y, angle, stats, parentId) {
			super(id, x, y);
			this.speed = stats.speed;
			this.damage = stats.damage;
			this.health = stats.health;
			this.velocity = Vector.create(0, this.speed);
			this.velocity.setDirection(angle);
			this.timer = 0;
			this.toRemove = false;
			this.parentId = parentId;
			Bullets.list.push(this);
		}
		update() {
			this.health -= 0.01;
			for (var i = 0; i < Players.list.length; i++) {
				var p = Players.list[i];
				if(this.position.getDistance(p.position) < 29 && this.parentId != p.id) {
					p.health -= this.damage;
					this.health -= p.ram;
				}
			}
			for (var i = 0; i < Bullets.list.length; i++) {
				var b = Bullets.list[i];
				if(
					this.position.getDistance(b.position) < 8 &&
					this.parentId != b.parentId
				) {
					b.health -= this.damage;
					this.health -= b.damage;
				}
			}
			this.updatePosition();
		}
	}

	var leaderboard = new Leaderboard([]);
	var STrees = {
		list: [],
		update: function () {
			var pack = [];
			STrees.list.forEach((tree) => {
				if(tree.needsUpdate) pack.push(tree.getUpdatePack());
				if(tree.health <= 0) {
					removePack.tree.push(tree.id);
					clearTimeout(tree.deathTimeout);
					STrees.list.splice(
						STrees.list.findIndex(function (element) {
							return element.id === tree.id;
						}),
						1
					);
					Entities.splice(
						Entities.findIndex((e) => e.id === tree.id),
						1
					);
					World.remove(engine.world, tree.body);
				}
			});
			return pack;
		},
	};
	var Stones = {
		list: [],
		update: function () {
			var pack = [];
			Stones.list.forEach((stone) => {
				if(stone.needsUpdate) pack.push(stone.getUpdatePack());
				if(stone.health <= 0) {
					removePack.stone.push(stone.id);
					clearTimeout(stone.deathTimeout);
					Stones.list.splice(
						Stones.list.findIndex(function (element) {
							return element.id === stone.id;
						}),
						1
					);
					Entities.splice(
						Entities.findIndex((e) => e.id === stone.id),
						1
					);
					World.remove(engine.world, stone.body);
				}
			});
			return pack;
		},
	};
	var Irons = {
		list: [],
		update: function () {
			var pack = [];
			Irons.list.forEach((iron) => {
				if(iron.needsUpdate) pack.push(iron.getUpdatePack());
				if(iron.health <= 0) {
					removePack.iron.push(iron.id);
					clearTimeout(iron.deathTimeout);
					Irons.list.splice(
						Irons.list.findIndex(function (element) {
							return element.id === iron.id;
						}),
						1
					);
					Entities.splice(
						Entities.findIndex((e) => e.id === iron.id),
						1
					);
					World.remove(engine.world, iron.body);
				}
			});

			return pack;
		},
	};
	var Golds = {
		list: [],
		update: function () {
			var pack = [];
			Golds.list.forEach((gold) => {
				if(gold.needsUpdate) pack.push(gold.getUpdatePack());
				if(gold.health <= 0) {
					removePack.gold.push(gold.id);
					clearTimeout(gold.deathTimeout);
					Golds.list.splice(
						Golds.list.findIndex(function (element) {
							return element.id === gold.id;
						}),
						1
					);
					Entities.splice(
						Entities.findIndex((e) => e.id === gold.id),
						1
					);
					World.remove(engine.world, gold.body);
				}
			});
			return pack;
		},
	};
	var Diamonds = {
		list: [],
		update: function () {
			var pack = [];
			Diamonds.list.forEach((diamond) => {
				if(diamond.needsUpdate) pack.push(diamond.getInitPack());
				if(diamond.health <= 0) {
					removePack.diamond.push(diamond.id);
					clearTimeout(diamond.deathTimeout);
					Diamonds.list.splice(
						Diamonds.list.findIndex(function (element) {
							return element.id === diamond.id;
						}),
						1
					);
					Entities.splice(
						Entities.findIndex((e) => e.id === diamond.id),
						1
					);
					World.remove(engine.world, diamond.body);
				}
			});
			return pack;
		},
	};
	var Amethysts = {
		list: [],
		update: function () {
			var pack = [];
			Amethysts.list.forEach((amethyst) => {
				if(amethyst.needsUpdate) pack.push(amethyst.getUpdatePack());
				if(amethyst.health <= 0) {
					removePack.amethyst.push(amethyst.id);
					clearTimeout(amethyst.deathTimeout);
					Amethysts.list.splice(
						Amethysts.list.findIndex(function (element) {
							return element.id === amethyst.id;
						}),
						1
					);
					Entities.splice(
						Entities.findIndex((e) => e.id === amethyst.id),
						1
					);
					World.remove(engine.world, amethyst.body);
				}
			});
			return pack;
		},
	};
	var Emeralds = {
		list: [],
		update: function () {
			var pack = [];
			Emeralds.list.forEach((emerald) => {
				if(emerald.needsUpdate) pack.push(emerald.getInitPack());
				if(emerald.health <= 0) {
					removePack.emerald.push(emerald.id);
					clearTimeout(emerald.deathTimeout);
					Emeralds.list.splice(
						Emeralds.list.findIndex(function (element) {
							return element.id === emerald.id;
						}),
						1
					);
					Entities.splice(
						Entities.findIndex((e) => e.id === emerald.id),
						1
					);
					World.remove(engine.world, emerald.body);
				}
			});
			return pack;
		},
	};
	var CarrotFarms = {
		list: [],
		update: function () {
			var pack = [];
			CarrotFarms.list.forEach((cfarm) => {
				if(cfarm.needsUpdate) pack.push(cfarm.getUpdatePack());
				if(cfarm.health <= 0) {
					removePack.cfarm.push(cfarm.id);
					clearTimeout(cfarm.deathTimeout);
					CarrotFarms.list.splice(
						CarrotFarms.list.findIndex(function (element) {
							return element.id === cfarm.id;
						}),
						1
					);
					Entities.splice(
						Entities.findIndex((e) => e.id === cfarm.id),
						1
					);
					World.remove(engine.world, cfarm.body);
				}
			});
			return pack;
		},
	};
	var Walls = {
		list: [],
		update: function () {
			var pack = [];
			Walls.list.forEach((wall) => {
				if(wall.health <= 0) {
					removePack.wall.push(wall.id);
					if(Players.list.find((p) => p.structures.find((s) => s == wall))) {
						let p = Players.list.find((p) => p.structures.find((s) => s == wall));
						p.structures.splice(
							p.structures.findIndex((s) => s == wall),
							1
						);
					}
					Walls.list.splice(
						Walls.list.findIndex(function (element) {
							return element.id === wall.id;
						}),
						1
					);
					Entities.splice(
						Entities.findIndex((e) => e.id === wall.id),
						1
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
				if(campfire.health <= 0) {
					removePack.campfire.push(campfire.id);
					if(Players.list.find((p) => p.structures.find((s) => s == campfire))) {
						let p = Players.list.find((p) => p.structures.find((s) => s == campfire));
						p.structures.splice(
							p.structures.findIndex((s) => s == campfire),
							1
						);
					}
					Campfires.list.splice(
						Campfires.list.findIndex(function (element) {
							return element.id === campfire.id;
						}),
						1
					);
					Entities.splice(
						Entities.findIndex((e) => e.id === campfire.id),
						1
					);
					World.remove(engine.world, campfire.body);
				}
				if(campfire.needsUpdate) {
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
				if(floor.health <= 0) {
					removePack.floor.push(floor.id);
					if(Players.list.find((p) => p.structures.find((s) => s == floor))) {
						let p = Players.list.find((p) => p.structures.find((s) => s == floor));
						p.structures.splice(
							p.structures.findIndex((s) => s == floor),
							1
						);
					}
					Floors.list.splice(
						Floors.list.findIndex(function (element) {
							return element.id === floor.id;
						}),
						1
					);
					Entities.splice(
						Entities.findIndex((e) => e.id === floor.id),
						1
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
				if(door.health <= 0) {
					removePack.door.push(door.id);
					if(Players.list.find((p) => p.structures.find((s) => s == door))) {
						let p = Players.list.find((p) => p.structures.find((s) => s == door));
						p.structures.splice(
							p.structures.findIndex((s) => s == door),
							1
						);
					}
					if(globalDoors.find((d) => d == door))
						globalDoors.splice(
							globalDoors.findIndex((d) => d == door),
							1
						);
					Doors.list.splice(
						Doors.list.findIndex(function (element) {
							return element.id === door.id;
						}),
						1
					);
					Entities.splice(
						Entities.findIndex((e) => e.id === door.id),
						1
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
				if(ctable.health <= 0) {
					removePack.ctable.push(ctable.id);
					if(Players.list.find((p) => p.structures.find((s) => s == ctable))) {
						let p = Players.list.find((p) => p.structures.find((s) => s == ctable));
						p.structures.splice(
							p.structures.findIndex((s) => s == ctable),
							1
						);
					}
					CraftingTables.list.splice(
						CraftingTables.list.findIndex(function (element) {
							return element.id === ctable.id;
						}),
						1
					);
					Entities.splice(
						Entities.findIndex((e) => e.id === ctable.id),
						1
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
				if(chest.health <= 0) {
					removePack.chest.push(chest.id);
					if(Players.list.find((p) => p.structures.find((s) => s == chest))) {
						let p = Players.list.find((p) => p.structures.find((s) => s == chest));
						p.structures.splice(
							p.structures.findIndex((s) => s == chest),
							1
						);
					}
					Chests.list.splice(
						Chests.list.findIndex(function (element) {
							return element.id === chest.id;
						}),
						1
					);
					Entities.splice(
						Entities.findIndex((e) => e.id === chest.id),
						1
					);
					World.remove(engine.world, chest.body);
				}
			});
			return pack;
		},
	});
	class STree {
		constructor(x, y, baselen = 100) {
			this.x = x;
            this.y = y;
            this.rad = 50;
			this.id = Math.random();
			this.wood = 0;
			this.growInterval = setInterval(() => {
				this.wood += 1;
			}, 1000);
			this.health = 50;
			this.deathTimeout = setTimeout(() => {
				clearTimeout(this.growInterval);
				removePack.tree.push(this.id);
				STrees.list.splice(
					STrees.list.findIndex((element) => element.id === this.id),
					1
				);
				World.remove(engine.world, this.body);
				Entities.splice(
					Entities.findIndex((e) => e.id === this.id),
					1
				);
			}, 300000);
			this.body = Bodies.circle(this.x, this.y, 50, { isStatic: true });
			Entities.push(this);
			World.addBody(engine.world, this.body);
			this.toplayer = 8;
			this.baselen = baselen;
			this.needsUpdate = false;
			//grow(this)
			var pack = {
				x: this.x,
				y: this.y,
				baselen: this.baselen,
				id: this.id,
				dead: this.dead || false,
			};
			STrees.list.push(this);
			game.initPack.tree.push(pack);
		}
		getInitPack() {
			var pack = {
				x: this.x,
				y: this.y,
				baselen: this.baselen,
				id: this.id,
				dead: this.dead || false,
			};
			return pack;
		}
	}
	class Stone {
		constructor(x, y) {
			this.x = x;
			this.y = y;this.rad = 50;
			this.id = Math.random();
			this.health = 100;
			this.deathTimeout = setTimeout(() => {
				clearTimeout(this.growInterval);
				removePack.stone.push(this.id);
				Stones.list.splice(
					Stones.list.findIndex((element) => element.id === this.id),
					1
				);
				Entities.splice(
					Entities.findIndex((e) => e.id === this.id),
					1
				);
				World.remove(engine.world, this.body);
			}, 400000);
			this.body = Bodies.circle(this.x, this.y, 50, { isStatic: true });
			Entities.push(this);
			World.addBody(engine.world, this.body);
			this.needsUpdate = false;
			//grow(this)
			var pack = {
				x: this.x,
				y: this.y,
				id: this.id,
			};
			Stones.list.push(this);
			game.initPack.stone.push(pack);
		}
		getInitPack() {
			return {
				x: this.x,
				y: this.y,
				id: this.id,
			};
		}
	}
	class Iron {
		constructor(x, y) {
			this.x = x;
			this.y = y;this.rad = 50;
			this.id = Math.random();
			this.health = 175;
			this.deathTimeout = setTimeout(() => {
				clearTimeout(this.growInterval);
				removePack.iron.push(this.id);
				Irons.list.splice(
					Irons.list.findIndex((element) => element.id === this.id),
					1
				);
				World.remove(engine.world, this.body);
				Entities.splice(
					Entities.findIndex((e) => e.id === this.id),
					1
				);
			}, 600000);
			this.body = Bodies.circle(this.x, this.y, 50, { isStatic: true });
			Entities.push(this);
			World.addBody(engine.world, this.body);
			this.needsUpdate = false;
			//grow(this)
			var pack = {
				x: this.x,
				y: this.y,
				id: this.id,
			};
			Irons.list.push(this);
			game.initPack.iron.push(pack);
		}
		getInitPack() {
			return {
				x: this.x,
				y: this.y,
				id: this.id,
			};
		}
	}
	class Gold {
		constructor(x, y) {
			this.x = x;
			this.y = y;this.rad = 50;
			this.id = Math.random();
			this.health = 275;
			this.deathTimeout = setTimeout(() => {
				clearTimeout(this.growInterval);
				removePack.gold.push(this.id);
				Golds.list.splice(
					Golds.list.findIndex((element) => element.id === this.id),
					1
				);
				World.remove(engine.world, this.body);
				Entities.splice(
					Entities.findIndex((e) => e.id === this.id),
					1
				);
			}, 800000);
			this.body = Bodies.circle(this.x, this.y, 50, { isStatic: true });
			Entities.push(this);
			World.addBody(engine.world, this.body);
			this.needsUpdate = false;
			//grow(this)
			var pack = {
				x: this.x,
				y: this.y,
				id: this.id,
			};
			Golds.list.push(this);
			game.initPack.gold.push(pack);
		}
		getInitPack() {
			return {
				x: this.x,
				y: this.y,
				id: this.id,
			};
		}
	}
	class Diamond {
		constructor(x, y) {
			this.x = x;
			this.y = y;this.rad = 50;
			this.id = Math.random();
			this.health = 400;
			this.deathTimeout = setTimeout(() => {
				removePack.diamond.push(this.id);
				Diamonds.list.splice(
					Diamonds.list.findIndex((element) => element.id === this.id),
					1
				);
				World.remove(engine.world, this.body);
				Entities.splice(
					Entities.findIndex((e) => e.id === this.id),
					1
				);
			}, 1000000);
			this.body = Bodies.circle(this.x, this.y, 50, { isStatic: true });
			Entities.push(this);
			World.addBody(engine.world, this.body);
			this.needsUpdate = false;
			//grow(this)
			var pack = {
				x: this.x,
				y: this.y,
				id: this.id,
			};
			Diamonds.list.push(this);
			game.initPack.diamond.push(pack);
		}
		getInitPack() {
			return {
				x: this.x,
				y: this.y,
				id: this.id,
			};
		}
	}
	class Emerald {
		constructor(x, y) {
			this.x = x;
			this.y = y;this.rad = 50;
			this.id = Math.random();
			this.health = 275;
			this.deathTimeout = setTimeout(() => {
				clearTimeout(this.growInterval);
				removePack.emerald.push(this.id);
				Emeralds.list.splice(
					Emeralds.list.findIndex((element) => element.id === this.id),
					1
				);
				World.remove(engine.world, this.body);
				Entities.splice(
					Entities.findIndex((e) => e.id === this.id),
					1
				);
			}, 800000);
			this.body = Bodies.circle(this.x, this.y, 50, { isStatic: true });
			Entities.push(this);
			World.addBody(engine.world, this.body);
			this.needsUpdate = false;
			//grow(this)
			var pack = {
				x: this.x,
				y: this.y,
				id: this.id,
			};
			Emeralds.list.push(this);
			game.initPack.emerald.push(pack);
		}
		getInitPack() {
			return {
				x: this.x,
				y: this.y,
				id: this.id,
			};
		}
	}
	class Amethyst {
		constructor(x, y) {
			this.x = x;
			this.y = y;this.rad = 50;
			this.id = Math.random();
			this.health = 400;
			this.deathTimeout = setTimeout(() => {
				removePack.amethyst.push(this.id);
				Amethysts.list.splice(
					Amethysts.list.findIndex((element) => element.id === this.id),
					1
				);
				World.remove(engine.world, this.body);
				Entities.splice(
					Entities.findIndex((e) => e.id === this.id),
					1
				);
			}, 1000000);
			this.body = Bodies.circle(this.x, this.y, 50, { isStatic: true });
			Entities.push(this);
			World.addBody(engine.world, this.body);
			this.needsUpdate = false;
			//grow(this)
			var pack = {
				x: this.x,
				y: this.y,
				id: this.id,
			};
			Amethysts.list.push(this);
			game.initPack.amethyst.push(pack);
		}
		getInitPack() {
			return {
				x: this.x,
				y: this.y,
				id: this.id,
			};
		}
	}
	class CarrotFarm {
		constructor(x, y) {
			this.x = x;
			this.y = y;this.rad = 50;
			this.id = Math.random();
			this.health = 100;
			this.deathTimeout = setTimeout(() => {
				clearTimeout(this.growInterval);
				removePack.cfarm.push(this.id);
				CarrotFarms.list.splice(
					CarrotFarms.list.findIndex((element) => element.id === this.id),
					1
				);
				World.remove(engine.world, this.body);
			}, 400000);
			this.body = Bodies.circle(this.x, this.y, 50, { isStatic: true });
			Entities.push(this);
			World.addBody(engine.world, this.body);
			this.needsUpdate = false;
			//grow(this)
			var pack = {
				x: this.x,
				y: this.y,
				id: this.id,
			};
			CarrotFarms.list.push(this);
			game.initPack.cfarm.push(pack);
		}
		getInitPack() {
			return {
				x: this.x,
				y: this.y,
				id: this.id,
			};
		}
	}
	class Wall {
		constructor(x, y, material) {
			this.x = x;
			this.y = y;this.rad = 50;
			this.id = Math.random();
			this.material = material;

			if(material == 'wood') this.health = 100;
			if(material == 'stone') this.health = 225;
			if(material == 'iron') this.health = 375;
			this.body = Bodies.rectangle(this.x, this.y, 100, 100, { isStatic: true });
			Entities.push(this);
			World.addBody(engine.world, this.body);
			this.needsUpdate = false;
			//grow(this)
			var pack = {
				x: this.x,
				y: this.y,
				id: this.id,
				material: this.material,
			};
			Walls.list.push(this);
			game.initPack.wall.push(pack);
		}
		getInitPack() {
			return {
				x: this.x,
				y: this.y,
				id: this.id,
				material: this.material,
			};
		}
	}
	class Campfire {
		constructor(x, y) {
			this.x = x;
			this.y = y;this.rad = 50;
			this.id = Math.random();
			this.health = 50;
			this.body = Bodies.circle(this.x, this.y, 175 / 12, { isStatic: true });
			Entities.push(this);
			World.addBody(engine.world, this.body);
			this.needsUpdate = false;
			this.lit = false;
			//grow(this)
			var pack = {
				x: this.x,
				y: this.y,
				id: this.id,
				lit: false,
			};
			Campfires.list.push(this);
			game.initPack.campfire.push(pack);
		}
		getInitPack() {
			return {
				x: this.x,
				y: this.y,
				id: this.id,
				lit: this.lit,
			};
		}
	}
	class Floor {
		constructor(x, y, material) {
			this.x = x;
			this.y = y;this.rad = 50;
			this.id = Math.random();
			this.material = material;

			if(material == 'wood') this.health = 75;
			if(material == 'stone') this.health = 150;
			if(material == 'iron') this.health = 275;
			this.body = Bodies.rectangle(this.x, this.y, 100, 100, { isStatic: true });
			Entities.push(this);
			this.needsUpdate = false;
			//grow(this)
			var pack = {
				x: this.x,
				y: this.y,
				id: this.id,
				material: this.material,
			};
			Floors.list.push(this);
			game.initPack.floor.push(pack);
		}
		getInitPack() {
			return {
				x: this.x,
				y: this.y,
				id: this.id,
				material: this.material,
			};
		}
	}
	class Door {
		constructor(x, y, material, ang) {
			this.x = x;
			this.y = y;this.rad = 50;
			this.id = Math.random();
			this.material = material;
			this.ang = ang;
			this.open = false;
			this.opening = false;
			this.opentimer = null;
			if(material == 'wood') this.health = 150;
			if(material == 'stone') this.health = 250;
			if(material == 'stone') this.health = 400;
			this.body = Bodies.rectangle(this.x, this.y, 100, 100, { isStatic: true });
			World.addBody(engine.world, this.body);
			this.needsUpdate = false;
			//grow(this)
			var pack = {
				x: this.x,
				y: this.y,
				id: this.id,
				material: this.material,
				ang: this.ang,
				open: false,
			};
			Entities.push(this);
			Doors.list.push(this);
			game.initPack.door.push(pack);
		}
		openFun() {
			if(this.opening) return;
			this.opentimeout = new Timeout(() => {
				this.open = !this.open;
				this.opening = false;
			}, 1000);
			this.opening = true;

			this.needsUpdate = true;
		}
		update() {
			if((this.ang == 'left' || this.ang == 'right') && this.opening) {
				if(!this.open) {
					let ang = (this.opentimeout.percntDone * 180 * Math.PI) / 180;
					let angle =
						(this.ang == 'left' ? -1 : 1) * ang +
						(this.ang == 'right' ? -1 : 1) * ((45 * Math.PI) / 180);
					Matter.Body.setPosition(
						this.body,
						Matter.Vector.create(
							this.x +
								Math.sin(angle) * 50 * Math.sqrt(2) +
								(this.ang == 'left' ? -1 : 1) * 50,
							this.y +
								(this.ang == 'right' ? -1 : 1) * (Math.cos(angle) * 50 * Math.sqrt(2)) +
								(this.ang == 'left' ? -1 : 1) * 50
						)
					);
					Matter.Body.setAngle(this.body, ang);
				} else {
					let ang = (this.opentimeout.percntDone * 180 * Math.PI) / 180;
					let angle =
						(this.ang == 'right' ? -1 : 1) * ang +
						(this.ang == 'right' ? -1 : 1) * ((45 * Math.PI) / 180);
					Matter.Body.setPosition(
						this.body,
						Matter.Vector.create(
							this.x +
								-(Math.sin(angle) * 50 * Math.sqrt(2)) +
								(this.ang == 'left' ? -1 : 1) * 50,
							this.y +
								-(this.ang == 'right' ? -1 : 1) *
									(Math.cos(angle) * 50 * Math.sqrt(2)) +
								(this.ang == 'left' ? -1 : 1) * 50
						)
					);
					Matter.Body.setAngle(this.body, ang);
				}
			}
			if(this.ang == 'up' && this.opening) {
				if(!this.open) {
					let ang = (this.opentimeout.percntDone * 180 * Math.PI) / 180;
					let angle = -ang - (45 * Math.PI) / 180;
					Matter.Body.setPosition(
						this.body,
						Matter.Vector.create(
							this.x + Math.sin(angle) * 50 * Math.sqrt(2) + 50,
							this.y + Math.cos(angle) * 50 * Math.sqrt(2) - 50
						)
					);
					Matter.Body.setAngle(this.body, ang);
				} else {
					let ang = (this.opentimeout.percntDone * 180 * Math.PI) / 180;
					let angle = ang - (45 * Math.PI) / 180;
					Matter.Body.setPosition(
						this.body,
						Matter.Vector.create(
							this.x + -(Math.sin(angle) * 50 * Math.sqrt(2)) + 50,
							this.y + -(Math.cos(angle) * 50 * Math.sqrt(2)) - 50
						)
					);
					Matter.Body.setAngle(this.body, ang);
				}
			}
			if(this.ang == 'down' && this.opening) {
				if(!this.open) {
					let ang = (this.opentimeout.percntDone * 180 * Math.PI) / 180;
					let angle = -ang - (45 * Math.PI) / 180;
					Matter.Body.setPosition(
						this.body,
						Matter.Vector.create(
							this.x + -(Math.sin(angle) * 50 * Math.sqrt(2)) - 50,
							this.y + -(Math.cos(angle) * 50 * Math.sqrt(2)) + 50
						)
					);
					Matter.Body.setAngle(this.body, ang);
				} else {
					let ang = (this.opentimeout.percntDone * 180 * Math.PI) / 180;
					let angle = ang - (45 * Math.PI) / 180;
					Matter.Body.setPosition(
						this.body,
						Matter.Vector.create(
							this.x + Math.sin(angle) * 50 * Math.sqrt(2) - 50,
							this.y + Math.cos(angle) * 50 * Math.sqrt(2) + 50
						)
					);
					Matter.Body.setAngle(this.body, ang);
				}
			}
		}
		getInitPack() {
			let pack = {
				x: this.x,
				y: this.y,
				id: this.id,
				material: this.material,
				ang: this.ang,
				open: this.open,
			};
			if(this.opening)
				pack.per =
					Math.roundToDeci(this.opentimeout.percntDone, 1000) > 0.97
						? 1
						: Math.roundToDeci(this.opentimeout.percntDone, 1000);
			return pack;
		}
		getUpdatePack() {
			let pack = {
				id: this.id,
				open: this.open,
			};
			if(this.opening)
				pack.per =
					Math.roundToDeci(this.opentimeout.percntDone, 1000) > 0.97
						? 1
						: Math.roundToDeci(this.opentimeout.percntDone, 1000);
			return pack;
		}
	}
	class Chest {
		constructor(x, y, ang) {
			this.x = x;
			this.y = y;this.rad = 50;
			this.ang = ang;
			this.id = Math.random();
			this.health = 50;
			if(ang == 'left' || ang == 'right') {
				this.body = Bodies.rectangle(this.x, this.y, 50, 95, { isStatic: true });
				this.width = 50;
				this.height = 95;
			} else {
				this.body = Bodies.rectangle(this.x, this.y, 95, 50, { isStatic: true });
				this.height = 50;
				this.wdith = 95;
			}
			Entities.push(this);
			World.addBody(engine.world, this.body);
			this.needsUpdate = false;
			this.storage = new Storage(null, 9);
			var pack = {
				x: this.x,
				y: this.y,
				id: this.id,
				ang: this.ang,
			};
			Chests.list.push(this);
			game.initPack.chest.push(pack);
		}
		getInitPack() {
			return {
				x: this.x,
				y: this.y,
				id: this.id,
			};
		}
	}
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
				if(Players.list.length > 0) {
					var player = Players.list.find(function (element) {
						return element.id === id;
					});
					if(player) {
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
						if(!data.pressingAttack && !data.prot && !data.grab)
							player.alusd = false;
						player.move.att = data.pressingAttack;
						//io.emit("chat message", {usrnm:"SERVER",msg:data.angle})
						player.move.ang = data.angle;
						player.move.grab = data.grab;
						player.move.mdis = Math.abs(data.mousedis);
						if(data.prot) {
							if(player.alusd) return;
							player.move.prot = true;
							player.alusd = true;
							if(player.pang == 'up') player.pang = 'right';
							else if(player.pang == 'right') player.pang = 'down';
							else if(player.pang == 'down') player.pang = 'left';
							else if(player.pang == 'left') player.pang = 'up';
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

				if(player.health <= 0) {
					player.emit('death');
					if(player.token) {
						let collapsauserbase = mLab.databases
							.get('collapsa')
							.collections.get('collapsauserbase');
						if(
							collapsauserbase.findDocument((doc) => doc.data.token == player.token)
						) {
							let user = collapsauserbase.findDocument(
								(doc) => doc.data.token == player.token
							);
							let newDoc = Object.assign({}, user.data);
							if(newDoc.highscore < player.score) {
								newDoc.highscore = player.score;
								collapsauserbase.updateDocument(newDoc);
							}
						}
					}
					if(Players.list.length > 1) removePack.player.push(player.id);
					Players.list.splice(
						Players.list.findIndex(function (element) {
							return element.id === player.id;
						}),
						1
					);

					Entities.splice(
						Entities.findIndex((e) => e.id === player.id),
						1
					);
					World.remove(engine.world, player.body);
					leaderboard.removePlayer(player.id);
					player.structures.forEach((s) => (s.health = 0));
					if(player.clan) player.clan.removeMember(player);
					let toDrop = player.inventory.findAll((slot) => slot !== 'empty');
					toDrop.forEach((slot, i) => {
						let a = 360 / toDrop.length;
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
									1
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
	var Demons = {
		list: [],
		update: () => {
			var pack = [];
			for (var i = 0; i < Demons.list.length; i++) {
				/**
				 * @type {Player}
				 */
				var demon = Demons.list[i];
				//demon.update();
				if(timeOfDay == 'day') {
					3;
					4;
					demon.hands.damage = dayTimeout.percntDone * 1 + 0.5;
					demon.maxHealth = dayTimeout.percntDone * 15 + 5;
					demon._maxSpd = (-2 * Math.abs(dayTimeout.percntDone - 0.5) + 1) * 1 + 1;
				} else {
					demon.hands.damage =
						2 + (-2 * Math.abs(dayTimeout.percntDone - 0.5) + 1) * 2;
					demon._maxSpd = 2 + (-2 * Math.abs(dayTimeout.percntDone - 0.5) + 1) * 2;
				}
				if(demon.health <= 0) {
					demon.emit('death');
					removePack.demon.push(demon.id);
					Demons.list.splice(
						Demons.list.findIndex(function (element) {
							return element.id === demon.id;
						}),
						1
					);
					Entities.splice(
						Entities.findIndex((e) => e.id === demon.id),
						1
					);
					World.remove(engine.world, demon.body);
					/*let toDrop = demon.inventory.findAll(slot => slot !== 'empty') 
                    toDrop.forEach((slot, i) => {
                        let a = 360/toDrop.length
                        let ang = a * i + 77
                        let offset = Vector.create(0, demon.rad + 20)
                        
                        offset.x = Math.cos(ang * Math.PI / 180) * Vector.magnitude(offset);
                        offset.y = Math.sin(ang * Math.PI / 180) * Vector.magnitude(offset);
                        Vector.add(demon.body.position, offset, offset)
                        let self = {
                            item:slot,
                            x:offset.x,
                            y:offset.y, 
                            timeout:new Timeout(() => {
                                dropped.splice(dropped.findIndex(function (element) {
                                    return element === self
                                }), 1);
                            }, 5000)
                        }
                        dropped.push(self)
                    })
                    */
				}
				pack.push(demon.getUpdatePack());
			}
			return pack;
		},
	};
	var Destroyers = {
		list: [],
		update: () => {
			var pack = [];
			Destroyers.list.forEach((destroyer) => {});
			for (var i = 0; i < Destroyers.list.length; i++) {
				/**
				 * @type {Player}
				 */
				var demon = Destroyers.list[i];
				//demon.update();
				if(timeOfDay == 'day') {
					demon.hands.damage = dayTimeout.percntDone * 1 + 0.5;
					demon.maxHealth = dayTimeout.percntDone * 25 + 5;
					demon._maxSpd = (-2 * Math.abs(dayTimeout.percntDone - 0.5) + 1) * 0.5 + 1;
				} else {
					demon.hands.damage =
						4 + (-2 * Math.abs(dayTimeout.percntDone - 0.5) + 1) * 2;
					demon._maxSpd = 1.75 + (-2 * Math.abs(dayTimeout.percntDone - 0.5) + 1);
				}
				if(demon.health <= 0 && timeOfDay == 'night') {
					let drops = [
						new Slot('diamond', 5, 'diamond'),
						new Slot('diamond', 5, 'diamond'),
						new Slot('diamond', 5, 'diamond'),
						new Slot('diamond', 5, 'diamond'),
					];
					let toDrop = drops;
					toDrop.forEach((slot, i) => {
						let a = 360 / toDrop.length;
						let ang = a * i + 77;
						let offset = Vector.create(0, demon.rad + 20);

						offset.x = Math.cos((ang * Math.PI) / 180) * Vector.magnitude(offset);
						offset.y = Math.sin((ang * Math.PI) / 180) * Vector.magnitude(offset);
						Vector.add(demon.body.position, offset, offset);
						let self = {
							item: slot,
							x: offset.x,
							y: offset.y,
							timeout: new Timeout(() => {
								dropped.splice(
									dropped.findIndex(function (element) {
										return element === self;
									}),
									1
								);
							}, 20000),
						};
						dropped.push(self);
					});
				}
				if(demon.health <= 0) {
					removePack.destroyer.push(demon.id);
					Destroyers.list.splice(
						Destroyers.list.findIndex(function (element) {
							return element.id === demon.id;
						}),
						1
					);
					Entities.splice(
						Entities.findIndex((e) => e.id === demon.id),
						1
					);
					World.remove(engine.world, demon.body);
				}
				pack.push(demon.getUpdatePack());
			}
			return pack;
		},
	};
	var Rabbits = {
		list: [],
		update: () => {
			var pack = [];
			Rabbits.list.forEach((rabbit) => {
				if(rabbit.health <= 0) {
					removePack.rabbit.push(rabbit.id);
					Rabbits.list.splice(
						Rabbits.list.findIndex(function (element) {
							return element.id === rabbit.id;
						}),
						1
					);
					Entities.splice(
						Entities.findIndex((e) => e.id === rabbit.id),
						1
					);
					World.remove(engine.world, rabbit.body);
					let drops = [
						new Slot('carrot', 5, 'carrot', 25, false, true),
						new Slot('carrot', 5, 'carrot', 25, false, true),
						new Slot('carrot', 5, 'carrot', 25, false, true),
						new Slot('carrot', 5, 'carrot', 25, false, true),
					];
					let toDrop = drops;
					toDrop.forEach((slot, i) => {
						let a = 360 / toDrop.length;
						let ang = a * i + 77;
						let offset = Vector.create(0, rabbit.rad + 20);

						offset.x = Math.cos((ang * Math.PI) / 180) * Vector.magnitude(offset);
						offset.y = Math.sin((ang * Math.PI) / 180) * Vector.magnitude(offset);
						Vector.add(rabbit.body.position, offset, offset);
						let self = {
							item: slot,
							x: offset.x,
							y: offset.y,
							timeout: new Timeout(() => {
								dropped.splice(
									dropped.findIndex(function (element) {
										return element === self;
									}),
									1
								);
							}, 5000),
						};
						dropped.push(self);
					});
				}
				pack.push(rabbit.getUpdatePack());
			});
			return pack;
		},
	};
	var Bullets = {
		list: [],
		update: function () {
			var pack = [];
			for (var i in Bullets.list) {
				/**
				 * @type {Bullet}
				 */
				var bullet = Bullets.list[i];
				if(typeof bullet === 'function' || typeof bullet === 'undefined') {
				} else {
					bullet.update();
					if(bullet.health <= 0) {
						Bullets.list.splice(
							Bullets.list.findIndex(function (element) {
								return element.id === bullet.id;
							}),
							1
						);
					} else {
						pack.push({
							x: Math.round(bullet.position.x),
							y: Math.round(bullet.position.y),
						});
					}
				}
			}
			return pack;
		},
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
		demon: [],
		destroyer: [],
		ctable: [],
		cfarm: [],
		rabbit: [],
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
		demon: [],
		destroyer: [],
		ctable: [],
		cfarm: [],
		rabbit: [],
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
			this.bottomRight = new Wall(
				x + (width - 1) * 100,
				y + (height - 1) * 100,
				'stone'
			);
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
				if(i == 3) {
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
	let getGoodPosition = () => {
		let tempx = Math.getRandomInt(0, game.map.forest.width / 100 - 1) * 100 + 50;
		let tempy = Math.getRandomInt(0, game.map.forest.height / 100 - 1) * 100 + 50;
		let inWay = false;
		Entities.forEach((e) => {
			if(
				(e.body.position.x == tempx && e.body.position.y == tempy) ||
				(e instanceof Player &&
					Vector.getDistance({ x: tempx, y: tempy }, e.body.position) <= 150)
			)
				inWay = true;
		});
		while (inWay) {
			tempx = Math.getRandomInt(0, game.map.forest.width / 100 - 1) * 100 + 50;
			tempy = Math.getRandomInt(0, game.map.forest.height / 100 - 1) * 100 + 50;
			inWay = false;
			Entities.forEach((e) => {
				if(
					(e.body.position.x == tempx && e.body.position.y == tempy) ||
					(e instanceof Player &&
						Vector.getDistance({ x: tempx, y: tempy }, e.body.position) <= 150)
				)
					inWay = true;
			});
		}
		return {
			x: tempx,
			y: tempy,
		};
	};
	setInterval(function () {
		let canAdd = [];
		if(STrees.list.length < 12) {
			let p = getGoodPosition();
			new STree(p.x, p.y, 50);
		}
		if(Stones.list.length < 7) {
			let p = getGoodPosition();
			new Stone(p.x, p.y, 50);
		}
		if(Irons.list.length < 6) {
			let p = getGoodPosition();
			new Iron(p.x, p.y, 50);
		}
		if(Golds.list.length < 3) {
			let p = getGoodPosition();
			new Gold(p.x, p.y, 50);
		}
		if(Diamonds.list.length < 2) {
			let p = getGoodPosition();
			new Diamond(p.x, p.y, 50);
		}
		if(Emeralds.list.length < 1) {
			let p = getGoodPosition();
			new Emerald(p.x, p.y, 50);
		}
		if(Amethysts.list.length < 1) {
			let p = getGoodPosition();
			new Amethyst(p.x, p.y, 50);
		}
		if(Players.list.some((player) => player.score > 700)) {
			if(Demons.list.length < 3 && timeOfDay == 'night') {
				let p = getGoodPosition();
				new Demon(p.x, p.y, 50);
			}
			if(
				Destroyers.list.length < 1 &&
				timeOfDay == 'night' &&
				dayTimeout.percntDone > 0.25 &&
				dayTimeout.percntDone < 0.75
			) {
				let p = getGoodPosition();
				new Destroyer(p.x, p.y, 50);
			}
		}
		if(CarrotFarms.list.length < 3) {
			let p = getGoodPosition();
			new CarrotFarm(p.x, p.y, 50);
		}
		if(Rabbits.list.length < 1 && timeOfDay == 'day') {
			let p = getGoodPosition();
			new Rabbit(p.x, p.y, 50);
		}
	}, 10);
	this.nsp.on('connection', function (socket) {
		socket.emit('images', images);
		socket.emit('items', [BasicRecipes, TableRecipes, Resources]);
		socket.on('log', (log) => console.log(log));
		socket.on('startInitPackReq', () => {
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
				demon: [],
				destroyer: [],
				ctable: [],
				cfarm: [],
				rabbit: [],
				chest: [],
				emerald: [],
				amethyst: [],
			};
			Players.list.forEach(function (player) {
				pack.player.push(player.getUpdatePack());
			});
			Stones.list.forEach((stone) => pack.stone.push(stone.getInitPack()));
			STrees.list.forEach((tree) => pack.tree.push(tree.getInitPack()));
			Irons.list.forEach((iron) => pack.iron.push(iron.getInitPack()));
			Golds.list.forEach((gold) => pack.gold.push(gold.getInitPack()));
			Diamonds.list.forEach((diamond) => pack.diamond.push(diamond.getInitPack()));
			Emeralds.list.forEach((gold) => pack.emerald.push(gold.getInitPack()));
			Amethysts.list.forEach((diamond) =>
				pack.amethyst.push(diamond.getInitPack())
			);
			Walls.list.forEach((wall) => pack.wall.push(wall.getInitPack()));
			Doors.list.forEach((door) => pack.door.push(door.getInitPack()));
			Floors.list.forEach((floor) => pack.floor.push(floor.getInitPack()));
			Campfires.list.forEach((campfire) =>
				pack.campfire.push(campfire.getInitPack())
			);
			CraftingTables.list.forEach((ctable) =>
				pack.ctable.push(ctable.getInitPack())
			);
			Chests.list.forEach((chest) => pack.chest.push(chest.getInitPack()));
			CarrotFarms.list.forEach((cfarm) => pack.cfarm.push(cfarm.getInitPack()));
			Rabbits.list.forEach((rabbit) => pack.rabbit.push(rabbit.getUpdatePack()));
			Demons.list.forEach(function (demon) {
				pack.demon.push(demon.getUpdatePack());
			});
			Destroyers.list.forEach(function (demon) {
				pack.destroyer.push(demon.getUpdatePack());
			});
			let playa;
			if((playa = Players.list.find((p) => p.id == socket.id))) {
				game.nsp.to(socket.id).emit('initPack', pack);
				game.nsp.to(socket.id).emit('selfUpdate', playa.getSelfUpdatePack());
			} else {
				game.nsp.to(socket.id).emit('error', 'game_start');
			}
		});
		socket.on('clan', () => {
			let playa = Players.list.find((player) => player.id == socket.id);
			if(!playa) return;
			playa.clanning = !playa.clanning;
			playa.needsSelfUpdate = true;
		});
		socket.on('recon', (id) => {
			let playa = Players.list.find((p) => p.id == id);
			if(!playa) return;
			playa.id = socket.id;
			playa.socket = socket;
			game.nsp.to(socket.id).emit('selfUpdatePack', playa.getSelfUpdatePack());
			game.nsp.to('recon');
		});
		socket.on('createClan', (name) => {
			if(clans.get(name)) return;
			if(clans.size >= 6) return;
			Players.list.find((player) => player.id == socket.id).clan = new Clan(
				name,
				Players.list.find((player) => player.id == socket.id)
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
			if(playa == playa.clan.owner) {
				playa.clan.acceptReq();
				playa.socket.emit('selfUpdate', playa.getSelfUpdatePack());
			}
		});
		socket.on('denyReq', () => {
			let playa = Players.list.find((player) => player.id == socket.id);
			if(playa == playa.clan.owner) playa.clan.denyReq();
		});
		socket.on('removeMember', (id) => {
			let playa = Players.list.find((player) => player.id == socket.id);
			if(playa == playa.clan.owner)
				playa.clan.removeMember(Players.list.find((player) => player.id == id));
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
			if(!playa) return;
			let slot = playa.inventory.get(slotnum);
			if(playa.chesting) {
				let res = playa.chest.storage.addItemMax(playa.inventory.get(slotnum));
				if(res) playa.inventory.set(slotnum, res);
				else playa.inventory.set(slotnum, 'empty');
				return;
			}
			if(playa.mainHand == slotnum) return (playa.mainHand = '-1');
			if(slot.armorable) {
				if(playa.armor) {
					playa.inventory.set(slotnum, playa.armor);
					playa.changeArmor(slot);
				} else {
					playa.inventory.set(slotnum, 'empty');
					playa.changeArmor(slot);
				}
			}
			if(slot.equipable || slot.edible) return (playa.mainHand = slotnum);
		});
		socket.on('swap', ([slotnum, toSwap]) => {
			slotnum = slotnum.toString();
			toSwap = toSwap.toString();
			let playa = Players.list.find((player) => player.id == socket.id);
			if(!playa) return;
			let swapSlot = playa.inventory.get(slotnum);
			let sSwapSlot = playa.inventory.get(toSwap);
			playa.inventory.set(slotnum, sSwapSlot);
			playa.inventory.set(toSwap, swapSlot);
			if(playa.mainHand == slotnum || playa.mainHand == toSwap)
				playa.mainHand = '-1';
		});
		socket.on('unequip', (type) => {
			let playa = Players.list.find((player) => player.id == socket.id);
			if(!playa) return;
			if(type == 'armor') {
				playa.needsSelfUpdate == 'false';
				if(playa.chesting) {
					let res = playa.chest.storage.addItemMax(playa.armor);
					if(!res) return (playa.armor = false);
				}
				let res = playa.inventory.addItemMax(playa.armor);
				if(res) return;
				playa.armor = false;
			}
		});
		socket.on('rc', (slotnum) => {
			slotnum = slotnum.toString();
			let playa = Players.list.find((player) => player.id == socket.id);
			let slot = playa.inventory.get(slotnum);
			if(slot == 'empty') return;
			let self = {
				item: slot,
				x: playa.body.position.x,
				y: playa.body.position.y,
				timeout: new Timeout(() => {
					dropped.splice(
						dropped.findIndex(function (element) {
							return element === self;
						}),
						1
					);
				}, 20000),
			};
			dropped.push(self);
			playa.inventory.set(slotnum, 'empty');
			if(playa.mainHand == slotnum) playa.mainHand = '-1';
			playa.needsSelfUpdate = true;
		});
		socket.on('lcChest', (slotnum) => {
			slotnum = slotnum.toString();
			let playa = Players.list.find((player) => player.id == socket.id);
			if(!playa) return;
			let slot = playa.inventory.get(slotnum);
			if(playa.hitting || playa.punch.timeout || playa.eating || slot == ' ')
				return;
			if(playa.chesting) {
				let res = playa.inventory.addItemMax(playa.chest.storage.get(slotnum));
				if(res) playa.chest.storage.set(slotnum, res);
				else playa.chest.storage.set(slotnum, 'empty');
				return;
			}
		});
		socket.on('rcChest', (slotnum) => {
			slotnum = slotnum.toString();
			let playa = Players.list.find((player) => player.id == socket.id);
			let slot = playa.chest.storage.get(slotnum);
			if(slot == 'empty') return;
			let self = {
				item: slot,
				x: playa.chest.body.position.x + Math.random() * 100,
				y: playa.chest.body.position.y + Math.random() * 100,
				timeout: new Timeout(() => {
					dropped.splice(
						dropped.findIndex(function (element) {
							return element === self;
						}),
						1
					);
				}, 20000),
			};
			dropped.push(self);
			playa.chest.storage.set(slotnum, 'empty');
		});
		socket.on('chat', (msg) => {
			let playa = Players.list.find((player) => player.id == socket.id);
			if(!playa) return;
			if(msg.startsWith('c:')) {
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
						let player =
							leaderboard.list[num - 1] ||
							Players.list.find((player) => player.id == socket.id);
						player.score = score;
					},
					setImmortal: (num) => {
						let player =
							leaderboard.list[num - 1] ||
							Players.list.find((player) => player.id == socket.id);
						if(player.immortal) {
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
						let player =
							leaderboard.list[num - 1] ||
							Players.list.find((player) => player.id == socket.id);
						player.inventory.addItemMax(new Slot(...item));
					},
					killAll: () => {
						let playa = Players.list.find((player) => player.id == socket.id);
						let players = Players.list.filter(
							(player) => player.adminLevel < playa.adminLevel
						);
						players.forEach((player) => (player.health = -100000000000000));
					},
				};
				msg = msg.substring(msg.indexOf(':') + 1);
				if(playa.admin) {
					eval(`commands.${msg}`);
				}
				//This is my admin key
				//Jeremy has one too
				//What should yours do?
				//basically if i type c:giveAdmin(knightmare), it gives me all those items.
				//amethyst items are fot admins only and they are faster do more damage
				if(msg == 'giveAdmin(logos)') {
					playa.inventory.set(
						'1',
						new Slot('Amethyst Sword', 1, 'amethystsword', 1, true)
					);
					playa.inventory.set(
						'2',
						new Slot('Amethyst Pickaxe', 1, 'amethystpickaxe', 1, true)
					);
					playa.inventory.set(
						'3',
						new Slot('Amethyst Axe', 1, 'amethystaxe', 1, true)
					);
					playa.inventory.set(
						'4',
						new Slot('Amethyst Hammer', 1, 'amethysthammer', 1, true)
					);
					playa.inventory.set(
						'5',
						new Slot('Iron Shovel', 1, 'ironshovel', 1, true)
					);
					playa.inventory.set('6', 'empty');
					playa.inventory.set('7', new Slot('iron', 255, 'iron', 255, false));
					playa.inventory.set('8', new Slot('stone', 255, 'stone', 255, false));
					playa.inventory.set('9', new Slot('wood', 255, 'draw', 255, false));
					playa.admin = true;
					playa.adminLevel = 100;
					playa.needsSelfUpdate = true;
				} else if(msg == '') {
					playa.inventory.set(
						'1',
						new Slot('Amethyst Sword', 1, 'amethystsword', 1, true)
					);
					playa.inventory.set(
						'2',
						new Slot('Amethyst Pickaxe', 1, 'amethystpickaxe', 1, true)
					);
					playa.inventory.set(
						'3',
						new Slot('Amethyst Axe', 1, 'amethystaxe', 1, true)
					);
					playa.inventory.set(
						'4',
						new Slot('Amethyst Hammer', 1, 'amethysthammer', 1, true)
					);
					playa.inventory.set(
						'5',
						new Slot('Iron Shovel', 1, 'ironshovel', 1, true)
					);
					playa.inventory.set('6', 'empty');
					playa.inventory.set('7', new Slot('iron', 255, 'iron', 255, false));
					playa.inventory.set('8', new Slot('stone', 255, 'stone', 255, false));
					playa.inventory.set('9', new Slot('wood', 255, 'draw', 255, false));
					playa.admin = true;
					playa.adminLevel = 100;
					playa.needsSelfUpdate = true;
				}
				if(msg == 'giveAdmin(w4ff135)') {
					playa.admin = true;
					playa.adminLevel = 1;
					playa.needsSelfUpdate = true;
				}
				if(msg == 'giveAdmin(honk*honk)') {
					playa.admin = true;
					playa.adminLevel = 2;
					playa.needsSelfUpdate = true;
				}
				if(msg == 'giveAdmin(feldtiv)') {
					playa.admin = true;
					playa.adminLevel = 2;
					playa.needsSelfUpdate = true;
				}
				if(msg.startsWith('deleteItems ')) {
					msg = msg.substring(msg.indexOf(' ') + 1);
					let place = parseInt(msg);
					let playa = leaderboard.list[place - 1];
					if(!playa) return;
					playa.inventory = new Inventory();
					playa.needsSelfUpdate = true;
				}
				return;
			}
			if(msg.length > 100) msg = msg.substring(0, 60);
			let msgID = Math.random();
			let msgObj = {
				timeout: new Timeout(() => {
					if(playa.msg.get(msgID)) playa.msg.delete(msgID);
				}, 5000),
				msg: msg,
			};
			if(playa.msg.size > 1) {
				playa.msg.delete(playa.msg.keys().next().value);
			}
			playa.msg.set(msgID, msgObj);
		});
		socket.on('new player', function ({ usr, token }) {
			console.log('New Player');
			var uppedTrees = STrees.update();
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
				demon: [],
				destroyer: [],
				ctable: [],
				cfarm: [],
				rabbit: [],
				chest: [],
				emerald: [],
				amethyst: [],
			};
			Players.list.forEach(function (player) {
				pack.player.push(player.getUpdatePack());
			});
			Stones.list.forEach((stone) => pack.stone.push(stone.getInitPack()));
			STrees.list.forEach((tree) => pack.tree.push(tree.getInitPack()));
			Irons.list.forEach((iron) => pack.iron.push(iron.getInitPack()));
			Golds.list.forEach((gold) => pack.gold.push(gold.getInitPack()));
			Diamonds.list.forEach((diamond) => pack.diamond.push(diamond.getInitPack()));
			Emeralds.list.forEach((gold) => pack.emerald.push(gold.getInitPack()));
			Amethysts.list.forEach((diamond) =>
				pack.amethyst.push(diamond.getInitPack())
			);
			Walls.list.forEach((wall) => pack.wall.push(wall.getInitPack()));
			Doors.list.forEach((door) => pack.door.push(door.getInitPack()));
			Floors.list.forEach((floor) => pack.floor.push(floor.getInitPack()));
			Campfires.list.forEach((campfire) =>
				pack.campfire.push(campfire.getInitPack())
			);
			CraftingTables.list.forEach((ctable) =>
				pack.ctable.push(ctable.getInitPack())
			);
			Chests.list.forEach((chest) => pack.chest.push(chest.getInitPack()));
			CarrotFarms.list.forEach((cfarm) => pack.cfarm.push(cfarm.getInitPack()));
			Rabbits.list.forEach((rabbit) => pack.rabbit.push(rabbit.getUpdatePack()));
			Demons.list.forEach(function (demon) {
				pack.demon.push(demon.getUpdatePack());
			});
			Destroyers.list.forEach(function (demon) {
				pack.destroyer.push(demon.getUpdatePack());
			});

			/*
            Bullets.list.forEach(function(bullet){
                pack.bullet.push(bulle)
            })*/
			Players.onConnect(socket.id, socket, usr, token);
			this.nsp.to(socket.id).emit('initPack', pack);
		});
	});
	globalDoors.push(new Door(150, 150, 'stone', 'left'));
	//c.storage.set('7', new Slot('Stone Sword', 1, 'stonesword', 1, true))
	setInterval(() => {
		Demons.list.forEach((d) => {
			if(
				Players.list.find(
					(player) =>
						Vector.getDistance(d.body.position, player.body.position) < 1500
				)
			)
				d.update();
		});
		Destroyers.list.forEach((des) => {
			if(
				Players.list.find(
					(player) =>
						Vector.getDistance(des.body.position, player.body.position) < 1500
				)
			)
				des.update();
		});
		Rabbits.list.forEach((rabbit) => {
			if(
				Players.list.find(
					(player) =>
						Vector.getDistance(rabbit.body.position, player.body.position) < 1500
				)
			)
				rabbit.update();
		});
	}, 1000 / 60);
	setInterval(() => {
		Players.update();
	}, 1000 / 60);
	setInterval(function () {
		if(Players.list[0] === undefined) return;
		Engine.update(engine);
		leaderboard.update();
		let pack = {
			player: Players.getPack(),
			demon: Demons.update(),
			destroyer: Destroyers.update(),
			bullet: Bullets.update(),
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
			rabbit: Rabbits.update(),
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
			if(alr === true) return;
			if(game.initPack[prop].length > 0) {
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
					demon: [],
					destroyer: [],
					ctable: [],
					cfarm: [],
					rabbit: [],
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
				if(
					prop !== 'leaderboard' &&
					prop !== 'dropped' &&
					prop !== 'tod' &&
					prop !== 'per' &&
					prop !== 'ctable' &&
					Array.isArray(personal[prop])
				) {
					if(prop == 'door') {
						personal[prop] = personal[prop].filter((es) => {
							let e = Doors.list.find((d) => d.id == es.id);
							if(!e) return false;
							return (
								Math.abs(playa.body.position.y - e.y) < 500 &&
								Math.abs(playa.body.position.x - e.x) < 800
							);
						});
					} else {
						personal[prop] = personal[prop].filter(
							(e) =>
								Math.abs(playa.body.position.y - e.y) < 500 &&
								Math.abs(playa.body.position.x - e.x) < 800
						);
					}
				}
			}
			self.nsp.to(playa.id).emit('state', personal);
		});
		alr = false;
		for (let prop in removePack) {
			if(alr === true) return;
			if(removePack[prop].length > 0) {
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
					demon: [],
					destroyer: [],
					campfire: [],
					ctable: [],
					cfarm: [],
					rabbit: [],
					chest: [],
					emerald: [],
					amethyst: [],
				};
			}
		}
	}, 1000 / 60);
	this.STrees = STrees;
	this.Stones = Stones;
	this.Irons = Irons;
	this.Golds = Golds;
	this.Walls = Walls;
	this.Diamonds = Diamonds;
	this.Bullet = Bullet;
	this.Bullets = Bullets;
	this.Player = Player;

	this.Players = Players;
	global.games.push(this);
};
process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);