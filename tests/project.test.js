import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidProject } from '../src/project.js';
const valid = () => ({serial: 1, selected: 0, objects: [{name:'Cubo', position:[0,1,0], scale:[2,2,2], color:'ff8844', rotation:0}]});
test('accepts current and legacy saved scenes, including empty scenes', () => {
  assert.equal(isValidProject(valid()), true);
  const legacy=valid(); delete legacy.objects[0].color; delete legacy.objects[0].rotation;
  assert.equal(isValidProject(legacy), true);
  assert.equal(isValidProject({serial:1, selected:-1, objects:[]}), true);
});
test('rejects malformed or unsafe project data', () => {
  for (const item of [null, {}, {name:'a',position:[0,0,0],scale:[1,0,1]}, {name:'a',position:[0,Infinity,0],scale:[1,1,1]}, {name:'a',position:[0,0,0],scale:[1,1,1],color:'red'}]) {
    const scene=valid(); scene.objects[0]=item; assert.equal(isValidProject(scene), false);
  }
  const scene=valid();scene.selected=5;assert.equal(isValidProject(scene),false);
});
test('accepts supported primitive types and rejects unknown ones', () => {
  for (const type of ['box', 'sphere', 'cylinder']) {const data=valid(); data.objects[0].type=type; assert.equal(isValidProject(data),true)}
  const data=valid();data.objects[0].type='unknown';assert.equal(isValidProject(data),false);
});
test('preserves compatibility with new primitive, visibility and rotations', () => {
  for (const type of ['cone','pyramid','torus','tetrahedron','icosahedron']) {
    const data=valid();Object.assign(data.objects[0],{type,visible:false,rotationX:1,rotationZ:-1});assert.equal(isValidProject(data),true);
  }
  const data=valid();data.objects[0].visible='false';assert.equal(isValidProject(data),false);
  data.objects[0].visible=true;data.objects[0].rotationX=NaN;assert.equal(isValidProject(data),false);
});

test('accepts valid material values and rejects malformed values',()=>{
  const data=valid(); Object.assign(data.objects[0],{roughness:.5,metalness:1,opacity:0});assert.equal(isValidProject(data),true);
  for(const [key,value] of [['roughness',-1],['metalness',2],['opacity','0.5']]){const scene=valid();scene.objects[0][key]=value;assert.equal(isValidProject(scene),false)}
});
test('project titles are optional for older files and validated when present',()=>{
  const data=valid();assert.equal(isValidProject(data),true);data.title='Oficina';assert.equal(isValidProject(data),true);data.title='  ';assert.equal(isValidProject(data),false);data.title='x'.repeat(81);assert.equal(isValidProject(data),false);
});
