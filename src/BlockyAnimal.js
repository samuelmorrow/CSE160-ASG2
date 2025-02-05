// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  `attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE =
  `precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

function setupWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);

  gl = canvas.getContext("webgl", {preservedDrawingBuffer: true});

  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}
function connectVariablesToGLSL(){
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
      console.log('Failed to intialize shaders.');
      return;
    }
  
    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
      return;
    }
  
    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
      console.log('Failed to get the storage location of u_FragColor');
      return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
      console.log('Failed to get the storage location of u_ModelMatrix');
      return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
      console.log('Failed to get the storage location of u_GlobalRotateMatrix');
      return;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);


}
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

//Global UI Elements
let g_selectedColor=[1.0,1.0,1.0,1.0];
let g_selectedSize=5;
let g_selectedType=POINT;
let g_selectedSegments=3;
let g_selectedAngle=45;
let g_globalAngle=0;
let g_globalAngleX = 0;
let g_globalAngleY = 0;


let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;

function addMouseControls() {
  canvas.addEventListener("mousedown", (event) => {
    if (event.shiftKey) {
      g_poke = true;
    } else {
    isDragging = true;
    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
    }
  });

  canvas.addEventListener("mousemove", (event) => {
    if (isDragging) {
      let deltaX = event.clientX - previousMouseX;
      let deltaY = event.clientY - previousMouseY;

      g_globalAngleX += deltaX * 0.5; // Adjust sensitivity if needed
      g_globalAngleY += deltaY * 0.5;

      previousMouseX = event.clientX;
      previousMouseY = event.clientY;
      renderAllShapes();
    }
  });

  canvas.addEventListener("mouseup", () => (isDragging = false));
  window.addEventListener("mouseup", () => (isDragging = false));
}

let g_leg_animation=false;
let g_poke=false;

let g_front_right_thigh_angle = 0;
let g_front_right_calf_angle = 0;
let g_front_left_thigh_angle = 0;
let g_front_left_calf_angle = 0;
let g_back_right_thigh_angle = 0;
let g_back_right_calf_angle = 0;
let g_back_left_thigh_angle = 0;
let g_back_left_calf_angle = 0;
let g_head_angle = 0;
let g_tongue_angle = 0;

function addActionsForHtmlUI() {
  document.getElementById('g_leg_animation_off').onclick = function() {g_leg_animation = false;};
  document.getElementById('g_leg_animation_on').onclick = function() {g_leg_animation = true;};  

  document.getElementById('GFRT').addEventListener('mousemove', function() { g_front_right_thigh_angle = this.value; renderAllShapes(); } );
  document.getElementById('GFRC').addEventListener('mousemove', function() { g_front_right_calf_angle = this.value; renderAllShapes(); } );
  document.getElementById('GFLT').addEventListener('mousemove', function() { g_front_left_thigh_angle = this.value; renderAllShapes(); } );
  document.getElementById('GFLC').addEventListener('mousemove', function() { g_front_left_calf_angle = this.value; renderAllShapes(); } );
  document.getElementById('GBRT').addEventListener('mousemove', function() { g_back_right_thigh_angle = this.value; renderAllShapes(); } );
  document.getElementById('GBRC').addEventListener('mousemove', function() { g_back_right_calf_angle = this.value; renderAllShapes(); } );
  document.getElementById('GBLT').addEventListener('mousemove', function() { g_back_left_thigh_angle = this.value; renderAllShapes(); } );
  document.getElementById('GBLC').addEventListener('mousemove', function() { g_back_left_calf_angle = this.value; renderAllShapes(); } );


  document.getElementById('angleSlider').addEventListener('mousemove', function() { g_globalAngle = this.value; renderAllShapes(); } );
  
}

function main() {

  setupWebGL();

  connectVariablesToGLSL();

  addActionsForHtmlUI();
  addMouseControls();
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) { if(ev.buttons == 1) { click(ev) } };



// Ensure mouse stops dragging if it leaves the window
  requestAnimationFrame(tick);
  renderAllShapes();
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

function tick() {
  g_seconds = performance.now()/500.0 - g_startTime;
  updateAnimationAngles();
  renderAllShapes();
  requestAnimationFrame(tick);
}

var g_shapesList = [];

function click(ev) {
  [x,y] = convertCoordinateEventToGL(ev);

  let point;
  if (g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE){
    point = new Triangle();
    point.angle = g_selectedAngle;
  } else {
    point = new Circle();
    point.segments = g_selectedSegments;
  }

  point.position=[x,y];
  point.color=g_selectedColor.slice();
  point.size=g_selectedSize;
  g_shapesList.push(point);

  renderAllShapes();
}

function convertCoordinateEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return ([x,y]);
}




function updateAnimationAngles() {
  if(g_leg_animation) {
    g_front_right_thigh_angle = 15*Math.sin(g_seconds);
    g_front_right_calf_angle = 30*Math.sin(g_seconds-1);
    g_front_left_calf_angle = 30*Math.sin(g_seconds);
    g_front_left_thigh_angle = 15*Math.sin(g_seconds-1);

    g_back_right_thigh_angle = 15*Math.sin(g_seconds);
    g_back_right_calf_angle = 30*Math.sin(g_seconds-1);
    g_back_left_calf_angle = 30*Math.sin(g_seconds);
    g_back_left_thigh_angle = 15*Math.sin(g_seconds-1);
  }
  if (g_poke) {

    g_head_angle = 15*Math.sin(5*g_seconds);
    g_tongue_angle = 30*Math.sin(10*g_seconds);
  }
  
}

function renderScene() {
  var startTime = performance.now();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  //head
  var head = new Cube();
  head.color = [0.6,0.451,0.055,1.0];
  head.matrix.translate(0, .4, -0.0001, 1);
  head.matrix.rotate(0,1,0,0);
  head.matrix.rotate(g_head_angle,0,0,1);
  var head_matrix = new Matrix4(head.matrix);
  head.matrix.scale(0.3, .15, 0.3);
  head.matrix.translate(0,0,0,0);
  head.render();

  var tongue = new Cube()
  tongue.color = [1.0,0.0,0.0,1.0];
  tongue.matrix = head_matrix;
  tongue.matrix.translate(0.1, 0, .25, 1);
  tongue.matrix.rotate(45,1,0,0);
  tongue.matrix.rotate(g_tongue_angle, 0, 0 ,1);

  tongue.matrix.scale(0.1, .05, 0.2);
  tongue.render();
  
  //neck
  neck = new Cube();
  neck.color = [0.941,0.831,0.545,1.0];
  neck.matrix.translate(.08, 0, 0, 1);
  neck.matrix.rotate(0,1,0,0);
  neck.matrix.scale(0.15, .5, 0.2);
  neck.render();

  //body
  body = new Cube();
  body.color = [0.89,0.769,0.443,1.0]; 
  body.matrix.translate(0, -.3, -.7, 1);
  body.matrix.rotate(0,1,0,0);
  body.matrix.scale(0.3, .3, .85);
  body.render();


 // Front right leg (upper)
  front_right_thigh = new Cube();
  front_right_thigh.color = [0.678, 0.58, 0.31, 1.0];
  front_right_thigh.matrix.translate(0.2, -0.225, 0.1);
  front_right_thigh.matrix.rotate(150, 1, 0, 0); 
  front_right_thigh.matrix.rotate(-g_front_right_thigh_angle, 1, 0, 0);
  var front_right_leg_matrix = new Matrix4(front_right_thigh.matrix);
  front_right_thigh.matrix.scale(0.1, 0.3, 0.1);
  front_right_thigh.matrix.translate(0.1, 0, -0.0001);
  front_right_thigh.render();

  // Front right leg (lower/knee)
  front_right_calf = new Cube();
  front_right_calf.color = [0.678, 0.58, 0.31, 1.0];
  front_right_calf.matrix = front_right_leg_matrix;
  front_right_calf.matrix.translate(0, .3, 0.07);
  front_right_calf.matrix.rotate(50, 1, 0, 0);
  front_right_calf.matrix.rotate(-g_front_right_calf_angle, 1, 0, 0); 
  front_right_calf.matrix.scale(0.1, 0.3, 0.1); 
  front_right_calf.matrix.translate(0, -0.25, .2); 
  front_right_calf.render();

  // Front left leg (upper)
  front_left_thigh = new Cube();
  front_left_thigh.color = [0.678, 0.58, 0.31, 1.0];
  front_left_thigh.matrix.translate(0, -0.225, 0.1);
  front_left_thigh.matrix.rotate(150, 1, 0, 0);
  front_left_thigh.matrix.rotate(g_front_left_thigh_angle, 1, 0, 0);
  var front_left_leg_matrix = new Matrix4(front_left_thigh.matrix);
  front_left_thigh.matrix.scale(0.1, 0.3, 0.1);
  front_right_thigh.matrix.translate(0.1, 0, -0.0001);
  front_left_thigh.render();

  // Front left leg (lower/knee)
  front_left_calf = new Cube();
  front_left_calf.color = [0.678, 0.58, 0.31, 1.0];
  front_left_calf.matrix = front_left_leg_matrix;
  front_left_calf.matrix.translate(0, 0.3, 0.07);
  front_left_calf.matrix.rotate(50, 1, 0, 0);
  front_left_calf.matrix.rotate(g_front_left_calf_angle, 1, 0, 0);
  front_left_calf.matrix.scale(0.1, 0.3, 0.1);
  front_left_calf.matrix.translate(0, -0.25, .2);
  front_left_calf.render();

  // Back right leg (upper)
  back_right_thigh = new Cube();
  back_right_thigh.color = [0.678, 0.58, 0.31, 1.0];
  back_right_thigh.matrix.translate(.2, -0.225, -.6);
  back_right_thigh.matrix.rotate(150, 1, 0, 0); 
  back_right_thigh.matrix.rotate(-g_back_right_thigh_angle, 1, 0, 0);
  var back_right_leg_matrix = new Matrix4(back_right_thigh.matrix);
  back_right_thigh.matrix.scale(0.1, 0.3, 0.1);
  back_right_thigh.matrix.translate(0.1, 0, -0.0001);
  back_right_thigh.render();

  // Back right leg (lower/knee)
  back_right_calf = new Cube();
  back_right_calf.color = [0.678, 0.58, 0.31, 1.0];
  back_right_calf.matrix = back_right_leg_matrix;
  back_right_calf.matrix.translate(0, .3, 0.07);
  back_right_calf.matrix.rotate(50, 1, 0, 0);
  back_right_calf.matrix.rotate(-g_back_right_calf_angle, 1, 0, 0);
  back_right_calf.matrix.scale(0.1, 0.3, 0.1);
  back_right_calf.matrix.translate(0, -0.25, 0.2);
  back_right_calf.render();

  // Back left leg (upper)
  back_left_thigh = new Cube();
  back_left_thigh.color = [0.678, 0.58, 0.31, 1.0];
  back_left_thigh.matrix.translate(0, -0.225, -0.6);
  back_left_thigh.matrix.rotate(150, 1, 0, 0);
  back_left_thigh.matrix.rotate(g_back_left_thigh_angle, 1, 0, 0);
  var back_left_leg_matrix = new Matrix4(back_left_thigh.matrix);
  back_left_thigh.matrix.scale(0.1, 0.3, 0.1);
  back_left_thigh.matrix.translate(0.1, 0, -0.0001);
  back_left_thigh.render();

  // Back left leg (lower/knee)
  back_left_calf = new Cube();
  back_left_calf.color = [0.678, 0.58, 0.31, 1.0];
  back_left_calf.matrix = back_left_leg_matrix;
  back_left_calf.matrix.translate(0, 0.3, 0.07);
  back_left_calf.matrix.rotate(50, 1, 0, 0);
  back_left_calf.matrix.rotate(g_back_left_calf_angle, 1, 0, 0);
  back_left_calf.matrix.scale(0.1, 0.3, 0.1);
  back_left_calf.matrix.translate(0, -0.25, .2);
  back_left_calf.render();



  // Front hump
  var hemi = new Hemisphere();
  hemi.color = [0.82, 0.698, 0.369, 1.0];
  hemi.matrix.translate(0.15, 0.0, -.13);
  hemi.matrix.rotate(-90, 1, 0, 0);
  hemi.matrix.scale(0.145, 0.2, 0.3);
  hemi.render();

  // Back hump
  var hemi2 = new Hemisphere();
  hemi2.color = [0.82, 0.698, 0.369, 1.0];
  hemi2.matrix.translate(0.15, -0.05, -.4);
  hemi2.matrix.rotate(-125, 1, 0, 0);
  // hemi2.matrix.rotate(-45, 0, 0, 1);
  hemi2.matrix.scale(0.145, 0.3, 0.5);
  hemi2.render();

  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration), "numdot");
  }

function renderAllShapes() {
  // var startTime = performance.now();

  var globalRotMat=new Matrix4()
    .rotate(g_globalAngle,0,1,0)
    .rotate(g_globalAngleX,0,1,0)
    .rotate(g_globalAngleY,1,0,0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);
  renderScene();

}



function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}