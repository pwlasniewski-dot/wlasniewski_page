import test from 'node:test';
import assert from 'node:assert/strict';
import {isShopQa,shopDatabaseUrl} from '../../src/lib/shop-qa';

test('review database never replaces production context and rejects aliases of production compute',()=>{
 const previous={...process.env};
 try {
  Object.assign(process.env,{NODE_ENV:'production',CONTEXT:'production',DATABASE_URL:'postgresql://user:example@ep-main-pooler.eu.neon.tech/db',GALLERY_QA_DATABASE_URL:'postgresql://user:example@ep-review.eu.neon.tech/db'});
  assert.equal(isShopQa(),false);assert.equal(shopDatabaseUrl(),process.env.DATABASE_URL);
  process.env.CONTEXT='deploy-preview';assert.equal(shopDatabaseUrl(),process.env.GALLERY_QA_DATABASE_URL);
  process.env.GALLERY_QA_DATABASE_URL='postgresql://user:example@ep-main.eu.neon.tech/db';assert.throws(shopDatabaseUrl,/isolated/);
  process.env.GALLERY_QA_DATABASE_URL='https://ep-review.eu.neon.tech/db';assert.throws(shopDatabaseUrl,/isolated/);
  delete process.env.CONTEXT;assert.throws(shopDatabaseUrl,/explicit preview/);
 } finally {for(const key of Object.keys(process.env))if(!(key in previous))delete process.env[key];Object.assign(process.env,previous);}
});
