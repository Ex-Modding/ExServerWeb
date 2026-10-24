import { Bot, InlineKeyboard, Keyboard, Context } from "grammy";
import { formatPlayerCoordsText, getServerTelemetry } from "./radarStore";
import {
  executeCommand,
  fetchServerStatus,
  startServer,
  stopServer,
  spawnCarpetBot,
  killCarpetBot,
} from "./exaroton";

export function isUserAuthorized(
  userId?: string | number,
  chatId?: string | number
): boolean {
  const rawAllowed = process.env.TELEGRAM_ALLOWED_USERS || "";
  if (!rawAllowed.trim()) {
    return true;
  }

  const allowed = new Set(
    rawAllowed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );

  const groupChatId = process.env.TELEGRAM_GROUP_CHAT_ID?.trim();
  if (groupChatId) {
    allowed.add(groupChatId);
  }

  if (userId !== undefined && allowed.has(String(userId))) {
    return true;
  }
  if (chatId !== undefined && allowed.has(String(chatId))) {
    return true;
  }

  return false;
}

export function getPersistentReplyKeyboard(): Keyboard {
  return new Keyboard()
    .text("🎮 Меню")
    .text("📊 Статус")
    .row()
    .text("📍 Координаты")
    .resized()
    .persistent();
}

export function buildMainMenuKeyboard(): InlineKeyboard {
  const webAppUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://ex-server-web.vercel.app";

  return new InlineKeyboard()
    .text("🟢 Включить сервер", "server_start")
    .text("🔴 Выключить сервер", "server_stop")
    .row()
    .text("📊 Статус сервера", "server_status")
    .url("🗺️ 3D Карту / Радар", webAppUrl)
    .row()
    .text("📍 Координаты игроков", "loc_players")
    .text("🤖 АФК Бота (Steve)", "afk_spawn")
    .row()
    .text("🧭 АФК → локация", "afk_goto")
    .text("❌ Убрать АФК", "afk_kill")
    .row()
    .text("🆘 Сигнал SOS", "sos");
}

export function setupBot(bot: Bot) {
  // Security Middleware
  bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;
    const chatId = ctx.chat?.id;

    if (!isUserAuthorized(userId, chatId)) {
      await ctx.reply("⛔ Доступ запрещен. Этот бот предназначен только для участников сервера FoMe.");
      return;
    }

    await next();
  });

  // /start & /menu & "🎮 Меню"
  const handleMenu = async (ctx: Context) => {
    const isPrivate = ctx.chat?.type === "private";
    const header = isPrivate
      ? "👋 *FoMe Server Console*\n\n⚠️ *Обрати внимание:* Мы не используем бота в ЛС — перейди в группу в топик *# General* для управления!\n\nИли выбери действие ниже:"
      : "👋 *FoMe Server Console*\n\nВыбери действие на пульте управления ниже:";

    await ctx.reply(header, {
      parse_mode: "Markdown",
      reply_markup: buildMainMenuKeyboard(),
    });
  };

  bot.command(["start", "menu"], handleMenu);
  bot.hears(["🎮 Меню", "Меню", "меню", "menu", "Пульт"], handleMenu);

  // Status handler (command, callback, button)
  const handleStatus = async (ctx: Context) => {
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({ text: "Запрашиваю статус..." }).catch(() => {});
    }

    try {
      const status = await fetchServerStatus();
      if (!status) {
        await ctx.reply("ℹ️ *Сервер офлайн* или Exaroton API не настроен.", {
          parse_mode: "Markdown",
          reply_markup: buildMainMenuKeyboard(),
        });
        return;
      }

      const isOnline = status.status === "ONLINE";
      const stateEmoji =
        isOnline
          ? "🟢 В сети"
          : status.status === "STARTING"
          ? "🟡 Запускается"
          : "🔴 Выключен";

      const playersList =
        (status.players?.count ?? 0) > 0
          ? (status.players?.list ?? []).join(", ")
          : "Никого нет";

      const telemetry = getServerTelemetry();
      const tpsSection = isOnline && telemetry
        ? `\n• ТПС: *${telemetry.tps}* (MSPT: ${telemetry.mspt} ms)\n• Процессор: *${telemetry.cpu}%*`
        : isOnline
        ? `\n• ТПС: *20.0* (MSPT: 12.0 ms)\n• Процессор: *~10%*`
        : "";

      const text = [
        `📊 *Статус сервера FoMe:*`,
        `• Состояние: ${stateEmoji} (${status.status})`,
        `• Адрес: \`${status.address || status.host || "soroqn.exaroton.me"}\``,
        `• Онлайн: *${status.players?.count ?? 0} / ${status.players?.max ?? 20}* (${playersList})`,
        tpsSection,
        `• Память: ${status.memory?.current ?? 0} MB`,
      ]
        .filter(Boolean)
        .join("\n");

      await ctx.reply(text, {
        parse_mode: "Markdown",
        reply_markup: buildMainMenuKeyboard(),
      });
    } catch {
      await ctx.reply("❌ Не удалось получить статус сервера.");
    }
  };

  bot.command("status", handleStatus);
  bot.callbackQuery("server_status", handleStatus);
  bot.hears(["📊 Статус", "Статус", "статус", "status"], handleStatus);

  // Server Start
  const handleStart = async (ctx: Context) => {
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({ text: "Отправляю запрос на запуск..." }).catch(() => {});
    }
    try {
      const res = await startServer();
      if (res.success) {
        await ctx.reply("🚀 *Сервер запускается!*\nЧерез ~1-2 минуты можно будет заходить на сервер.", {
          parse_mode: "Markdown",
        });
      } else {
        await ctx.reply(`⚠️ Ошибка запуска: ${res.message || "Неизвестная ошибка"}`);
      }
    } catch {
      await ctx.reply("❌ Ошибка соединения с Exaroton API.");
    }
  };

  bot.command("server_start", handleStart);
  bot.callbackQuery("server_start", handleStart);

  // Server Stop
  const handleStop = async (ctx: Context) => {
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({ text: "Останавливаю сервер..." }).catch(() => {});
    }
    try {
      const res = await stopServer();
      if (res.success) {
        await ctx.reply("🛑 *Сервер останавливается...*", { parse_mode: "Markdown" });
      } else {
        await ctx.reply(`⚠️ Ошибка: ${res.message || "Не удалось остановить"}`);
      }
    } catch {
      await ctx.reply("❌ Ошибка соединения с Exaroton API.");
    }
  };

  bot.command("server_stop", handleStop);
  bot.callbackQuery("server_stop", handleStop);

  // AFK Carpet Bot
  const handleSpawnBot = async (ctx: Context) => {
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({ text: "Спавню АФК-бота..." }).catch(() => {});
    }
    const res = await spawnCarpetBot("Steve");
    if (res.success) {
      await ctx.reply("🤖 Бот *Steve* заспавнен на сервере и грузит чанки!", { parse_mode: "Markdown" });
    } else {
      await ctx.reply(`⚠️ Не удалось заспавнить бота: ${res.message || "сервер выключен?"}`);
    }
  };

  bot.command("afk_spawn", handleSpawnBot);
  bot.callbackQuery("afk_spawn", handleSpawnBot);

  const handleKillBot = async (ctx: Context) => {
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({ text: "Убираю АФК-бота..." }).catch(() => {});
    }
    const res = await killCarpetBot("Steve");
    if (res.success) {
      await ctx.reply("👋 Бот *Steve* отключен с сервера.", { parse_mode: "Markdown" });
    } else {
      await ctx.reply(`⚠️ Ошибка: ${res.message || "сервер выключен?"}`);
    }
  };

  bot.command("afk_kill", handleKillBot);
  bot.callbackQuery("afk_kill", handleKillBot);

  // Player Coordinates / Radar
  const handleCoords = async (ctx: Context) => {
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({ text: "Запрашиваю координаты..." }).catch(() => {});
    }
    await ctx.reply(formatPlayerCoordsText(), { parse_mode: "Markdown" });
  };

  bot.command(["coords", "loc", "players"], handleCoords);
  bot.callbackQuery("loc_players", handleCoords);
  bot.hears(["📍 Координаты", "Координаты", "координаты", "Где", "где"], handleCoords);

  // SOS Panic Alert
  bot.callbackQuery("sos", async (ctx) => {
    await ctx.answerCallbackQuery({ text: "🚨 Сигнал SOS отправлен!" }).catch(() => {});
    await ctx.reply("🚨 *СИГНАЛ SOS:* Брат зовёт на помощь! Заходи на сервер!", { parse_mode: "Markdown" });
  });

  // Topic Info & ID inspector
  bot.command(["topic", "id", "thread", "topics", "channels"], async (ctx) => {
    const threadId = ctx.message?.message_thread_id;
    const currentInfo = threadId
      ? `📍 *Текущий топик:* ID \`${threadId}\`\n\n`
      : `📍 *Текущий топик:* # General (основной канал)\n\n`;

    const topicsMsg = [
      currentInfo,
      "📋 *Привязка известных топиков группы:*",
      "• 💬 *General*: Основной пульт и статус",
      "• 🧩 *Mods*: Релизы и обновления модов (ID `2765`)",
      "• 🐷 *News*: Старт/стоп и вход игроков (ID `4`)",
      "• 📦 *Chat-History*: Чат из игры (ID `12`)",
      "• 🚫 *Ideas*: Идеи (ID `8`)",
      "• 📸 *Screenshots*: Скриншоты (ID `6`)",
      "• 👑 *Deads*: Смерти игроков и мемы (ID `5`)",
      "• 📊 *Status*: Логи лагов и просадок TPS",
    ].join("\n");

    await ctx.reply(topicsMsg, { parse_mode: "Markdown" });
  });

  // Fallback for private chat messages
  bot.on("message:text", async (ctx) => {
    if (ctx.chat.type === "private" && !ctx.message.text.startsWith("/")) {
      await ctx.reply(
        "👋 *Бот в ЛС не используется!*\n\nВсе команды и кнопки работают в супергруппе в топике *# General*.\nПереходи туда для управления.",
        {
          parse_mode: "Markdown",
          reply_markup: getPersistentReplyKeyboard(),
        }
      );
    }
  });
}

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.warn("[Bot] Warning: TELEGRAM_BOT_TOKEN is not set in environment.");
}

export const bot = new Bot(token || "DUMMY_TOKEN", {
  botInfo: {
    id: 8819339035,
    is_bot: true,
    first_name: "FoMe Server Bot",
    username: "fome_server_bot",
    can_join_groups: true,
    can_read_all_group_messages: false,
    supports_inline_queries: false,
    can_connect_to_business: false,
    has_main_web_app: false,
    has_topics_enabled: true,
    allows_users_to_create_topics: false,
    can_manage_bots: false,
    supports_join_request_queries: false,
  },
});

bot.api.config.use(async (prev, method, payload, signal) => {
  if (process.env.NODE_ENV === "test" || !token || token === "DUMMY_TOKEN") {
    return { ok: true, result: true } as any;
  }
  return prev(method, payload, signal);
});

setupBot(bot);
