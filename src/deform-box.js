import * as THREE from 'three';
import {normalizeImportedGeometry} from './mesh-import.js';

/** Deform a box in its own axes; input geometry is normalized and dimensions are metres. */
export function deformBox(geometry,scale,{mode,amount,axis='x'}){
  if(!geometry?.isBufferGeometry||!geometry.attributes.position||!scale||!['x','y','z'].every(k=>Number.isFinite(scale[k])&&scale[k]>0&&scale[k]<=100000))throw new Error('Caixa inválida.');
  if(!Number.isFinite(amount))throw new Error('Informe um valor válido.');
  if(mode==='taper'&&(amount<0.1||amount>3))throw new Error('A proporção do topo deve estar entre 0,1 e 3.');
  if(mode==='shear'&&(!['x','z'].includes(axis)||Math.abs(amount)>100000))throw new Error('Deslocamento ou eixo inválido.');
  if(!['taper','shear'].includes(mode))throw new Error('Deformação desconhecida.');
  const g=geometry.index?geometry.toNonIndexed():geometry.clone();
  try{const p=g.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i)*scale.x,y=p.getY(i)*scale.y,z=p.getZ(i)*scale.z;const t=p.getY(i)+0.5;if(mode==='taper'){const factor=1+(amount-1)*t;x*=factor;z*=factor}else if(axis==='x')x+=amount*t;else z+=amount*t;p.setXYZ(i,x,y,z)}p.needsUpdate=true;return normalizeImportedGeometry(g)}finally{g.dispose()}
}
