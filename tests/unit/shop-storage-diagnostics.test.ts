import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {checkShopStorage} from '../../src/lib/storage/shop-diagnostics';
test('only exact diagnostic object is read; lifecycle denial does not hide successful read; secrets never returned',async()=>{
 const commands:any[]=[];
 const result=await checkShopStorage(async command=>{commands.push(command);if(command.constructor.name==='GetBucketLifecycleConfigurationCommand')throw Object.assign(Error('SECRET AWS ARN URL'),{name:'AccessDenied'});if(command.constructor.name==='GetObjectCommand')return {Body:Readable.from([Buffer.from('TEST')]),ContentLength:4};return {Metadata:{secret:'NEVER_RETURN'},ContentLength:123};});
 assert.equal(result.head,'ok');assert.equal(result.read,'ok');assert.equal(result.lifecycle,'denied');assert.equal(result.enabledLifecycleRules,null);
 assert.equal(commands.length,3);for(const command of commands.filter(c=>c.constructor.name!=='GetBucketLifecycleConfigurationCommand'))assert.equal(command.input.Key,'shop-personalization/test.txt');assert.equal(commands.find(c=>c.constructor.name==='GetObjectCommand').input.Range,'bytes=0-3');
 assert.doesNotMatch(JSON.stringify(result),/SECRET|TEST|NEVER_RETURN|https|Metadata/);
});
test('timeouts are bounded even when sender ignores abort; all requests receive aborted signals',async()=>{
 const signals:AbortSignal[]=[];const started=Date.now();const result=await checkShopStorage(async(_command,options)=>{signals.push(options.abortSignal);return new Promise(()=>{});},15);
 assert.equal(result.head,'timeout');assert.equal(result.read,'timeout');assert.equal(result.lifecycle,'timeout');assert.ok(Date.now()-started<1000);assert.ok(signals.every(s=>s.aborted));
});
test('oversized response is discarded and closed; lifecycle returns count only',async()=>{
 const body=Readable.from([Buffer.from('SECRET_RESPONSE')]);const result=await checkShopStorage(async command=>command.constructor.name==='GetObjectCommand'?{Body:body,ContentLength:15}:command.constructor.name==='GetBucketLifecycleConfigurationCommand'?{Rules:[{Status:'Enabled',ID:'SECRET_RULE',Filter:{Prefix:'private/'}}]}:{});
 assert.equal(result.read,'unavailable');assert.equal(result.lifecycle,'ok');assert.equal(result.enabledLifecycleRules,1);assert.ok(body.destroyed);assert.doesNotMatch(JSON.stringify(result),/SECRET|private\//);
});

test('stalled GET body is destroyed by timeout',async()=>{
 const body=new Readable({read(){}});
 const result=await checkShopStorage(async command=>command.constructor.name==='GetObjectCommand'?{Body:body,ContentLength:4}:{},15);
 assert.equal(result.read,'timeout');assert.ok(body.destroyed);
});
