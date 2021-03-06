import * as THREE from 'three';
import { addWorldIntoScene, getCollidables, getShootables } from './buildWorld.js';
import { VRButton } from 'VRButton';
import { XRControllerModelFactory } from 'XRControllerModelFactory';
import { OrbitControls } from 'OrbitControls';
import { Matrix3, Vector3 } from 'three';
import {FontLoader} from 'FontLoader';
import {TextGeometry} from 'TextGeometry';
//scene design vars: -------------------------x
const widthofRange = 50; //Shootingrange size 
const lengthOfRange = 100; //Shootingrange size
const heightOfWall = 10;

//scene settings
const scene = new THREE.Scene();

//clock
const clock = new THREE.Clock();

//gameText 
let textMesh;
let kills = 0;

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
refresh();
const collidables = getCollidables();
//animation loop function
function animate() {
  renderer.setAnimationLoop( render );
}
animate();

function render() {
  const dt = clock.getDelta();
  if(controller1)handleController(controller1, dt);
  if(controller2)handleController(controller2, dt);
  updateBullets(dt);
  renderer.render( scene, camera );
}
//Func for repos the hayBales
function newPosOnRange(){
  let x = (Math.random()*48)-24;
  let z = (Math.random()*98)-49;
  let y = .35;
  return new Vector3(x, y, z);
}

//___________PROJECTILE ARRAY FOR SHOOTING___________
let bullets = [];
const bulletGeom = new THREE.SphereGeometry( .2, 32, 16 );
let bullet = new THREE.Mesh( bulletGeom,  new THREE.MeshPhongMaterial( { color: Math.random()*0xffffff } ) );
let shot = true;

const bulletRay = new THREE.Raycaster();

function updateBullets(dt){
  const flyspeed = 30;
  let zer = new THREE.Vector3();
  for(let o of bullets){
    o.translateZ(o.userData.speed * (-dt));
    let pos = o.position.clone();
    let dir = o.getWorldDirection(new THREE.Vector3());
    dir.negate();
    bulletRay.set( pos, dir );
    let intersect = bulletRay.intersectObjects( getShootables() );
    if(intersect.length > 0){
      if(intersect[0].distance < 1)
        {
          //New Position of HayBales after Bullet hit
          kills++;
          refresh();
          let rand = newPosOnRange();
          scene.getObjectById(intersect[0].object.id).position.set(rand.x, rand.y, rand.z)
          bullets = bullets.filter((v)=>{
            scene.remove(o)
            return v != o;
          })
        }
    }
  }
  
  if(bullets.length > 0){
    const removalDist = 400; // on this dist, the ball will be removed
    var p = new THREE.Vector3();
    bullets[bullets.length-1].getWorldPosition(p);
    let dist = p.distanceTo(zer);
    if(dist >= removalDist){
      scene.remove(bullets.pop());
    }
  }
}

//___________SPEAKER SPHERE_____________
const sphere = new THREE.SphereGeometry( 1, 32, 16 );
const material = new THREE.MeshPhongMaterial( { color: 0xff2200 } );
const mesh = new THREE.Mesh( sphere, material );
scene.add( mesh );
mesh.position.set(40,20,-15);
// finally add the sound to the mesh
mesh.add( sound );

  //_____CONTROLLER FUNCTIONS________________________________________
function onStartR( event ){ 
  Right_trigger_active = true;
  if(left_trigger_active){
    bullet = new THREE.Mesh( bulletGeom, new THREE.MeshPhongMaterial( { color: Math.random()*0xffffff } ) );
    shot = false;
  }
  controller1.userData.selectPressed = true;
}
  
function onEndR(){ 
  Right_trigger_active = false; 
  if(left_trigger_active)releaseProjectile();
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

function releaseProjectile(){
  if(!shot){
    scene.add(bullet);
    //position of right hand and with that the end of the bow string
    let pos = controllerGrip1.getWorldPosition(new THREE.Vector3());
    let bowhandle = controllerGrip2.getWorldPosition(new THREE.Vector3());

    bullet.userData.speed = pos.distanceTo(bowhandle)*40;

    bullet.position.add(pos);
    let rotMatrix = new THREE.Matrix4().lookAt(pos, bowhandle, new THREE.Vector3(0, 11, 0))
    bullet.quaternion.setFromRotationMatrix(rotMatrix);
    bullets.unshift(bullet);
    shot = true;
    //test
  }
}

function handleController( controller, dt ){
  const speed = 3.6;
  if(controller.userData.selectPressed){
    //RIGHT CONTROLLER FOR MOVING FORWARD
    if(controller === controller1 && !controller2.userData.selectPressed){
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
  }
}

function createText() {
  const loader = new FontLoader();
  loader.load('./node_modules/three/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    let textGeo = new TextGeometry( 'Killcounter: ' + kills.toString(), {
      font: font,
      size: 3,
      height: 2,
      curveSegments: 24,
    } );
    textMesh = new THREE.Mesh(textGeo, new THREE.MeshStandardMaterial( { color: '#03ffff' } ));
    textMesh.castShadow = true;
    textMesh.position.setX(-10)
    textMesh.position.setY(10.5)
    textMesh.position.setZ(-50)
    camera.add(textMesh);
    scene.add(textMesh);
  });
}

function refresh() {
  if ( textMesh !== undefined ) scene.remove(textMesh);
  createText();
}