import * as THREE from 'three';
import {isValidMeshPositions,geometryFromPositions} from './mesh-import.js';
import {isValidCutRecipe,editBoxCut} from './editable-cut.js';
import {bevelMeshEdge,findBevelEdges} from './modeling.js';
const v=(x,n,positive=false)=>Array.isArray(x)&&x.length===n&&x.every(a=>Number.isFinite(a)&&Math.abs(a)<=100000&&(!positive||a>0));
export function isValidMeshBevel(r){const e=r?.edge;return !!r&&typeof r==='object'&&isValidMeshPositions(r.sourceGeometry)&&v(r.sourceScale,3,true)&&v(r.center,3)&&v(r.resultScale,3,true)&&isValidCutRecipe(r.sourceCut)&&e&&['x','y','z'].includes(e.axis)&&v(e.point,3)&&Number.isFinite(e.min)&&Number.isFinite(e.max)&&Math.abs(e.min)<=100000&&Math.abs(e.max)<=100000&&e.max>e.min&&Array.isArray(e.normals)&&e.normals.length===2&&e.normals.every(n=>n&&['x','y','z'].includes(n.axis)&&[-1,1].includes(n.sign))&&e.normals[0].axis!==e.normals[1].axis&&e.normals.every(n=>n.axis!==e.axis)&&Number.isFinite(r.amount)&&r.amount>0&&r.amount<=100000&&Number.isInteger(r.segments)&&r.segments>=1&&r.segments<=12&&(r.enabled===undefined||typeof r.enabled==='boolean')}
function transformed(recipe,position,scale,quaternion,center,dimensions){const factor=scale.clone().divide(new THREE.Vector3().fromArray(recipe.resultScale)),nextPos=position.clone().add(new THREE.Vector3().fromArray(center).sub(new THREE.Vector3().fromArray(recipe.center)).multiply(factor).applyQuaternion(quaternion)),nextScale=new THREE.Vector3().fromArray(dimensions).multiply(factor);if([...nextPos.toArray(),...nextScale.toArray()].some(n=>!Number.isFinite(n)||Math.abs(n)>100000)||nextScale.toArray().some(n=>n<=0))throw new Error('Resultado fora dos limites da cena.');return {position:nextPos,scale:nextScale}}
export function editMeshBevel(recipe,position,scale,quaternion,amount,segments,enabled=true){if(!isValidMeshBevel(recipe))throw new Error('Parâmetros do chanfro inválidos.');const geometry=geometryFromPositions(recipe.sourceGeometry);try{const result=enabled?bevelMeshEdge(geometry,new THREE.Vector3().fromArray(recipe.sourceScale),recipe.edge,amount,segments):{geometry:recipe.sourceGeometry,position:[0,0,0],scale:recipe.sourceScale};return {...transformed(recipe,position,scale,quaternion,result.position,result.scale),geometry:result.geometry,recipe:{...recipe,center:result.position,resultScale:result.scale,amount,segments,enabled}}}finally{geometry.dispose()}}
export function removeMeshBevel(recipe,position,scale,quaternion){if(!isValidMeshBevel(recipe))throw new Error('Parâmetros do chanfro inválidos.');return transformed(recipe,position,scale,quaternion,[0,0,0],recipe.sourceScale)}

/** Recompute the preceding cut while the bevel is disabled. Keep an edge only
 * when it still describes the same physical crease on the rebuilt solid. */
export function editCutBeneathBevel(recipe,position,scale,quaternion,{mode,depth,first=recipe.sourceCut.first,second=recipe.sourceCut.second}){
  if(!isValidMeshBevel(recipe)||recipe.enabled!==false)throw new Error('Desative o chanfro antes de editar o corte.');
  const sourceScale=new THREE.Vector3().fromArray(recipe.sourceScale),oldCut=recipe.sourceCut;
  const rebuilt=editBoxCut(oldCut,new THREE.Vector3(),sourceScale,new THREE.Quaternion(),{mode,depth,first,second,enabled:oldCut.enabled!==false});
  const geometry=geometryFromPositions(rebuilt.geometry);
  try{
    const factor=sourceScale.clone().divide(new THREE.Vector3().fromArray(oldCut.resultScale));
    const oldCenter=new THREE.Vector3().fromArray(oldCut.center),newCenter=new THREE.Vector3().fromArray(rebuilt.recipe.center),axes=['x','y','z'],edge=recipe.edge,eps=Math.max(1e-6,Math.max(...oldCut.baseScale)*1e-5);
    const normalKey=e=>e.normals.map(n=>`${n.axis}:${n.sign}`).sort().join('|'),oldAxisCenter=oldCenter[edge.axis],oldStart=edge.min/factor[edge.axis]+oldAxisCenter,oldEnd=edge.max/factor[edge.axis]+oldAxisCenter;
    const matches=findBevelEdges(geometry,rebuilt.scale).filter(candidate=>{
      if(candidate.axis!==edge.axis||normalKey(candidate)!==normalKey(edge))return false;
      if(axes.filter(a=>a!==edge.axis).some(a=>Math.abs(edge.point[axes.indexOf(a)]/factor[a]+oldCenter[a]-candidate.point[axes.indexOf(a)]/factor[a]-newCenter[a])>eps))return false;
      const min=candidate.min/factor[edge.axis]+newCenter[edge.axis],max=candidate.max/factor[edge.axis]+newCenter[edge.axis];return Math.min(oldEnd,max)-Math.max(oldStart,min)>eps;
    });
    if(matches.length!==1)throw new Error('A aresta do chanfro não pode ser identificada com segurança após esta alteração. Remova o chanfro para editar o corte.');
    const external=scale.clone().divide(sourceScale),nextPosition=position.clone().add(rebuilt.position.clone().multiply(external).applyQuaternion(quaternion)),nextScale=rebuilt.scale.clone().multiply(external);
    if([...nextPosition.toArray(),...nextScale.toArray()].some(v=>!Number.isFinite(v)||Math.abs(v)>100000)||nextScale.toArray().some(v=>v<=0))throw new Error('Resultado fora dos limites da cena.');
    return {geometry:rebuilt.geometry,position:nextPosition,scale:nextScale,recipe:{...recipe,sourceGeometry:rebuilt.geometry,sourceScale:rebuilt.scale.toArray(),sourceCut:rebuilt.recipe,edge:matches[0],center:[0,0,0],resultScale:rebuilt.scale.toArray()}};
  } finally {geometry.dispose()}
}

/** Edit the cut and rebuild an active bevel as a single atomic operation. */
export function editCutWithBevel(recipe,position,scale,quaternion,options){
  if(!isValidMeshBevel(recipe))throw new Error('Parâmetros do chanfro inválidos.');
  if(recipe.enabled===false)return editCutBeneathBevel(recipe,position,scale,quaternion,options);
  const disabled=editMeshBevel(recipe,position,scale,quaternion,recipe.amount,recipe.segments,false);
  const edited=editCutBeneathBevel(disabled.recipe,disabled.position,disabled.scale,quaternion,options);
  return editMeshBevel(edited.recipe,edited.position,edited.scale,quaternion,recipe.amount,recipe.segments,true);
}
