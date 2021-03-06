/**
 * MySubmarine
 * @param gl {WebGLRenderingContext}
 * @constructor
 */
function MySubmarine(scene) {
    CGFobject.call(this, scene);

    this.initBuffers();

    this.deg2rad = Math.PI / 180;

    this.MAX_VEL = 15; // max Vel in world units per second
    this.velocity = 0;

	this.MIN_HEIGHT = 1;
	
    this.pos_x = 0;
    this.pos_z = 0;
    this.pos_y = 2; // Altitude

    this.vertical_vel = 0;
    this.VERT_ACCEL = 0.2;
    this.MAX_VERT_VEL = 2;

    // Orientation Angles
    this.theta_ang = 0;
    this.MAX_THETA_ANG = Math.PI / 24;
    this.THETA_ANG_VEL = Math.PI / 24;

    this.ang = 98;
    this.ang_vel = 0;
    this.ang_accel = 20;
    this.MAX_ANG_VEL = 40;

    this.lastUpdateTime = 0;

    this.upwards = false;
    this.downwards = false;

    this.rotating_left = false;
    this.rotating_right = false;

    this.dampening_vel = false;
    this.dampening_ang_vel = false;
    this.dampen_constant = 2;

    this.pivot = [0, 0];

    // Periscope Vars
    this.MAX_PERISCOPE = 1;
    this.MIN_PERISCOPE = -0.3;
    this.periscope_y = 0;
    this.PERISCOPE_DELTA = 0.05;

    //Torpedo firing Vars
    this.torpedos = [];

    // Shapes
    this.cylinder = new MyCylinder(this.scene, 12, 1);
    this.semisphere = new MySemiSphere(this.scene, 12, 6);
    this.circle = new MyCircle(this.scene, 12);
    this.trapezeTailVert = new MyTrapeze(this.scene, 1.64, 2.34);
    this.trapezeTailHorz = new MyTrapeze(this.scene, 1.64, 2.34);
    this.trapezeTower = new MyTrapeze(this.scene, 1.1, 1.42);
    this.helixLeft = new MyHelix(this.scene, 12, 1, 6, false);
    this.helixRight = new MyHelix(this.scene, 12, 1, 6, true);

    // Materials
    this.materialDefault = new CGFappearance(this);

    // Sounds
    this.myAudio = new Audio('../resources/sounds/submarine_ping.mp3'); 
    this.myAudio.volume = 0.4;
    this.myAudio.addEventListener('ended', function() {
        this.currentTime = 0;
        this.play();
    }, false);
    this.myAudio.play();
}
;
MySubmarine.prototype = Object.create(CGFobject.prototype);
MySubmarine.prototype.constructor = MySubmarine;

MySubmarine.prototype.initBuffers = function() {
    this.vertices = [
        0.5, 0.3, 0,
        -0.5, 0.3, 0,
        0, 0.3, 2
    ];

    this.indices = [
        0, 1, 2
    ];

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
}
;

MySubmarine.prototype.update = function(currTime) {
    var deltaTime = currTime - this.lastUpdateTime;
    this.lastUpdateTime = currTime;

    // Update Fins
    var rotation = 0;
    if (this.rotating_left) {
        rotation = 1;
    } else if (this.rotating_right) {
        rotation = -1;
    }
    this.trapezeTailVert.update(deltaTime, this.velocity == 0 ? 0 : rotation);

    rotation = 0;
    if (this.downwards) {
        rotation = 1;
    } else if (this.upwards) {
        rotation = -1;
    }
    this.trapezeTower.update(deltaTime, rotation);
    this.trapezeTailHorz.update(deltaTime, rotation);

    // Update helix
    this.helixLeft.update(deltaTime, this.velocity);
    this.helixRight.update(deltaTime, this.velocity);

    this.pos_x += 0.001 * deltaTime * this.velocity * Math.sin(this.ang * this.deg2rad);
    this.pos_z += 0.001 * deltaTime * this.velocity * Math.cos(this.ang * this.deg2rad);
    this.pos_y += 0.001 * deltaTime * this.vertical_vel * ((3/4) * (this.velocity / this.MAX_VEL) 
                + (1/4) * Math.abs(this.theta_ang / this.MAX_THETA_ANG));

    if (this.pos_y < this.MIN_HEIGHT)
        this.pos_y = this.MIN_HEIGHT;

    if (this.velocity != 0)
        this.ang += 0.001 * deltaTime * this.ang_vel * (1 + (this.velocity / this.MAX_VEL));

    // Simulate friction -- Dampen velocities
    if (this.dampening_ang_vel)
        this.ang_vel -= (this.ang_vel * this.dampen_constant * 0.001 * deltaTime);
    if (this.dampening_vel)
        this.velocity -= (this.velocity * this.dampen_constant * 0.1 * 0.001 * deltaTime);

    // Vertical friction and update inclination
    if (! this.upwards && !this.downwards) {
        this.vertical_vel -= this.vertical_vel * this.dampen_constant * 0.1 * 0.001 * deltaTime;
        this.updateThetaAng(deltaTime, 0);
    } else {
        this.updateThetaAng(deltaTime, this.upwards ? -1 : 1);
    }

    // Update pivot's position
    this.pivot = [1.5 * Math.sin(this.ang * this.deg2rad), 1.5 * Math.cos(this.ang * this.deg2rad)];

    // Updating Submarine's torpedos if there are any
    this.updateTorpedos(deltaTime);
}

MySubmarine.prototype.updateThetaAng = function(deltaTime, rotation) {

    switch (rotation) {
        case 1:
        case -1:
            this.theta_ang += this.THETA_ANG_VEL * rotation * deltaTime * 0.001;
            break;
        case 0:
            this.theta_ang -= this.theta_ang * this.THETA_ANG_VEL * 10 * deltaTime * 0.001;
            break;
        default:
            console.log("Invalid rotation value in Submarine");
            break;
    }
    

    if (this.theta_ang > this.MAX_THETA_ANG)
        this.theta_ang = this.MAX_THETA_ANG;
    else if (this.theta_ang < -this.MAX_THETA_ANG)
        this.theta_ang = -this.MAX_THETA_ANG;
}

MySubmarine.prototype.display = function() {
    
    this.scene.pushMatrix();
        this.scene.translate(- this.pivot[0], this.pos_y, - this.pivot[1]);

        this.scene.translate(this.pos_x, 0, this.pos_z);
        this.scene.rotate(this.ang * this.deg2rad, 0, 1, 0);
        this.scene.rotate(this.theta_ang, 1, 0, 0);

        //Main Body
        this.scene.pushMatrix();
            this.scene.scale(0.365, 0.5, 4.08);
            this.cylinder.display();
        this.scene.popMatrix();

        //Submarine's front
        this.scene.pushMatrix();
            this.scene.translate(0, 0, 4.08);
            this.scene.scale(0.365, 0.5, 0.46);
            this.semisphere.display();
        this.scene.popMatrix();

        //Subsmarine's Back
        this.scene.pushMatrix();
            this.scene.rotate(180 * this.deg2rad, 0, 1, 0);
            this.scene.scale(0.365, 0.5, 0.46);
            this.semisphere.display();
        this.scene.popMatrix();

        //Submarine's Tower
        this.scene.pushMatrix();
            this.scene.translate(0, 0, 2.50);
            this.scene.scale(0.27 , 1.07, 0.44);
            this.scene.translate(0, 1, 0);
            this.scene.rotate(90 * this.deg2rad, 1, 0, 0);
            this.cylinder.display();
        this.scene.popMatrix();

        //Submarine's Tower Top
        this.scene.pushMatrix();
            this.scene.translate(0, 1.07, 2.50);
            this.scene.scale(0.27 , 1, 0.44);
            this.scene.rotate(-90 * this.deg2rad, 1, 0, 0);
            this.circle.display();
        this.scene.popMatrix();

        // ** Subamrine's Periscope **
        this.scene.pushMatrix();
            this.scene.translate(0, this.periscope_y, 0);

            this.scene.pushMatrix();
                this.scene.translate(0, 0, 2.65);
                this.scene.scale(0.10 , 1.65, 0.10);
                this.scene.translate(0, 1, 0);
                this.scene.rotate(90 * this.deg2rad, 1, 0, 0);
                this.cylinder.display();
            this.scene.popMatrix();

            this.scene.pushMatrix();
                this.scene.translate(0, 1.65, 2.55);
                this.scene.scale(0.10 , 0.10, 0.30);
                this.cylinder.display();
            this.scene.popMatrix();

            this.scene.pushMatrix();
                this.scene.translate(0, 1.65, 2.85);
                this.scene.scale(0.10 , 0.10, 1);
                this.circle.display();
            this.scene.popMatrix();

            this.scene.pushMatrix();
                this.scene.translate(0, 1.65, 2.55);
                this.scene.scale(0.10 , 0.10, 1);
                this.scene.rotate(180 * this.deg2rad, 0, 1, 0);
                this.circle.display();
            this.scene.popMatrix();

        this.scene.popMatrix();
        // END OF Periscope

        // ** Submarine's 'Fins' **
        // VERTICAL
        this.scene.pushMatrix();
            this.scene.rotate(-90 * this.scene.deg2rad, 0, 0, 1);
            this.scene.rotate(180 * this.scene.deg2rad, 1, 0, 0);
            this.scene.scale(1, 0.3, 0.2);

            this.trapezeTailVert.displayWithDir();
            
        this.scene.popMatrix();

        // HORIZONTAL
        this.scene.pushMatrix();
            this.scene.rotate(180 * this.scene.deg2rad, 1, 0, 0);
            this.scene.scale(1, 0.3, 0.2);

            this.trapezeTailHorz.displayWithDir();

        this.scene.popMatrix();

        this.scene.pushMatrix();
            this.scene.translate(0 , 0.8, 2.40);
            this.scene.scale(1, 0.15, 0.25);

            this.trapezeTower.displayWithDir();

        this.scene.popMatrix();

        //Submarine's Helix
        this.scene.pushMatrix();
            this.scene.translate(0.73/2 + 0.15, -0.3, 0);
            this.scene.scale(0.2, 0.2, 0.2);
            this.helixLeft.display();
        this.scene.popMatrix();

        this.scene.pushMatrix();
            this.scene.translate(-0.73/2 - 0.15, -0.3, 0);
            this.scene.scale(0.2, 0.2, 0.2);
            this.helixRight.display();
        this.scene.popMatrix();

    this.scene.popMatrix();
    
    for (var i = 0; i < this.torpedos.length; ++i)
            this.torpedos[i].display();
};

MySubmarine.prototype.movingForward = function() {
    this.dampening_vel = false;
    this.velocity += this.scene.acceleration;

    if (this.velocity > this.MAX_VEL)
        this.velocity = this.MAX_VEL;
}

MySubmarine.prototype.movingBackward = function() {
    this.dampening_vel = false;
    this.velocity -= this.scene.acceleration;
    
    if (this.velocity < - this.MAX_VEL)
        this.velocity = - this.MAX_VEL;
}

MySubmarine.prototype.dampenVel = function() {
    this.dampening_vel = true;
}

MySubmarine.prototype.rotatingLeft = function() {
    this.dampening_ang_vel = false;
    this.rotating_left = true;
    this.rotating_right = false;

    this.ang_vel += this.ang_accel;

    if (this.ang_vel > this.MAX_ANG_VEL)
        this.ang_vel = this.MAX_ANG_VEL;
}

MySubmarine.prototype.rotatingRight = function() {
    this.dampening_ang_vel = false;
    this.rotating_right = true;
    this.rotating_left = false;

    this.ang_vel -= this.ang_accel;

    if (this.ang_vel < -this.MAX_ANG_VEL)
        this.ang_vel = -this.MAX_ANG_VEL;
}

MySubmarine.prototype.dampenAngVel = function() {
    this.dampening_ang_vel = true;
    this.rotating_left = false;
    this.rotating_right = false;
}

MySubmarine.prototype.movingUpwards = function() {
    this.upwards = true;
    this.downwards = false;

    this.vertical_vel += this.VERT_ACCEL;

    if (this.vertical_vel > this.MAX_VERT_VEL)
        this.vertical_vel = this.MAX_VERT_VEL;
}

MySubmarine.prototype.movingDownwards = function() {
    this.upwards = false;
    this.downwards = true;

    this.vertical_vel -= this.VERT_ACCEL;

    if (this.vertical_vel < -this.MAX_VERT_VEL)
        this.vertical_vel = -this.MAX_VERT_VEL;
}

MySubmarine.prototype.dampenVerticalVel = function() {
    this.upwards = false;
    this.downwards = false;
}

MySubmarine.prototype.raisePeriscope = function() {
    this.periscope_y += this.PERISCOPE_DELTA;

    if (this.periscope_y > this.MAX_PERISCOPE)
        this.periscope_y = this.MAX_PERISCOPE;
}

MySubmarine.prototype.lowerPeriscope = function() {
    this.periscope_y -= this.PERISCOPE_DELTA;

    if (this.periscope_y < this.MIN_PERISCOPE)
        this.periscope_y = this.MIN_PERISCOPE;
}

//Firing a Torpedo associated function
MySubmarine.prototype.fireTorpedo = function(target) {
    
    //If no targets alive no torpedo is created
    if (this.scene.currentTarget >= this.scene.targets.length) {
        console.log("No targets left!");
        return;
    }
    
    //Current submarine position as an array
    var sub_pos = [this.pos_x, this.pos_y, this.pos_z];

    this.torpedos.push(new MyTorpedo(this.scene, sub_pos, this.ang, this.scene.targets[this.scene.currentTarget++]));
};

MySubmarine.prototype.updateTorpedos = function(deltaTime) {

    for (var i = 0; i < this.torpedos.length; ++i) {
        if (this.torpedos[i].wasDestroyed())
            this.torpedos.splice(i, 1);
        else
            this.torpedos[i].update(deltaTime);
    }
};