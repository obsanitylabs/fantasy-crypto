const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper functions
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

const getClient = async () => {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;
  
  // Set a timeout of 5 seconds, after which we will log this client's last query
  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!');
    console.error(`The last executed query on this client was: ${client.lastQuery}`);
  }, 5000);
  
  // Monkey patch the query method to keep track of the last query executed
  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };
  
  client.release = () => {
    clearTimeout(timeout);
    // Call the actual 'release' method
    release.call(client);
  };
  
  return client;
};

// Database utility functions
const findUserByAddress = async (address) => {
  const result = await query(
    'SELECT * FROM users WHERE wallet_address = $1',
    [address.toLowerCase()]
  );
  return result.rows[0];
};

const createUser = async (address) => {
  const result = await query(
    `INSERT INTO users (wallet_address) 
     VALUES ($1) 
     ON CONFLICT (wallet_address) DO NOTHING 
     RETURNING *`,
    [address.toLowerCase()]
  );
  return result.rows[0] || await findUserByAddress(address);
};

const updateUserStats = async (userId, stats) => {
  const {
    total_wins = 0,
    total_eth_won = 0,
    total_eth_wagered = 0,
    average_position_size = 0
  } = stats;
  
  await query(
    `UPDATE users 
     SET total_wins = total_wins + $1,
         total_eth_won = total_eth_won + $2,
         total_eth_wagered = total_eth_wagered + $3,
         average_position_size = CASE 
           WHEN average_position_size = 0 THEN $4
           ELSE (average_position_size + $4) / 2
         END
     WHERE id = $5`,
    [total_wins, total_eth_won, total_eth_wagered, average_position_size, userId]
  );
  
  // Update user class based on new stats
  await query('SELECT update_user_class($1)', [userId]);
};

const getLeaderboard = async (sortBy = 'total_eth_won', limit = 100, offset = 0) => {
  const validSortFields = [
    'total_wins', 'total_eth_won', 'total_eth_wagered', 
    'win_percentage', 'total_matches', 'season_wins'
  ];
  
  if (!validSortFields.includes(sortBy)) {
    sortBy = 'total_eth_won';
  }
  
  // Use parameterized query to prevent SQL injection
  const result = await query(
    `SELECT * FROM leaderboard_view 
     ORDER BY 
       CASE WHEN $1 = 'total_wins' THEN total_wins END DESC,
       CASE WHEN $1 = 'total_eth_won' THEN total_eth_won END DESC,
       CASE WHEN $1 = 'total_eth_wagered' THEN total_eth_wagered END DESC,
       CASE WHEN $1 = 'win_percentage' THEN win_percentage END DESC,
       CASE WHEN $1 = 'total_matches' THEN total_matches END DESC,
       CASE WHEN $1 = 'season_wins' THEN season_wins END DESC,
       total_wins DESC
     LIMIT $2 OFFSET $3`,
    [sortBy, limit, offset || 0]
  );
  
  return result.rows;
};

const getPlatformStats = async () => {
  const result = await query('SELECT * FROM platform_stats ORDER BY id DESC LIMIT 1');
  return result.rows[0] || {};
};

const updatePlatformStats = async (updates) => {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  
  if (fields.length === 0) return;
  
  const setClause = fields.map((field, index) => `${field} = ${field} + $${index + 1}`).join(', ');
  
  await query(
    `UPDATE platform_stats SET ${setClause} WHERE id = (
       SELECT id FROM platform_stats ORDER BY id DESC LIMIT 1
     )`,
    values
  );
};

// Cleanup function
const cleanup = async () => {
  console.log('Closing database connections...');
  await pool.end();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

module.exports = {
  pool,
  query,
  getClient,
  // Utility functions
  findUserByAddress,
  createUser,
  updateUserStats,
  getLeaderboard,
  getPlatformStats,
  updatePlatformStats,
  cleanup
};