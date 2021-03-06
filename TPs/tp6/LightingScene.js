var degToRad = Math.PI / 180.0;

function LightingScene() {
    CGFscene.call(this);
}

LightingScene.prototype = Object.create(CGFscene.prototype);
LightingScene.prototype.constructor = LightingScene;

LightingScene.prototype.init = function(application) {
    CGFscene.prototype.init.call(this, application);
    
    //Interface
    this.light_01 = true;
    this.light_02 = false;
    this.light_03 = true;
    this.light_04 = true;
    this.pauseClock = false;
    this.acceleration = 1;
    this.submarineSkin = 'Metallic';
    
    this.deg2rad = Math.PI / 180;
    
    this.enableTextures(true);
    
    this.initCameras();

    this.initLights();

    //this.gl.clearColor(0.153, 0.313, 0.525, 1.0);
    this.gl.clearColor(0.253, 0.543, 0.725, 1.0);
    this.gl.clearDepth(100.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.depthFunc(this.gl.LEQUAL);

    this.axis = new CGFaxis(this);

    // Scene elements
    this.clock = new MyClock(this);
    this.oceanFloor = new Plane(this, 100, 1, 0, 5, 0, 5);
    this.clockPost = new MyCylinder(this, 10, 1);
    this.submarine = new MySubmarine(this);
    var pos = [0,0,0];

    // Materials
    this.materialDefault = new CGFappearance(this);

    this.waterAppearance = new CGFappearance(this);
    this.waterAppearance.setAmbient(0.3, 0.4, 0.4, 1);
    this.waterAppearance.setDiffuse(0.4, 0.4, 0.4, 1);
    this.waterAppearance.setSpecular(0.5, 0.3, 0.4, 1);
    this.waterAppearance.setShininess(40)
    this.waterAppearance.setTextureWrap('MIRRORED_REPEAT', 'MIRRORED_REPEAT');
    this.waterAppearance.loadTexture("../resources/images/oceanFloor.png");

    this.stoneColumnAppearance = new CGFappearance(this);
    this.stoneColumnAppearance.setAmbient(0.3, 0.3, 0.3, 1);
    this.stoneColumnAppearance.setDiffuse(0.4, 0.4, 0.4, 1);
    this.stoneColumnAppearance.setSpecular(0.1, 0.1, 0.1, 1);
    this.stoneColumnAppearance.setShininess(20);
    this.stoneColumnAppearance.loadTexture("../resources/images/stone_column.png");

    //Submarine Appearances
    this.submarineAppearances = [];

    //Skin01 - Metallic
    this.submarineAppearances.push(new CGFappearance(this));
    this.submarineAppearances[0].loadTexture("../resources/images/skins/skin1.png");

    //Skin02 - Camouflage
    this.submarineAppearances.push(new CGFappearance(this));
    this.submarineAppearances[1].loadTexture("../resources/images/skins/skin2.png");

    //Skin03 - Ricky & Morty
    this.submarineAppearances.push(new CGFappearance(this));
    this.submarineAppearances[2].loadTexture("../resources/images/skins/skin3.png");

    //Skin03 - FEUP
    this.submarineAppearances.push(new CGFappearance(this));
    this.submarineAppearances[3].loadTexture("../resources/images/skins/skin4.png");

    //Submarine's Appearances Dictionary
    this.submarineAppearanceList = {
      'Metallic'        : 0,
      'Camouflage'      : 1,
      'Ricky & Morty'   : 2,
      'FEUP'            : 3,  
    };

    //Current Submarine Appearance, update in animation function
    this.currSubmarineAppearance = this.submarineAppearanceList[this.submarineSkin];

    //List of Targets for Torpedos
    this.targets = [
       new MyTarget(this, 10, 1, -6),
       new MyTarget(this, -3, 1, 9),
       new MyTarget(this, 25, 1, 8),
       new MyTarget(this, -15, 1, 2),
       new MyTarget(this, -12, 1, -12),
    ];
    this.currentTarget = 0;
    
    //Animation
    this.setUpdatePeriod(10);
}
;

LightingScene.prototype.initCameras = function() {
    this.camera = new CGFcamera(0.4,0.1,500,vec3.fromValues(30, 30, 30),vec3.fromValues(0, 0, 0));
    //this.camera = new CGFcamera(0.4,0.2,500,vec3.fromValues(1, 30, 1),vec3.fromValues(5, 20, 5));

    // Positions for four lights
    this.lights[0].setPosition(8, 6, 5, 1);
    this.lights[0].setVisible(true);

    this.lights[1].setPosition(-10, 6, 3, 1);
    this.lights[1].setVisible(true);

    this.lights[2].setPosition(10, 6, -9, 1);
    this.lights[2].setVisible(true);
    
    this.lights[3].setPosition(-3, 6, -5, 1);
    this.lights[3].setVisible(true);

    // SETUP
    this.lights[0].setAmbient(0.4, 0.7, 0.7, 1);
    this.lights[0].setDiffuse(0.8, 0.8, 0.8, 1.0);
    this.lights[0].setSpecular(0.3, 0.6, 0.6, 1.0);
    this.lights[0].setLinearAttenuation(0.01);

    this.lights[1].setAmbient(0.2, 0.6, 0.8, 1);
    this.lights[1].setDiffuse(0.4, 0.6, 0.7, 1.0);
    this.lights[1].setSpecular(01, 0.6, 0.5, 1.0);
    this.lights[1].setLinearAttenuation(0.01);

    this.lights[2].setAmbient(0, 0.7, 0.7, 1);
    this.lights[2].setDiffuse(0.5, 0.5, 0.5, 1.0);
    this.lights[2].setSpecular(0, 0.8, 0.8, 1.0);
    this.lights[2].setLinearAttenuation(0.01);

    this.lights[3].setAmbient(0.6, 0.6, 0.6, 1);
    this.lights[3].setDiffuse(0.6, 0.6, 0.6, 1.0);
    this.lights[3].setSpecular(0.2, 0.2, 0.2, 1.0);
    this.lights[3].setLinearAttenuation(0.01);
}
;

LightingScene.prototype.initLights = function() {
    this.setGlobalAmbientLight(0.3, 0.3, 0.5);
    //this.setGlobalAmbientLight(0.3, 0.3, 0.3, 1.0);
    
}
;

LightingScene.prototype.updateLights = function() {
    this.lightsCheck();
    for (i = 0; i < this.lights.length; i++)
        this.lights[i].update();
}

LightingScene.prototype.display = function() {
    // ---- BEGIN Background, camera and axis setup

    // Clear image and depth buffer everytime we update the scene
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    // Initialize Model-View matrix as identity (no transformation)
    this.updateProjectionMatrix();
    this.loadIdentity();

    // Apply transformations corresponding to the camera position relative to the origin
    this.applyViewMatrix();

    // Update all lights used
    this.updateLights();

    // Draw axis
    this.axis.display();

    this.materialDefault.apply();

    // ---- END Background, camera and axis setup

    // ---- BEGIN Geometric transformation section

    // ---- END Geometric transformation section

    // ---- BEGIN Primitive drawing section

    //Clock's Post
    this.pushMatrix();
        this.translate(8, 0, -0.9);
        this.scale(1, 7, 1);
        this.rotate(-90 * this.deg2rad, 1, 0, 0);
        this.stoneColumnAppearance.apply();
        this.clockPost.display();
    this.popMatrix();

    // Clock
    this.pushMatrix();
        this.translate(8, 5, 0);
        this.scale(0.7, 0.7, 0.7);
        this.clock.display();
    this.popMatrix();

    //oceanFloor
    this.pushMatrix();
        this.scale(64, 1, 64);
        this.rotate(-90 * this.deg2rad, 1, 0, 0);
        this.waterAppearance.apply();
        this.oceanFloor.display();
    this.popMatrix();

    //Submarine
    this.submarineAppearances[this.currSubmarineAppearance].apply();
    this.submarine.display();

    //Targets
    this.pushMatrix();
        for (var i = 0; i < this.targets.length; ++i)
            this.targets[i].display();
    this.popMatrix();
    
    // ---- END Primitive drawing section

}
;

//Animation Functions
LightingScene.prototype.update = function(currTime) {
    if (!this.pauseClock)
        this.clock.update(currTime);
    
    //Updating the Submarine skin
    this.currSubmarineAppearance = this.submarineAppearanceList[this.submarineSkin];

    this.submarine.update(currTime); 

    this.updateTargets(currTime);   
};

LightingScene.prototype.doSomething = function () { 
    console.log("Doing something...");
};

LightingScene.prototype.lightsCheck = function () {
   
    if(this.light_01)
        this.lights[0].enable();
    else this.lights[0].disable();

    if(this.light_02)
        this.lights[1].enable();
    else this.lights[1].disable();

    if(this.light_03)
        this.lights[2].enable();
    else this.lights[2].disable();
    
    if(this.light_04)
        this.lights[3].enable();
    else this.lights[3].disable();
};

LightingScene.prototype.getSubmarine = function () { 
    console.log("Scene's getSubmarine called");
    return this.submarine;
};

LightingScene.prototype.updateTargets = function (currTime) {

    for (var i = 0; i < this.targets.length; ++i) {
        //If target is destroyed, erase it from targets array
        if (this.targets[i].getStatus()) {
            this.targets.splice(i, 1);
            this.currentTarget--;
        }
        else
            this.targets[i].update(currTime);
    }
    
};