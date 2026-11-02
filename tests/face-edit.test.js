import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {resizeBoxFace} from '../src/face-edit.js';
const eps=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} ≠ ${b}`);
test('face resize keeps the opposite face fixed for every axis and side',()=>{
  for(const axis of ['x','y','z'])for(const sign of [-1,1]){
    const pos=new THREE.Vector3(2,3,4),scale=new THREE.Vector3(2,4,6),q=new THREE.Quaternion().setFromEuler(new THREE.Euler(.3,.7,-.4));
    const normal=new THREE.Vector3();normal[axis]=sign;normal.applyQuaternion(q);
    const opposite=pos.clone().addScaledVector(normal,-scale[axis]/2);
    for(const distance of [2,-1,-100]){
      const result=resizeBoxFace({position:pos,scale,quaternion:q,axis,sign,distance});
      const actual=result.position.clone().addScaledVector(normal,-result.scale[axis]/2);
      eps(actual.distanceTo(opposite),0);assert.ok(result.scale[axis]>=.05);
    }
  }
});
test('face resize rejects invalid inputs',()=>assert.throws(()=>resizeBoxFace({position:new THREE.Vector3(),scale:new THREE.Vector3(1,1,1),quaternion:new THREE.Quaternion(),axis:'q',sign:1,distance:1})));
