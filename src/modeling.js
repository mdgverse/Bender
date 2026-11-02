import * as THREE from 'three';
import {Brush, Evaluator, SUBTRACTION} from 'three-bvh-csg';
import {normalizeImportedGeometry} from './mesh-import.js';

/** Chamfer or round one of the twelve original box edges, in local metres. */
export function bevelEdge(scale, axis, signs, amount, segments=1) {
  const axes={x:['y','z'],y:['z','x'],z:['x','y']}[axis];
  if(!axes||!Array.isArray(signs)||signs.length!==2||!signs.every(s=>s===1||s===-1)||![scale.x,scale.y,scale.z,amount].every(Number.isFinite)||!Number.isInteger(segments)||segments<1||segments>12||amount<=0||amount>=Math.min(scale[axes[0]],scale[axes[1]])/2)throw new Error('Largura inválida para essa aresta. Use menos da metade da menor dimensão adjacente.');
  const [u,v]=axes, hu=scale[u]/2,hv=scale[v]/2,corners=[[-hu,-hv],[hu,-hv],[hu,hv],[-hu,hv]],points=[];
  for(let i=0;i<4;i++){
    const c=corners[i];if(Math.sign(c[0])!==signs[0]||Math.sign(c[1])!==signs[1]){points.push(c);continue}
    const prev=corners[(i+3)%4],next=corners[(i+1)%4],pre=[c[0]+Math.sign(prev[0]-c[0])*amount,c[1]+Math.sign(prev[1]-c[1])*amount],post=[c[0]+Math.sign(next[0]-c[0])*amount,c[1]+Math.sign(next[1]-c[1])*amount];
    const center=[c[0]-signs[0]*amount,c[1]-signs[1]*amount],start=Math.atan2(pre[1]-center[1],pre[0]-center[0]);let end=Math.atan2(post[1]-center[1],post[0]-center[0]);while(end<=start)end+=Math.PI*2;
    for(let j=0;j<=segments;j++){const theta=start+(end-start)*j/segments;points.push([center[0]+Math.cos(theta)*amount,center[1]+Math.sin(theta)*amount])}
  }
  const shape=new THREE.Shape();shape.moveTo(...points[0]);for(const p of points.slice(1))shape.lineTo(...p);shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:scale[axis],bevelEnabled:false,steps:1});geometry.translate(0,0,-scale[axis]/2);
  const pos=geometry.attributes.position;for(let i=0;i<pos.count;i++){const a=pos.getX(i),b=pos.getY(i),c=pos.getZ(i),mapped=new THREE.Vector3();mapped[u]=a;mapped[v]=b;mapped[axis]=c;pos.setXYZ(i,mapped.x,mapped.y,mapped.z)}pos.needsUpdate=true;
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
