import {isValidProject} from './project.js';
export const INDEX_KEY='bender-library-v1';
export const LEGACY_KEY='bender-scene-v1';
const MIGRATED='bender-library-migrated-v1';
const keyFor=id=>'bender-project-v1:'+id;
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9-]{1,80}$/.test(id);
export function readIndex(storage){try{const data=JSON.parse(storage.getItem(INDEX_KEY)||'[]');return Array.isArray(data)?data.filter(p=>p&&validId(p.id)&&typeof p.title==='string'&&typeof p.updatedAt==='number').slice(0,200):[]}catch{return []}}
export function loadProject(storage,id){if(!validId(id))return null;try{const project=JSON.parse(storage.getItem(keyFor(id)));return isValidProject(project)?project:null}catch{return null}}
export function saveProject(storage,id,project,thumbnail=''){
  if(!validId(id)||!isValidProject(project))throw new Error('Projeto inválido.');
  const index=readIndex(storage),old=index.find(p=>p.id===id);
  const entry={id,title:project.title||'Projeto sem título',units:project.units||'m',updatedAt:Date.now(),thumbnail:thumbnail||old?.thumbnail||''};
  // Write the project before its index entry; a quota failure never erases an older copy.
  storage.setItem(keyFor(id),JSON.stringify(project));
  storage.setItem(INDEX_KEY,JSON.stringify([entry,...index.filter(p=>p.id!==id)].slice(0,200)));
}
export function deleteProject(storage,id){if(!validId(id))return;storage.setItem(INDEX_KEY,JSON.stringify(readIndex(storage).filter(p=>p.id!==id)));storage.removeItem(keyFor(id))}
export function migrateLegacy(storage,id){
  if(storage.getItem(MIGRATED))return false;
  const raw=storage.getItem(LEGACY_KEY);if(raw){try{const project=JSON.parse(raw);if(isValidProject(project)){saveProject(storage,id,project);storage.setItem(MIGRATED,'1');return true}}catch(e){if(e?.name==='QuotaExceededError')throw e}}
  storage.setItem(MIGRATED,'1');return false;
}

/** Export a portable copy of all indexed projects without changing local data. */
export function exportLibrary(storage){
  const entries=readIndex(storage);return {format:'bender-library',version:1,projects:entries.map(entry=>{const project=loadProject(storage,entry.id);if(!project)throw new Error('Um projeto está danificado; faça backups individuais dos demais.');const thumbnail=typeof entry.thumbnail==='string'&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(entry.thumbnail)&&entry.thumbnail.length<200000?entry.thumbnail:'';return {project,thumbnail}})};
}
/** Restore as new projects. On quota errors, remove newly written records and retain the original index. */
export function importLibrary(storage,backup,newId){
  if(!backup||backup.format!=='bender-library'||backup.version!==1||!Array.isArray(backup.projects)||backup.projects.length<1||backup.projects.length>200)throw new Error('Arquivo de biblioteca inválido.');
  const old=readIndex(storage);if(old.length+backup.projects.length>200)throw new Error('A biblioteca suporta até 200 projetos.');
  const items=backup.projects.map(item=>{if(!item||!isValidProject(item.project))throw new Error('O arquivo contém um projeto inválido.');const thumbnail=item.thumbnail||'';if(typeof thumbnail!=='string'||thumbnail.length>=200000||(thumbnail&&!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(thumbnail)))throw new Error('Miniatura inválida.');return {project:item.project,thumbnail}});
  const used=new Set(old.map(item=>item.id));const created=[];try{
    for(let i=0;i<items.length;i++){let id;for(let attempts=0;attempts<10;attempts++){id=newId();if(validId(id)&&!used.has(id)&&!storage.getItem(keyFor(id)))break;id=null}if(!id)throw new Error('Não foi possível gerar identificadores únicos.');used.add(id);storage.setItem(keyFor(id),JSON.stringify(items[i].project));created.push({id,title:items[i].project.title||'Projeto sem título',units:items[i].project.units||'m',updatedAt:Date.now()-i,thumbnail:items[i].thumbnail})}
    storage.setItem(INDEX_KEY,JSON.stringify([...created,...old]));return created.length;
  }catch(error){for(const item of created)storage.removeItem(keyFor(item.id));throw error}
}
