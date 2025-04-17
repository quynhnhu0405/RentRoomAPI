#!/usr/bin/env node

/**
 * Script to setup the MySQL database
 */

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

const sqlFilePath = path.join(__dirname, "..", "config", "init.sql");
const MAX_RETRIES = 10;
const RETRY_INTERVAL = 5000; // 5 seconds

async function waitForDatabase(retries = MAX_RETRIES) {
  console.log("Waiting for MySQL database to be ready...");

  for (let i = 0; i < retries; i++) {
    try {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        multipleStatements: true,
      });

      await connection.end();
      console.log("Database is ready!");
      return true;
    } catch (error) {
      console.log(
        `Attempt ${i + 1}/${retries}: Database not ready yet. Retrying in ${
          RETRY_INTERVAL / 1000
        } seconds...`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
    }
  }

  console.error("Could not connect to database after multiple attempts");
  return false;
}

async function setupDatabase() {
  console.log("Setting up MySQL database...");

  // Wait for database to be ready
  const isReady = await waitForDatabase();
  if (!isReady) {
    process.exit(1);
  }

  // Read SQL file
  let sql;
  try {
    sql = fs.readFileSync(sqlFilePath, "utf8");
  } catch (err) {
    console.error("Error reading SQL file:", err);
    process.exit(1);
  }

  // Create connection to MySQL
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true,
    });
    console.log("Connected to MySQL server");
  } catch (err) {
    console.error("Error connecting to MySQL server:", err);
    process.exit(1);
  }

  // Execute SQL file
  try {
    // First check if database exists
    const [rows] = await connection.query("SHOW DATABASES LIKE 'rentroom'");

    if (rows.length === 0) {
      // Database doesn't exist, run the initialization script
      await connection.query(sql);
      console.log("Database setup completed successfully!");
    } else {
      console.log("Database already exists, skipping initialization");
    }
  } catch (err) {
    console.error("Error executing SQL commands:", err);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
