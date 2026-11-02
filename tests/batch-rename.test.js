import {test} from 'node:test';import assert from 'node:assert/strict';import {numberedNames} from '../src/batch-rename.js';
test('numbers names in target order with configurable padding',()=>assert.deepEqual(numberedNames(3,'  Peça ',7,3),['Peça 007','Peça 008','Peça 009']));
test('rejects invalid or unsafe names and numbers atomically',()=>{for(const args of [[1,'',1,2],[1,'bad\n',1,2],[1,'a'.repeat(100),1,2],[0,'A',1,2],[2,'A',999999,1],[1,'A',-1,2],[1,'A',1,0],[1,'A',1.1,2]])assert.throws(()=>numberedNames(...args))});
