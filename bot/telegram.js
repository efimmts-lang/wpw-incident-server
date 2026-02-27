// ═══════════════════════════════════════════════════════
// WPW Telegram Bot — Full Factory Integration
// ═══════════════════════════════════════════════════════
require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const db = require("../src/database");

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN || TOKEN === "YOUR_BOT_TOKEN_HERE") {
  console.error("❌ Set TELEGRAM_BOT_TOKEN in .env file! Get it from @BotFather on Telegram.");
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });
const ADMIN_CHAT = process.env.ADMIN_CHAT_ID;
const NOTIFY_GROUP = process.env.NOTIFY_GROUP_ID;

// ── i18n ──
const T = {
  he: {
    welcome: "🏭 *WPW — מערכת ניהול תקלות*\n\nברוך הבא! בחר פעולה:",
    linked: "✅ חשבון מקושר! שלום {name} ({role})",
    notLinked: "❌ צריך להתחבר קודם. שלח:\n`/login שם PIN`\nדוגמה: `/login אלי 2222`",
    loginFail: "❌ שם או PIN שגויים",
    loginOk: "✅ התחברת בהצלחה!\nשלום *{name}* — {role}",
    newInc: "🔴 *תקלה חדשה!*\n\n🏭 מכונה: *{machine}* ({dept})\n👤 עובד: {emp}\n📝 {desc}\n⚡ עדיפות: *{urg}*\n{stopped}\n\n🆔 `{id}`",
    stopped: "⛔ *מכונה מושבתת!*",
    notStopped: "✅ מכונה עובדת",
    ackDone: "👋 ACK בוצע ע״י *{by}*\n🆔 `{id}`",
    startDone: "🔧 טיפול התחיל ע״י *{by}*\n🆔 `{id}`",
    resolved: "✅ טופל ע״י *{by}*\n🆔 `{id}`",
    closed: "🔒 נסגר ע״י *{by}*\n🆔 `{id}`",
    reopened: "🔄 נפתח מחדש!\n🆔 `{id}`",
    slaBreach: "🚨 *SLA חריגה!*\n\n🆔 `{id}`\n🏭 {machine}\n⏱️ {elapsed} דק׳ (מקסימום {limit})\n\n⚠️ נדרש ACK מיידי!",
    status: "📊 *סטטוס מערכת*\n\n📋 סה״כ: {total}\n🔴 פתוחים: {active}\n✅ נסגרו היום: {closedToday}\n🆕 חדשים היום: {newToday}\n⛔ מכונות עצורות: {stopped}",
    noPerms: "🚫 אין הרשאה לפעולה זו",
    selectDept: "🏭 בחר מחלקה:",
    selectMachine: "⚙️ בחר מכונה מ{dept}:",
    enterDesc: "📝 כתוב תיאור התקלה (מינ׳ 5 תווים):",
    machineStatus: "⚠️ האם המכונה מושבתת?",
    enterEmpNum: "👤 הזן מספר עובד:",
    incCreated: "✅ *תקלה נפתחה!*\n🆔 `{id}`\n🏭 {machine}\n⚡ {urg}",
    incDetail: "📋 *{id}*\n\n🏭 {machine} ({dept})\n📊 סטטוס: *{status}*\n⚡ עדיפות: {urg}\n👤 פתח: {opened}\n🔧 מטפל: {assigned}\n📝 {desc}\n⏱️ נפתח: {created}",
    help: "📖 *פקודות זמינות:*\n\n/start — תפריט ראשי\n/login שם PIN — התחברות\n/new — פתיחת תקלה חדשה\n/status — סטטוס מערכת\n/active — תקלות פתוחות\n/inc ID — פרטי תקלה\n/ack ID — ACK לתקלה\n/mystatus — מי אני\n/lang — שנה שפה\n/help — עזרה",
    deptNames: { T: "חריטה", M: "כרסום", B: "הלחמה", S: "השחזה" },
    urgNames: { critical: "🔴 קריטי", high: "🟠 גבוה", medium: "🟡 בינוני", low: "🟢 נמוך" },
    statusNames: { new: "🔴 חדש", ack: "👋 ACK", in_progress: "🔧 בטיפול", waiting: "⏸️ ממתין", resolved: "✅ טופל", closed: "🔒 סגור", reopened: "🔄 נפתח מחדש", canceled: "❌ בוטל" },
    roleNames: { operator: "מפעיל", maintenance: "אחזקה", director: "מנהל", owner: "בעלים", admin: "מנהל מערכת" },
  },
  en: {
    welcome: "🏭 *WPW — Incident Management*\n\nWelcome! Choose an action:",
    linked: "✅ Account linked! Hello {name} ({role})",
    notLinked: "❌ Login first. Send:\n`/login name PIN`\nExample: `/login Efim 0000`",
    loginFail: "❌ Wrong name or PIN",
    loginOk: "✅ Logged in!\nHello *{name}* — {role}",
    newInc: "🔴 *New Incident!*\n\n🏭 Machine: *{machine}* ({dept})\n👤 Employee: {emp}\n📝 {desc}\n⚡ Priority: *{urg}*\n{stopped}\n\n🆔 `{id}`",
    stopped: "⛔ *Machine STOPPED!*",
    notStopped: "✅ Machine running",
    ackDone: "👋 ACK by *{by}*\n🆔 `{id}`",
    startDone: "🔧 Work started by *{by}*\n🆔 `{id}`",
    resolved: "✅ Resolved by *{by}*\n🆔 `{id}`",
    closed: "🔒 Closed by *{by}*\n🆔 `{id}`",
    reopened: "🔄 Reopened!\n🆔 `{id}`",
    slaBreach: "🚨 *SLA BREACH!*\n\n🆔 `{id}`\n🏭 {machine}\n⏱️ {elapsed} min (limit {limit})\n\n⚠️ Immediate ACK required!",
    status: "📊 *System Status*\n\n📋 Total: {total}\n🔴 Active: {active}\n✅ Closed today: {closedToday}\n🆕 New today: {newToday}\n⛔ Stopped machines: {stopped}",
    noPerms: "🚫 No permission for this action",
    selectDept: "🏭 Select department:",
    selectMachine: "⚙️ Select machine from {dept}:",
    enterDesc: "📝 Describe the issue (min 5 chars):",
    machineStatus: "⚠️ Is the machine stopped?",
    enterEmpNum: "👤 Enter employee number:",
    incCreated: "✅ *Incident created!*\n🆔 `{id}`\n🏭 {machine}\n⚡ {urg}",
    incDetail: "📋 *{id}*\n\n🏭 {machine} ({dept})\n📊 Status: *{status}*\n⚡ Priority: {urg}\n👤 Opened: {opened}\n🔧 Assigned: {assigned}\n📝 {desc}\n⏱️ Created: {created}",
    help: "📖 *Available commands:*\n\n/start — Main menu\n/login name PIN — Login\n/new — Report new incident\n/status — System status\n/active — Active incidents\n/inc ID — Incident details\n/ack ID — ACK incident\n/mystatus — Who am I\n/lang — Change language\n/help — Help",
    deptNames: { T: "Turning", M: "Milling", B: "Brazing", S: "Grinding" },
    urgNames: { critical: "🔴 Critical", high: "🟠 High", medium: "🟡 Medium", low: "🟢 Low" },
    statusNames: { new: "🔴 New", ack: "👋 ACK", in_progress: "🔧 In Progress", waiting: "⏸️ Waiting", resolved: "✅ Resolved", closed: "🔒 Closed", reopened: "🔄 Reopened", canceled: "❌ Canceled" },
    roleNames: { operator: "Operator", maintenance: "Maintenance", director: "Director", owner: "Owner", admin: "System Admin" },
  },
  ru: {
    welcome: "🏭 *WPW — Управление инцидентами*\n\nДобро пожаловать! Выберите действие:",
    linked: "✅ Аккаунт привязан! Привет {name} ({role})",
    notLinked: "❌ Сначала войдите. Отправьте:\n`/login имя PIN`\nПример: `/login Efim 0000`",
    loginFail: "❌ Неверное имя или PIN",
    loginOk: "✅ Вход выполнен!\nПривет *{name}* — {role}",
    newInc: "🔴 *Новый инцидент!*\n\n🏭 Станок: *{machine}* ({dept})\n👤 Работник: {emp}\n📝 {desc}\n⚡ Приоритет: *{urg}*\n{stopped}\n\n🆔 `{id}`",
    stopped: "⛔ *Станок ОСТАНОВЛЕН!*",
    notStopped: "✅ Станок работает",
    ackDone: "👋 ACK от *{by}*\n🆔 `{id}`",
    startDone: "🔧 Работа начата *{by}*\n🆔 `{id}`",
    resolved: "✅ Решено *{by}*\n🆔 `{id}`",
    closed: "🔒 Закрыто *{by}*\n🆔 `{id}`",
    reopened: "🔄 Переоткрыто!\n🆔 `{id}`",
    slaBreach: "🚨 *SLA НАРУШЕН!*\n\n🆔 `{id}`\n🏭 {machine}\n⏱️ {elapsed} мин (лимит {limit})\n\n⚠️ Требуется срочный ACK!",
    status: "📊 *Статус системы*\n\n📋 Всего: {total}\n🔴 Активные: {active}\n✅ Закрыто сегодня: {closedToday}\n🆕 Новые сегодня: {newToday}\n⛔ Станки стоят: {stopped}",
    noPerms: "🚫 Нет прав для этого действия",
    selectDept: "🏭 Выберите отдел:",
    selectMachine: "⚙️ Выберите станок из {dept}:",
    enterDesc: "📝 Опишите проблему (мин. 5 символов):",
    machineStatus: "⚠️ Станок остановлен?",
    enterEmpNum: "👤 Введите номер работника:",
    incCreated: "✅ *Инцидент создан!*\n🆔 `{id}`\n🏭 {machine}\n⚡ {urg}",
    incDetail: "📋 *{id}*\n\n🏭 {machine} ({dept})\n📊 Статус: *{status}*\n⚡ Приоритет: {urg}\n👤 Открыл: {opened}\n🔧 Назначен: {assigned}\n📝 {desc}\n⏱️ Создан: {created}",
    help: "📖 *Доступные команды:*\n\n/start — Главное меню\n/login имя PIN — Вход\n/new — Новый инцидент\n/status — Статус системы\n/active — Активные инциденты\n/inc ID — Детали инцидента\n/ack ID — ACK инцидент\n/mystatus — Кто я\n/lang — Сменить язык\n/help — Помощь",
    deptNames: { T: "Токарка", M: "Фрезерка", B: "Пайка", S: "Шлифовка" },
    urgNames: { critical: "🔴 Критический", high: "🟠 Высокий", medium: "🟡 Средний", low: "🟢 Низкий" },
    statusNames: { new: "🔴 Новый", ack: "👋 ACK", in_progress: "🔧 В работе", waiting: "⏸️ Ожидание", resolved: "✅ Решён", closed: "🔒 Закрыт", reopened: "🔄 Переоткрыт", canceled: "❌ Отменён" },
    roleNames: { operator: "Оператор", maintenance: "Обслуживание", director: "Менеджер", owner: "Владелец", admin: "Администратор" },
  },
};

// ── User state (in-memory for conversation flow) ──
const userState = {}; // chatId -> { step, data, lang }
const userLangs = {}; // chatId -> "he"|"en"|"ru"

function getLang(chatId) {
  if (userLangs[chatId]) return userLangs[chatId];
  const u = db.getUserByTelegram(String(chatId));
  if (u?.lang) { userLangs[chatId] = u.lang; return u.lang; }
  return process.env.DEFAULT_LANG || "he";
}
function t(chatId, key) { return T[getLang(chatId)]?.[key] || T.he[key] || key; }
function fmt(chatId, key, vars) {
  let s = t(chatId, key);
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}

// ── Permissions ──
const PERMS = {
  operator:    { create:1,ack:0,treat:0,resolve:0,close:0,dashboard:0 },
  maintenance: { create:0,ack:1,treat:1,resolve:1,close:0,dashboard:0 },
  director:    { create:0,ack:1,treat:0,resolve:0,close:1,dashboard:1 },
  owner:       { create:0,ack:0,treat:0,resolve:0,close:1,dashboard:1 },
  admin:       { create:1,ack:1,treat:1,resolve:1,close:1,dashboard:1 },
};

function getUser(chatId) { return db.getUserByTelegram(String(chatId)); }

// ══════════════════════════════════════════════════════
// COMMANDS
// ══════════════════════════════════════════════════════

// ── /start ──
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const user = getUser(chatId);

  const keyboard = user ? [
    [{ text: "🆕 פתיחת תקלה", callback_data: "new_inc" }, { text: "📊 סטטוס", callback_data: "status" }],
    [{ text: "🔴 תקלות פתוחות", callback_data: "active" }, { text: "🔍 חפש תקלה", callback_data: "search" }],
    [{ text: "🌐 שפה / Language", callback_data: "lang" }, { text: "❓ עזרה", callback_data: "help" }],
  ] : [
    [{ text: "🔐 התחברות", callback_data: "login_help" }],
    [{ text: "🌐 שפה / Language", callback_data: "lang" }],
  ];

  bot.sendMessage(chatId, t(chatId, "welcome"), {
    parse_mode: "Markdown",
    reply_markup: { inline_keyboard: keyboard },
  });
});

// ── /login name PIN ──
bot.onText(/\/login (.+) (\d{4})/, (msg, match) => {
  const chatId = msg.chat.id;
  const name = match[1].trim();
  const pin = match[2];
  const user = db.authenticateUser(name, pin);
  if (!user) return bot.sendMessage(chatId, t(chatId, "loginFail"));

  db.linkTelegram(user.id, chatId);
  const lang = getLang(chatId);
  const roleName = T[lang].roleNames[user.role] || user.role;
  bot.sendMessage(chatId, fmt(chatId, "loginOk", { name: user.name, role: roleName }), { parse_mode: "Markdown" });
});

// ── /lang ──
bot.onText(/\/lang/, (msg) => {
  bot.sendMessage(msg.chat.id, "🌐 Choose language / בחר שפה / Выберите язык:", {
    reply_markup: { inline_keyboard: [
      [{ text: "🇮🇱 עברית", callback_data: "lang_he" }, { text: "🇬🇧 English", callback_data: "lang_en" }, { text: "🇷🇺 Русский", callback_data: "lang_ru" }],
    ]},
  });
});

// ── /status ──
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  const stats = db.getStats();
  bot.sendMessage(chatId, fmt(chatId, "status", {
    total: stats.total, active: stats.active,
    closedToday: stats.closedToday, newToday: stats.newToday,
    stopped: stats.stopped,
  }), { parse_mode: "Markdown" });
});

// ── /active ──
bot.onText(/\/active/, (msg) => {
  const chatId = msg.chat.id;
  const lang = getLang(chatId);
  const active = db.getActiveIncidents().slice(0, 15);
  if (!active.length) return bot.sendMessage(chatId, "📭 " + (lang === "he" ? "אין תקלות פתוחות" : lang === "ru" ? "Нет активных инцидентов" : "No active incidents"));

  const lines = active.map(inc => {
    const m = db.getMachine(inc.machine_id);
    const st = T[lang].statusNames[inc.status] || inc.status;
    const urg = T[lang].urgNames[inc.urgency] || inc.urgency;
    return `${st} | *${m?.name || inc.machine_id}* | ${urg}\n📝 ${(inc.description || "").slice(0, 40)}\n🆔 \`${inc.id}\``;
  });

  bot.sendMessage(chatId, lines.join("\n\n"), { parse_mode: "Markdown" });
});

// ── /inc ID ──
bot.onText(/\/inc (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const lang = getLang(chatId);
  const id = match[1].trim().toUpperCase();
  const inc = db.getIncident(id);
  if (!inc) return bot.sendMessage(chatId, "❌ Not found: " + id);

  const m = db.getMachine(inc.machine_id);
  const dept = T[lang].deptNames[m?.dept] || m?.dept;
  const st = T[lang].statusNames[inc.status] || inc.status;
  const urg = T[lang].urgNames[inc.urgency] || inc.urgency;

  const text = fmt(chatId, "incDetail", {
    id: inc.id, machine: m?.name || inc.machine_id, dept,
    status: st, urg, opened: inc.opened_by || "—",
    assigned: inc.assigned_to || "—", desc: inc.description || "—",
    created: inc.created_at?.slice(0, 16).replace("T", " ") || "—",
  });

  // Action buttons based on status
  const user = getUser(chatId);
  const buttons = [];
  if (user) {
    const p = PERMS[user.role] || {};
    if (["new", "reopened"].includes(inc.status) && p.ack) {
      buttons.push([{ text: "👋 ACK", callback_data: `ack_${inc.id}` }]);
    }
    if (inc.status === "ack" && p.treat) {
      buttons.push([{ text: "🔧 התחל טיפול", callback_data: `start_${inc.id}` }]);
    }
    if (inc.status === "resolved" && p.close) {
      buttons.push([{ text: "🔒 סגור", callback_data: `close_${inc.id}` }]);
    }
  }

  bot.sendMessage(chatId, text, {
    parse_mode: "Markdown",
    reply_markup: buttons.length ? { inline_keyboard: buttons } : undefined,
  });
});

// ── /ack ID ──
bot.onText(/\/ack (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const user = getUser(chatId);
  if (!user || !PERMS[user.role]?.ack) return bot.sendMessage(chatId, t(chatId, "noPerms"));
  const id = match[1].trim().toUpperCase();
  const inc = db.ackIncident(id, user.name);
  if (!inc) return bot.sendMessage(chatId, "❌ Not found");
  bot.sendMessage(chatId, fmt(chatId, "ackDone", { by: user.name, id: inc.id }), { parse_mode: "Markdown" });
});

// ── /new — New incident flow ──
bot.onText(/\/new/, (msg) => {
  const chatId = msg.chat.id;
  const user = getUser(chatId);
  if (!user) return bot.sendMessage(chatId, t(chatId, "notLinked"), { parse_mode: "Markdown" });

  const lang = getLang(chatId);
  userState[chatId] = { step: "dept", data: {} };

  bot.sendMessage(chatId, t(chatId, "selectDept"), {
    reply_markup: { inline_keyboard: [
      [
        { text: `🔵 ${T[lang].deptNames.T}`, callback_data: "dept_T" },
        { text: `🟠 ${T[lang].deptNames.M}`, callback_data: "dept_M" },
      ],
      [
        { text: `🔴 ${T[lang].deptNames.B}`, callback_data: "dept_B" },
        { text: `🟢 ${T[lang].deptNames.S}`, callback_data: "dept_S" },
      ],
    ]},
  });
});

// ── /mystatus ──
bot.onText(/\/mystatus/, (msg) => {
  const chatId = msg.chat.id;
  const user = getUser(chatId);
  if (!user) return bot.sendMessage(chatId, t(chatId, "notLinked"), { parse_mode: "Markdown" });
  const lang = getLang(chatId);
  bot.sendMessage(chatId, fmt(chatId, "linked", { name: user.name, role: T[lang].roleNames[user.role] }));
});

// ── /help ──
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, t(msg.chat.id, "help"), { parse_mode: "Markdown" });
});

// ── /chatid — utility ──
bot.onText(/\/chatid/, (msg) => {
  bot.sendMessage(msg.chat.id, `Chat ID: \`${msg.chat.id}\``, { parse_mode: "Markdown" });
});

// ══════════════════════════════════════════════════════
// CALLBACK QUERIES (inline buttons)
// ══════════════════════════════════════════════════════
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const lang = getLang(chatId);
  bot.answerCallbackQuery(query.id);

  // ── Language ──
  if (data.startsWith("lang_")) {
    const newLang = data.replace("lang_", "");
    userLangs[chatId] = newLang;
    const user = getUser(chatId);
    if (user) {
      db.getDb().prepare("UPDATE users SET lang = ? WHERE id = ?").run(newLang, user.id);
    }
    const names = { he: "🇮🇱 עברית", en: "🇬🇧 English", ru: "🇷🇺 Русский" };
    bot.sendMessage(chatId, `✅ ${names[newLang]}`);
    return;
  }

  // ── Menu buttons ──
  if (data === "new_inc") return bot.emit("text", { chat: { id: chatId }, text: "/new", from: query.from });
  if (data === "status") return bot.emit("text", { chat: { id: chatId }, text: "/status", from: query.from });
  if (data === "active") return bot.emit("text", { chat: { id: chatId }, text: "/active", from: query.from });
  if (data === "help") return bot.emit("text", { chat: { id: chatId }, text: "/help", from: query.from });
  if (data === "lang") return bot.emit("text", { chat: { id: chatId }, text: "/lang", from: query.from });
  if (data === "login_help") {
    return bot.sendMessage(chatId, t(chatId, "notLinked"), { parse_mode: "Markdown" });
  }

  // ── ACK from button ──
  if (data.startsWith("ack_")) {
    const incId = data.replace("ack_", "");
    const user = getUser(chatId);
    if (!user || !PERMS[user.role]?.ack) return bot.sendMessage(chatId, t(chatId, "noPerms"));
    const inc = db.ackIncident(incId, user.name);
    bot.sendMessage(chatId, fmt(chatId, "ackDone", { by: user.name, id: incId }), { parse_mode: "Markdown" });
    notifyAll("incident:ack", inc, user.name);
    return;
  }

  // ── Start work from button ──
  if (data.startsWith("start_")) {
    const incId = data.replace("start_", "");
    const user = getUser(chatId);
    if (!user || !PERMS[user.role]?.treat) return bot.sendMessage(chatId, t(chatId, "noPerms"));
    const inc = db.startWork(incId, user.name);
    bot.sendMessage(chatId, fmt(chatId, "startDone", { by: user.name, id: incId }), { parse_mode: "Markdown" });
    return;
  }

  // ── Close from button ──
  if (data.startsWith("close_")) {
    const incId = data.replace("close_", "");
    const user = getUser(chatId);
    if (!user || !PERMS[user.role]?.close) return bot.sendMessage(chatId, t(chatId, "noPerms"));
    const inc = db.closeIncident(incId, user.name);
    bot.sendMessage(chatId, fmt(chatId, "closed", { by: user.name, id: incId }), { parse_mode: "Markdown" });
    return;
  }

  // ── New incident flow ──
  const state = userState[chatId];
  if (!state) return;

  // Department selected
  if (data.startsWith("dept_")) {
    const dept = data.replace("dept_", "");
    state.data.dept = dept;
    state.step = "machine";
    const machines = db.getMachinesByDept(dept);
    const buttons = [];
    for (let i = 0; i < machines.length; i += 2) {
      const row = [{ text: `${machines[i].id} ${machines[i].name}`, callback_data: `machine_${machines[i].id}` }];
      if (machines[i + 1]) row.push({ text: `${machines[i + 1].id} ${machines[i + 1].name}`, callback_data: `machine_${machines[i + 1].id}` });
      buttons.push(row);
    }
    const deptName = T[lang].deptNames[dept];
    bot.sendMessage(chatId, fmt(chatId, "selectMachine", { dept: deptName }), {
      reply_markup: { inline_keyboard: buttons },
    });
    return;
  }

  // Machine selected
  if (data.startsWith("machine_")) {
    const machineId = data.replace("machine_", "");
    state.data.machineId = machineId;
    state.step = "empNum";
    bot.sendMessage(chatId, t(chatId, "enterEmpNum"));
    return;
  }

  // Machine status
  if (data === "stopped_yes" || data === "stopped_no") {
    state.data.isStopped = data === "stopped_yes";
    state.step = "confirm";

    // Create the incident
    const user = getUser(chatId);
    const inc = db.createIncident({
      machineId: state.data.machineId,
      empNum: state.data.empNum,
      description: state.data.description,
      isStopped: state.data.isStopped,
      openedBy: user?.name || "Telegram",
    });

    const m = db.getMachine(inc.machine_id);
    const urg = T[lang].urgNames[inc.urgency] || inc.urgency;
    bot.sendMessage(chatId, fmt(chatId, "incCreated", { id: inc.id, machine: m?.name, urg }), { parse_mode: "Markdown" });

    // Notify all
    notifyAll("incident:new", inc, user?.name);

    delete userState[chatId];
    return;
  }
});

// ══════════════════════════════════════════════════════
// TEXT MESSAGES (for conversation flow)
// ══════════════════════════════════════════════════════
bot.on("message", (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;
  const chatId = msg.chat.id;
  const state = userState[chatId];
  if (!state) return;

  // Employee number
  if (state.step === "empNum") {
    state.data.empNum = msg.text.trim();
    state.step = "description";
    bot.sendMessage(chatId, t(chatId, "enterDesc"));
    return;
  }

  // Description
  if (state.step === "description") {
    if (msg.text.length < 5) {
      return bot.sendMessage(chatId, "⚠️ " + (getLang(chatId) === "he" ? "מינימום 5 תווים" : getLang(chatId) === "ru" ? "Минимум 5 символов" : "Minimum 5 characters"));
    }
    state.data.description = msg.text;
    state.step = "machineStatus";
    bot.sendMessage(chatId, t(chatId, "machineStatus"), {
      reply_markup: { inline_keyboard: [
        [
          { text: "⛔ " + (getLang(chatId) === "he" ? "כן, מושבתת" : getLang(chatId) === "ru" ? "Да, остановлен" : "Yes, stopped"), callback_data: "stopped_yes" },
          { text: "✅ " + (getLang(chatId) === "he" ? "לא, עובדת" : getLang(chatId) === "ru" ? "Нет, работает" : "No, running"), callback_data: "stopped_no" },
        ],
      ]},
    });
    return;
  }
});

// ══════════════════════════════════════════════════════
// NOTIFICATIONS — Push to subscribed users
// ══════════════════════════════════════════════════════
function notifyAll(event, inc, byUser) {
  const m = db.getMachine(inc.machine_id);

  // Notify group if configured
  if (NOTIFY_GROUP) {
    const gLang = process.env.DEFAULT_LANG || "he";
    let text = "";
    if (event === "incident:new") {
      text = T[gLang].newInc
        .replace("{machine}", m?.name || inc.machine_id)
        .replace("{dept}", T[gLang].deptNames[m?.dept] || "")
        .replace("{emp}", inc.emp_num || "—")
        .replace("{desc}", inc.description || "")
        .replace("{urg}", T[gLang].urgNames[inc.urgency] || inc.urgency)
        .replace("{stopped}", inc.is_stopped ? T[gLang].stopped : T[gLang].notStopped)
        .replace("{id}", inc.id);
    } else if (event === "incident:ack") {
      text = T[gLang].ackDone.replace("{by}", byUser).replace("{id}", inc.id);
    }
    if (text) {
      bot.sendMessage(NOTIFY_GROUP, text, { parse_mode: "Markdown" }).catch(e => console.error("Group notify error:", e.message));
    }
  }

  // Notify all maintenance users for new incidents
  if (event === "incident:new") {
    const techs = db.getUsersByRole("maintenance").filter(u => u.telegram_id);
    for (const tech of techs) {
      const tLang = tech.lang || "he";
      const text = T[tLang].newInc
        .replace("{machine}", m?.name || inc.machine_id)
        .replace("{dept}", T[tLang].deptNames[m?.dept] || "")
        .replace("{emp}", inc.emp_num || "—")
        .replace("{desc}", inc.description || "")
        .replace("{urg}", T[tLang].urgNames[inc.urgency] || inc.urgency)
        .replace("{stopped}", inc.is_stopped ? T[tLang].stopped : T[tLang].notStopped)
        .replace("{id}", inc.id);

      const buttons = [[{ text: "👋 ACK", callback_data: `ack_${inc.id}` }]];
      bot.sendMessage(tech.telegram_id, text, {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: buttons },
      }).catch(e => console.error(`Notify ${tech.name} error:`, e.message));
    }
  }

  // Notify directors/owners for critical/stopped
  if (event === "incident:new" && (inc.is_stopped || inc.urgency === "critical")) {
    const mgrs = [...db.getUsersByRole("director"), ...db.getUsersByRole("owner"), ...db.getUsersByRole("admin")]
      .filter(u => u.telegram_id);
    for (const mgr of mgrs) {
      const mLang = mgr.lang || "he";
      const text = "🚨 " + T[mLang].newInc
        .replace("{machine}", m?.name || inc.machine_id)
        .replace("{dept}", T[mLang].deptNames[m?.dept] || "")
        .replace("{emp}", inc.emp_num || "—")
        .replace("{desc}", inc.description || "")
        .replace("{urg}", T[mLang].urgNames[inc.urgency] || inc.urgency)
        .replace("{stopped}", inc.is_stopped ? T[mLang].stopped : T[mLang].notStopped)
        .replace("{id}", inc.id);
      bot.sendMessage(mgr.telegram_id, text, { parse_mode: "Markdown" }).catch(() => {});
    }
  }
}

// ── SLA Breach notifications ──
const SLA_LIMITS = { critical: 5, high: 10, medium: 30, low: 120 };
const breachNotified = new Set();

setInterval(() => {
  const active = db.getActiveIncidents().filter(i => ["new", "reopened"].includes(i.status));
  for (const inc of active) {
    const limit = SLA_LIMITS[inc.urgency] || 30;
    const elapsed = (Date.now() - new Date(inc.created_at).getTime()) / 60000;
    if (elapsed > limit && !breachNotified.has(inc.id)) {
      breachNotified.add(inc.id);
      const m = db.getMachine(inc.machine_id);

      // Notify all maintenance + managers
      const allUsers = [...db.getUsersByRole("maintenance"), ...db.getUsersByRole("director"),
        ...db.getUsersByRole("owner"), ...db.getUsersByRole("admin")].filter(u => u.telegram_id);
      for (const u of allUsers) {
        const uLang = u.lang || "he";
        const text = T[uLang].slaBreach
          .replace("{id}", inc.id)
          .replace("{machine}", m?.name || inc.machine_id)
          .replace("{elapsed}", Math.round(elapsed))
          .replace("{limit}", limit);
        bot.sendMessage(u.telegram_id, text, {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: [[{ text: "👋 ACK NOW", callback_data: `ack_${inc.id}` }]] },
        }).catch(() => {});
      }

      if (NOTIFY_GROUP) {
        const gLang = process.env.DEFAULT_LANG || "he";
        bot.sendMessage(NOTIFY_GROUP, T[gLang].slaBreach
          .replace("{id}", inc.id).replace("{machine}", m?.name)
          .replace("{elapsed}", Math.round(elapsed)).replace("{limit}", limit),
          { parse_mode: "Markdown" }).catch(() => {});
      }
    }
  }
  // Clear breachNotified for closed incidents
  for (const id of breachNotified) {
    const inc = db.getIncident(id);
    if (!inc || ["closed", "canceled", "ack", "in_progress"].includes(inc.status)) {
      breachNotified.delete(id);
    }
  }
}, 30000);

// ══════════════════════════════════════════════════════
// CONNECT TO SERVER BUS (if running together)
// ══════════════════════════════════════════════════════
function connectToServer() {
  try {
    const { bus } = require("../src/server");
    bus.on("incident:new", ({ incident, machine }) => notifyAll("incident:new", incident));
    bus.on("incident:ack", ({ incident, by }) => notifyAll("incident:ack", incident, by));
    bus.on("sla:breach", ({ incident }) => {
      if (!breachNotified.has(incident.id)) notifyAll("sla:breach", incident);
    });
    console.log("🔗 Connected to server event bus");
  } catch (e) {
    console.log("ℹ️ Running standalone (no server bus)");
  }
}

// ── START ──
console.log(`
═══════════════════════════════════════════
🤖 WPW Telegram Bot Started
═══════════════════════════════════════════
📡 Polling for messages...
🌐 Languages: HE / EN / RU
👥 ${db.getAllUsers().length} users
🏭 ${db.getAllMachines().length} machines
═══════════════════════════════════════════
`);

connectToServer();
module.exports = { bot, notifyAll };
