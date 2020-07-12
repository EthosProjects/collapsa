const { World, Bodies } = require('matter-js')
const { EventEmitter } = require('events')
class Entity extends EventEmitter {
    constructor(body, health, game) {
        super()
        this.body = body
        this.health = health
        this.maxHealth = health
        this.needsUpdate = false
        this.id = Math.random();
        this.damages = []
        this.game = game;
        const { Entities, engine } = this.game
        Entities.push(this);
        World.addBody(engine.world, this.body);
    }
    takeDamage(damObj) {
        damObj.timer = new Timeout(() => {
            this.damages.splice(
                this.damages.findIndex(d => d == damObj),
                1
            );
        }, damObj.length);
        this.damages.push(damObj);
    }
    handleDamage(dam) {
        let toTake;
        this.health -= (dam.damage / (dam.length / (1000 / 60)))
    }
}
module.exports = Entity