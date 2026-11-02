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
test('validates scene lighting and object locking, retaining legacy compatibility',()=>{
  const p=valid();assert.equal(isValidProject(p),true);p.environment={background:'abcdef',ambient:2,direct:1};p.objects[0].locked=true;assert.equal(isValidProject(p),true);
  p.environment.direct=6;assert.equal(isValidProject(p),false);p.environment.direct=1;p.objects[0].locked='yes';assert.equal(isValidProject(p),false);
});
test('validates light position, color and marker visibility',()=>{
  const data=valid();data.environment={background:'242628',ambient:0.6,direct:2,lightPosition:[1,2,3],lightColor:'ffddee',showLight:true};assert.equal(isValidProject(data),true);
  data.environment.lightPosition=[Infinity,2,3];assert.equal(isValidProject(data),false);data.environment.lightPosition=[1,2,3];data.environment.lightColor='bad';assert.equal(isValidProject(data),false);data.environment.lightColor='ffffff';data.environment.showLight=1;assert.equal(isValidProject(data),false);
});
test('shadow setting is optional for older projects and accepts only booleans',()=>{
  const p=valid();p.environment={background:'242628',ambient:.6,direct:2};assert.equal(isValidProject(p),true);p.environment.shadows=true;assert.equal(isValidProject(p),true);p.environment.shadows='yes';assert.equal(isValidProject(p),false);
});
test('accepts optional tags and rejects unsafe tags',()=>{const data=valid();assert.equal(isValidProject(data),true);data.objects[0].tag='Móveis';assert.equal(isValidProject(data),true);data.objects[0].tag='x'.repeat(41);assert.equal(isValidProject(data),false);data.objects[0].tag={};assert.equal(isValidProject(data),false);data.objects[0].tag='a\nb';assert.equal(isValidProject(data),false)});
test('validates optional editable stairs metadata',()=>{const data=valid();const item=data.objects[0];item.type='mesh';item.geometry=[0,0,0,.5,0,0,0,.5,0];item.stairs={steps:8};assert.equal(isValidProject(data),true);for(const steps of [0,101,1.5,'8',null]){item.stairs={steps};assert.equal(isValidProject(data),false)}delete item.stairs;assert.equal(isValidProject(data),true);item.type='box';delete item.geometry;item.stairs={steps:8};assert.equal(isValidProject(data),false)});
test('validates editable box bevel metadata',()=>{const data=valid(),o=data.objects[0];o.type='mesh';o.geometry=[0,0,0,.5,0,0,0,.5,0];o.bevel={axis:'x',signs:[-1,1],amount:.1,segments:2};assert.equal(isValidProject(data),true);for(const patch of [{axis:'bad'},{signs:[0,1]},{amount:0},{segments:13}]){const previous=o.bevel;o.bevel={...previous,...patch};assert.equal(isValidProject(data),false);o.bevel=previous}o.stairs={steps:4};assert.equal(isValidProject(data),false)});
test('validates optional non-destructive cut recipe',()=>{const data=valid(),o=data.objects[0];o.type='mesh';o.geometry=[0,0,0,.5,0,0,0,.5,0];o.cut={axis:'y',sign:1,face:1,first:[-.2,-.2],second:[.2,.2],baseScale:[2,2,2],center:[0,0,0],resultScale:[2,2,2],mode:'pocket',depth:.5};assert.equal(isValidProject(data),true);for(const patch of [{axis:'q'},{mode:'bad'},{depth:0},{baseScale:[0,1,1]},{resultScale:[1,1]},{sign:0}]){const old=o.cut;o.cut={...old,...patch};assert.equal(isValidProject(data),false);o.cut=old}o.stairs={steps:3};assert.equal(isValidProject(data),false)});
