import * as THREE from 'three';
/** Equal parallel pieces along a box local axis, with an optional gap removed between them. */
export function splitBox({position,scale,quaternion,axis,count,gap}){
  if(!['x','y','z'].includes(axis)||!Number.isInteger(count)||count<2||count>100||!Number.isFinite(gap)||gap<0||![...position.toArray(),...scale.toArray(),...quaternion.toArray()].every(Number.isFinite)||scale[axis]<=0)throw new Error('Parâmetros de divisão inválidos.');
  const width=(scale[axis]-gap*(count-1))/count;if(width<.0001)throw new Error('O espaçamento deixa as peças pequenas demais.');
  const direction=new THREE.Vector3();direction[axis]=1;direction.applyQuaternion(quaternion);
  return Array.from({length:count},(_,i)=>{const displacement=-scale[axis]/2+width/2+i*(width+gap),p=position.clone().addScaledVector(direction,displacement),s=scale.clone();s[axis]=width;if(p.toArray().some(v=>Math.abs(v)>100000))throw new Error('Peças fora dos limites da cena.');return {position:p,scale:s}});
}
