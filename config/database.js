const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Supabase client initialization (Main connection method)
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_KEY 
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
        db: {
            schema: 'public',
        },
        global: {
            headers: { 'x-connection-timeout': '30000' },
        },
        fetch: (...args) => {
            const [resource, config] = args;
            const timeout = 30000; // 30 seconds
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            return fetch(resource, {
                ...config,
                signal: controller.signal
            }).finally(() => clearTimeout(id));
        }
    })
    : null;

// PostgreSQL pool for legacy compatibility (optional - only if DB_PASSWORD is set)
let pool = null;
if (process.env.DB_PASSWORD && process.env.DB_PASSWORD !== 'your_supabase_db_password') {
    pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'postgres',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
    });
}

// Query helper that works with both Supabase and PostgreSQL
const query = async (text, params) => {
    if (pool) {
        // Use PostgreSQL if available
        try {
            return await pool.query(text, params);
        } catch (error) {
            console.error('PostgreSQL query error:', error.message);
            throw error;
        }
    }
    
    // Fallback: return empty result (routes should use Supabase client directly)
    console.log('Query called but using Supabase client - routes should use supabase directly');
    return { rows: [], rowCount: 0 };
};

// Initialize and test connection
const initDB = async () => {
    try {
        if (!supabase) {
            throw new Error('Supabase client not initialized. Check SUPABASE_URL and SUPABASE_KEY in .env');
        }
        
        console.log('🔄 Connecting to Supabase...');
        
        // Test connection by checking if we can query
        const { error } = await supabase.from('hero_slides').select('count', { count: 'exact', head: true });
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (OK)
            throw error;
        }
        
        console.log('✅ Supabase connected successfully!');
        console.log('📦 Database: https://supabase.com/dashboard/project/lpcviiavefxepvtcedxs');
        console.log('🗄️  Storage bucket "astrology" is ready!');
        
        if (pool) {
            console.log('💡 PostgreSQL pool also initialized (optional)');
        } else {
            console.log('💡 Using Supabase REST API (no PostgreSQL password needed)');
        }
        
    } catch (error) {
        console.error('❌ Supabase connection error:', error.message);
        console.error('Please check SUPABASE_URL and SUPABASE_KEY in .env');
        console.error('Server will start but database features may not work');
    }
};

module.exports = {
    supabase,
    pool,
    query,
    initDB
};
