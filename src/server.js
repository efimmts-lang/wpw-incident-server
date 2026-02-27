// ═══════════════════════════════════════════════════════
// WPW Server — Express API
// ═══════════════════════════════════════════════════════
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./database");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

// ── Event emitter for bot notifications ──
const EventEmitter = require("events");
const bus = new EventEmitter();
app.locals.bus = bus;

// ══════════════════════════════════════════════════════
// AUTH middleware
// ══════════════════════════════════════════════════════
const PERMS = {
  operator:    { create:1,ack:0,treat:0,resolve:0,close:0,reopen:0,priority:0,route:0,cancel:0,dashboard:0,reports:0,viewAll:0 },
  maintenance: { create:0,ack:1,treat:1,resolve:1,close:0,reopen:0,priority:0,route:0,cancel:0,dashboard:0,reports:0,viewAll:0 },
  director:    { create:0,ack:1,treat:0,resolve:0,close:1,reopen:1,priority:1,route:1,cancel:1,dashboard:1,reports:1,viewAll:1 },
  owner:       { create:0,ack:0,treat:0,resolve:0,close:1,reopen:1,priority:1,route:1,cancel:1,dashboard:1,reports:1,viewAll:1 },
  admin:       { create:1,ack:1,treat:1,resolve:1,close:1,reopen:1,priority:1,route:1,cancel:1,dashboard:1,reports:1,viewAll:1 },
};

function authMiddleware(req, res, next) {
  const pin = req.headers["x-pin"];
  const role = req.headers["x-role"];
  const name = req.headers["x-user"];
  if (!role || !PERMS[role]) return res.status(401).json({ error: "Missing role" });
  // Simple PIN auth (production: use JWT)
  req.role = role;
  req.userName = name || role;
  req.perm = PERMS[role];
  next();
}

// ══════════════════════════════════════════════════════
// API ROUTES
// ══════════════════════════════════════════════════════

// ── Health ──
app.get("/api/health", (req, res) => {
  res.json({ ok: true, version: "2.0.0", machines: db.getAllMachines().length });
});

// ── Auth ──
app.post("/api/login", (req, res) => {
  const { name, pin } = req.body;
  const user = db.authenticateUser(name, pin);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  res.json({ user: { id: user.id, name: user.name, role: user.role, lang: user.lang } });
});

// ── Machines ──
app.get("/api/machines", (req, res) => {
  const { dept } = req.query;
  res.json(dept ? db.getMachinesByDept(dept) : db.getAllMachines());
});

app.put("/api/machines/:id/rate", authMiddleware, (req, res) => {
  if (!req.perm.dashboard) return res.status(403).json({ error: "Forbidden" });
  db.updateMachineRate(req.params.id, req.body.rate);
  res.json({ ok: true });
});

// ── Users ──
app.get("/api/users", authMiddleware, (req, res) => {
  const users = db.getAllUsers().map(u => ({ id: u.id, name: u.name, role: u.role, lang: u.lang }));
  res.json(users);
});

app.get("/api/technicians", (req, res) => {
  const techs = db.getUsersByRole("maintenance").map(u => u.name);
  res.json(techs);
});

// ── Incidents ──
app.get("/api/incidents", authMiddleware, (req, res) => {
  const { status, machine, dept } = req.query;
  let incs = status === "closed" ? db.getClosedIncidents() : 
             status === "active" ? db.getActiveIncidents() : 
             db.getAllIncidents();
  if (machine) incs = incs.filter(i => i.machine_id === machine);
  if (dept) {
    const machines = db.getMachinesByDept(dept).map(m => m.id);
    incs = incs.filter(i => machines.includes(i.machine_id));
  }
  res.json(incs);
});

app.get("/api/incidents/:id", authMiddleware, (req, res) => {
  const inc = db.getIncident(req.params.id);
  if (!inc) return res.status(404).json({ error: "Not found" });
  res.json(inc);
});

app.post("/api/incidents", authMiddleware, (req, res) => {
  if (!req.perm.create) return res.status(403).json({ error: "Forbidden" });
  const inc = db.createIncident({ ...req.body, openedBy: req.userName });
  // Notify
  const machine = db.getMachine(inc.machine_id);
  bus.emit("incident:new", { incident: inc, machine });
  res.status(201).json(inc);
});

// ── Workflow actions ──
app.post("/api/incidents/:id/ack", authMiddleware, (req, res) => {
  if (!req.perm.ack) return res.status(403).json({ error: "Forbidden" });
  const inc = db.ackIncident(req.params.id, req.userName);
  bus.emit("incident:ack", { incident: inc, by: req.userName });
  res.json(inc);
});

app.post("/api/incidents/:id/start", authMiddleware, (req, res) => {
  if (!req.perm.treat) return res.status(403).json({ error: "Forbidden" });
  const inc = db.startWork(req.params.id, req.userName);
  bus.emit("incident:start", { incident: inc, by: req.userName });
  res.json(inc);
});

app.post("/api/incidents/:id/wait", authMiddleware, (req, res) => {
  if (!req.perm.treat) return res.status(403).json({ error: "Forbidden" });
  const inc = db.setWaiting(req.params.id, req.body.reason, req.userName);
  res.json(inc);
});

app.post("/api/incidents/:id/resume", authMiddleware, (req, res) => {
  if (!req.perm.treat) return res.status(403).json({ error: "Forbidden" });
  const inc = db.resumeWork(req.params.id, req.userName);
  res.json(inc);
});

app.post("/api/incidents/:id/resolve", authMiddleware, (req, res) => {
  if (!req.perm.resolve) return res.status(403).json({ error: "Forbidden" });
  const inc = db.resolveIncident(req.params.id, req.body, req.userName);
  bus.emit("incident:resolve", { incident: inc, by: req.userName });
  res.json(inc);
});

app.post("/api/incidents/:id/close", authMiddleware, (req, res) => {
  if (!req.perm.close) return res.status(403).json({ error: "Forbidden" });
  const inc = db.closeIncident(req.params.id, req.userName);
  bus.emit("incident:close", { incident: inc, by: req.userName });
  res.json(inc);
});

app.post("/api/incidents/:id/reopen", authMiddleware, (req, res) => {
  if (!req.perm.reopen) return res.status(403).json({ error: "Forbidden" });
  const inc = db.reopenIncident(req.params.id, req.userName);
  bus.emit("incident:reopen", { incident: inc, by: req.userName });
  res.json(inc);
});

app.post("/api/incidents/:id/cancel", authMiddleware, (req, res) => {
  if (!req.perm.cancel) return res.status(403).json({ error: "Forbidden" });
  const inc = db.cancelIncident(req.params.id, req.userName);
  res.json(inc);
});

app.post("/api/incidents/:id/priority", authMiddleware, (req, res) => {
  if (!req.perm.priority) return res.status(403).json({ error: "Forbidden" });
  const inc = db.setPriority(req.params.id, req.body.urgency, req.userName);
  bus.emit("incident:priority", { incident: inc, by: req.userName, urgency: req.body.urgency });
  res.json(inc);
});

app.post("/api/incidents/:id/reassign", authMiddleware, (req, res) => {
  if (!req.perm.route) return res.status(403).json({ error: "Forbidden" });
  const inc = db.reassignIncident(req.params.id, req.body.to, req.userName);
  bus.emit("incident:reassign", { incident: inc, to: req.body.to });
  res.json(inc);
});

// ── Audit ──
app.get("/api/incidents/:id/audit", authMiddleware, (req, res) => {
  res.json(db.getAuditForIncident(req.params.id));
});

// ── Stats / Dashboard ──
app.get("/api/stats", authMiddleware, (req, res) => {
  if (!req.perm.dashboard) return res.status(403).json({ error: "Forbidden" });
  res.json(db.getStats());
});

// ── Excel Export ──
app.get("/api/export/excel", authMiddleware, (req, res) => {
  if (!req.perm.reports) return res.status(403).json({ error: "Forbidden" });
  const XLSX = require("xlsx");
  const incs = db.getAllIncidents();
  const machines = db.getAllMachines();

  const rows = incs.map((inc, i) => {
    const m = machines.find(x => x.id === inc.machine_id);
    let downMin = null, cost = null;
    if (inc.t0 && inc.t1) {
      downMin = Math.round((new Date(inc.t1) - new Date(inc.t0)) / 60000);
      cost = Math.round((downMin / 60) * (m?.rate || 0));
    }
    return {
      "#": i + 1, "ID": inc.id, "Status": inc.status,
      "Machine": m?.name || inc.machine_id, "Code": inc.machine_id,
      "Dept": m?.dept_name || "", "Employee": inc.emp_num || "",
      "Description": inc.description || "",
      "Stopped": inc.is_stopped ? "Yes" : "No",
      "Urgency": inc.urgency, "Created": inc.created_at,
      "ACK By": inc.ack_by || "", "ACK At": inc.ack_at || "",
      "Assigned": inc.assigned_to || "",
      "Resolved At": inc.resolved_at || "",
      "Closed At": inc.closed_at || "",
      "T0": inc.t0 || "", "T1": inc.t1 || "",
      "Downtime (min)": downMin ?? "", "Cost ($)": cost ?? "",
      "Work Done": inc.work_action || "",
      "Root Cause": inc.work_root || "",
      "Parts": inc.work_parts || "",
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Incidents");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=WPW_incidents_${new Date().toISOString().slice(0,10)}.xlsx`);
  res.send(buf);
});

// ══════════════════════════════════════════════════════
// SLA Monitor — runs every 30 seconds
// ══════════════════════════════════════════════════════
const SLA_LIMITS = { critical: 5, high: 10, medium: 30, low: 120 };

setInterval(() => {
  const active = db.getActiveIncidents().filter(i => ["new", "reopened"].includes(i.status));
  for (const inc of active) {
    const limit = SLA_LIMITS[inc.urgency] || 30;
    const elapsed = (Date.now() - new Date(inc.created_at).getTime()) / 60000;
    if (elapsed > limit) {
      bus.emit("sla:breach", { incident: inc, elapsed: Math.round(elapsed), limit });
    }
  }
}, 30000);

// ══════════════════════════════════════════════════════
// START
// ══════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(`
  ═══════════════════════════════════════════
  🏭 WPW Incident Server v2.0
  ═══════════════════════════════════════════
  📡 API:   http://${HOST}:${PORT}/api
  🌐 Web:   http://${HOST}:${PORT}
  📊 DB:    ${process.env.DB_PATH || "./db/wpw.db"}
  ═══════════════════════════════════════════
  `);
});

module.exports = { app, server, bus };
