import { test } from 'node:test';
import assert from 'node:assert/strict';
import {guestOrderPath,parseGuestOrderToken,verifyGuestOrderToken} from '../../src/lib/galleries/guest-order-link';
test('read-only receipt capability binds one guest and order, expires, rejects tampering',()=>{
 const previous=process.env.JWT_SECRET;process.env.JWT_SECRET='test-only-secret-key-'.repeat(3);
 try{
  const owner='guest_'+'a'.repeat(64),now=Date.now();
  const path=guestOrderPath(12,owner,now),token=path.split('/').pop()!;
  assert.equal(parseGuestOrderToken(token,now)?.orderId,12);assert.equal(verifyGuestOrderToken(token,owner,now),true);
  assert.equal(verifyGuestOrderToken(token,'guest_'+'b'.repeat(64),now),false);
  assert.equal(verifyGuestOrderToken(token.replace(/^12\./,'13.'),owner,now),false);
  assert.equal(verifyGuestOrderToken(token,owner,now+91*86400000),false);
  assert.equal(parseGuestOrderToken('12.bad.anything',now),null);
  process.env.JWT_SECRET='short';assert.throws(()=>guestOrderPath(12,owner,now));assert.equal(verifyGuestOrderToken(token,owner,now),false);
 }finally{if(previous===undefined)delete process.env.JWT_SECRET;else process.env.JWT_SECRET=previous;}
});
