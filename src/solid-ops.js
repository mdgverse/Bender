import * as THREE from 'three';
import {Brush,Evaluator,ADDITION,SUBTRACTION,INTERSECTION} from 'three-bvh-csg';
import {normalizeImportedGeometry} from './mesh-import.js';

function normalizeResult(g){
  const pos=g.attributes.position,index=g.index,count=Math.min(g.drawRange.count,index?index.count:pos.count);
  if(!Number.isFinite(count)||count<3||count%3||count>10000)throw new Error('Resultado vazio ou complexo demais para o editor.');
  const values=[];for(let i=0;i<count;i++){const n=index?index.getX(i):i;values.push(pos.getX(n),pos.getY(n),pos.getZ(n))}
  const trimmed=new THREE.BufferGeometry();trimmed.setAttribute('position',new THREE.Float32BufferAttribute(values,3));try{return normalizeImportedGeometry(trimmed)}finally{trimmed.dispose()}
}
/** Boolean on two solids. Output is expressed in the first object's rotation/translation frame, in metres. */
export function booleanSolids(source,operand,operation){
  const operations={union:ADDITION,subtract:SUBTRACTION,intersect:INTERSECTION};if(!Object.hasOwn(operations,operation))throw new Error('Operação inválida.');
  source.updateMatrixWorld(true);operand.updateMatrixWorld(true);
  const aGeometry=source.geometry.clone();aGeometry.scale(source.scale.x,source.scale.y,source.scale.z);aGeometry.clearGroups();aGeometry.computeVertexNormals();
  const frame=new THREE.Matrix4().compose(source.position,source.quaternion,new THREE.Vector3(1,1,1)).invert();
  const bGeometry=operand.geometry.clone();bGeometry.applyMatrix4(frame.multiply(operand.matrixWorld));bGeometry.clearGroups();bGeometry.computeVertexNormals();
  const a=new Brush(aGeometry),b=new Brush(bGeometry);a.updateMatrixWorld();b.updateMatrixWorld();let result;
  try{const evaluator=new Evaluator();evaluator.useGroups=false;evaluator.attributes=['position','normal'];result=evaluator.evaluate(a,b,operations[operation]);return normalizeResult(result.geometry)}finally{result?.geometry.dispose();aGeometry.dispose();bGeometry.dispose()}
}
/** Mirror local geometry, retaining outward triangle winding. */
export function mirrorGeometry(source,scale,axis){
  if(!['x','y','z'].includes(axis))throw new Error('Eixo inválido.');
  const g=source.index?source.toNonIndexed():source.clone();try{g.scale(scale.x,scale.y,scale.z);const p=g.attributes.position;if(p.count%3!==0)throw new Error('Malha inválida.');const values=[];for(let i=0;i<p.count;i+=3)for(const j of [0,2,1]){const v=new THREE.Vector3(p.getX(i+j),p.getY(i+j),p.getZ(i+j));v[axis]*=-1;values.push(...v.toArray())}const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.Float32BufferAttribute(values,3));try{return normalizeImportedGeometry(result)}finally{result.dispose()}}finally{g.dispose()}
}
