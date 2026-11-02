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

test('partial sphere and torus honor angular parameters and reject invalid ranges',()=>{const a=createPrimitiveGeometry('sphere',{widthSegments:32,heightSegments:20,longitudeSweep:180}),b=createPrimitiveGeometry('sphere');assert.notDeepEqual(Array.from(a.attributes.position.array),Array.from(b.attributes.position.array));assert.throws(()=>createPrimitiveGeometry('sphere',{widthSegments:32,heightSegments:20,latitudeStart:120,latitudeSweep:90}));assert.throws(()=>createPrimitiveGeometry('torus',{radialSegments:16,tubularSegments:48,tubeRatio:.3,arcSweep:0}));const t=createPrimitiveGeometry('torus',{radialSegments:16,tubularSegments:48,tubeRatio:.3,arcStart:30,arcSweep:180});assert.ok(t.attributes.position.count>0);a.dispose();b.dispose();t.dispose()});
test('cylinder cone and pyramid open caps do not change legacy closed default',()=>{for(const type of ['cylinder','cone','pyramid']){const params={segments:8,topRatio:type==='cylinder'?1:0},closed=createPrimitiveGeometry(type,params),open=createPrimitiveGeometry(type,{...params,open:true});assert.ok(open.index.count<closed.index.count);closed.dispose();open.dispose()}});
test('flat polyhedron subdivision keeps original planar surface and winding',()=>{for(const type of ['tetrahedron','octahedron','icosahedron','dodecahedron']){const original=createPrimitiveGeometry(type,{detail:0}),flat=createPrimitiveGeometry(type,{detail:2,flat:true}),rounded=createPrimitiveGeometry(type,{detail:2});const area=g=>{const p=g.attributes.position;let a=0;for(let i=0;i<p.count;i+=3){const v=j=>new THREE.Vector3().fromBufferAttribute(p,i+j);a+=v(1).sub(v(0)).cross(v(2).sub(v(0))).length()/2}return a};assert.ok(Math.abs(area(flat)-area(original))<1e-5,type);assert.ok(Math.abs(area(rounded)-area(flat))>1e-4,type);original.dispose();flat.dispose();rounded.dispose()}});
