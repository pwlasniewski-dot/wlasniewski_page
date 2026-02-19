const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env copy.production');
const envContent = fs.readFileSync(envPath, 'utf-8');

let dbUrl = '';
const lines = envContent.split(/\r?\n/);
for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
        let value = trimmed.substring('DATABASE_URL='.length);
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        dbUrl = value;
        break;
    }
}

if (!dbUrl) {
    console.error('DATABASE_URL not found');
    process.exit(1);
}

const command = 'npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script';

const child = exec(command, {
    env: { ...process.env, DATABASE_URL: dbUrl },
    cwd: path.join(__dirname, '..')
});

let output = '';
child.stdout.on('data', (data) => {
    output += data;
});

child.stderr.on('data', (data) => {
    console.error(data);
});

child.on('close', (code) => {
    fs.writeFileSync(path.join(__dirname, '..', 'clean_drift_report.sql'), output);
    console.log(`Report generated. Exit code: ${code}`);
});
