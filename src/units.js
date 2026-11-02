// Internal coordinates and GLB exports use metres. Pixels are a fixed modeling
// convention (100 px per metre), not a physical display measurement.
export const UNIT_METRES = Object.freeze({m:1,cm:.01,mm:.001,px:.01});
export const isUnit = unit => Object.hasOwn(UNIT_METRES,unit);
export function toDisplay(metres,unit){if(!isUnit(unit))throw new Error('Unidade inválida');return metres/UNIT_METRES[unit]}
export function toMetres(value,unit){if(!isUnit(unit))throw new Error('Unidade inválida');return value*UNIT_METRES[unit]}
export function formatLength(value,unit){return Number(toDisplay(value,unit).toFixed(4)).toString()}
