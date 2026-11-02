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

export const PARAMETRIC_DEFAULTS = Object.freeze({sphere:{widthSegments:32,heightSegments:20},cylinder:{segments:32,topRatio:1},cone:{segments:32,topRatio:0},torus:{radialSegments:16,tubularSegments:48,tubeRatio:.3},pyramid:{segments:4,topRatio:0},capsule:{capSegments:8,radialSegments:24,capRatio:.7},tetrahedron:{detail:0},octahedron:{detail:0},icosahedron:{detail:0},dodecahedron:{detail:0}});
// Optional fields retain compatibility with projects saved before these controls existed.
export const PARAMETRIC_OPTIONALS = Object.freeze({sphere:{longitudeStart:0,longitudeSweep:360,latitudeStart:0,latitudeSweep:180},cylinder:{open:false},cone:{open:false},pyramid:{open:false},torus:{arcStart:0,arcSweep:360},tetrahedron:{flat:false},octahedron:{flat:false},icosahedron:{flat:false},dodecahedron:{flat:false}});
export function completePrimitiveParams(type,p={}){return {...PARAMETRIC_DEFAULTS[type],...PARAMETRIC_OPTIONALS[type],...p}}
export function isValidPrimitiveParams(type,p){
  if(!p||typeof p!=='object'||!Object.hasOwn(PARAMETRIC_DEFAULTS,type))return false;
  const required=PARAMETRIC_DEFAULTS[type],optional=PARAMETRIC_OPTIONALS[type]||{};if(!Object.keys(required).every(key=>Object.hasOwn(p,key))||Object.keys(p).some(key=>!Object.hasOwn(required,key)&&!Object.hasOwn(optional,key)))return false;
  p=completePrimitiveParams(type,p);
  const int=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
  if(type==='sphere')return int(p.widthSegments,3,96)&&int(p.heightSegments,2,64)&&Number.isFinite(p.longitudeStart)&&p.longitudeStart>=0&&p.longitudeStart<=360&&Number.isFinite(p.longitudeSweep)&&p.longitudeSweep>=1&&p.longitudeSweep<=360&&Number.isFinite(p.latitudeStart)&&p.latitudeStart>=0&&p.latitudeStart<180&&Number.isFinite(p.latitudeSweep)&&p.latitudeSweep>=1&&p.latitudeStart+p.latitudeSweep<=180;
  if(['cylinder','cone','pyramid'].includes(type))return int(p.segments,3,128)&&Number.isFinite(p.topRatio)&&p.topRatio>=0&&p.topRatio<=1&&typeof p.open==='boolean';
  if(type==='torus')return int(p.radialSegments,3,64)&&int(p.tubularSegments,3,128)&&Number.isFinite(p.tubeRatio)&&p.tubeRatio>=.05&&p.tubeRatio<=.9&&Number.isFinite(p.arcStart)&&p.arcStart>=0&&p.arcStart<=360&&Number.isFinite(p.arcSweep)&&p.arcSweep>=1&&p.arcSweep<=360;
  if(type==='capsule')return int(p.capSegments,2,64)&&int(p.radialSegments,3,128)&&Number.isFinite(p.capRatio)&&p.capRatio>=.1&&p.capRatio<=.95;
  return int(p.detail,0,3)&&typeof p.flat==='boolean';
}
function parametricGeometry(type,p){
  if(!isValidPrimitiveParams(type,p))throw new Error('Parâmetros da primitiva inválidos.');
  p=completePrimitiveParams(type,p);const radians=THREE.MathUtils.degToRad;
  if(type==='sphere')return new THREE.SphereGeometry(.5,p.widthSegments,p.heightSegments,radians(p.longitudeStart),radians(p.longitudeSweep),radians(p.latitudeStart),radians(p.latitudeSweep));
  if(['cylinder','cone','pyramid'].includes(type))return new THREE.CylinderGeometry(.5*p.topRatio,.5,1,p.segments,1,p.open);
  if(type==='torus')return new THREE.TorusGeometry((1-p.tubeRatio)*.5,p.tubeRatio*.5,p.radialSegments,p.tubularSegments,radians(p.arcSweep)).rotateZ(radians(p.arcStart)).rotateX(Math.PI/2);
  if(type==='capsule')return new THREE.CapsuleGeometry(p.capRatio*.5,1-p.capRatio,p.capSegments,p.radialSegments);
  const classes={tetrahedron:THREE.TetrahedronGeometry,octahedron:THREE.OctahedronGeometry,icosahedron:THREE.IcosahedronGeometry,dodecahedron:THREE.DodecahedronGeometry};return p.flat?flatPolyhedron(classes[type],p.detail):new classes[type](.5,p.detail);
}

// Subdivide each original triangle in its own plane, without spherical projection.
function flatPolyhedron(Geometry,detail){
  const base=new Geometry(.5,0),array=base.attributes.position,vertices=[],n=2**detail;
  const point=(a,b,c,i,j)=>a.clone().addScaledVector(b.clone().sub(a),i/n).addScaledVector(c.clone().sub(a),j/n);
  try{for(let k=0;k<array.count;k+=3){const a=new THREE.Vector3().fromBufferAttribute(array,k),b=new THREE.Vector3().fromBufferAttribute(array,k+1),c=new THREE.Vector3().fromBufferAttribute(array,k+2);const push=(p,q,r)=>vertices.push(...p.toArray(),...q.toArray(),...r.toArray());for(let i=0;i<n;i++)for(let j=0;j<n-i;j++){const p=point(a,b,c,i,j),q=point(a,b,c,i+1,j),r=point(a,b,c,i,j+1);push(p,q,r);if(i+j<n-1)push(q,point(a,b,c,i+1,j+1),r)}}const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));result.computeVertexNormals();return result}finally{base.dispose()}
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
