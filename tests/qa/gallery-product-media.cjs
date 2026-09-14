const {assert,mount,reset,button,click,check}=require('./gallery-shop-dom.cjs');
const Preview=require('../../src/components/galleries/GalleryProductPreview.tsx').default;
const product={title:'Album',price:25000,image_url:'https://example.test/cover.jpg',video_url:'https://example.test/film.mp4',sample_pages:['https://example.test/one.jpg','https://example.test/two.jpg']};
(async()=>{
await check('product media: video only mounts on request and never autoplays',async()=>{
 await mount(Preview,{product});assert.equal(document.querySelector('video'),null);
 await click(button('Obejrzyj film'));const video=document.querySelector('video');assert.equal(video.getAttribute('preload'),'none');assert.equal(video.autoplay,false);assert.equal(video.controls,true);
 await click(button('Zdjęcia'));assert.equal(document.querySelector('video'),null);
});
await check('product media: sample spreads have bounded navigation and are labelled as examples',async()=>{
 await click(button('Zajrzyj do środka'));assert.ok(button('Poprzednia').disabled);assert.ok(document.body.textContent.includes('Przykładowa realizacja'));
 await click(button('Następna'));assert.ok(document.querySelector('img').src.endsWith('/two.jpg'));assert.ok(button('Następna').disabled);
 await click(button('Poprzednia'));assert.ok(document.querySelector('img').src.endsWith('/one.jpg'));
 await reset();await mount(Preview,{product:{title:'Legacy',price:100}});assert.equal(document.querySelector('video'),null);assert.ok(document.body.textContent.includes('Legacy'));
});
await reset();
})().catch(error=>{console.error(error);process.exitCode=1});
