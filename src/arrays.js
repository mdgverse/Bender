/** Offsets for independent duplicate objects in the editor's X/Y/Z coordinate system. */
export function arrayOffsets({mode,count,axis='x',distance=2,radius=2}) {
  if (!Number.isInteger(count)||count<1||count>100) throw new Error('Use de 1 a 100 cópias.');
  if (!['linear','radial'].includes(mode)) throw new Error('Tipo de repetição inválido.');
  if (!['x','y','z'].includes(axis)) throw new Error('Eixo inválido.');
  if (!Number.isFinite(distance)||Math.abs(distance)>10000) throw new Error('Distância inválida.');
  if (!Number.isFinite(radius)||radius<=0||radius>10000) throw new Error('Raio inválido.');
  return Array.from({length:count},(_,index)=>{
    const offset={x:0,y:0,z:0,angle:0};
    if(mode==='linear')offset[axis]=distance*(index+1);
    else {offset.angle=2*Math.PI*index/count;offset.x=radius*Math.cos(offset.angle);offset.y=radius*Math.sin(offset.angle)}
    return offset;
  });
}
