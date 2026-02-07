import { isB2BContext } from '../src/lib/context';

const testCases = [
    { hostname: 'wlasniewski.pl', expected: false },
    { hostname: 'b2b.wlasniewski.pl', expected: true },
    { hostname: 'dron.wlasniewski.pl', expected: true },
    { hostname: 'aeroanaliza.pl', expected: true },
    { hostname: 'www.aeroanaliza.pl', expected: true },
    { hostname: 'localhost', port: '3000', expected: false },
    { hostname: 'localhost', port: '3001', expected: true },
    { pathname: '/b2b/test', expected: true },
    { pathname: '/dron/test', expected: true },
    { pathname: '/portfolio/wedding', expected: false }
];

console.log('--- Testing B2B Context Logic ---');
let allPassed = true;

testCases.forEach((tc, i) => {
    const result = isB2BContext({
        hostname: tc.hostname,
        port: tc.port,
        pathname: tc.pathname
    });
    const passed = result === tc.expected;
    console.log(`Test ${i + 1}: ${JSON.stringify(tc)} -> ${result} (${passed ? 'PASS' : 'FAIL'})`);
    if (!passed) allPassed = false;
});

if (allPassed) {
    console.log('\n✅ ALL TESTS PASSED');
    process.exit(0);
} else {
    console.log('\n❌ SOME TESTS FAILED');
    process.exit(1);
}
