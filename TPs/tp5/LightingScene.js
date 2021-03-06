var degToRad = Math.PI / 180.0;

var BOARD_WIDTH = 6.0;
var BOARD_HEIGHT = 4.0;

var BOARD_A_DIVISIONS = 30;
var BOARD_B_DIVISIONS = 100;

function LightingScene() {
    CGFscene.call(this);
}

LightingScene.prototype = Object.create(CGFscene.prototype);
LightingScene.prototype.constructor = LightingScene;

LightingScene.prototype.init = function(application) {
    CGFscene.prototype.init.call(this, application);

    this.deg2rad = Math.PI / 180;
    
    this.enableTextures(true);
    
    this.initCameras();

    this.initLights();

    this.gl.clearColor(0, 0, 0, 1.0);
    this.gl.clearDepth(100.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.depthFunc(this.gl.LEQUAL);

    this.axis = new CGFaxis(this);

    // Scene elements
    this.table = new MyTable(this);
    this.wallRight = new Plane(this);
    this.wallLeft = new MyQuad(this, -0.5, 1.5, -0.5, 1.5);
    this.floor = new MyQuad(this, 0, 10, 0, 12);

    this.boardA = new Plane(this,BOARD_A_DIVISIONS, BOARD_WIDTH / BOARD_HEIGHT);
    this.boardB = new Plane(this,BOARD_B_DIVISIONS);

    this.prism = new MyPrism(this, 10, 20);
    this.cylinder = new MyCylinder(this, 10, 20);
    this.lamp = new MyLamp(this, 20, 100);

    this.clock = new MyClock(this);
    this.paperPlane = new MyPaperPlane(this);

    // Materials
    this.materialDefault = new CGFappearance(this);

    this.floorAppearance = new CGFappearance(this);
    this.floorAppearance.setAmbient(0.3, 0.4, 0.4, 1);
    this.floorAppearance.setDiffuse(0.4, 0.4, 0.4, 1);
    this.floorAppearance.setSpecular(0.5, 0.3, 0.4, 1);
    this.floorAppearance.setShininess(40);
    this.floorAppearance.loadTexture("../resources/images/floor.png");

    this.windowAppearance = new CGFappearance(this);
    this.windowAppearance.setAmbient(0.9, 0.85, 0.7, 1);
    this.windowAppearance.setDiffuse(0.9, 0.85, 0.7, 1);
    this.windowAppearance.setSpecular(0.5, 0.5, 0.5, 1);
    this.windowAppearance.setShininess(20);
    this.windowAppearance.loadTexture("../resources/images/window.png");
    this.windowAppearance.setTextureWrap('CLAMP_TO_EDGE', 'CLAMP_TO_EDGE');

    this.slidesAppearance = new CGFappearance(this);
    this.slidesAppearance.setAmbient(1, 1, 1, 1);
    this.slidesAppearance.setDiffuse(1, 1, 1, 1);
    this.slidesAppearance.setSpecular(0.1, 0.1, 0.1, 1);
    this.slidesAppearance.setShininess(10);
    this.slidesAppearance.loadTexture("../resources/images/slides.png");
    this.slidesAppearance.setTextureWrap('CLAMP_TO_EDGE', 'CLAMP_TO_EDGE');

    this.boardAppearance = new CGFappearance(this);
    this.boardAppearance.setAmbient(1, 1, 1, 1);
    this.boardAppearance.setDiffuse(0.6, 0.6, 0.6, 1);
    this.boardAppearance.setSpecular(0.5, 0.5, 0.5, 1);
    this.boardAppearance.setShininess(250);
    this.boardAppearance.loadTexture("../resources/images/board.png");

    this.columnAppearance = new CGFappearance(this);
    this.columnAppearance.setAmbient(0.3, 0.3, 0.3);
    this.columnAppearance.setDiffuse(0.8, 0.8, 0.8, 1);
    this.columnAppearance.setSpecular(0.2, 0.2, 0.2, 1);
    this.columnAppearance.setShininess(50);
    this.columnAppearance.loadTexture("../resources/images/stone_column.png");

    this.materialLamp = new CGFappearance(this);
    this.materialLamp.setAmbient(0.2, 0.2, 0.2);
    this.materialLamp.setDiffuse(0.8, 0.8, 0.5, 1);
    this.materialLamp.setSpecular(0.8, 0.8, 0.6, 1);
    this.materialLamp.setShininess(100);

    this.paperPlaneAppearance = new CGFappearance(this);
    this.paperPlaneAppearance.setAmbient(1, 1, 1, 1);
    this.paperPlaneAppearance.setDiffuse(0.6, 0.6, 0.6, 1);
    this.paperPlaneAppearance.setSpecular(0, 0, 0, 1);
    this.paperPlaneAppearance.setShininess(40);


    //Animation
    this.setUpdatePeriod(100);
    this.animationLastTime = 0;
    this.animationUpdateTime = 100;
    this.avgUpdate = 1000;

    this.animationStatus = {
        FLYING : 0,
        FALLING : 1,
        FLOOR : 2
    }
    this.animationCurrentStatus = this.animationStatus.FLYING;

    //PaperPlane Animation related Macros
    this.transX = 11;
    this.transY = 3.8;

    this.rotX = 0;
    this.rotZ = 0;

    this.wallX = 0;
    this.floorY = 0;

    this.zFallLimit = 90;
    this.xFloorLimit = 40;
    this.zFloorLimit = 13;    


}
;

LightingScene.prototype.initCameras = function() {
    this.camera = new CGFcamera(0.4,0.1,500,vec3.fromValues(30, 30, 30),vec3.fromValues(0, 0, 0));
    //this.camera = new CGFcamera(0.4,0.2,500,vec3.fromValues(1, 30, 1),vec3.fromValues(5, 20, 5));
}
;

LightingScene.prototype.initLights = function() {
    this.setGlobalAmbientLight(0.3, 0.3, 0.3, 1.0);
    //this.setGlobalAmbientLight(0, 0, 0, 1.0);
    
    // Positions for four lights
    this.lights[0].setPosition(4, 6, 1, 1);
    this.lights[0].setVisible(true);

    this.lights[1].setPosition(10.5, 6.0, 1.0, 1.0);
    this.lights[1].setVisible(true);

    this.lights[2].setPosition(10.5, 6.0, 5.0, 1.0);
    this.lights[2].setVisible(true);

    this.lights[3].setPosition(4, 6.0, 5.0, 1.0);
    this.lights[3].setVisible(true);

    this.lights[4].setPosition(0.1, 5, 7, 1.0);
    this.lights[4].setVisible(false);
    
    // SETUP
    this.lights[0].setAmbient(0, 0, 0, 1);
    this.lights[0].setDiffuse(1.0, 1.0, 1.0, 1.0);
    this.lights[0].setSpecular(1., 1., 0., 1.0);
    this.lights[0].enable();

    this.lights[1].setAmbient(0, 0, 0, 1);
    this.lights[1].setDiffuse(1.0, 1.0, 1.0, 1.0);
    this.lights[1].enable();

    this.lights[2].setSpecular(1, 1, 1, 1);
    this.lights[2].setConstantAttenuation(0);
    this.lights[2].setLinearAttenuation(1);
    this.lights[2].setQuadraticAttenuation(0);
    this.lights[2].enable();

    this.lights[3].setSpecular(1, 1, 1, 1);
    this.lights[3].setConstantAttenuation(0);
    this.lights[3].setLinearAttenuation(0);
    this.lights[3].setQuadraticAttenuation(0.2);
    this.lights[3].enable();

    this.lights[4].setSpecular(1.0, 0.95, 0.85, 1);
    this.lights[4].setConstantAttenuation(0);
    this.lights[4].setLinearAttenuation(1);
    this.lights[4].enable();

}
;

LightingScene.prototype.updateLights = function() {
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

    
    // Column - Cylinder
    this.pushMatrix();
    this.translate(4, 0, 14);
    this.rotate(- Math.PI / 2, 1, 0, 0);
    this.scale(1, 1, 7);
    this.columnAppearance.apply();
    this.cylinder.display();
    this.popMatrix();

    // Column - Prism
    this.pushMatrix();
    this.translate(14, 0, 14);
    this.rotate(-90 * degToRad, 1, 0, 0);
    this.scale(1, 1, 7);
    this.prism.display();
    this.popMatrix();

    // Lamp
    this.pushMatrix();
    this.translate(7.5, 8, 7.5);
    this.rotate(Math.PI / 2, 1, 0, 0);
    this.materialLamp.apply();
    this.lamp.display();
    this.popMatrix();

    // Floor
    this.pushMatrix();
    this.translate(7.5, 0, 7.5);
    this.rotate(-90 * degToRad, 1, 0, 0);
    this.scale(15, 15, 0.2);
    this.floorAppearance.apply();
    this.floor.display();
    this.popMatrix();

    // Left Quad Wall
    this.pushMatrix();
    this.translate(0, 4, 7.5);
    this.rotate(90 * degToRad, 0, 1, 0);
    this.scale(15, 8, 0.2);
    this.windowAppearance.apply();
    this.wallLeft.display();
    this.popMatrix();

    // Right Plane Wall
    this.pushMatrix();
    this.translate(7.5, 4, 0);
    this.scale(15, 8, 0.2);
    this.materialDefault.apply();
    this.wallRight.display();
    this.popMatrix();

    // First Table
    this.pushMatrix();
    this.translate(5, 0, 8);
    this.table.display();
    this.popMatrix();

    // Second Table
    this.pushMatrix();
    this.translate(12, 0, 8);
    this.table.display();
    this.popMatrix();

    this.materialDefault.apply();

    // Board A
    this.pushMatrix();
    this.translate(4, 4.5, 0.2);
    this.scale(BOARD_WIDTH, BOARD_HEIGHT, 1);
    this.slidesAppearance.apply();
    this.boardA.display();
    this.popMatrix();

    // Board B
    this.pushMatrix();
    this.translate(10.5, 4.5, 0.2);
    this.scale(BOARD_WIDTH, BOARD_HEIGHT, 1);
    this.boardAppearance.apply();
    this.boardB.display();
    this.popMatrix();

    this.materialDefault.apply();

    // Clock
    this.pushMatrix();
    this.translate(7.25, 7.25, 0);
    this.scale(0.7, 0.7, 0.5);
    this.clock.display();
    this.popMatrix();
    
    //PaperPlane
    this.pushMatrix();
        this.translate(this.transX, this.transY, 8);
        this.rotate(this.rotZ * Math.PI / 180, 0, 0, 1);
        this.rotate(this.rotX * Math.PI / 180, 1, 0, 0);
        this.paperPlaneAppearance.apply();
        this.paperPlane.display();
    this.popMatrix();
    // ---- END Primitive drawing section

}
;

LightingScene.prototype.update = function(currTime) {
    this.clock.update(currTime);

    //Plane update
    if (currTime - this.animationLastTime >= this.animationUpdateTime)
	{
		this.animationLastTime = currTime;

		//Velocities are Hard - Coded
        switch (this.animationCurrentStatus) {
            case (this.animationStatus.FLYING):
                this.transX -= (3 * (this.animationUpdateTime / this.avgUpdate));
                this.transY += (0.3 * (this.animationUpdateTime / this.avgUpdate));
                
                //Oscilation to simulate the wind
                if ((this.animationLastTime % 3) == 0)
                    this.rotX += (45 * (this.animationUpdateTime / this.avgUpdate));
                else 
                if ((this.animationLastTime % 3) == 1)
                    this.rotX -= (45 * (this.animationUpdateTime / this.avgUpdate));
                
                this.updateStatus(this.animationCurrentStatus);
                break;
            
            case (this.animationStatus.FALLING):
                this.transY -= (7.1 * (this.animationUpdateTime / this.avgUpdate));

                if (this.rotZ <= this.zFallLimit) {
                    this.rotZ += (120 * (this.animationUpdateTime/this.avgUpdate));
                    this.transX += (0.8 * (this.animationUpdateTime/this.avgUpdate));
                }

                this.updateStatus(this.animationCurrentStatus);
                break;
            
            case (this.animationStatus.FLOOR):
                if (this.rotX <= this.xFloorLimit)
                    this.rotX += (180 * (this.animationUpdateTime / this.avgUpdate));
                 
                if (this.rotZ >= this.zFloorLimit)
                    this.rotZ -= (180 * (this.animationUpdateTime / this.avgUpdate));
                break;
        }
	}
}

LightingScene.prototype.updateStatus = function(currentStatus) {
    switch (currentStatus) {
       
        case (this.animationStatus.FLYING):
            if (this.transX <= this.wallX)
                this.animationCurrentStatus = this.animationStatus.FALLING;
            break;
            
        case (this.animationStatus.FALLING):
            if (this.transY <= this.floorY)
                this.animationCurrentStatus = this.animationStatus.FLOOR;
            break;    
    }
}
