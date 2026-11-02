import * as THREE from 'three';

/** Plan all changes before applying any, including hidden and locked results. */
export function planBatchTransform(objects,action,options={}){
  if(!objects.length)throw new Error('Nenhum resultado para transformar.');
  const axis=options.axis;
  if(action==='move'&&(!Array.isArray(options.offset)||options.offset.length!==3||options.offset.some(x=>!Number.isFinite(x))))throw new Error('Informe três deslocamentos válidos.');
  if(action==='rotate'&&(!['x','y','z'].includes(axis)||!Number.isFinite(options.degrees)||Math.abs(options.degrees)>360000))throw new Error('Informe um eixo e ângulo válidos.');
  if(action==='scale'&&(!Number.isFinite(options.factor)||options.factor<=0))throw new Error('A escala deve ser maior que zero.');
  if(action==='snap'&&(!Number.isFinite(options.step)||options.step<=0))throw new Error('O passo deve ser maior que zero.');
  return objects.map(object=>{
    const position=object.position.clone(),rotation=object.rotation.clone(),scale=object.scale.clone();
    if(action==='move')position.add(new THREE.Vector3(...options.offset));
    else if(action==='rotate')rotation[axis]+=THREE.MathUtils.degToRad(options.degrees);
    else if(action==='scale')scale.multiplyScalar(options.factor);
    else if(action==='ground'){object.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(object);if(bounds.isEmpty()||!Number.isFinite(bounds.min.y))throw new Error('Não foi possível calcular a base de um objeto.');position.y-=bounds.min.y}
    else if(action==='center'){position.x=0;position.z=0}
    else if(action==='reset-rotation')rotation.set(0,0,0);
    else if(action==='snap')for(const key of ['x','y','z'])position[key]=Math.round(position[key]/options.step)*options.step;
    else throw new Error('Transformação desconhecida.');
    if([...position.toArray(),...scale.toArray()].some(x=>!Number.isFinite(x)||Math.abs(x)>100000)||scale.toArray().some(x=>x<=0)||[rotation.x,rotation.y,rotation.z].some(x=>!Number.isFinite(x)||Math.abs(x)>100000))throw new Error('Resultado fora dos limites da cena; nenhum objeto foi alterado.');
    return {object,position,rotation,scale};
  });
}
export function planBatchNames(objects,action,{text='',find='',replacement=''}={}){
  if(!objects.length)throw new Error('Nenhum resultado para renomear.');
  if(action==='replace'&&!find)throw new Error('Informe o texto a localizar.');
  if(!['prefix','suffix','replace'].includes(action))throw new Error('Operação desconhecida.');
  const names=objects.map(o=>action==='prefix'?text+o.userData.name:action==='suffix'?o.userData.name+text:o.userData.name.split(find).join(replacement));
  if(names.some(n=>!n.trim()||n.length>100||/[\u0000-\u001f\u007f]/.test(n)))throw new Error('Os nomes devem ter de 1 a 100 caracteres e não podem conter caracteres de controle.');
  return names;
}
