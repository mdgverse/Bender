import {isValidMeshPositions, MAX_SCENE_MESH_VALUES} from './mesh-import.js';
/** Validate the portable scene format before replacing the current scene. */
export function isValidProject(data) {
  if (!data || !Array.isArray(data.objects) || !Number.isSafeInteger(data.serial) || data.serial < 0 || data.objects.length > 1000) return false;
  if (data.title !== undefined && (typeof data.title !== 'string' || !data.title.trim() || data.title.length > 80)) return false;
  if (data.environment !== undefined && (!data.environment || typeof data.environment !== 'object' || typeof data.environment.background !== 'string' || !/^[0-9a-f]{6}$/i.test(data.environment.background) || !['ambient','direct'].every(k=>Number.isFinite(data.environment[k]) && data.environment[k]>=0 && data.environment[k]<=5))) return false;
  if (data.environment?.lightPosition !== undefined && (!Array.isArray(data.environment.lightPosition) || data.environment.lightPosition.length !== 3 || !data.environment.lightPosition.every(n=>Number.isFinite(n)&&Math.abs(n)<=10000))) return false;
  if (data.environment?.lightColor !== undefined && (typeof data.environment.lightColor !== 'string' || !/^[0-9a-f]{6}$/i.test(data.environment.lightColor))) return false;
  if (data.environment?.shadows !== undefined && typeof data.environment.shadows !== 'boolean') return false;
  if (data.environment?.showLight !== undefined && typeof data.environment.showLight !== 'boolean') return false;
  if (!Number.isInteger(data.selected) || data.selected < -1 || data.selected >= data.objects.length) return false;
  let totalMeshValues=0;
  return data.objects.every(o => {
    if (!o || typeof o !== 'object' || typeof o.name !== 'string' || o.name.length > 100) return false;
    if (o.type !== undefined && !['box', 'sphere', 'cylinder', 'cone', 'pyramid', 'torus', 'tetrahedron', 'icosahedron', 'octahedron', 'dodecahedron', 'capsule', 'mesh'].includes(o.type)) return false;
    if(o.type==='mesh'){if(!isValidMeshPositions(o.geometry))return false;totalMeshValues+=o.geometry.length;if(totalMeshValues>MAX_SCENE_MESH_VALUES)return false;}else if(o.geometry !== undefined)return false;
    if (o.color !== undefined && (typeof o.color !== 'string' || !/^[0-9a-f]{6}$/i.test(o.color))) return false;
    if (['rotation', 'rotationX', 'rotationZ'].some(key => o[key] !== undefined && !Number.isFinite(o[key]))) return false;
    if (['roughness', 'metalness', 'opacity'].some(key => o[key] !== undefined && (!Number.isFinite(o[key]) || o[key] < 0 || o[key] > 1))) return false;
    if (o.locked !== undefined && typeof o.locked !== 'boolean') return false;
    if (o.visible !== undefined && typeof o.visible !== 'boolean') return false;
    if (!Array.isArray(o.position) || !Array.isArray(o.scale) || o.position.length !== 3 || o.scale.length !== 3) return false;
    return [...o.position, ...o.scale].every(n => Number.isFinite(n) && Math.abs(n) <= 100000) && o.scale.every(n => n > 0);
  });
}
