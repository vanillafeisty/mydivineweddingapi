import mysql from "mysql2/promise.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// Create connection pool
let pool;

export const initializeDatabase = async () => {
  try {
    pool = mysql.createPool({
      // Change this line to use the full URI
      uri: process.env.DATABASE_URL, 
      ssl: {
        rejectUnauthorized: false
      },
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_POOL_LIMIT || "10"),
      queueLimit: 0,
      enableKeepAlive: true,
    });

    // Test connection
    const connection = await pool.getConnection();
    console.log("✅ Database connected successfully to Aiven Cloud");
    connection.release();

    return pool;
  } catch (error) {
    console.error("✗ Database connection failed:", error.message);
    throw error;
  }
};

export const getPool = () => {
  if (!pool) {
    throw new Error("Database pool not initialized");
  }
  return pool;
};

export const executeQuery = async (sql, values = []) => {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.execute(sql, values);
    return results;
  } finally {
    connection.release();
  }
};

export const closeDatabase = async () => {
  if (pool) {
    await pool.end();
    console.log("Database connection pool closed");
  }
};
