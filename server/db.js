import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "outpass.db");
export const db = new sqlite3.Database(dbPath);

export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}
export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
  });
}
export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
  });
}
export async function initializeDatabase() {
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    register_number TEXT UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student','warden')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  await run(`CREATE TABLE IF NOT EXISTS outpasses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    destination TEXT NOT NULL,
    reason TEXT NOT NULL,
    departure_datetime TEXT NOT NULL,
    expected_return_datetime TEXT NOT NULL,
    actual_return_datetime TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    rejection_reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES users(id)
  )`);
  await run(`CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    outpass_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    performed_by INTEGER NOT NULL,
    details TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(outpass_id) REFERENCES outpasses(id),
    FOREIGN KEY(performed_by) REFERENCES users(id)
  )`);

  const student = await get("SELECT id FROM users WHERE email = ?", ["student@gateflow.demo"]);
  if (!student) {
    const hash = await bcrypt.hash("Student@123", 10);
    await run("INSERT INTO users(name,register_number,email,password,role) VALUES(?,?,?,?,?)",
      ["Aarav Mathew","23BCA041","student@gateflow.demo",hash,"student"]);
  }
  const warden = await get("SELECT id FROM users WHERE email = ?", ["warden@gateflow.demo"]);
  if (!warden) {
    const hash = await bcrypt.hash("Warden@123", 10);
    await run("INSERT INTO users(name,register_number,email,password,role) VALUES(?,?,?,?,?)",
      ["Anita Thomas",null,"warden@gateflow.demo",hash,"warden"]);
  }
  const count = await get("SELECT COUNT(*) AS count FROM outpasses");
  if (count.count === 0) {
    const s = await get("SELECT id FROM users WHERE email = ?", ["student@gateflow.demo"]);
    const samples = [
      ["Kottayam","Family visit","2026-11-14T09:00","2026-11-14T18:00","Pending"],
      ["Pala","Personal work","2026-11-10T10:00","2026-11-10T17:00","Approved"],
      ["Ernakulam","Medical appointment","2026-11-06T08:00","2026-11-06T20:00","Returned"]
    ];
    for (const item of samples) {
      const result = await run("INSERT INTO outpasses(student_id,destination,reason,departure_datetime,expected_return_datetime,status,actual_return_datetime) VALUES(?,?,?,?,?,?,?)",
        [s.id,item[0],item[1],item[2],item[3],item[4],item[4] === "Returned" ? "2026-11-06T19:15" : null]);
      await run("INSERT INTO activity_logs(outpass_id,action,performed_by,details) VALUES(?,?,?,?)",
        [result.id,"Application created",s.id,"Demo application"]);
    }
  }
}
