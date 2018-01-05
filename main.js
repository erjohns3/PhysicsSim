var gl;
var canvas;
var shaderProgram;

var days=0;

// Create a place to store sphere geometry
var sphereVertexPositionBuffer;

//Create a place to store sphere normals for shading
var sphereVertexNormalBuffer;

// Create a place to store cube geometry
var cubeVertexPositionBuffer;

//Create a place to store cube normals for shading
var cubeVertexNormalBuffer;

var spherePos = [];		// position of sphere centers
var sphereVel = [];		// velocity of spheres
var sphereRad = [];		// radius of spheres
var sphereMas = [];		// mass of spheres
var sphereCol = [];		// color of spheres

var sphereCount = 0;	// number of spheres

var gravity = 100;				// gravitional force
var drag = 0.95;				// drag amount
var bounceMultiplier = 0.95;	// the fraction of velocity that it skept after a bounce

var timeCurr = Date.now();
var timePrev = Date.now();
var timeElapsed = 0;

// View parameters
var eyePt = vec3.fromValues(0.0,0.0,120.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);

// Create the normal
var nMatrix = mat3.create();

// Create ModelView matrix
var mvMatrix = mat4.create();

//Create Projection matrix
var pMatrix = mat4.create();

var mvMatrixStack = [];

// create a cube out of planes with subdivisions
function setupCubeBuffers() {
	// create a cube

	var cubePositions = [];
	var cubeNormals = [];

	var numDivs = 4;
	var totalTriangles = 0;

	/////////////////////////////////////////////

	var vertexArray = [];
	var numT = planeFromSubdivision(numDivs, -60,60,-60,60, vertexArray);
	for(var i=0; i<numT*3; i++){
		vertexArray[i*3+2] = -60;

		cubePositions.push(vertexArray[i*3]);
		cubePositions.push(vertexArray[i*3+1]);
		cubePositions.push(vertexArray[i*3+2]);
		cubeNormals.push(0);
		cubeNormals.push(0);
		cubeNormals.push(1);
	}
	totalTriangles += numT;

	/////////////////////////////////////////////

	var vertexArray = [];
	var numT = planeFromSubdivision(numDivs, -60,60,-60,60, vertexArray);
	for(var i=0; i<numT*3; i++){
		vertexArray[i*3+2] = vertexArray[i*3+1];
		vertexArray[i*3+1] = -60;

		cubePositions.push(vertexArray[i*3]);
		cubePositions.push(vertexArray[i*3+1]);
		cubePositions.push(vertexArray[i*3+2]);
		cubeNormals.push(0);
		cubeNormals.push(1);
		cubeNormals.push(0);
	}
	totalTriangles += numT;

	var vertexArray = [];
	var numT = planeFromSubdivision(numDivs, -60,60,-60,60, vertexArray);
	for(var i=0; i<numT*3; i++){
		vertexArray[i*3+2] = vertexArray[i*3+1];
		vertexArray[i*3+1] = 60;

		cubePositions.push(vertexArray[i*3]);
		cubePositions.push(vertexArray[i*3+1]);
		cubePositions.push(vertexArray[i*3+2]);
		cubeNormals.push(0);
		cubeNormals.push(-1);
		cubeNormals.push(0);
	}
	totalTriangles += numT;

	///////////////////////////////////////////////

	var vertexArray = [];
	var numT = planeFromSubdivision(numDivs, -60,60,-60,60, vertexArray);
	for(var i=0; i<numT*3; i++){
		vertexArray[i*3+2] = vertexArray[i*3];
		vertexArray[i*3] = -60;

		cubePositions.push(vertexArray[i*3]);
		cubePositions.push(vertexArray[i*3+1]);
		cubePositions.push(vertexArray[i*3+2]);
		cubeNormals.push(1);
		cubeNormals.push(0);
		cubeNormals.push(0);
	}
	totalTriangles += numT;

	var vertexArray = [];
	var numT = planeFromSubdivision(numDivs, -60,60,-60,60, vertexArray);
	for(var i=0; i<numT*3; i++){
		vertexArray[i*3+2] = vertexArray[i*3];
		vertexArray[i*3] = 60;

		cubePositions.push(vertexArray[i*3]);
		cubePositions.push(vertexArray[i*3+1]);
		cubePositions.push(vertexArray[i*3+2]);
		cubeNormals.push(-1);
		cubeNormals.push(0);
		cubeNormals.push(0);
	}
	totalTriangles += numT;

	/////////////////////////////////////////////

	// fill in vertex position buffer
	cubeVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer); 
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubePositions), gl.STATIC_DRAW);
	cubeVertexPositionBuffer.itemSize = 3;
	cubeVertexPositionBuffer.numItems = totalTriangles*3;

	// fill in vertex normal buffer
	cubeVertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeNormals), gl.STATIC_DRAW);
	cubeVertexNormalBuffer.itemSize = 3;
	cubeVertexNormalBuffer.numItems = totalTriangles*3;

}

//-------------------------------------------------------------------------
function setupSphereBuffers() {
    
    var sphereSoup=[];
    var sphereNormals=[];
	var numT=sphereFromSubdivision(6,sphereSoup,sphereNormals);
	
    sphereVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereSoup), gl.STATIC_DRAW);
    sphereVertexPositionBuffer.itemSize = 3;
    sphereVertexPositionBuffer.numItems = numT*3;
    
    // Specify normals to be able to do lighting calculations
    sphereVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereNormals), gl.STATIC_DRAW);
    sphereVertexNormalBuffer.itemSize = 3;
    sphereVertexNormalBuffer.numItems = numT*3;   
}

//-------------------------------------------------------------------------
function drawSphere(){
	gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	// Bind normal buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, sphereVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.TRIANGLES, 0, sphereVertexPositionBuffer.numItems);      
}

function drawCube(){
	// Bind positions buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	// Bind normal buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, cubeVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.drawArrays(gl.TRIANGLES, 0, cubeVertexPositionBuffer.numItems); 
}

//-------------------------------------------------------------------------
function uploadModelViewMatrixToShader() {
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
function uploadProjectionMatrixToShader() {
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}

//-------------------------------------------------------------------------
function uploadNormalMatrixToShader() {
	mat3.fromMat4(nMatrix,mvMatrix);
	mat3.transpose(nMatrix,nMatrix);
	mat3.invert(nMatrix,nMatrix);
	gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}


//----------------------------------------------------------------------------------
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
    	throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

//----------------------------------------------------------------------------------
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
	shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

//----------------------------------------------------------------------------------
function setupShaders() {
    vertexShader = loadShaderFromDOM("shader-vs");
    fragmentShader = loadShaderFromDOM("shader-fs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert("Failed to setup shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
      
    shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
    shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
    shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
    shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
      
    shaderProgram.uniformAmbientMatColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientMatColor");  
    shaderProgram.uniformDiffuseMatColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseMatColor");
    shaderProgram.uniformSpecularMatColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularMatColor");    
      
}


//-------------------------------------------------------------------------
function uploadLightsToShader(loc,a,d,s) {
	gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
	gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
	gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
	gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

//-------------------------------------------------------------------------
function uploadMaterialToShader(a,d,s) {
	gl.uniform3fv(shaderProgram.uniformAmbientMatColorLoc, a);
	gl.uniform3fv(shaderProgram.uniformDiffuseMatColorLoc, d);
	gl.uniform3fv(shaderProgram.uniformSpecularMatColorLoc, s);
}


//----------------------------------------------------------------------------------
function setupBuffers() {
    setupSphereBuffers();
	setupCubeBuffers();   
}

//----------------------------------------------------------------------------------
function draw() { 
    var transformVec = vec3.create();
  
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    mat4.perspective(pMatrix, degToRad(90), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

    // Then generate the lookat matrix and initialize the MV matrix to that view
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);

    // Set up light parameters
    var Ia = vec3.fromValues(1.0,1.0,1.0);
    var Id = vec3.fromValues(1.0,1.0,1.0);
    var Is = vec3.fromValues(0.0,0.0,0.0);
    
    var lightPosEye4 = vec4.fromValues(0.0,0.0,0.0,1.0);
    lightPosEye4 = vec4.transformMat4(lightPosEye4,lightPosEye4,mvMatrix);
    var lightPosEye = vec3.fromValues(lightPosEye4[0],lightPosEye4[1],lightPosEye4[2]);

	var ma = vec3.fromValues(0.0, 0.0, 0.0);			// get the ambient color of the cube
	var md = vec3.fromValues(1.0, 1.0, 1.0);			// get the diffuse color of the cube
	var ms = vec3.fromValues(1.0, 1.0, 1.0);			// get the specular color of the cube

	uploadLightsToShader(lightPosEye,Ia,Id,Is);		// apply the light
	uploadMaterialToShader(ma, md, ms);				// apply the color of the cube
	setMatrixUniforms();							// apply the cibe attributes

	drawCube();								// draw the cube

	for(var i=0; i<sphereCount; i++){
		mat4.lookAt(mvMatrix,eyePt,viewPt,up);			// reset model view matrix

		vec3.set(transformVec, spherePos[i*3], spherePos[i*3+1], spherePos[i*3+2]);		// get the position of the sphere
		mat4.translate(mvMatrix, mvMatrix,transformVec);								// translate the model view matrix for the sphere
		vec3.set(transformVec,sphereRad[i], sphereRad[i], sphereRad[i]);				// get the radius of the sphere
		mat4.scale(mvMatrix, mvMatrix,transformVec);									// scale the model view matrix for the sphere

		var ma = vec3.fromValues(sphereCol[i*3]/3, sphereCol[i*3+1]/3, sphereCol[i*3+2]/3);		// get the ambient color of the sphere
		var md = vec3.fromValues(sphereCol[i*3], sphereCol[i*3+1], sphereCol[i*3+2]);			// get the diffuse color of the sphere

		uploadMaterialToShader(ma, md, md);				// apply the color of the sphere
		setMatrixUniforms();							// apply the sphere attributes

		drawSphere();							// draw the sphere
	}
}

//----------------------------------------------------------------------------------
function animate() {
	timeCurr = Date.now();							// get the new current time
	timeElapsed = (timeCurr - timePrev) / 1000;		// get the time between last frame and this frame
	timePrev = timeCurr;							// update the last frame time

    for(var i=0; i<sphereCount; i++){
		spherePos[i*3] = spherePos[i*3] + (sphereVel[i*3] * timeElapsed);			// update x position
		spherePos[i*3+1] = spherePos[i*3+1] + (sphereVel[i*3+1] * timeElapsed);		// update y position
		spherePos[i*3+2] = spherePos[i*3+2] + (sphereVel[i*3+2] * timeElapsed);		// update z position

		// account for collisions
		for(var j=0; j<3; j++){
			if(spherePos[i*3+j] + sphereRad[i] > 60){
				spherePos[i*3+j] = 60 - ((spherePos[i*3+j] + sphereRad[i]) - 60) - sphereRad[i];
				sphereVel[i*3+j] = (-bounceMultiplier)*sphereVel[i*3+j];
			}else if(spherePos[i*3+j] - sphereRad[i] < -60){
				spherePos[i*3+j] = -60 - ((spherePos[i*3+j] - sphereRad[i]) + 60) + sphereRad[i];
				sphereVel[i*3+j] = (-bounceMultiplier)*sphereVel[i*3+j];
			}
		}

		var dt = Math.pow(drag, timeElapsed);	// drag force to the elapsed time power

		sphereVel[i*3] = sphereVel[i*3] * dt;
		sphereVel[i*3+1] = (sphereVel[i*3+1] * dt) - (gravity*timeElapsed);		// update y velocity to account for gravity
		sphereVel[i*3+2] = sphereVel[i*3+2] * dt;
	}
}


//----------------------------------------------------------------------------------
function startup() {
  canvas = document.getElementById("myGLCanvas");
  window.addEventListener( 'keydown', onKeyDown, false );
  gl = createGLContext(canvas);
  setupShaders();
  setupBuffers();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}


//----------------------------------------------------------------------------------
function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}

function onKeyDown(event){
    if(event.keyCode == "38"){		// up arrow key

		// set the position of new sphere to random
		spherePos.push((Math.random()-0.5)*100);
		spherePos.push((Math.random()-0.5)*100);
		spherePos.push((Math.random()-0.5)*100);

		// set the velocity of new sphere to random
		sphereVel.push((Math.random()-0.5)*50);
		sphereVel.push((Math.random()-0.5)*50);
		sphereVel.push((Math.random()-0.5)*50);

		// set the color of new sphere to random
		sphereCol.push(Math.random());
		sphereCol.push(Math.random());
		sphereCol.push(Math.random());

		// set the radius of new sphere to random
		sphereRad.push((Math.random()*5) + 1);

		// set the mass of the sphere to the radius cubed
		sphereMas.push(Math.pow(sphereRad, 3));

		sphereCount++;				// add a sphere
    }
    if(event.keyCode == "40"){		// down arrow key

		//clear all the arrays for the spheres
		while(spherePos.length > 0){
			spherePos.pop();
		}
		while(sphereVel.length > 0){
			sphereVel.pop();
		}
		while(sphereRad.length > 0){
			sphereRad.pop();
		}
		while(sphereMas.length > 0){
			sphereMas.pop();
		}
		while(sphereCol.length > 0){
			sphereCol.pop();
		}
		sphereCount = 0;			// reset sphere count to 0
    }
	console.log(sphereCount);
}