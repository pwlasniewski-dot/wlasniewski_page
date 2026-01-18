
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Detect Environment
let dbUrl = process.env.DATABASE_URL || '';
const envPath = path.join(process.cwd(), '.env');

if (!dbUrl && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/DATABASE_URL=["']?(.*?)["']?$/m);
    if (match) {
        dbUrl = match[1];
    }
}

let isProduction = false;
if (dbUrl) {
    if ((dbUrl.includes('neon.tech') || dbUrl.includes('wlasniewski.pl') || dbUrl.includes('accelerate.prisma-data.net')) && !dbUrl.includes('test_neon')) {
        isProduction = true;
    }
}

// 2. Identify Command
const args = process.argv.slice(2);
const command = args[0]; // e.g., 'push', 'reset'

console.log(`🛡️  GUARDIAN: Checking command '${command}' against environment...`);

// 3. Block Destructive Commands on Production
if (isProduction) {
    const blocked = ['push', 'reset', 'seed'];

    // Allow seed ONLY if explicit bypass flag is used (not implemented yet for max safety)
    // For now, STRICT BLOCK on push/reset

    if (blocked.some(b => command.includes(b)) && command !== 'seed') {
        // Allow seed for now as it's often needed, but block push/reset absolutely
        // Actually, db push is the main killer.

        if (command.includes('push') || command.includes('reset')) {
            console.error('\n🔴🔴🔴 GUARDIAN BLOCK TRIGGERED 🔴🔴🔴');
            console.error('You are attempting to use `prisma db ${command}` on a PRODUCTION database (Neon/Live).');
            console.error('This will WIPE OR CORRUPT data.');
            console.error('Action REJECTED by safety protocol.');
            console.error('\nUse `prisma migrate deploy` instead.');
            process.exit(1);
        }
    }
}

console.log('✅ GUARDIAN: Check passed. Executing...');

// 4. Pass-through execution (if safe)
// This script is meant to be run BEFORE the actual command, OR wrap it.
// For integration simplicity, we will just use this as a check script in package.json "pre" hooks
// or explicit wrappers.
