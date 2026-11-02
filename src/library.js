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
