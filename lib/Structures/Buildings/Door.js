const { Bodies, Body, Vector } = require('matter-js')
const Entity = require('../../Entity')
Math = require('../../../math.js');
class Door extends Entity{
    constructor(x, y, material, ang) {
        let h
        if (material == 'wood') h = 150;
        if (material == 'stone') h = 250;
        if (material == 'iron') h = 400;
        super(Bodies.rectangle(x, y, 100, 100, { isStatic: true }), h, game)
        this.material = material;
        this.ang = ang;
        this.open = false;
        this.opening = false;
        this.opentimer = null;
        const { Doors, Entities, initPack } = this.game
        var pack = {
            x: this.x,
            y: this.y,
            id: this.id,
            material: this.material,
            ang: this.ang,
            open: false,
        };
        Doors.list.push(this);
        initPack.door.push(pack);
    }
    openFun() {
        if (this.opening) return;
        this.opentimeout = new Timeout(() => {
            this.open = !this.open;
            this.opening = false;
        }, 1000);
        this.opening = true;

        this.needsUpdate = true;
    }
    update() {
        if ((this.ang == 'left' || this.ang == 'right') && this.opening) {
            if (!this.open) {
                let ang = (this.opentimeout.percntDone * 180 * Math.PI) / 180;
                let angle =
                    (this.ang == 'left' ? -1 : 1) * ang + (this.ang == 'right' ? -1 : 1) * ((45 * Math.PI) / 180);
                Body.setPosition(
                    this.body,
                    Vector.create(
                        this.x + Math.sin(angle) * 50 * Math.sqrt(2) + (this.ang == 'left' ? -1 : 1) * 50,
                        this.y +
                            (this.ang == 'right' ? -1 : 1) * (Math.cos(angle) * 50 * Math.sqrt(2)) +
                            (this.ang == 'left' ? -1 : 1) * 50
                    )
                );
                Body.setAngle(this.body, ang);
            } else {
                let ang = (this.opentimeout.percntDone * 180 * Math.PI) / 180;
                let angle =
                    (this.ang == 'right' ? -1 : 1) * ang + (this.ang == 'right' ? -1 : 1) * ((45 * Math.PI) / 180);
                Body.setPosition(
                    this.body,
                    Vector.create(
                        this.x + -(Math.sin(angle) * 50 * Math.sqrt(2)) + (this.ang == 'left' ? -1 : 1) * 50,
                        this.y +
                            -(this.ang == 'right' ? -1 : 1) * (Math.cos(angle) * 50 * Math.sqrt(2)) +
                            (this.ang == 'left' ? -1 : 1) * 50
                    )
                );
                Body.setAngle(this.body, ang);
            }
        }
        if (this.ang == 'up' && this.opening) {
            if (!this.open) {
                let ang = (this.opentimeout.percntDone * 180 * Math.PI) / 180;
                let angle = -ang - (45 * Math.PI) / 180;
                Body.setPosition(
                    this.body,
                    Vector.create(
                        this.x + Math.sin(angle) * 50 * Math.sqrt(2) + 50,
                        this.y + Math.cos(angle) * 50 * Math.sqrt(2) - 50
                    )
                );
                Body.setAngle(this.body, ang);
            } else {
                let ang = (this.opentimeout.percntDone * 180 * Math.PI) / 180;
                let angle = ang - (45 * Math.PI) / 180;
                Body.setPosition(
                    this.body,
                    Vector.create(
                        this.x + -(Math.sin(angle) * 50 * Math.sqrt(2)) + 50,
                        this.y + -(Math.cos(angle) * 50 * Math.sqrt(2)) - 50
                    )
                );
                Body.setAngle(this.body, ang);
            }
        }
        if (this.ang == 'down' && this.opening) {
            if (!this.open) {
                let ang = (this.opentimeout.percntDone * 180 * Math.PI) / 180;
                let angle = -ang - (45 * Math.PI) / 180;
                Body.setPosition(
                    this.body,
                    Vector.create(
                        this.x + -(Math.sin(angle) * 50 * Math.sqrt(2)) - 50,
                        this.y + -(Math.cos(angle) * 50 * Math.sqrt(2)) + 50
                    )
                );
                Body.setAngle(this.body, ang);
            } else {
                let ang = (this.opentimeout.percntDone * 180 * Math.PI) / 180;
                let angle = ang - (45 * Math.PI) / 180;
                Body.setPosition(
                    this.body,
                    Vector.create(
                        this.x + Math.sin(angle) * 50 * Math.sqrt(2) - 50,
                        this.y + Math.cos(angle) * 50 * Math.sqrt(2) + 50
                    )
                );
                Body.setAngle(this.body, ang);
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
        if (this.opening)
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
        if (this.opening)
            pack.per =
                Math.roundToDeci(this.opentimeout.percntDone, 1000) > 0.97
                    ? 1
                    : Math.roundToDeci(this.opentimeout.percntDone, 1000);
        return pack;
    }
}
module.exports = Door