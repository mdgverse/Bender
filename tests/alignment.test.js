import {test} from 'node:test';
import assert from 'node:assert/strict';
import {alignmentOffset} from '../src/alignment.js';
const a={min:-1,max:3},b={min:10,max:16};
test('aligns minimum, center and maximum bounds',()=>{
  assert.equal(alignmentOffset(a,b,'min'),11);assert.equal(alignmentOffset(a,b,'center'),12);assert.equal(alignmentOffset(a,b,'max'),13);
});
test('places objects on either side with a gap',()=>{
  assert.equal(alignmentOffset(a,b,'before',2),5);assert.equal(alignmentOffset(a,b,'after',2),19);
});
test('rejects invalid inputs',()=>{
  assert.throws(()=>alignmentOffset(a,b,'none'));assert.throws(()=>alignmentOffset(a,b,'before',-1));assert.throws(()=>alignmentOffset({min:2,max:1},b,'min'));assert.throws(()=>alignmentOffset(a,b,'after',NaN));
});
