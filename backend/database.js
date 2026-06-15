const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'clothes_swap.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      bio TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clothes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      brand TEXT,
      category TEXT NOT NULL,
      size TEXT NOT NULL,
      condition TEXT NOT NULL,
      wanted_types TEXT,
      images TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS swap_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      target_clothes_id INTEGER NOT NULL,
      offered_clothes_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user_id) REFERENCES users(id),
      FOREIGN KEY (to_user_id) REFERENCES users(id),
      FOREIGN KEY (target_clothes_id) REFERENCES clothes(id),
      FOREIGN KEY (offered_clothes_id) REFERENCES clothes(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      swap_request_id INTEGER NOT NULL,
      reviewer_id INTEGER NOT NULL,
      reviewee_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (swap_request_id) REFERENCES swap_requests(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id),
      FOREIGN KEY (reviewee_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category TEXT,
      brand TEXT,
      size TEXT,
      keyword TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS swap_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      swap_request_id INTEGER NOT NULL,
      user1_confirmed INTEGER DEFAULT 0,
      user2_confirmed INTEGER DEFAULT 0,
      completed_at DATETIME,
      FOREIGN KEY (swap_request_id) REFERENCES swap_requests(id)
    );
  `);

  const adminCheck = db.prepare('SELECT * FROM users WHERE username = ?');
  const admin = adminCheck.get('admin');
  if (!admin) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const insertAdmin = db.prepare('INSERT INTO users (username, password, nickname, role) VALUES (?, ?, ?, ?)');
    insertAdmin.run('admin', hashedPassword, '管理员', 'admin');
    console.log('管理员账户已创建: admin / admin123');
  }

  console.log('数据库初始化完成');
}

module.exports = { db, initDatabase };
