import test from 'node:test';
import assert from 'node:assert/strict';
import {HeadObjectCommand} from '@aws-sdk/client-s3';

// Offline AWS signing with deliberately fake credentials; only the SDK transport is mocked.
process.env.MY_AWS_ACCESS_KEY_ID='OFFLINE_ADAPTER_TEST';
process.env.MY_AWS_SECRET_ACCESS_KEY='offline-adapter-test-not-a-secret';
process.env.S3_BUCKET='offline-shop-upload-test';
process.env.S3_REGION='eu-north-1';
const adapter=import('../../src/lib/storage/s3');
const uuid='af981d35-f876-42cc-95dc-e45ec1429dbe';
const guest=`guest_${'a5'.repeat(32)}`;
const sha='b3'.repeat(32);
const key=(owner:string)=>`shop-personalization/staging/${owner}/${uuid}`;

test('real S3 adapter signs guest and account uploads offline and sends exact HEAD commands',async t=>{
 const {s3Client,createPrivateShopUploadUrl,headPrivateShopUpload}=await adapter;
 const seen:unknown[]=[];
 t.mock.method(s3Client,'send',async(command:HeadObjectCommand)=>{assert.ok(command instanceof HeadObjectCommand);seen.push(command.input);return {ContentLength:2048,ContentType:'image/jpeg',ChecksumSHA256:Buffer.from(sha,'hex').toString('base64')};});
 for(const owner of [guest,'7',String(Number.MAX_SAFE_INTEGER)]){
  const before=seen.length;
  const signed=await createPrivateShopUploadUrl(key(owner),'image/jpeg',2048,sha);
  const url=new URL(signed.url);
  assert.equal(decodeURIComponent(url.pathname),`/${key(owner)}`);
  assert.equal(url.hostname,'offline-shop-upload-test.s3.eu-north-1.amazonaws.com');
  assert.equal(url.searchParams.get('X-Amz-Expires'),'600');
  assert.match(url.searchParams.get('X-Amz-Credential')||'',/^OFFLINE_ADAPTER_TEST\//);
  assert.match(url.searchParams.get('X-Amz-SignedHeaders')||'',/x-amz-checksum-sha256/);
  assert.deepEqual(signed.headers,{'Content-Type':'image/jpeg','x-amz-checksum-sha256':Buffer.from(sha,'hex').toString('base64'),'If-None-Match':'*'});
  assert.equal(seen.length,before,'signing performs no SDK send');
  assert.deepEqual(await headPrivateShopUpload(key(owner)),{size:2048,contentType:'image/jpeg',checksum:Buffer.from(sha,'hex').toString('base64')});
  assert.deepEqual(seen.at(-1),{Bucket:'offline-shop-upload-test',Key:key(owner),ChecksumMode:'ENABLED'});
 }
 assert.equal(seen.length,3);
});

test('both real adapter entrypoints reject traversal, malformed owners and upload IDs before SDK transport',async t=>{
 const {s3Client,createPrivateShopUploadUrl,headPrivateShopUpload}=await adapter;
 const send=t.mock.method(s3Client,'send',async()=>{throw Error('invalid key reached SDK');});
 const owners=['0','-1','01','1.5','1e3','9007199254740992','guest_','guest_'+ 'a'.repeat(63),'guest_'+ 'a'.repeat(65),'guest_'+ 'A'.repeat(64),'guest_'+ 'z'.repeat(64),'../7','%2e%2e%2f7',guest+'/../7'];
 const invalid=[...owners.map(key),key(guest)+'/extra',key(guest).replace(uuid,'-'.repeat(36)),key(guest).replace(uuid,'../'+uuid),key(guest).replace('/staging/','/final/'),'/'+key(guest),'https://example.test/'+key(guest),key(guest)+'?x=1',key(guest)+'\n',key(guest)+'\r\n'];
 for(const value of invalid){await assert.rejects(()=>createPrivateShopUploadUrl(value,'image/jpeg',2048,sha),/Invalid private upload capability/);await assert.rejects(()=>headPrivateShopUpload(value),/Invalid private upload key/);}
 assert.equal(send.mock.callCount(),0);
});
