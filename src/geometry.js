import * as THREE from 'three';

export const PRIMITIVES = {
  box: {label:'Cubo', create:()=>new THREE.BoxGeometry(1,1,1)},
  sphere: {label:'Esfera', create:()=>new THREE.SphereGeometry(.5,32,20)},
  cylinder: {label:'Cilindro', create:()=>new THREE.CylinderGeometry(.5,.5,1,32)},
  cone: {label:'Cone', create:()=>new THREE.ConeGeometry(.5,1,32)},
  pyramid: {label:'Pirâmide', create:()=>new THREE.ConeGeometry(.5,1,4)},
  torus: {label:'Toro', create:()=>new THREE.TorusGeometry(.35,.15,16,48).rotateX(Math.PI/2)},
  tetrahedron: {label:'Tetraedro', create:()=>new THREE.TetrahedronGeometry(.5)},
  icosahedron: {label:'Icosaedro', create:()=>new THREE.IcosahedronGeometry(.5)},
  octahedron: {label:'Octaedro', create:()=>new THREE.OctahedronGeometry(.5)},
  dodecahedron: {label:'Dodecaedro', create:()=>new THREE.DodecahedronGeometry(.5)},
  capsule: {label:'Cápsula', create:()=>new THREE.CapsuleGeometry(.35,.3,8,24)},
};

export const PARAMETRIC_DEFAULTS = Object.freeze({sphere:{widthSegments:32,heightSegments:20},cylinder:{segments:32,topRatio:1},cone:{segments:32,topRatio:0},torus:{radialSegments:16,tubularSegments:48,tubeRatio:.3}});
export function isValidPrimitiveParams(type,p){
  if(!p||typeof p!=='object'||!Object.hasOwn(PARAMETRIC_DEFAULTS,type))return false;
  if(Object.keys(p).length!==Object.keys(PARAMETRIC_DEFAULTS[type]).length||!Object.keys(PARAMETRIC_DEFAULTS[type]).every(key=>Object.hasOwn(p,key)))return false;
  const int=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
  if(type==='sphere')return int(p.widthSegments,3,96)&&int(p.heightSegments,2,64);
  if(type==='cylinder'||type==='cone')return int(p.segments,3,128)&&Number.isFinite(p.topRatio)&&p.topRatio>=0&&p.topRatio<=1;
  return int(p.radialSegments,3,64)&&int(p.tubularSegments,3,128)&&Number.isFinite(p.tubeRatio)&&p.tubeRatio>=.05&&p.tubeRatio<=.9;
}
function parametricGeometry(type,p){
  if(!isValidPrimitiveParams(type,p))throw new Error('Parâmetros da primitiva inválidos.');
  if(type==='sphere')return new THREE.SphereGeometry(.5,p.widthSegments,p.heightSegments);
  if(type==='cylinder'||type==='cone')return new THREE.CylinderGeometry(.5*p.topRatio,.5,1,p.segments);
  return new THREE.TorusGeometry((1-p.tubeRatio)*.5,p.tubeRatio*.5,p.radialSegments,p.tubularSegments).rotateX(Math.PI/2);
}

// Every primitive has a one-unit bounding box, so dimensions in the inspector
// remain meaningful even for curved shapes or rotated geometry.
export function createPrimitiveGeometry(type,params) {
  if (!Object.hasOwn(PRIMITIVES,type)) throw new Error('Primitiva desconhecida');
  const geometry=params===undefined?PRIMITIVES[type].create():parametricGeometry(type,params);
  geometry.computeBoundingBox();
  const size=geometry.boundingBox.getSize(new THREE.Vector3());
  const center=geometry.boundingBox.getCenter(new THREE.Vector3());
  geometry.translate(-center.x,-center.y,-center.z);
  geometry.scale(1/size.x,1/size.y,1/size.z);
  geometry.computeBoundingBox();
  return geometry;
}
