const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

// Read the production env file
const envPath = path.join(__dirname, '..', '.env copy.production');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Parse DATABASE_URL
let dbUrl = '';
const lines = envContent.split(/\r?\n/);
console.log(`Found ${lines.length} lines in env file.`);

for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
        // Extract value, handle quotes if present
        let value = trimmed.substring('DATABASE_URL='.length);
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
        }
        dbUrl = value;
        break;
    }
}

if (!dbUrl) {
    console.error('DATABASE_URL not found in .env copy.production');
    process.exit(1);
}

// Prepare the command
// We need to set the DATABASE_URL environment variable for the child process
// The command: npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script
const command = 'npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script';

console.log('Running Prisma Diff...');
const child = exec(command, {
    env: { ...process.env, DATABASE_URL: dbUrl },
    cwd: path.join(__dirname, '..')
});

child.stdout.on('data', (data) => {
    console.log(data);
});

child.stderr.on('data', (data) => {
    console.error(data);
});

child.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
});
