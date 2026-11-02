/** Translation along one world axis for aligning or placing bounding boxes. */
export function alignmentOffset(source, reference, mode, gap=0) {
  if (![source.min,source.max,reference.min,reference.max,gap].every(Number.isFinite) || source.min>source.max || reference.min>reference.max || gap<0 || gap>10000) throw new Error('Limites ou distância inválidos.');
  switch(mode) {
    case 'min': return reference.min-source.min;
    case 'center': return (reference.min+reference.max-source.min-source.max)/2;
    case 'max': return reference.max-source.max;
    case 'before': return reference.min-gap-source.max;
    case 'after': return reference.max+gap-source.min;
    default: throw new Error('Alinhamento inválido.');
  }
}
