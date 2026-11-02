import * as THREE from 'three';
import {normalizeImportedGeometry} from './mesh-import.js';

/** Closed straight stair, resting on y=0, centered horizontally in metres. */
export function createStairs({width,depth,height,steps,reverse=false}){
  if(typeof reverse!=='boolean')throw new Error('Sentido inválido.');
  if(![width,depth,height].every(n=>Number.isFinite(n)&&n>=0.001&&n<=10000))throw new Error('Cada dimensão deve estar entre 0,001 e 10000 metros.');
  if(!Number.isInteger(steps)||steps<1||steps>100)throw new Error('A quantidade de degraus deve estar entre 1 e 100.');
  if(depth/steps<0.0001||height/steps<0.0001)throw new Error('Degraus pequenos demais para a precisão da malha.');
  const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(depth,0);shape.lineTo(depth,height);
  for(let i=steps;i>0;i--){shape.lineTo(depth*(i-1)/steps,height*i/steps);shape.lineTo(depth*(i-1)/steps,height*(i-1)/steps)}shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:width,bevelEnabled:false,steps:1,curveSegments:1});
  try{geometry.rotateY(Math.PI/2);geometry.translate(-width/2,0,depth/2);if(reverse)geometry.rotateY(Math.PI);return normalizeImportedGeometry(geometry)}finally{geometry.dispose()}
}
