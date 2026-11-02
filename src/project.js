/** Validate the portable scene format before replacing the current scene. */
export function isValidProject(data) {
  if (!data || !Array.isArray(data.objects) || !Number.isSafeInteger(data.serial) || data.serial < 0 || data.objects.length > 1000) return false;
  if (data.title !== undefined && (typeof data.title !== 'string' || !data.title.trim() || data.title.length > 80)) return false;
  if (!Number.isInteger(data.selected) || data.selected < -1 || data.selected >= data.objects.length) return false;
  return data.objects.every(o => {
    if (!o || typeof o !== 'object' || typeof o.name !== 'string' || o.name.length > 100) return false;
    if (o.type !== undefined && !['box', 'sphere', 'cylinder', 'cone', 'pyramid', 'torus', 'tetrahedron', 'icosahedron'].includes(o.type)) return false;
    if (o.color !== undefined && (typeof o.color !== 'string' || !/^[0-9a-f]{6}$/i.test(o.color))) return false;
    if (['rotation', 'rotationX', 'rotationZ'].some(key => o[key] !== undefined && !Number.isFinite(o[key]))) return false;
    if (['roughness', 'metalness', 'opacity'].some(key => o[key] !== undefined && (!Number.isFinite(o[key]) || o[key] < 0 || o[key] > 1))) return false;
    if (o.visible !== undefined && typeof o.visible !== 'boolean') return false;
    if (!Array.isArray(o.position) || !Array.isArray(o.scale) || o.position.length !== 3 || o.scale.length !== 3) return false;
    return [...o.position, ...o.scale].every(n => Number.isFinite(n) && Math.abs(n) <= 100000) && o.scale.every(n => n > 0);
  });
}
