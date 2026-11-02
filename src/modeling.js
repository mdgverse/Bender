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

/** Identify straight, axis-aligned convex creases shared by two perpendicular faces.
 * Intervals are split at triangle T-junctions so cuts do not lose their edges. */
export function findBevelEdges(geometry, scale) {
  const pos=geometry.attributes.position,idx=geometry.index;if(!pos)return [];
  const count=idx?idx.count:pos.count,eps=Math.max(1e-7,Math.max(scale.x,scale.y,scale.z)*1e-6), groups=new Map(), axes=['x','y','z'];
  const vertex=i=>{const j=idx?idx.getX(i):i;return new THREE.Vector3(pos.getX(j)*scale.x,pos.getY(j)*scale.y,pos.getZ(j)*scale.z)};
  const key=n=>Math.round(n/eps);
  for(let i=0;i+2<count;i+=3){
    const points=[vertex(i),vertex(i+1),vertex(i+2)],normal=new THREE.Vector3().subVectors(points[1],points[0]).cross(new THREE.Vector3().subVectors(points[2],points[0]));
    if(normal.lengthSq()<eps*eps*eps*eps)continue;normal.normalize();
    const normalAxis=axes.find(a=>Math.abs(normal[a])>.9999);if(!normalAxis)continue;
    const sign=Math.sign(normal[normalAxis]),centroid=points[0].clone().add(points[1]).add(points[2]).divideScalar(3);
    for(let j=0;j<3;j++){
      const a=points[j],b=points[(j+1)%3],delta=new THREE.Vector3().subVectors(b,a),axis=axes.find(k=>Math.abs(delta[k])>eps&&axes.filter(q=>q!==k).every(q=>Math.abs(delta[q])<=eps));if(!axis)continue;
      const other=axes.filter(q=>q!==axis),id=axis+':'+other.map(q=>key((a[q]+b[q])/2)).join(':');let group=groups.get(id);
      if(!group){const point=a.clone();point[axis]=0;group={axis,point,spans:[]};groups.set(id,group)}
      group.spans.push({min:Math.min(a[axis],b[axis]),max:Math.max(a[axis],b[axis]),normalAxis,sign,centroid});
    }
  }
  const edges=[];
  for(const {axis,point,spans} of groups.values()){
    const breaks=[...new Set(spans.flatMap(s=>[key(s.min),key(s.max)]))].sort((a,b)=>a-b).map(n=>n*eps);let previous=null;
    for(let i=0;i+1<breaks.length;i++){
      const min=breaks[i],max=breaks[i+1],mid=(min+max)/2;if(max-min<=eps)continue;
      const active=spans.filter(s=>s.min<=mid+eps&&s.max>=mid-eps);let pair=null;
      for(const a of active){const b=active.find(n=>n.normalAxis!==a.normalAxis&&n.normalAxis!==axis);if(b){pair=[a,b];break}}
      if(!pair){previous=null;continue}
      const [a,b]=pair; // For convex edges, each adjoining face extends behind the other's outward normal.
      if((b.centroid[a.normalAxis]-point[a.normalAxis])*a.sign>eps || (a.centroid[b.normalAxis]-point[b.normalAxis])*b.sign>eps){previous=null;continue}
      const normals=[{axis:a.normalAxis,sign:a.sign},{axis:b.normalAxis,sign:b.sign}].sort((x,y)=>x.axis.localeCompare(y.axis));const signature=normals.map(n=>n.axis+n.sign).join('/');
      if(previous&&previous.signature===signature&&Math.abs(previous.max-min)<=eps*2)previous.max=max;
      else{previous={axis,point:point.toArray(),min,max,normals,signature};edges.push(previous)}
    }
  }
  return edges.filter(e=>e.max-e.min>eps*4).slice(0,500);
}

/** Remove a bevel-shaped prism from a convex orthogonal crease of a closed mesh. */
export function bevelMeshEdge(sourceGeometry,scale,edge,amount,segments=1){
  if(!edge||!['x','y','z'].includes(edge.axis)||!Array.isArray(edge.normals)||edge.normals.length!==2||!Number.isInteger(segments)||segments<1||segments>12||!Number.isFinite(amount)||amount<=0||amount>=Math.min(scale.x,scale.y,scale.z)/2)throw new Error('Largura ou aresta inválida.');
  const axes={x:['y','z'],y:['z','x'],z:['x','y']}[edge.axis], [u,v]=axes, nU=edge.normals.find(n=>n.axis===u),nV=edge.normals.find(n=>n.axis===v);if(!nU||!nV||![nU.sign,nV.sign].every(n=>n===1||n===-1))throw new Error('Aresta não suportada.');
  const p=new THREE.Vector3().fromArray(edge.point),epsilon=Math.max(1e-5,Math.min(amount*.005,1e-3)),radius=amount+epsilon;
  const cu=p[u]+nU.sign*epsilon,cv=p[v]+nV.sign*epsilon,centerU=cu-nU.sign*radius,centerV=cv-nV.sign*radius;
  const points=[[cu,cv]];const start=Math.atan2(nV.sign,0),end=Math.atan2(0,nU.sign); // endpoints: (centerU, cv), (cu, centerV)
 let delta=end-start;while(delta>Math.PI)delta-=Math.PI*2;while(delta< -Math.PI)delta+=Math.PI*2;
  for(let i=0;i<=segments;i++){const angle=start+delta*i/segments;points.push([centerU+Math.cos(angle)*radius,centerV+Math.sin(angle)*radius])}
  const shape=new THREE.Shape();shape.moveTo(...points[0]);for(const pt of points.slice(1))shape.lineTo(...pt);shape.closePath();
  const cutter=new THREE.ExtrudeGeometry(shape,{depth:edge.max-edge.min+2*epsilon,bevelEnabled:false});cutter.translate(0,0,edge.min-epsilon);
  const attr=cutter.attributes.position;for(let i=0;i<attr.count;i++){const x=attr.getX(i),y=attr.getY(i),z=attr.getZ(i),v3=new THREE.Vector3();v3[u]=x;v3[v]=y;v3[edge.axis]=z;attr.setXYZ(i,v3.x,v3.y,v3.z)}attr.needsUpdate=true;cutter.computeVertexNormals();
  const source=sourceGeometry.clone();source.scale(scale.x,scale.y,scale.z);source.clearGroups();source.computeVertexNormals();const a=new Brush(source),b=new Brush(cutter);a.updateMatrixWorld();b.updateMatrixWorld();let result;
  try{const evaluator=new Evaluator();evaluator.useGroups=false;evaluator.attributes=['position','normal'];result=evaluator.evaluate(a,b,SUBTRACTION);const g=result.geometry,index=g.index,pos=g.attributes.position,count=Math.min(g.drawRange.count,index?index.count:pos.count);if(!Number.isFinite(count)||count<3||count%3||count>10000)throw new Error('Chanfro complexo demais para o editor.');const values=[];for(let i=0;i<count;i++){const n=index?index.getX(i):i;values.push(pos.getX(n),pos.getY(n),pos.getZ(n))}const trimmed=new THREE.BufferGeometry();trimmed.setAttribute('position',new THREE.Float32BufferAttribute(values,3));try{return normalizeImportedGeometry(trimmed)}finally{trimmed.dispose()}}finally{result?.geometry.dispose();source.dispose();cutter.dispose()}
}
