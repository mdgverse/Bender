import * as THREE from 'three';
/** Surface area and signed tetrahedral volume in world coordinates. Volume is only reliable for a closed manifold. */
export function meshMetrics(object){
  object.updateMatrixWorld(true);const geometry=object.geometry,position=geometry.attributes.position,index=geometry.index,count=index?index.count:position.count;
  const origin=new THREE.Vector3().setFromMatrixPosition(object.matrixWorld),box=new THREE.Box3().setFromObject(object),size=box.getSize(new THREE.Vector3());
  const epsilon=Math.max(1e-9,Math.max(size.x,size.y,size.z)*1e-6),quantize=p=>[p.x,p.y,p.z].map(n=>Math.round(n/epsilon)).join(',');
  const edges=new Map();let area=0,volume=0,triangles=0;
  function vertex(i){const n=index?index.getX(i):i;return new THREE.Vector3().fromBufferAttribute(position,n).applyMatrix4(object.matrixWorld).sub(origin)}
  for(let i=0;i+2<count;i+=3){const a=vertex(i),b=vertex(i+1),c=vertex(i+2),cross=new THREE.Vector3().subVectors(b,a).cross(new THREE.Vector3().subVectors(c,a));const faceArea=cross.length()/2;if(faceArea<epsilon*epsilon)continue;triangles++;area+=faceArea;volume+=a.dot(b.clone().cross(c))/6;const keys=[quantize(a),quantize(b),quantize(c)];for(const [u,v] of [[0,1],[1,2],[2,0]]){const sorted=[keys[u],keys[v]].sort(),k=sorted.join('|'),entry=edges.get(k)||{count:0,direction:0};entry.count++;entry.direction+=keys[u]===sorted[0]?1:-1;edges.set(k,entry)}}
  return {size:size.toArray(),area,volume:Math.abs(volume),triangles,closed:edges.size>0&&[...edges.values()].every(e=>e.count===2&&e.direction===0)};
}
