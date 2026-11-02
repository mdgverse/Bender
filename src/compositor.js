/* SPDX-FileCopyrightText: 2020 Blender Authors
 * SPDX-FileCopyrightText: 2006 Blender Authors
 * SPDX-License-Identifier: GPL-2.0-or-later
 * JavaScript adaptation of Blender's compositor Exposure and Brightness/Contrast
 * pixel operations, revision a5080f6cd433a11bb2c254f20dc208f4a6ea9804.
 * See third_party/blender/NOTICE.md for upstream files and attribution. */

export function isValidCompositor(recipe){
  return !!recipe&&typeof recipe==='object'&&recipe.version===1&&Array.isArray(recipe.nodes)&&recipe.nodes.length<=20&&recipe.nodes.every(n=>{
    if(!n||typeof n!=='object'||typeof n.enabled!=='boolean')return false;
    if(n.type==='exposure')return Number.isFinite(n.exposure)&&n.exposure>=-10&&n.exposure<=10;
    if(n.type==='brightnessContrast')return Number.isFinite(n.brightness)&&n.brightness>=-100&&n.brightness<=100&&Number.isFinite(n.contrast)&&n.contrast>=-100&&n.contrast<=100;
    return false;
  });
}
export function defaultCompositor(){return {version:1,nodes:[]}}
export function defaultNode(type){if(type==='exposure')return {type,enabled:true,exposure:0};if(type==='brightnessContrast')return {type,enabled:true,brightness:0,contrast:0};throw new Error('Nó desconhecido.')}

/** Blender's adjust_exposure: apply to RGB and leave alpha unchanged. */
export function exposurePixel(color,exposure){const multiplier=2**exposure;return [color[0]*multiplier,color[1]*multiplier,color[2]*multiplier,color[3]]}
/** Blender brightness_and_contrast, credited upstream to Werner D. Streidt / OpenCV. */
export function brightnessContrastPixel(color,brightness,contrast){
  const scaled=brightness/100;let delta=contrast/200,multiplier,offset;
  if(contrast>0){multiplier=1/Math.max(1-delta*2,2**-23);offset=multiplier*(scaled-delta)}
  else{delta*=-1;multiplier=Math.max(1-delta*2,0);offset=multiplier*scaled+delta}
  return [color[0]*multiplier+offset,color[1]*multiplier+offset,color[2]*multiplier+offset,color[3]];
}
const toLinear=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
const toSrgb=v=>v<=.0031308?v*12.92:1.055*Math.pow(v,1/2.4)-.055;
/** Apply a linear, ordered chain to an sRGB 8-bit viewport capture, without mutating it. */
export function compositePixels(pixels,recipe){
  if(!isValidCompositor(recipe)||!(pixels instanceof Uint8ClampedArray)||pixels.length%4)throw new Error('Imagem ou composição inválida.');
  const result=new Uint8ClampedArray(pixels),active=recipe.nodes.filter(n=>n.enabled);if(!active.length)return result;
  // Both upstream operations are affine in linear RGB. Fold the ordered chain
  // into one multiplier and offset, without clipping between operations.
  let multiplier=1,offset=0;for(const node of active){if(node.type==='exposure'){const scale=2**node.exposure;multiplier*=scale;offset*=scale}else{const black=brightnessContrastPixel([0,0,0,1],node.brightness,node.contrast)[0],white=brightnessContrastPixel([1,1,1,1],node.brightness,node.contrast)[0],scale=white-black;multiplier*=scale;offset=offset*scale+black}}
  for(let i=0;i<result.length;i+=4)if(result[i+3]!==0)for(let c=0;c<3;c++)result[i+c]=Math.max(0,Math.min(255,toSrgb(Math.max(0,toLinear(result[i+c]/255)*multiplier+offset))*255));
  return result;
}
