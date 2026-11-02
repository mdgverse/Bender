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

test('curved primitives rebuild with editable shape parameters',()=>{for(const [type,p] of Object.entries({sphere:{widthSegments:12,heightSegments:8},cylinder:{segments:6,topRatio:.5},cone:{segments:8,topRatio:.25},torus:{radialSegments:8,tubularSegments:12,tubeRatio:.5}})){const old=createPrimitiveGeometry(type),g=createPrimitiveGeometry(type,p);assert.notEqual(g.attributes.position.count,old.attributes.position.count);for(const axis of ['x','y','z']){assert.ok(Math.abs(g.boundingBox.min[axis]+.5)<1e-5);assert.ok(Math.abs(g.boundingBox.max[axis]-.5)<1e-5)}old.dispose();g.dispose()}});
test('primitive parameters reject dangerous and unexpected values',()=>{assert.throws(()=>createPrimitiveGeometry('sphere',{widthSegments:1000,heightSegments:20}));assert.throws(()=>createPrimitiveGeometry('torus',{radialSegments:16,tubularSegments:48,tubeRatio:0}));assert.throws(()=>createPrimitiveGeometry('box',{segments:8}));assert.throws(()=>createPrimitiveGeometry('cylinder',{segments:12,topRatio:1,extra:true}))});

test('all additional primitives preserve defaults and rebuild edited geometry',()=>{for(const [type,params] of Object.entries({pyramid:{segments:6,topRatio:.2},capsule:{capSegments:6,radialSegments:12,capRatio:.5},tetrahedron:{detail:1},octahedron:{detail:1},icosahedron:{detail:1},dodecahedron:{detail:1}})){const legacy=createPrimitiveGeometry(type),edited=createPrimitiveGeometry(type,params);assert.notEqual(edited.attributes.position.count,legacy.attributes.position.count);for(const axis of ['x','y','z']){assert.ok(Math.abs(edited.boundingBox.min[axis]+.5)<1e-5);assert.ok(Math.abs(edited.boundingBox.max[axis]-.5)<1e-5)}legacy.dispose();edited.dispose()}});
test('capsule and polyhedra reject unsafe parameters',()=>{assert.throws(()=>createPrimitiveGeometry('capsule',{capSegments:8,radialSegments:24,capRatio:1}));assert.throws(()=>createPrimitiveGeometry('icosahedron',{detail:4}));assert.throws(()=>createPrimitiveGeometry('pyramid',{segments:2,topRatio:0}))});
