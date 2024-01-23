const Database = require('better-sqlite3');

// New DatabaseHandler class to handle database operations
class DatabaseHandler {
  constructor(dbFilePath) {
    this.db = new Database(dbFilePath);
    this.setupDatabase();
  }

  setupDatabase() {
    const tableCreationQuery = `
      CREATE TABLE IF NOT EXISTS chat_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        originalQuery TEXT,
        response TEXT,
        timestamp TEXT
      )`;
    this.db.prepare(tableCreationQuery).run();
  }

  appendToChatLog(userId, originalQuery, response) {
    const timestamp = new Date().toISOString();
    const insertQuery = `
      INSERT INTO chat_logs (userId, originalQuery, response, timestamp)
      VALUES (?, ?, ?, ?)`;
    this.db.prepare(insertQuery).run(userId, originalQuery, response, timestamp);
  }
}

module.exports = DatabaseHandler;