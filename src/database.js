// ═══════════════════════════════════════════════════════
// WPW Database — SQLite (better-sqlite3)
// ═══════════════════════════════════════════════════════
const Database = require("better-sqlite3");
const path = require("path");
const { v4: uuid } = require("uuid");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "db", "wpw.db");

let db;

function getDb() {
  if (!db) {
    const fs = require("fs");
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema();
    seedData();
  }
  return db;
}

// ── SCHEMA ──
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS machines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      dept TEXT NOT NULL CHECK(dept IN ('T','M','B','S')),
      dept_name TEXT NOT NULL,
      rate REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('operator','maintenance','director','owner','admin')),
      pin TEXT NOT NULL,
      telegram_id TEXT,
      lang TEXT DEFAULT 'he',
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      machine_id TEXT NOT NULL REFERENCES machines(id),
      emp_num TEXT,
      description TEXT,
      category TEXT DEFAULT 'general',
      urgency TEXT DEFAULT 'medium' CHECK(urgency IN ('critical','high','medium','low')),
      is_stopped INTEGER DEFAULT 0,
      image TEXT,
      status TEXT DEFAULT 'new' CHECK(status IN ('new','ack','in_progress','waiting','resolved','closed','reopened','canceled')),
      created_at TEXT NOT NULL,
      opened_by TEXT,
      ack_by TEXT,
      ack_at TEXT,
      started_at TEXT,
      assigned_to TEXT,
      wait_reason TEXT,
      wait_at TEXT,
      resolved_at TEXT,
      closed_at TEXT,
      closed_by TEXT,
      canceled_at TEXT,
      canceled_by TEXT,
      reopen_count INTEGER DEFAULT 0,
      reopened_at TEXT,
      t0 TEXT,
      t1 TEXT,
      work_action TEXT,
      work_emp_num TEXT,
      work_root TEXT,
      work_parts TEXT,
      work_notes TEXT,
      work_image TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      inc_id TEXT REFERENCES incidents(id),
      action TEXT NOT NULL,
      by_user TEXT,
      from_val TEXT,
      to_val TEXT,
      at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS telegram_subscriptions (
      telegram_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      dept_filter TEXT,
      PRIMARY KEY (telegram_id, event_type)
    );

    CREATE INDEX IF NOT EXISTS idx_inc_status ON incidents(status);
    CREATE INDEX IF NOT EXISTS idx_inc_machine ON incidents(machine_id);
    CREATE INDEX IF NOT EXISTS idx_inc_created ON incidents(created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_inc ON audit_log(inc_id);
  `);
}

// ── SEED DATA ──
function seedData() {
  const count = db.prepare("SELECT COUNT(*) as c FROM machines").get().c;
  if (count > 0) return;

  const machines = [
    // 🔵 חריטה (T)
    { id: "T-01", name: "MAZAK", dept: "T", dept_name: "חריטה", rate: 40 },
    { id: "T-02", name: "HANWHA STL 38", dept: "T", dept_name: "חריטה", rate: 35 },
    { id: "T-03", name: "HANWHA 26H", dept: "T", dept_name: "חריטה", rate: 22 },
    { id: "T-04", name: "FELLER FTC20", dept: "T", dept_name: "חריטה", rate: 20 },
    { id: "T-05", name: "OKUMA LB9", dept: "T", dept_name: "חריטה", rate: 20 },
    { id: "T-06", name: "STAR", dept: "T", dept_name: "חריטה", rate: 22 },
    // 🟠 כרסום (M)
    { id: "M-01", name: "VICTOR", dept: "M", dept_name: "כרסום", rate: 25 },
    { id: "M-02", name: "KITAMURA", dept: "M", dept_name: "כרסום", rate: 20 },
    { id: "M-03", name: "SHARNOA", dept: "M", dept_name: "כרסום", rate: 18 },
    { id: "M-04", name: "SERVO", dept: "M", dept_name: "כרסום", rate: 18 },
    { id: "M-05", name: "CONLOG", dept: "M", dept_name: "כרסום", rate: 18 },
    { id: "M-06", name: "SHARNOAX5", dept: "M", dept_name: "כרסום", rate: 28 },
    { id: "M-07", name: "HAAS VF5-1", dept: "M", dept_name: "כרסום", rate: 28 },
    { id: "M-08", name: "HAAS VF5-2", dept: "M", dept_name: "כרסום", rate: 25 },
    { id: "M-09", name: "HAAS VF3", dept: "M", dept_name: "כרסום", rate: 25 },
    // 🔴 הלחמה (B)
    { id: "B-01", name: "ניקוי חול חדשה", dept: "B", dept_name: "הלחמה", rate: 25 },
    { id: "B-02", name: "ניקוי חול ישנה", dept: "B", dept_name: "הלחמה", rate: 15 },
    { id: "B-03", name: "אינדוקציה 1", dept: "B", dept_name: "הלחמה", rate: 30 },
    { id: "B-04", name: "אינדוקציה 2", dept: "B", dept_name: "הלחמה", rate: 30 },
    { id: "B-05", name: "תנור ואקום", dept: "B", dept_name: "הלחמה", rate: 40 },
    { id: "B-06", name: "תנור רציף", dept: "B", dept_name: "הלחמה", rate: 30 },
    // 🟢 השחזה (S)
    { id: "S-01", name: "JONES SHIPMAN 1300X", dept: "S", dept_name: "השחזה", rate: 20 },
    { id: "S-02", name: "JONES SHIPMAN 1300", dept: "S", dept_name: "השחזה", rate: 18 },
    { id: "S-03", name: "JONES SHIPMAN 540", dept: "S", dept_name: "השחזה", rate: 18 },
    { id: "S-04", name: "CHEVALIER FSG1020", dept: "S", dept_name: "השחזה", rate: 15 },
    { id: "S-05", name: "CHEVALIER FSG1224", dept: "S", dept_name: "השחזה", rate: 15 },
    { id: "S-06", name: "HONING SUNNEN", dept: "S", dept_name: "השחזה", rate: 22 },
    { id: "S-07", name: "LAPPING 1", dept: "S", dept_name: "השחזה", rate: 12 },
    { id: "S-08", name: "LAPPING 2", dept: "S", dept_name: "השחזה", rate: 12 },
    { id: "S-09", name: "LAPPING 3", dept: "S", dept_name: "השחזה", rate: 12 },
    { id: "S-10", name: "LAPPING 4", dept: "S", dept_name: "השחזה", rate: 12 },
    { id: "S-11", name: "BDN ISOMIL", dept: "S", dept_name: "השחזה", rate: 10 },
    { id: "S-12", name: "OVERBECK", dept: "S", dept_name: "השחזה", rate: 22 },
    { id: "S-13", name: "KONDO", dept: "S", dept_name: "השחזה", rate: 18 },
    { id: "S-14", name: "OKAMOTO", dept: "S", dept_name: "השחזה", rate: 22 },
    { id: "S-15", name: "AGATHON", dept: "S", dept_name: "השחזה", rate: 20 },
    { id: "S-16", name: "EWAG", dept: "S", dept_name: "השחזה", rate: 25 },
  ];

  const ins = db.prepare("INSERT OR IGNORE INTO machines VALUES (?,?,?,?,?)");
  const tx = db.transaction(() => {
    for (const m of machines) ins.run(m.id, m.name, m.dept, m.dept_name, m.rate);
  });
  tx();

  // Default users
  const users = [
    { name: "מפעיל", role: "operator", pin: "1111" },
    { name: "אלי", role: "maintenance", pin: "2222" },
    { name: "סלאח", role: "maintenance", pin: "2222" },
    { name: "סיימון", role: "maintenance", pin: "2222" },
    { name: "אמיל", role: "maintenance", pin: "2222" },
    { name: "גבי", role: "maintenance", pin: "2222" },
    { name: "יפים", role: "maintenance", pin: "2222" },
    { name: "מנהל", role: "director", pin: "3333" },
    { name: "בעלים", role: "owner", pin: "4444" },
    { name: "Efim", role: "admin", pin: "0000" },
  ];
  const insU = db.prepare("INSERT INTO users (name, role, pin) VALUES (?,?,?)");
  const tx2 = db.transaction(() => {
    for (const u of users) insU.run(u.name, u.role, u.pin);
  });
  tx2();

  console.log(`✅ Seeded ${machines.length} machines, ${users.length} users`);
}

// ═══════════════════════════════════════════════════════
// DATA ACCESS
// ═══════════════════════════════════════════════════════

// ── Machines ──
const getAllMachines = () => getDb().prepare("SELECT * FROM machines ORDER BY id").all();
const getMachine = (id) => getDb().prepare("SELECT * FROM machines WHERE id = ?").get(id);
const getMachinesByDept = (dept) => getDb().prepare("SELECT * FROM machines WHERE dept = ? ORDER BY id").all(dept);
const updateMachineRate = (id, rate) => getDb().prepare("UPDATE machines SET rate = ? WHERE id = ?").run(rate, id);

// ── Users ──
const getAllUsers = () => getDb().prepare("SELECT * FROM users WHERE active = 1").all();
const getUserByTelegram = (tgId) => getDb().prepare("SELECT * FROM users WHERE telegram_id = ?").get(String(tgId));
const linkTelegram = (userId, tgId) => getDb().prepare("UPDATE users SET telegram_id = ? WHERE id = ?").run(String(tgId), userId);
const getUsersByRole = (role) => getDb().prepare("SELECT * FROM users WHERE role = ? AND active = 1").all(role);
const authenticateUser = (name, pin) => getDb().prepare("SELECT * FROM users WHERE name = ? AND pin = ? AND active = 1").get(name, pin);

// ── Incidents ──
const createIncident = (data) => {
  const id = "INC-" + uuid().slice(0, 6).toUpperCase();
  const now = new Date().toISOString();
  getDb().prepare(`
    INSERT INTO incidents (id, machine_id, emp_num, description, category, urgency, is_stopped, image, status, created_at, opened_by, t0)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)
  `).run(id, data.machineId, data.empNum, data.description, data.category || "general",
    data.isStopped ? "critical" : (data.urgency || "medium"),
    data.isStopped ? 1 : 0, data.image || null, now, data.openedBy || "מפעיל",
    data.isStopped ? now : null);
  addAudit(id, "CREATE", data.openedBy, null, "new");
  return getIncident(id);
};

const getIncident = (id) => getDb().prepare("SELECT * FROM incidents WHERE id = ?").get(id);

const getActiveIncidents = () => getDb().prepare(
  "SELECT * FROM incidents WHERE status NOT IN ('closed','canceled') ORDER BY created_at DESC"
).all();

const getClosedIncidents = (limit = 100) => getDb().prepare(
  "SELECT * FROM incidents WHERE status IN ('closed','canceled') ORDER BY closed_at DESC LIMIT ?"
).all(limit);

const getAllIncidents = () => getDb().prepare("SELECT * FROM incidents ORDER BY created_at DESC").all();

const updateIncident = (id, fields) => {
  const sets = Object.keys(fields).map(k => `${k} = ?`).join(", ");
  const vals = Object.values(fields);
  getDb().prepare(`UPDATE incidents SET ${sets} WHERE id = ?`).run(...vals, id);
  return getIncident(id);
};

// Workflow actions
const ackIncident = (id, byUser) => {
  const now = new Date().toISOString();
  updateIncident(id, { status: "ack", ack_by: byUser, ack_at: now });
  addAudit(id, "ACK", byUser, "new", "ack");
  return getIncident(id);
};

const startWork = (id, byUser) => {
  const now = new Date().toISOString();
  updateIncident(id, { status: "in_progress", assigned_to: byUser, started_at: now });
  addAudit(id, "START_WORK", byUser, "ack", "in_progress");
  return getIncident(id);
};

const setWaiting = (id, reason, byUser) => {
  const now = new Date().toISOString();
  updateIncident(id, { status: "waiting", wait_reason: reason, wait_at: now });
  addAudit(id, "WAIT", byUser, "in_progress", "waiting");
  return getIncident(id);
};

const resumeWork = (id, byUser) => {
  updateIncident(id, { status: "in_progress", wait_reason: null, wait_at: null });
  addAudit(id, "RESUME", byUser, "waiting", "in_progress");
  return getIncident(id);
};

const resolveIncident = (id, workData, byUser) => {
  const now = new Date().toISOString();
  const inc = getIncident(id);
  updateIncident(id, {
    status: "resolved", resolved_at: now,
    work_action: workData.action, work_emp_num: workData.empNum,
    work_root: workData.root, work_parts: workData.parts,
    work_notes: workData.notes, work_image: workData.image,
    t1: inc.is_stopped ? now : null,
  });
  addAudit(id, "RESOLVE", byUser, "in_progress", "resolved");
  return getIncident(id);
};

const closeIncident = (id, byUser) => {
  const now = new Date().toISOString();
  updateIncident(id, { status: "closed", closed_at: now, closed_by: byUser });
  addAudit(id, "CLOSE", byUser, "resolved", "closed");
  return getIncident(id);
};

const reopenIncident = (id, byUser) => {
  const inc = getIncident(id);
  const now = new Date().toISOString();
  updateIncident(id, { status: "reopened", reopened_at: now, reopen_count: (inc.reopen_count || 0) + 1 });
  addAudit(id, "REOPEN", byUser, "closed", "reopened");
  return getIncident(id);
};

const cancelIncident = (id, byUser) => {
  const now = new Date().toISOString();
  updateIncident(id, { status: "canceled", canceled_at: now, canceled_by: byUser });
  addAudit(id, "CANCEL", byUser, null, "canceled");
  return getIncident(id);
};

const setPriority = (id, urgency, byUser) => {
  const inc = getIncident(id);
  updateIncident(id, { urgency });
  addAudit(id, "PRIORITY", byUser, inc.urgency, urgency);
  return getIncident(id);
};

const reassignIncident = (id, toUser, byUser) => {
  updateIncident(id, { assigned_to: toUser });
  addAudit(id, "REASSIGN", byUser, null, toUser);
  return getIncident(id);
};

// ── Audit ──
const addAudit = (incId, action, byUser, fromVal, toVal) => {
  const id = "A-" + uuid().slice(0, 8);
  getDb().prepare("INSERT INTO audit_log VALUES (?,?,?,?,?,?,?)").run(
    id, incId, action, byUser || "system", fromVal, toVal, new Date().toISOString()
  );
};

const getAuditForIncident = (incId) => getDb().prepare(
  "SELECT * FROM audit_log WHERE inc_id = ? ORDER BY at ASC"
).all(incId);

// ── Telegram subscriptions ──
const subscribe = (tgId, eventType, deptFilter) => {
  getDb().prepare("INSERT OR REPLACE INTO telegram_subscriptions VALUES (?,?,?)").run(String(tgId), eventType, deptFilter);
};
const unsubscribe = (tgId, eventType) => {
  getDb().prepare("DELETE FROM telegram_subscriptions WHERE telegram_id = ? AND event_type = ?").run(String(tgId), eventType);
};
const getSubscribers = (eventType, dept) => {
  return getDb().prepare(
    "SELECT telegram_id FROM telegram_subscriptions WHERE event_type = ? AND (dept_filter IS NULL OR dept_filter = ?)"
  ).all(eventType, dept).map(r => r.telegram_id);
};

// ── Stats ──
const getStats = () => {
  const d = getDb();
  const today = new Date().toISOString().slice(0, 10);
  return {
    total: d.prepare("SELECT COUNT(*) as c FROM incidents").get().c,
    active: d.prepare("SELECT COUNT(*) as c FROM incidents WHERE status NOT IN ('closed','canceled')").get().c,
    closedToday: d.prepare("SELECT COUNT(*) as c FROM incidents WHERE status = 'closed' AND closed_at LIKE ?").get(today + "%").c,
    newToday: d.prepare("SELECT COUNT(*) as c FROM incidents WHERE created_at LIKE ?").get(today + "%").c,
    stopped: d.prepare("SELECT COUNT(*) as c FROM incidents WHERE is_stopped = 1 AND status NOT IN ('closed','canceled')").get().c,
    byDept: d.prepare(`
      SELECT m.dept, COUNT(*) as c FROM incidents i
      JOIN machines m ON i.machine_id = m.id
      WHERE i.status NOT IN ('closed','canceled') GROUP BY m.dept
    `).all(),
    byUrgency: d.prepare(`
      SELECT urgency, COUNT(*) as c FROM incidents
      WHERE status NOT IN ('closed','canceled') GROUP BY urgency
    `).all(),
  };
};

module.exports = {
  getDb, getAllMachines, getMachine, getMachinesByDept, updateMachineRate,
  getAllUsers, getUserByTelegram, linkTelegram, getUsersByRole, authenticateUser,
  createIncident, getIncident, getActiveIncidents, getClosedIncidents, getAllIncidents,
  updateIncident, ackIncident, startWork, setWaiting, resumeWork,
  resolveIncident, closeIncident, reopenIncident, cancelIncident, setPriority, reassignIncident,
  addAudit, getAuditForIncident,
  subscribe, unsubscribe, getSubscribers, getStats,
};
