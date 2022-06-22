import * as THREE from 'three';
import {FontLoader} from 'FontLoader';
import {TextGeometry} from 'TextGeometry';
//Path
//const pathToBowGLTF = "./models/bow.glb";
const skyBoxPtahs = [ "./SkyBoxImages/stormydays_ft.png",
                      "./SkyBoxImages/stormydays_bk.png",
                      "./SkyBoxImages/stormydays_up.png",
                      "./SkyBoxImages/stormydays_dn.png",
                      "./SkyBoxImages/stormydays_rt.png",
                      "./SkyBoxImages/stormydays_lf.png",
                    ];

//scene design vars:
const widthofRange = 50; //Shootingrange size 
const lengthOfRange = 100; //Shootingrange size
const heightOfWall = 10;
const radiusOfHayBale = .6;
const heightOfHayBale = .7;
const countRadialSegments = 20;

//Lighting
const dist = 10.0;
const angle = Math.PI/4.0;
const penum = 0.5;
const dec = 1.0;
//const light = new THREE.SpotLight(0xffffff, 100, dist, angle, penum, dec);
const ambientLight = new THREE.AmbientLight( 0xF0FF40 );

const light = new THREE.DirectionalLight( 0xffffff );
				light.position.set( 0, 6, 0 );
				light.castShadow = true;
				light.shadow.camera.top = 2;
				light.shadow.camera.bottom = - 2;
				light.shadow.camera.right = 2;
				light.shadow.camera.left = - 2;
				light.shadow.mapSize.set( 4096, 4096 );
				


//loader
// const loader = new GLTFLoader();
const skyLoader = new THREE.CubeTextureLoader();
// const objLoader = new OBJLoader();

//textures
const hayTexture = new THREE.TextureLoader().load( "./textures/hayTexture.jpg" );
const woodTexture = new THREE.TextureLoader().load( "./textures/wood_texture.jpg" );
const wallTexture = new THREE.TextureLoader().load( "./textures/wood_texture.jpg" );
const skyBoxTexture = skyLoader.load(skyBoxPtahs);
skyBoxTexture.encoding = THREE.sRGBEncoding;

//materials
const bowStringMaterial = new THREE.MeshStandardMaterial( { color: '#03ffff' } ); //light blue material
const woodMaterial = new THREE.MeshStandardMaterial( {  map: woodTexture,
                                                        roughness: 0.7, }); //brown material for the Bow and the Arrow
const metalMaterial = new THREE.LineBasicMaterial( { color: '#ADADAD' } ); //grey material for the arrowhead
const hayMaterial = new THREE.MeshStandardMaterial( {  map: hayTexture  } ); //yellow'ish for the hay bales (targets)
const floorMaterial = new THREE.MeshBasicMaterial( { color: 0x8fff0f } );

//geometrys
const hayBaleGeometry = new THREE.CylinderGeometry( radiusOfHayBale, radiusOfHayBale, heightOfHayBale, countRadialSegments ); //CylinderGeometry(radiusTop : Float, radiusBottom : Float, height : Float, radialSegments : Integer, heightSegments : Integer, openEnded : Boolean, thetaStart : Float, thetaLength : Float)
const floorGeom = new THREE.PlaneGeometry( widthofRange, lengthOfRange );
const LongWallGeom = new THREE.BoxGeometry( lengthOfRange, heightOfWall, 1 );
const shortWallGeom = new THREE.BoxGeometry( widthofRange, heightOfWall, 1 );

const floor = new THREE.Mesh(floorGeom, floorMaterial);
floor.rotateX( -Math.PI / 2 );
floor.receiveShadow = true;


const wall1 = new THREE.Mesh(LongWallGeom, woodMaterial).rotateY( -Math.PI / 2 ); // default sicht "rechts"
//(x +r -l)(y +o -u)(z +bild raus -bild rein)
wall1.position.set(widthofRange/2, heightOfWall/2,  0);//seite

const wall2 = new THREE.Mesh(LongWallGeom, woodMaterial).rotateY( -Math.PI / 2 ); //default sicht "links"
wall2.position.set(-widthofRange/2, heightOfWall/2,  0);

const wall3 = new THREE.Mesh(shortWallGeom, woodMaterial); //default sicht "vorne"
wall3.position.set(0, heightOfWall/2,  -lengthOfRange/2);

const wall4 = new THREE.Mesh(shortWallGeom, woodMaterial); //default sicht "hinten"
wall4.position.set(0, heightOfWall/2,  lengthOfRange/2);

//creating a few hayBales and adding them into scene
const hayBale1 = new THREE.Mesh( hayBaleGeometry, hayMaterial );
hayBale1.position.set(12, heightOfHayBale/2,  30);
const hayBale2 = new THREE.Mesh( hayBaleGeometry, hayMaterial );
hayBale2.position.set(1, heightOfHayBale/2,  9);
const hayBale3 = new THREE.Mesh( hayBaleGeometry, hayMaterial );
hayBale3.position.set(-3, heightOfHayBale/2,  8);
const hayBale4 = new THREE.Mesh( hayBaleGeometry, hayMaterial );
hayBale4.position.set(-23, heightOfHayBale/2,  -4);
const hayBale5 = new THREE.Mesh( hayBaleGeometry, hayMaterial );
hayBale5.position.set(2, heightOfHayBale/2,  9);

const loader = new FontLoader();



//tut aktuell inchts sichtbares.
hayBale1.castShadow = true;
hayBale2.castShadow = true;
hayBale3.castShadow = true;
hayBale4.castShadow = true;
hayBale5.castShadow = true;

const collidableObjects = [];
const shootables = [];

let sceneText;

export function addWorldIntoScene (scene){
    scene.add( ambientLight );
    scene.add( light );
      
    scene.background = skyBoxTexture;
    
    scene.add(floor);
    scene.add(wall1);
    scene.add(wall2);
    scene.add(wall3);
    scene.add(wall4);
    scene.add(hayBale1);
    scene.add(hayBale2);
    scene.add(hayBale3);
    scene.add(hayBale4);
    scene.add(hayBale5);

    loader.load( 'fonts/font.json', function ( font ) {
      const textGeom = new TextGeometry( 'ARCHER', {
        font: font,
        size: 3,
        height: 5,
        curveSegments: 12,
      } );
      const textMesh = new THREE.Mesh(textGeom, [
        new THREE.MeshPhongMaterial({color: 0xad4000}),
        new THREE.MeshPhongMaterial({color: 0x5c2301})
      ])
    
      textMesh.castShadow = true;
      textMesh.position.setX(-10)
      textMesh.position.setY(12)
      textMesh.position.setZ(-50)
      scene.add(textMesh)
    } );
   
    //__________ADDING IN OBJ WHICH I CAN COLLIDE WITH______________
    collidableObjects.push(wall1);
    collidableObjects.push(wall2);
    collidableObjects.push(wall3);
    collidableObjects.push(wall4);

    shootables.push(hayBale1);
    shootables.push(hayBale2);
    shootables.push(hayBale3);
    shootables.push(hayBale4);
    shootables.push(hayBale5);
}

export function getCollidables(){
  return collidableObjects;
}

export function getShootables(){
  return shootables;
}