import test from 'node:test';
import assert from 'node:assert/strict';
import {isShopQa,shopDatabaseUrl} from '../../src/lib/shop-qa';

test('review database never replaces production context and rejects aliases of production compute',()=>{
 const previous={...process.env};
 try {
  delete process.env.GALLERY_QA_CONTEXT;
  Object.assign(process.env,{NODE_ENV:'production',CONTEXT:'production',DATABASE_URL:'postgresql://user:example@ep-main-pooler.eu.neon.tech/db',GALLERY_QA_DATABASE_URL:'postgresql://user:example@ep-review.eu.neon.tech/db'});
  assert.equal(isShopQa(),false);assert.equal(shopDatabaseUrl(),process.env.DATABASE_URL);
  process.env.CONTEXT='deploy-preview';assert.equal(shopDatabaseUrl(),process.env.GALLERY_QA_DATABASE_URL);
  process.env.GALLERY_QA_DATABASE_URL='postgresql://user:example@ep-main.eu.neon.tech/db';assert.throws(shopDatabaseUrl,/isolated/);
  process.env.GALLERY_QA_DATABASE_URL='https://ep-review.eu.neon.tech/db';assert.throws(shopDatabaseUrl,/isolated/);
  delete process.env.CONTEXT;assert.throws(shopDatabaseUrl,/explicit preview/);
 } finally {for(const key of Object.keys(process.env))if(!(key in previous))delete process.env[key];Object.assign(process.env,previous);}
});

test('Netlify Functions use an explicit branch-scoped context without relying on build-only CONTEXT',()=>{
 const previous={...process.env};
 try {
  delete process.env.CONTEXT;
  Object.assign(process.env,{NODE_ENV:'production',GALLERY_QA_CONTEXT:'deploy-preview',DATABASE_URL:'postgresql://user:example@ep-main-pooler.eu.neon.tech/db',GALLERY_QA_DATABASE_URL:'postgresql://user:example@ep-review-pooler.eu.neon.tech/db'});
  assert.equal(isShopQa(),true);
  assert.equal(shopDatabaseUrl(),process.env.GALLERY_QA_DATABASE_URL);

  process.env.CONTEXT='production';
  assert.equal(isShopQa(),false);
  assert.equal(shopDatabaseUrl(),process.env.DATABASE_URL);
  process.env.CONTEXT='branch-deploy';
  assert.throws(shopDatabaseUrl,/explicit preview/);

  delete process.env.CONTEXT;
  process.env.GALLERY_QA_DATABASE_URL='postgresql://user:example@ep-main.eu.neon.tech/db';
  assert.throws(shopDatabaseUrl,/isolated/);
  process.env.GALLERY_QA_CONTEXT='production';
  assert.equal(isShopQa(),false);
  assert.equal(shopDatabaseUrl(),process.env.DATABASE_URL);

  process.env.GALLERY_QA_CONTEXT='deploy-preview';
  delete process.env.GALLERY_QA_DATABASE_URL;
  assert.equal(isShopQa(),false);
  assert.equal(shopDatabaseUrl(),process.env.DATABASE_URL);
 } finally {for(const key of Object.keys(process.env))if(!(key in previous))delete process.env[key];Object.assign(process.env,previous);}
});
