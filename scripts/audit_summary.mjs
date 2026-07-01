import fs from 'node:fs';
const r = JSON.parse(fs.readFileSync('./scripts/audit_result.json', 'utf8'));
const weak = r.matches.filter(m => m.best_dist > 6 && m.best_dist <= 12).sort((a, b) => b.best_dist - a.best_dist);
console.log('SLABE dopasowania (7-12):', weak.length);
weak.forEach(m => console.log(`  webp#${m.webp_id} dist=${m.best_dist} margines=${m.margin} -> ${m.best_jpg}`));
const test = r.matches.filter(m => m.webp_id >= 2188).map(m => m.webp_id).sort((a, b) => a - b);
console.log('\nwebp id>=2188 (podejrzane testowe):', test.join(', '));
console.log('\nJPG nieuzyty:', r.unused_jpg);
