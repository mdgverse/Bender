import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { PRIMITIVES, createPrimitiveGeometry } from '../src/geometry.js';
for (const type of Object.keys(PRIMITIVES)) {
  test(`${type}: centered unit bounds and exportable triangles`, () => {
    const geometry=createPrimitiveGeometry(type), bounds=geometry.boundingBox;
    for (const axis of ['x','y','z']) { assert.ok(Math.abs(bounds.min[axis]+.5)<1e-5); assert.ok(Math.abs(bounds.max[axis]-.5)<1e-5); }
    const group=new THREE.Group();const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial());group.add(mesh);group.updateMatrixWorld(true);
    assert.match(new OBJExporter().parse(group), /\nf /);
    assert.ok(new STLExporter().parse(group,{binary:true}).byteLength > 84);
    geometry.dispose();mesh.material.dispose();
  });
}
test('unknown primitive fails',()=>assert.throws(()=>createPrimitiveGeometry('bad')));
