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

/** Align world-space bounds or distribute them, leaving all geometry untouched. */
export function planBatchLayout(objects,{axis,mode,gap=0}){
  if(!['x','y','z'].includes(axis)||!['min','center','max','distribute','gap','space-between'].includes(mode))throw new Error('Alinhamento inválido.');
  if(objects.length<(['distribute','space-between'].includes(mode)?3:2))throw new Error(['distribute','space-between'].includes(mode)?'São necessários pelo menos 3 resultados.':'São necessários pelo menos 2 resultados.');
  if(mode==='gap'&&(!Number.isFinite(gap)||gap<0||gap>100000))throw new Error('Informe um espaço entre 0 e 100000 metros.');
  const items=objects.map((object,index)=>{object.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(object),min=box.min[axis],max=box.max[axis];if(box.isEmpty()||!Number.isFinite(min)||!Number.isFinite(max))throw new Error('Não foi possível calcular os limites dos objetos.');return {object,index,min,max,center:(min+max)/2}});
  const ordered=[...items].sort((a,b)=>a.center-b.center||a.index-b.index),deltas=new Map();
  if(['min','center','max'].includes(mode)){
    const min=Math.min(...items.map(i=>i.min)),max=Math.max(...items.map(i=>i.max)),target=mode==='min'?min:mode==='max'?max:(min+max)/2;
    items.forEach(item=>deltas.set(item,target-item[mode]));
  }else if(mode==='distribute'){
    const first=ordered[0].center,last=ordered.at(-1).center,step=(last-first)/(ordered.length-1);
    ordered.forEach((item,i)=>deltas.set(item,first+i*step-item.center));
  }else{
    let cursor=ordered[0].min;
    if(mode==='space-between'){gap=(ordered.at(-1).max-cursor-ordered.reduce((sum,item)=>sum+item.max-item.min,0))/(ordered.length-1);if(gap< -1e-9)throw new Error('Não há espaço entre os extremos sem sobreposição.');gap=Math.max(0,gap)}
    ordered.forEach(item=>{deltas.set(item,cursor-item.min);cursor+=item.max-item.min+gap});
  }
  return items.map(item=>{const {object}=item,position=object.position.clone();position[axis]+=deltas.get(item);if(position.toArray().some(v=>!Number.isFinite(v)||Math.abs(v)>100000))throw new Error('Resultado fora dos limites da cena; nenhum objeto foi alterado.');return {object,position,rotation:object.rotation.clone(),scale:object.scale.clone()}});
}
