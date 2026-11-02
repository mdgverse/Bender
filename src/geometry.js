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

// Every primitive has a one-unit bounding box, so dimensions in the inspector
// remain meaningful even for curved shapes or rotated geometry.
export function createPrimitiveGeometry(type) {
  if (!Object.hasOwn(PRIMITIVES,type)) throw new Error('Primitiva desconhecida');
  const geometry=PRIMITIVES[type].create();
  geometry.computeBoundingBox();
  const size=geometry.boundingBox.getSize(new THREE.Vector3());
  const center=geometry.boundingBox.getCenter(new THREE.Vector3());
  geometry.translate(-center.x,-center.y,-center.z);
  geometry.scale(1/size.x,1/size.y,1/size.z);
  geometry.computeBoundingBox();
  return geometry;
}
