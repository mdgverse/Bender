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
