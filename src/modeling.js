import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {Brush, Evaluator, SUBTRACTION} from 'three-bvh-csg';
import {normalizeImportedGeometry} from './mesh-import.js';

/** Faceted bevel on all edges of an unrotated box in local physical coordinates. */
export function bevelBox(scale, amount) {
  if(![scale.x,scale.y,scale.z,amount].every(Number.isFinite)||amount<=0||amount>=Math.min(scale.x,scale.y,scale.z)/2)throw new Error('Use um chanfro maior que zero e menor que a metade da menor dimensão.');
  const geometry=new RoundedBoxGeometry(scale.x,scale.y,scale.z,1,amount);
  try{return normalizeImportedGeometry(geometry)}finally{geometry.dispose()}
}

/** Rectangular subtractive prism, in the object's local coordinates measured in metres. */
export function cutRectangle(sourceGeometry, scale, {axis,sign,face,first,second,depth}) {
  if(!['x','y','z'].includes(axis)||![-1,1].includes(sign)||![scale.x,scale.y,scale.z,face,depth,...first,...second].every(Number.isFinite)||depth<=0||depth>200000)throw new Error('Corte inválido.');
  const axes=['x','y','z'].filter(a=>a!==axis), width=Math.abs(second[0]-first[0]),height=Math.abs(second[1]-first[1]);
  if(width<.001||height<.001||width>200000||height>200000)throw new Error('Desenhe um retângulo maior para fazer o corte.');
  const margin=Math.max(.0001,Math.min(.01,depth*.01));
  const dims=new THREE.Vector3();dims[axes[0]]=width;dims[axes[1]]=height;dims[axis]=depth+margin;
  const cutterGeometry=new THREE.BoxGeometry(dims.x,dims.y,dims.z);
  const geometry=sourceGeometry.clone();geometry.scale(scale.x,scale.y,scale.z);geometry.clearGroups();
  const a=new Brush(geometry),b=new Brush(cutterGeometry);b.position[axes[0]]=(first[0]+second[0])/2;b.position[axes[1]]=(first[1]+second[1])/2;b.position[axis]=face-sign*(depth-margin)/2;a.updateMatrixWorld();b.updateMatrixWorld();
  let result;
  try{
    const evaluator=new Evaluator();evaluator.useGroups=false;evaluator.attributes=['position','normal'];result=evaluator.evaluate(a,b,SUBTRACTION);
    const g=result.geometry, index=g.index, p=g.attributes.position, count=Math.min(g.drawRange.count,index?index.count:p.count);
    if(!Number.isFinite(count)||count<3||count%3!==0||count>10000)throw new Error('Corte vazio ou complexo demais para o editor.');
    const values=[];for(let i=0;i<count;i++){const n=index?index.getX(i):i;values.push(p.getX(n),p.getY(n),p.getZ(n))}
    const trimmed=new THREE.BufferGeometry();trimmed.setAttribute('position',new THREE.Float32BufferAttribute(values,3));
    try{return normalizeImportedGeometry(trimmed)}finally{trimmed.dispose()}
  } finally {result?.geometry.dispose();geometry.dispose();cutterGeometry.dispose()}
}
