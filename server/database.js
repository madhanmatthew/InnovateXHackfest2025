const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'recruitment.db');

let db = null;

// Initialize SQL.js and database
async function initDatabase() {
    const SQL = await initSqlJs();

    // Load existing database or create new one
    if (fs.existsSync(DB_PATH)) {
        const buffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }

    // Create tables
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('recruiter', 'applicant')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS scenarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')),
      questions_json TEXT NOT NULL,
      time_limit INTEGER,
      passing_score INTEGER,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      customizations_json TEXT,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scenario_id INTEGER NOT NULL,
      applicant_id INTEGER NOT NULL,
      answers_json TEXT NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      time_spent INTEGER,
      scores_json TEXT,
      ai_evaluation_json TEXT,
      total_score REAL,
      FOREIGN KEY (scenario_id) REFERENCES scenarios(id),
      FOREIGN KEY (applicant_id) REFERENCES users(id)
    )
  `);

    saveDatabase();
    console.log('✅ Database schema initialized successfully');
}

// Save database to file
function saveDatabase() {
    if (db) {
        const data = db.export();
        fs.writeFileSync(DB_PATH, data);
    }
}

// Helper functions for common queries
const queries = {
    // Users
    createUser: (name, email, passwordHash, role) => {
        db.run('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [name, email, passwordHash, role]);
        saveDatabase();
        return { lastInsertRowid: db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] };
    },

    getUserByEmail: (email) => {
        const result = db.exec('SELECT * FROM users WHERE email = ?', [email]);
        if (result.length === 0) return null;
        return rowToObject(result[0]);
    },

    getUserById: (id) => {
        const result = db.exec('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id]);
        if (result.length === 0) return null;
        return rowToObject(result[0]);
    },

    // Scenarios
    createScenario: (title, description, category, difficulty, questionsJson, timeLimit, passingScore, createdBy, customizationsJson) => {
        db.run(`INSERT INTO scenarios (title, description, category, difficulty, questions_json, time_limit, passing_score, created_by, customizations_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, category, difficulty, questionsJson, timeLimit, passingScore, createdBy, customizationsJson]);
        saveDatabase();
        return { lastInsertRowid: db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] };
    },

    getAllScenarios: () => {
        const result = db.exec(`
      SELECT s.*, u.name as creator_name 
      FROM scenarios s 
      LEFT JOIN users u ON s.created_by = u.id
      ORDER BY s.created_at DESC
    `);
        return result.length > 0 ? rowsToObjects(result[0]) : [];
    },

    getScenarioById: (id) => {
        const result = db.exec(`
      SELECT s.*, u.name as creator_name 
      FROM scenarios s 
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `, [id]);
        if (result.length === 0) return null;
        return rowToObject(result[0]);
    },

    updateScenario: (title, description, category, difficulty, questionsJson, timeLimit, passingScore, customizationsJson, id, createdBy) => {
        db.run(`UPDATE scenarios 
      SET title = ?, description = ?, category = ?, difficulty = ?, questions_json = ?, time_limit = ?, passing_score = ?, customizations_json = ?
      WHERE id = ? AND created_by = ?`,
            [title, description, category, difficulty, questionsJson, timeLimit, passingScore, customizationsJson, id, createdBy]);
        saveDatabase();
        return { changes: db.getRowsModified() };
    },

    deleteScenario: (id, createdBy) => {
        db.run('DELETE FROM scenarios WHERE id = ? AND created_by = ?', [id, createdBy]);
        saveDatabase();
        return { changes: db.getRowsModified() };
    },

    // Responses
    createResponse: (scenarioId, applicantId, answersJson, timeSpent, scoresJson, aiEvaluationJson, totalScore) => {
        db.run(`INSERT INTO responses (scenario_id, applicant_id, answers_json, time_spent, scores_json, ai_evaluation_json, total_score)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [scenarioId, applicantId, answersJson, timeSpent, scoresJson, aiEvaluationJson, totalScore]);
        saveDatabase();
        return { lastInsertRowid: db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] };
    },

    getResponseById: (id) => {
        const result = db.exec(`
      SELECT r.*, s.title as scenario_title, u.name as applicant_name
      FROM responses r
      LEFT JOIN scenarios s ON r.scenario_id = s.id
      LEFT JOIN users u ON r.applicant_id = u.id
      WHERE r.id = ?
    `, [id]);
        if (result.length === 0) return null;
        return rowToObject(result[0]);
    },

    getResponsesByScenario: (scenarioId) => {
        const result = db.exec(`
      SELECT r.*, u.name as applicant_name, u.email as applicant_email
      FROM responses r
      LEFT JOIN users u ON r.applicant_id = u.id
      WHERE r.scenario_id = ?
      ORDER BY r.submitted_at DESC
    `, [scenarioId]);
        return result.length > 0 ? rowsToObjects(result[0]) : [];
    },

    getResponsesByApplicant: (applicantId) => {
        const result = db.exec(`
      SELECT r.*, s.title as scenario_title, s.category
      FROM responses r
      LEFT JOIN scenarios s ON r.scenario_id = s.id
      WHERE r.applicant_id = ?
      ORDER BY r.submitted_at DESC
    `, [applicantId]);
        return result.length > 0 ? rowsToObjects(result[0]) : [];
    },

    // Analytics
    getOverviewStats: () => {
        const result = db.exec(`
      SELECT 
        (SELECT COUNT(*) FROM scenarios) as total_scenarios,
        (SELECT COUNT(*) FROM users WHERE role = 'applicant') as total_applicants,
        (SELECT COUNT(*) FROM responses) as total_responses,
        (SELECT AVG(total_score) FROM responses) as avg_score
    `);
        return result.length > 0 ? rowToObject(result[0]) : { total_scenarios: 0, total_applicants: 0, total_responses: 0, avg_score: 0 };
    },
};

// Helper to convert SQL.js result to object
function rowToObject(result) {
    if (!result || !result.columns || !result.values || result.values.length === 0) {
        return null;
    }
    const obj = {};
    result.columns.forEach((col, i) => {
        obj[col] = result.values[0][i];
    });
    return obj;
}

// Helper to convert SQL.js results to array of objects
function rowsToObjects(result) {
    if (!result || !result.columns || !result.values) {
        return [];
    }
    return result.values.map(row => {
        const obj = {};
        result.columns.forEach((col, i) => {
            obj[col] = row[i];
        });
        return obj;
    });
}

module.exports = {
    db,
    initDatabase,
    queries,
    saveDatabase
};
