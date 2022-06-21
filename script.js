import * as THREE from 'three';
import { addWorldIntoScene, getCollidables } from './buildWorld.js';
import { VRButton } from 'VRButton';
import { XRControllerModelFactory } from 'XRControllerModelFactory';
import { OrbitControls } from 'OrbitControls';

//scene design vars: -------------------------x
const widthofRange = 50; //Shootingrange size 
const lengthOfRange = 100; //Shootingrange size
const heightOfWall = 10;

//scene settings
const scene = new THREE.Scene();

//clock
const clock = new THREE.Clock();


//renderer settings
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.xr.enabled = true;//For VR to work
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild( renderer.domElement );
document.body.appendChild( VRButton.createButton( renderer ) );//For VR to work

//camera settings
const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 200 );
camera.position.set( 0, 2, 0 );
camera.lookAt(1, 2, 0)

//Set sound receiver on camera
const listener = new THREE.AudioListener();
camera.add( listener );

const sound = new THREE.PositionalAudio( listener );

const audioLoader = new THREE.AudioLoader();
audioLoader.load( 'audio/soundtrack.ogg', function( buffer ) {
	sound.setBuffer( buffer );
	sound.setRefDistance( 10 );
  sound.setLoop( true );
	sound.play();
});



//___ADDING IN VR CONTROLLS CODE BECAUSE CLASS DOESN'T WORK___

let Right_trigger_active = false;
let left_trigger_active = false;


const RIGHT_CONTR_INDEX = 1;
const LEFT_CONTR_INDEX = 0;

const raycaster = new THREE.Raycaster(); //for checking if something is in front of the player

const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );
const line = new THREE.Line( geometry );
line.name = 'line';
line.scale.z = 5;

const dolly = new THREE.Object3D();//attach camera to this object, so i can move around without walking in my room
const dummyCam = new THREE.Object3D();//added to the camera for getting the orientation

dolly.position.z = 0; //maybe change to 2 later on
      dolly.add( camera );
      scene.add( dolly );
      camera.add( dummyCam );
dolly.position.set(0,0,0)

const controller1 = renderer.xr.getController( RIGHT_CONTR_INDEX );
controller1.addEventListener( 'selectstart', onStartR );
controller1.addEventListener( 'selectend', onEndR );
controller1.addEventListener( 'squeezestart', onStartR );
controller1.addEventListener( 'squeezeend', onEndR );
scene.add( controller1 );
const controller2 = renderer.xr.getController( LEFT_CONTR_INDEX );
controller2.addEventListener( 'selectstart', onStartL );
controller2.addEventListener( 'selectend', onEndL );
scene.add( controller2 );

const controllerModelFactory = new XRControllerModelFactory();

const controllerGrip1 = renderer.xr.getControllerGrip( RIGHT_CONTR_INDEX );
controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
scene.add( controllerGrip1 );

const controllerGrip2 = renderer.xr.getControllerGrip( LEFT_CONTR_INDEX );
controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
scene.add( controllerGrip2 );

const controls = new OrbitControls( camera, renderer.domElement );
controls.target.set(0, 1.6, 0);
controls.update();

dolly.add(controllerGrip1);
dolly.add(controllerGrip2);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
})  

addWorldIntoScene(scene);
const collidables = getCollidables();
//animation loop function
function animate() {
  renderer.setAnimationLoop( render );
}

function render() {
  const dt = clock.getDelta();
  if(controller1)handleController(controller1, dt);
  if(controller2)handleController(controller2, dt);
  updateBullets(dt);
  renderer.render( scene, camera );
}

  // Animate activate only if movement is in the scene
  animate();

//___________PROJECTILE ARRAY FOR SHOOTING___________
let bullets = [];
const bulletGeom = new THREE.SphereGeometry( .2, 32, 16 );
const bulletMat = new THREE.MeshPhongMaterial( { color: Math.random()*0xffffff } );
let bullet = new THREE.Mesh( bulletGeom, bulletMat );
let shot = true;

function updateBullets(dt){
  const flyspeed = 30;
  let zer = new THREE.Vector3();
  for(let o of bullets){
    o.translateZ(flyspeed * (-dt));
  }
  
  if(bullets.length > 0){
    var p = new THREE.Vector3();
    bullets[bullets.length-1].getWorldPosition(p);
    let dist = p.distanceTo(zer);
    if(dist >= 200){
      bullets.shift()
    }
  }
}

//___________SPEAKER SPHERE_____________
const sphere = new THREE.SphereGeometry( .03, 32, 16 );
const material = new THREE.MeshPhongMaterial( { color: 0xff2200 } );
const mesh = new THREE.Mesh( sphere, material );
scene.add( mesh );
mesh.position.set(40,20,-15);
// finally add the sound to the mesh
mesh.add( sound );


  //_____CONTROLLER FUNCTIONS________________________________________
function onStartR( event ){ 
  Right_trigger_active = true; //remove later on 
  bullet = new THREE.Mesh( bulletGeom, bulletMat );
  shot = false;
  controller1.userData.selectPressed = true;
}
  
function onEndR(){ 
  Right_trigger_active = false;  //remove later on 
  controller1.userData.selectPressed = false;
}

function onStartL( event ){ 
  left_trigger_active = true;  
  controller2.userData.selectPressed = true;
}
  
function onEndL(){ 
  left_trigger_active = false;  
  controller2.userData.selectPressed = false;
}

function handleController( controller, dt ){
  const speed = 3.6;
  if(controller.userData.selectPressed){
    //LEFT CONTROLLER FOR MOVING FORWARD
    if(controller === controller2){
      const minDistWall = 1;
      let pos = new THREE.Quaternion();
      let quat = new THREE.Quaternion();
      let blocked = false;
      pos = dolly.position.clone();
      pos.y += 1;
      dolly.quaternion.clone(quat);
      dolly.quaternion.copy(dummyCam.getWorldQuaternion(new THREE.Quaternion()));

      let dir = dolly.getWorldDirection(new THREE.Vector3());
      dir.negate();
      
      raycaster.set( pos, dir);
      let intersect = raycaster.intersectObjects( getCollidables() );
      if( intersect.length > 0 ){
        if( intersect[0].distance < minDistWall ) blocked = true;
        if( intersect[0].distance >= minDistWall ) blocked = false;
      }
      if ( !blocked ) dolly.translateZ(-dt*speed);
      dolly.position.y = 0;
      dolly.quaternion.copy(quat);
    }
    
    //_____RIGHT CONTROLLER FOR SHOOTING STUFF_____
    if(controller === controller1){
      if(!shot){
        scene.add(bullet);
        let pos = controllerGrip1.getWorldPosition(new THREE.Vector3());
        bullet.position.add(pos);
        bullet.quaternion.copy(controllerGrip1.getWorldQuaternion(new THREE.Quaternion))
        bullets.unshift(bullet);
        shot = true;
        //test
      }
    }
  }
}