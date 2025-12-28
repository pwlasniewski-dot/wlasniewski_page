
const fs = require('fs');
const path = require('path');

console.log('\x1b[33m%s\x1b[0m', '=======================================================');
console.log('\x1b[33m%s\x1b[0m', '⚠️  PRE-BUILD CHECK: DOCUMENTATION UPDATE REQUIRED ⚠️');
console.log('\x1b[33m%s\x1b[0m', '=======================================================');
console.log('Ensure the following files have been updated with the latest context:');
console.log('1. PROJECT_HISTORIA.md (Reasoning & History)');
console.log('2. FUNCTIONAL_SPECIFICATION.md (Features & Logic)');
console.log('3. ARCHITECTURE.md (System Design)');
console.log('4. task.md (Progress & Todo)');
console.log('-------------------------------------------------------');
console.log('⚠️  IMPORTANT: Entries must be sorted NEWEST FIRST (Descending Date) ⚠️');
console.log('-------------------------------------------------------');
console.log('If you are the AI Assistant, STOP and update them if you haven\'t yet.');
console.log('=======================================================\n');

// Optional: specific checks could go here, but context is key
