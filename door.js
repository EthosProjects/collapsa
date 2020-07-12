//This file exists simply to aid in understanding the mathmatics that went into
//the door function because I didn't get it the first time either
if (this.ang == 'left' && this.opening) {
    console.log(this.body.position, this.x, this.y);
    if (!this.open) {
        let ang = (this.opentimeout.percntDone * 180 * Math.PI) / 180;
        let angle = -ang + (45 * Math.PI) / 180;
        console.log((ang * 180) / Math.PI, (angle * 180) / Math.PI);
        Matter.Body.setPosition(
            this.body,
            Matter.Vector.create(
                this.x + Math.sin(angle) * 50 * Math.sqrt(2) - 50,
                this.y + Math.cos(angle) * 50 * Math.sqrt(2) - 50,
            ),
        );
        Matter.Body.setAngle(this.body, ang);
    } else {
        let ang = (this.opentimeout.percntDone * 180 * Math.PI) / 180;
        let angle = ang + (45 * Math.PI) / 180;
        console.log((ang * 180) / Math.PI, (angle * 180) / Math.PI);
        Matter.Body.setPosition(
            this.body,
            Matter.Vector.create(
                this.x + -(Math.sin(angle) * 50 * Math.sqrt(2)) - 50,
                this.y + -(Math.cos(angle) * 50 * Math.sqrt(2)) - 50,
            ),
        );
        Matter.Body.setAngle(this.body, ang);
    }
}
if (this.ang == 'right' && this.opening) {
    console.log(this.body.position, this.x, this.y);
    if (!this.open) {
        let ang = (this.opentimeout.percntDone * 180 * Math.PI) / 180;
        let angle = ang - (45 * Math.PI) / 180;
        console.log((ang * 180) / Math.PI, (angle * 180) / Math.PI);
        Matter.Body.setPosition(
            this.body,
            Matter.Vector.create(
                this.x + Math.sin(angle) * 50 * Math.sqrt(2) + 50,
                this.y + -(Math.cos(angle) * 50 * Math.sqrt(2)) + 50,
            ),
        );
        Matter.Body.setAngle(this.body, ang);
    } else {
        let ang = (this.opentimeout.percntDone * 180 * Math.PI) / 180;
        let angle = -ang - (45 * Math.PI) / 180;
        console.log((ang * 180) / Math.PI, (angle * 180) / Math.PI);
        Matter.Body.setPosition(
            this.body,
            Matter.Vector.create(
                this.x + -(Math.sin(angle) * 50 * Math.sqrt(2)) + 50,
                this.y + Math.cos(angle) * 50 * Math.sqrt(2) + 50,
            ),
        );
        Matter.Body.setAngle(this.body, ang);
    }
}
if (this.ang == 'up' && this.opening) {
    console.log(this.body.position, this.x, this.y);
    if (!this.open) {
        let ang = (this.opentimeout.percntDone * 180 * Math.PI) / 180;
        let angle = -ang - (45 * Math.PI) / 180;
        console.log((ang * 180) / Math.PI, (angle * 180) / Math.PI);
        Matter.Body.setPosition(
            this.body,
            Matter.Vector.create(
                this.x + Math.sin(angle) * 50 * Math.sqrt(2) + 50,
                this.y + Math.cos(angle) * 50 * Math.sqrt(2) - 50,
            ),
        );
        Matter.Body.setAngle(this.body, ang);
    } else {
        let ang = (this.opentimeout.percntDone * 180 * Math.PI) / 180;
        let angle = ang - (45 * Math.PI) / 180;
        console.log((ang * 180) / Math.PI, (angle * 180) / Math.PI);
        Matter.Body.setPosition(
            this.body,
            Matter.Vector.create(
                this.x + -(Math.sin(angle) * 50 * Math.sqrt(2)) + 50,
                this.y + -(Math.cos(angle) * 50 * Math.sqrt(2)) - 50,
            ),
        );
        Matter.Body.setAngle(this.body, ang);
    }
}
if (this.ang == 'down' && this.opening) {
    console.log(this.body.position, this.x, this.y);
    if (!this.open) {
        let ang = (this.opentimeout.percntDone * 180 * Math.PI) / 180;
        let angle = -ang - (45 * Math.PI) / 180;
        console.log((ang * 180) / Math.PI, (angle * 180) / Math.PI);
        Matter.Body.setPosition(
            this.body,
            Matter.Vector.create(
                this.x + -(Math.sin(angle) * 50 * Math.sqrt(2)) - 50,
                this.y + -(Math.cos(angle) * 50 * Math.sqrt(2)) + 50,
            ),
        );
        Matter.Body.setAngle(this.body, ang);
    } else {
        let ang = (this.opentimeout.percntDone * 180 * Math.PI) / 180;
        let angle = ang - (45 * Math.PI) / 180;
        console.log((ang * 180) / Math.PI, (angle * 180) / Math.PI);
        Matter.Body.setPosition(
            this.body,
            Matter.Vector.create(
                this.x + Math.sin(angle) * 50 * Math.sqrt(2) - 50,
                this.y + Math.cos(angle) * 50 * Math.sqrt(2) + 50,
            ),
        );
        Matter.Body.setAngle(this.body, ang);
    }
}
