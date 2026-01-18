
import { Client } from 'pg';

async function main() {
    const connectionString = "postgresql://postgres:zWMWbkFpBt@localhost:5432/postgres";
    const client = new Client({
        connectionString: connectionString,
    });

    console.log('--- CREATING LOCAL DB test_neon ---');
    try {
        await client.connect();

        // Check if DB already exists
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname='test_neon'");
        if (res.rowCount === 0) {
            console.log('Database test_neon not found. Creating...');
            await client.query('CREATE DATABASE test_neon');
            console.log('✅ SUCCESS: Database test_neon created.');
        } else {
            console.log('Database test_neon already exists.');
        }
    } catch (error: any) {
        console.error('❌ FAILURE: Could not create database.');
        console.error('Error:', error.message);
    } finally {
        await client.end();
        console.log('--- DONE ---');
    }
}

main();
