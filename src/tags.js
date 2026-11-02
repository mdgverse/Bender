/** Names are stored as plain text, optional on older projects. */
export function isValidTag(tag){return typeof tag==='string'&&tag.length<=40&&!/[\u0000-\u001f\u007f]/.test(tag)}
export function normalizeTag(tag){if(typeof tag!=='string')throw new Error('Etiqueta inválida.');const name=tag.trim();if(!isValidTag(name))throw new Error('Etiqueta deve ter até 40 caracteres, sem caracteres de controle.');return name}
export function listTags(objects){return [...new Set(objects.map(o=>o.userData.tag||'').filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'))}
export function matchesTag(object,filter){if(filter==='all')return true;const tag=object.userData.tag||'';if(filter==='none')return !tag;return filter.startsWith('tag:')&&tag===filter.slice(4)}
