import {matchesTag} from './tags.js';

/** Filter and sort the list without modifying scene order or visibility. */
export function sceneItems(objects,{query='',tag='all',type='all',state='all',sort='scene'}={}){
  const text=query.trim().toLocaleLowerCase();
  const items=objects.map((object,index)=>({object,index})).filter(({object:o})=>
    o.userData.name.toLocaleLowerCase().includes(text)&&matchesTag(o,tag)&&
    (type==='all'||(o.userData.type||'box')===type)&&
    (state==='all'||(state==='visible'&&o.visible)||(state==='hidden'&&!o.visible)||(state==='locked'&&!!o.userData.locked)||(state==='unlocked'&&!o.userData.locked))
  );
  if(sort==='name'||sort==='name-desc')items.sort((a,b)=>{const c=a.object.userData.name.localeCompare(b.object.userData.name,'pt-BR',{numeric:true,sensitivity:'base'});return (sort==='name'?c:-c)||a.index-b.index});
  else if(sort==='type')items.sort((a,b)=>(a.object.userData.type||'box').localeCompare(b.object.userData.type||'box')||a.index-b.index);
  return items;
}
