import * as THREE from 'three';
import {cutRectangle} from './modeling.js';

const vec=(v,n,positive=false)=>Array.isArray(v)&&v.length===n&&v.every(x=>Number.isFinite(x)&&Math.abs(x)<=200000&&(!positive||x>0));
export function isValidCutRecipe(r){return !!r&&typeof r==='object'&&['x','y','z'].includes(r.axis)&&[-1,1].includes(r.sign)&&Number.isFinite(r.face)&&Math.abs(r.face)<=100000&&vec(r.first,2)&&vec(r.second,2)&&vec(r.baseScale,3,true)&&r.baseScale.every(x=>x<=100000)&&vec(r.center,3)&&vec(r.resultScale,3,true)&&r.resultScale.every(x=>x<=100000)&&['pocket','through'].includes(r.mode)&&Number.isFinite(r.depth)&&r.depth>0&&r.depth<=200000}
/** Recompute from the unmodified box, preserving the current object transform. */
export function editBoxCut(recipe,position,scale,quaternion,{mode,depth}){
  if(!isValidCutRecipe(recipe)||!['pocket','through'].includes(mode)||!Number.isFinite(depth)||depth<=0||depth>200000)throw new Error('Parâmetros de corte inválidos.');
  const original=new THREE.BoxGeometry(1,1,1),base=new THREE.Vector3().fromArray(recipe.baseScale);
  try{
    const cutDepth=mode==='through'?Math.min(200000,Math.max(...recipe.baseScale)*2+.01):depth;
    const result=cutRectangle(original,base,{axis:recipe.axis,sign:recipe.sign,face:recipe.face,first:recipe.first,second:recipe.second,depth:cutDepth});
    const factor=scale.clone().divide(new THREE.Vector3().fromArray(recipe.resultScale));
    const offset=new THREE.Vector3().fromArray(result.position).sub(new THREE.Vector3().fromArray(recipe.center)).multiply(factor).applyQuaternion(quaternion);
    const nextPosition=position.clone().add(offset),nextScale=new THREE.Vector3().fromArray(result.scale).multiply(factor);
    if([...nextPosition.toArray(),...nextScale.toArray()].some(v=>!Number.isFinite(v)||Math.abs(v)>100000)||nextScale.toArray().some(v=>v<=0))throw new Error('Resultado fora dos limites da cena.');
    return {geometry:result.geometry,position:nextPosition,scale:nextScale,recipe:{...recipe,mode,depth,center:result.position,resultScale:result.scale}};
  }finally{original.dispose()}
}
export function originalBoxTransform(recipe,position,scale,quaternion){
  if(!isValidCutRecipe(recipe))throw new Error('Parâmetros de corte inválidos.');
  const factor=scale.clone().divide(new THREE.Vector3().fromArray(recipe.resultScale));
  const nextPosition=position.clone().sub(new THREE.Vector3().fromArray(recipe.center).multiply(factor).applyQuaternion(quaternion));
  const nextScale=new THREE.Vector3().fromArray(recipe.baseScale).multiply(factor);
  if([...nextPosition.toArray(),...nextScale.toArray()].some(v=>!Number.isFinite(v)||Math.abs(v)>100000)||nextScale.toArray().some(v=>v<=0))throw new Error('Resultado fora dos limites da cena.');
  return {position:nextPosition,scale:nextScale};
}
