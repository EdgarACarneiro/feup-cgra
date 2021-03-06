/**
 * MyLamp
 * @constructor
 */
function MyLamp(scene, slices, stacks) {
    CGFobject.call(this, scene);

    this.slices = slices;
    this.stacks = stacks;

    this.initBuffers();
}
;MyLamp.prototype = Object.create(CGFobject.prototype);
MyLamp.prototype.constructor = MyLamp;

MyLamp.prototype.initBuffers = function() {
    this.vertices = [];
    this.indices = [];

    var deltaTheta = (Math.PI / 180) * (360 / this.slices);
    var deltaFi = Math.PI / 2 / this.stacks;

    // Vertices - Using Spherical Coordinates
    for (var i = 0; i <= this.stacks; i++) {
        for (var j = 0; j < this.slices; j++) {
            var new_vertex = [
                Math.cos(deltaTheta * j) * Math.sin(i * deltaFi),
                Math.sin(deltaTheta * j) * Math.sin(i * deltaFi),
                Math.cos(i * deltaFi)];

            this.vertices = this.vertices.concat(new_vertex);
        }
    }

    // Indices
    for (var sl = 0; sl < this.slices; sl++) {
        
        for (var st = 0; st < this.stacks; st++) {
            this.indices = this.indices.concat([
                (sl + 1) + this.slices * st,
                sl + this.slices * st,
                (sl + this.slices) + this.slices * st]);

            this.indices = this.indices.concat([
                (sl + 1 + this.slices * (st+1)) < this.vertices.length / 3 ? sl + 1 + this.slices * (st+1) : sl + 1 + this.slices * st,
                (sl + 1) + this.slices * st,
                sl + this.slices * (st+1)])

        }
    }

    // Normals
    this.normals = [];
    for (var i = 0; i <= this.stacks; i++) {
        for (var j = 0; j < this.slices; j++) {

          this.normals = this.normals.concat([
              Math.cos(deltaTheta * j) * Math.sin(i * deltaFi),
              Math.sin(deltaTheta * j) * Math.sin(i * deltaFi),
              Math.cos(i * deltaFi)]);

        }
    }

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
}
;
