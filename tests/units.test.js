import {test} from 'node:test';import assert from 'node:assert/strict';import {isUnit,toDisplay,toMetres,formatLength} from '../src/units.js';
test('round trips all supported units through metres',()=>{for(const unit of ['m','cm','mm','px'])assert.ok(Math.abs(toMetres(toDisplay(1.234,unit),unit)-1.234)<1e-12);assert.equal(toDisplay(2,'cm'),200);assert.equal(toDisplay(1,'mm'),1000);assert.equal(toDisplay(1,'px'),100);assert.equal(formatLength(.015,'cm'),'1.5')});
test('rejects unknown units',()=>{assert.equal(isUnit('inch'),false);assert.throws(()=>toMetres(1,'inch'))});
