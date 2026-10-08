import test from 'node:test';
import assert from 'node:assert/strict';
import {calibratedReference} from '../src/reference-calibration.js';
test('a known 8 metre side calibrates the full image proportionally without mutating it',()=>{const ref={width:12,depth:8};assert.deepEqual(calibratedReference(ref,4,8),{width:24,depth:16});assert.deepEqual(ref,{width:12,depth:8});});
test('calibration supports reducing an image and rejects invalid or out-of-range measurements',()=>{assert.deepEqual(calibratedReference({width:24,depth:16},16,8),{width:12,depth:8});for(const value of [0,-1,NaN,Infinity])assert.throws(()=>calibratedReference({width:12,depth:8},4,value));assert.throws(()=>calibratedReference({width:12,depth:8},0,8));assert.throws(()=>calibratedReference({width:12,depth:8},.1,100));});
