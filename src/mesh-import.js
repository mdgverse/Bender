import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

export const MAX_MESH_VALUES = 30000;
export const MAX_SCENE_MESH_VALUES = 60000;

export function isValidMeshPositions(values) {
  return Array.isArray(values) && values.length >= 9 && values.length <= MAX_MESH_VALUES && values.length % 9 === 0 && values.every(v=>Number.isFinite(v) && Math.abs(v)<=.5001);
}

/** Center and normalize a world-space triangle mesh, retaining its original bounds. */
export function normalizeImportedGeometry(input) {
  if(!input?.isBufferGeometry || !input.attributes.position) throw new Error('A malha não contém vértices.');
  const geometry=input.index?input.toNonIndexed():input.clone();
  try {
    const pos=geometry.attributes.position;
    if(pos.itemSize!==3||pos.count<3||pos.count%3!==0||pos.count*3>MAX_MESH_VALUES)throw new Error('A malha deve conter até 10.000 vértices triangulares.');
    for(let i=0;i<pos.count;i++) if(![pos.getX(i),pos.getY(i),pos.getZ(i)].every(n=>Number.isFinite(n)&&Math.abs(n)<=100000))throw new Error('A malha contém coordenadas inválidas.');
    geometry.computeBoundingBox();const center=geometry.boundingBox.getCenter(new THREE.Vector3()),size=geometry.boundingBox.getSize(new THREE.Vector3());
    if(size.length()<1e-8)throw new Error('A malha não possui dimensões.');
    if(Math.max(size.x,size.y,size.z)>100000)throw new Error('A malha excede as dimensões permitidas.');
    size.set(Math.max(size.x,.001),Math.max(size.y,.001),Math.max(size.z,.001));
    geometry.translate(-center.x,-center.y,-center.z);geometry.scale(1/size.x,1/size.y,1/size.z);
    const values=Array.from(geometry.attributes.position.array, v=>Math.round(v*1e7)/1e7);
    if(!isValidMeshPositions(values))throw new Error('A malha contém geometria inválida.');
    return {position:center.toArray(),scale:size.toArray(),geometry:values};
  } finally {geometry.dispose()}
}

export function geometryFromPositions(values) {
  if(!isValidMeshPositions(values))throw new Error('Geometria importada inválida.');
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(values,3));geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}

export function parseSTL(buffer) {
  if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<15||buffer.byteLength>2_000_000)throw new Error('Arquivo STL vazio ou maior que 2 MB.');
  if(buffer.byteLength>=84){const view=new DataView(buffer);const faces=view.getUint32(80,true);const isExact=84+faces*50===buffer.byteLength;const prefix=new TextDecoder().decode(new Uint8Array(buffer,0,Math.min(buffer.byteLength,9))).trimStart().toLowerCase();if(isExact){if(faces>MAX_MESH_VALUES/9)throw new Error('STL excede o limite de triângulos.')}else if(!prefix.startsWith('solid'))throw new Error('Arquivo STL binário inválido.');}
  const geometry=new STLLoader().parse(buffer);
  try{return [normalizeImportedGeometry(geometry)]}finally{geometry.dispose()}
}

export function parseOBJ(text) {
  if(typeof text!=='string'||text.length>2_000_000)throw new Error('Arquivo OBJ maior que 2 MB.');
  const root=new OBJLoader().parse(text);root.updateMatrixWorld(true);const result=[];let total=0;
  try {root.traverse(object=>{if(!object.isMesh)return;const clone=object.geometry.clone();try{clone.applyMatrix4(object.matrixWorld);const item=normalizeImportedGeometry(clone);total+=item.geometry.length;if(total>MAX_SCENE_MESH_VALUES||result.length>=100)throw new Error('OBJ excede o limite de malhas ou vértices.');result.push(item)}finally{clone.dispose()}})}
  finally{root.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose()})}
  if(!result.length)throw new Error('O OBJ não contém faces triangulares.');return result;
}
