import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {createPrimitiveGeometry} from '../src/geometry.js';

test('GLB retains basic material properties and mesh transforms',async()=>{
  globalThis.FileReader=class {
    readAsArrayBuffer(blob){blob.arrayBuffer().then(buffer=>{this.result=buffer;this.onloadend?.()}).catch(error=>this.onerror?.(error))}
    readAsDataURL(blob){blob.arrayBuffer().then(buffer=>{this.result=`data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`;this.onloadend?.()}).catch(error=>this.onerror?.(error))}
  };
  const geometry=createPrimitiveGeometry('cone');const material=new THREE.MeshStandardMaterial({color:0xff3300,roughness:.3,metalness:.8,opacity:.4,transparent:true});const mesh=new THREE.Mesh(geometry,material);mesh.position.set(1,2,3);
  const result=await new GLTFExporter().parseAsync(mesh,{binary:true});const view=new DataView(result);assert.equal(view.getUint32(0,true),0x46546c67);const jsonLength=view.getUint32(12,true);const json=JSON.parse(new TextDecoder().decode(new Uint8Array(result,20,jsonLength)));
  assert.deepEqual(json.nodes[0].matrix.slice(12,15),[1,2,3]);assert.equal(json.materials[0].pbrMetallicRoughness.roughnessFactor,.3);assert.equal(json.materials[0].pbrMetallicRoughness.metallicFactor,.8);assert.equal(json.materials[0].alphaMode,'BLEND');assert.equal(json.materials[0].pbrMetallicRoughness.baseColorFactor[3],.4);
  geometry.dispose();material.dispose();delete globalThis.FileReader;
});
