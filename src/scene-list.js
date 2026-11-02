import {matchesTag} from './tags.js';
const fold=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
function modifierMatches(o,filter){const d=o.userData,has={cut:!!(d.cut||d.meshBevel?.sourceCut),bevel:!!(d.bevel||d.meshBevel),deform:!!d.deform,stairs:!!d.stairs};return filter==='all'||(filter==='any'&&Object.values(has).some(Boolean))||(filter==='none'&&!Object.values(has).some(Boolean))||!!has[filter]}
/** Filter and sort without modifying scene order, visibility or selection. */
export function sceneItems(objects,{query='',searchIn='name',tag='all',type='all',state='all',modifier='all',sort='scene'}={}){
  const text=fold(query.trim());
  const items=objects.map((object,index)=>({object,index})).filter(({object:o})=>{
    const name=fold(o.userData.name),label=fold(o.userData.tag||''),matches=searchIn==='tag'?label.includes(text):searchIn==='both'?name.includes(text)||label.includes(text):name.includes(text);
    return matches&&matchesTag(o,tag)&&modifierMatches(o,modifier)&&
      (type==='all'||(o.userData.type||'box')===type)&&
      (state==='all'||(state==='visible'&&o.visible)||(state==='hidden'&&!o.visible)||(state==='locked'&&!!o.userData.locked)||(state==='unlocked'&&!o.userData.locked));
  });
  if(sort==='name'||sort==='name-desc')items.sort((a,b)=>{const c=a.object.userData.name.localeCompare(b.object.userData.name,'pt-BR',{numeric:true,sensitivity:'base'});return (sort==='name'?c:-c)||a.index-b.index});
  else if(sort==='type')items.sort((a,b)=>(a.object.userData.type||'box').localeCompare(b.object.userData.type||'box')||a.index-b.index);
  else if(/^(position|scale)-[xyz]$/.test(sort)){const [prop,axis]=sort.split('-');items.sort((a,b)=>(a.object[prop][axis]-b.object[prop][axis])||a.index-b.index)}
  return items;
}
