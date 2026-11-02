import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {switchProjection,resizeCamera} from '../src/camera.js';
test('preserves target apparent scale through projection changes and zoom',()=>{
  const target=new THREE.Vector3(1,2,3), perspective=new THREE.PerspectiveCamera(40,2,.1,1000);perspective.position.set(4,7,12);perspective.lookAt(target);perspective.updateMatrixWorld();
  const ortho=switchProjection(perspective,target,2);assert.ok(ortho.isOrthographicCamera);
  const p=target.clone().add(new THREE.Vector3(0,1,0).applyQuaternion(perspective.quaternion));const a=p.clone().project(perspective),b=p.clone().project(ortho);assert.ok(Math.abs(a.y-b.y)<.01);
  ortho.zoom=2;ortho.updateProjectionMatrix();const next=switchProjection(ortho,target,2);assert.ok(next.isPerspectiveCamera);assert.ok(Math.abs(next.position.distanceTo(target)-perspective.position.distanceTo(target)/2)<1e-7);
  resizeCamera(ortho,1);assert.ok(Math.abs((ortho.right-ortho.left)-(ortho.top-ortho.bottom))<1e-8);
});
