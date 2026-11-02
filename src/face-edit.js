import * as THREE from 'three';

/** Resize a box along a local face normal while keeping its opposite face fixed.
 * The box geometry is a centered unit cube; size and position are local to its parent. */
export function resizeBoxFace({position,scale,quaternion,axis,sign,distance,minSize=.05}) {
  if (!['x','y','z'].includes(axis) || ![-1,1].includes(sign) || !Number.isFinite(distance)) throw new Error('Face inválida');
  const newSize=Math.max(minSize,scale[axis]+distance);
  const change=newSize-scale[axis];
  const normal=new THREE.Vector3();normal[axis]=sign;normal.applyQuaternion(quaternion);
  const nextPosition=position.clone().addScaledVector(normal,change/2);
  const nextScale=scale.clone();nextScale[axis]=newSize;
  return {position:nextPosition,scale:nextScale};
}
