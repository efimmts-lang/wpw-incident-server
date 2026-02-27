// ═══════════════════════════════════════════════════════
// WPW — Combined Startup (Server + Bot)
// ═══════════════════════════════════════════════════════
require("dotenv").config();

console.log(`
  ██╗    ██╗██████╗ ██╗    ██╗
  ██║    ██║██╔══██╗██║    ██║
  ██║ █╗ ██║██████╔╝██║ █╗ ██║
  ██║███╗██║██╔═══╝ ██║███╗██║
  ╚███╔███╔╝██║     ╚███╔███╔╝
   ╚══╝╚══╝ ╚═╝      ╚══╝╚══╝
  Industrial Incident Management
`);

// 1. Start the API server
const { app, server, bus } = require("./server");

// 2. Start the Telegram bot (if token configured)
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (TOKEN && TOKEN !== "YOUR_BOT_TOKEN_HERE") {
  const { bot, notifyAll } = require("../bot/telegram");

  // Connect server events to bot notifications
  bus.on("incident:new", ({ incident, machine }) => {
    notifyAll("incident:new", incident);
  });
  bus.on("incident:ack", ({ incident, by }) => {
    notifyAll("incident:ack", incident, by);
  });
  bus.on("incident:resolve", ({ incident, by }) => {
    notifyAll("incident:resolve", incident, by);
  });
  bus.on("incident:close", ({ incident, by }) => {
    notifyAll("incident:close", incident, by);
  });
  bus.on("incident:reopen", ({ incident }) => {
    notifyAll("incident:reopen", incident);
  });
  bus.on("sla:breach", ({ incident }) => {
    notifyAll("sla:breach", incident);
  });

  console.log("  🤖 Telegram Bot: CONNECTED");
} else {
  console.log("  🤖 Telegram Bot: DISABLED (no token in .env)");
  console.log("     Get a token from @BotFather and add to .env");
}

console.log("  ═══════════════════════════════════════\n");
