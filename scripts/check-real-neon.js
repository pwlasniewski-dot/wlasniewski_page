const { Client } = require('pg');

async function checkRealNeon() {
    // DIRECT Neon connection (NOT through Accelerate)
    const directUrl = 'postgresql://neondb_owner:npg_vjh6d9PJuKFT@ep-dry-art-aemsvsfc.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

    const client = new Client({ connectionString: directUrl });

    try {
        await client.connect();
        console.log('✅ Connected to DIRECT Neon (ep-dry-art-aemsvsfc)');

        // Check what tables exist
        const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

        console.log('\n📋 TABLES IN PUBLIC SCHEMA:');
        console.log('Count:', tablesResult.rows.length);
        tablesResult.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        // Check admin_users if exists
        if (tablesResult.rows.some(r => r.table_name === 'admin_users')) {
            const adminsResult = await client.query('SELECT id, email, name FROM admin_users LIMIT 5');
            console.log('\n👤 ADMIN_USERS:');
            console.log('Count:', adminsResult.rows.length);
            adminsResult.rows.forEach(admin => {
                console.log(`  - ${admin.email} (ID: ${admin.id}, Name: ${admin.name || 'N/A'})`);
            });
        } else {
            console.log('\n❌ admin_users table DOES NOT EXIST');
        }

        // Check users if exists  
        if (tablesResult.rows.some(r => r.table_name === 'users')) {
            const usersResult = await client.query('SELECT id, email, role FROM users WHERE role = \'ADMIN\' LIMIT 5');
            console.log('\n👥 USERS (ADMIN role):');
            console.log('Count:', usersResult.rows.length);
            usersResult.rows.forEach(user => {
                console.log(`  - ${user.email} (ID: ${user.id}, Role: ${user.role})`);
            });
        } else {
            console.log('\n❌ users table DOES NOT EXIST');
        }

        // Check pages if exists
        if (tablesResult.rows.some(r => r.table_name === 'pages')) {
            const pagesResult = await client.query('SELECT COUNT(*) as count FROM pages');
            console.log('\n📄 PAGES:');
            console.log('Count:', pagesResult.rows[0].count);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkRealNeon();
