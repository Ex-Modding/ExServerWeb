import { Bot, InlineKeyboard, Context } from "grammy";
import { formatPlayerCoordsText } from "./radarStore";
import {
  fetchServerStatus,
  startServer,
  stopServer,
  spawnCarpetBot,
  killCarpetBot,
  executeCommand,
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
    .text("🎮 Начать прятки (/games)", "games_start")
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

  // /start & /menu
  bot.command(["start", "menu"], async (ctx: Context) => {
    await ctx.reply(
      "👋 *FoMe Server Console*\n\nВыбери действие на пульте управления ниже:",
      {
        parse_mode: "Markdown",
        reply_markup: buildMainMenuKeyboard(),
      }
    );
  });

  // Status handler (command & callback)
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

      const stateEmoji =
        status.status === "ONLINE"
          ? "🟢 В сети"
          : status.status === "STARTING"
          ? "🟡 Запускается"
          : "🔴 Выключен";

      const playersList =
        (status.players?.count ?? 0) > 0
          ? (status.players?.list ?? []).join(", ")
          : "Никого нет";

      const text = [
        `📊 *Статус сервера FoMe:*`,
        `• Состояние: ${stateEmoji} (${status.status})`,
        `• Адрес: \`${status.address || status.host || "fome.exaroton.me"}\``,
        `• Онлайн: *${status.players?.count ?? 0} / ${status.players?.max ?? 20}* (${playersList})`,
        `• Память: ${status.memory?.current ?? 0} MB`,
      ].join("\n");

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

  // Games Trigger
  const handleGames = async (ctx: Context) => {
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({ text: "Запуск пряток..." }).catch(() => {});
    }
    const res = await executeCommand("games");
    if (res.success) {
      await ctx.reply("🎮 Команда пряток `/games` отправлена на сервер!", { parse_mode: "Markdown" });
    } else {
      await ctx.reply("⚠️ Не удалось отправить команду (сервер в сети?).");
    }
  };

  bot.command("games_start", handleGames);
  bot.callbackQuery("games_start", handleGames);

  // Player Coordinates / Radar
  const handleCoords = async (ctx: Context) => {
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({ text: "Запрашиваю координаты..." }).catch(() => {});
    }
    await ctx.reply(formatPlayerCoordsText(), { parse_mode: "Markdown" });
  };

  bot.command(["coords", "loc", "players"], handleCoords);
  bot.callbackQuery("loc_players", handleCoords);

  // SOS Panic Alert
  bot.callbackQuery("sos", async (ctx) => {
    await ctx.answerCallbackQuery({ text: "🚨 Сигнал SOS отправлен!" }).catch(() => {});
    await ctx.reply("🚨 *СИГНАЛ SOS:* Брат зовёт на помощь! Проверь сервер!", { parse_mode: "Markdown" });
  });

  // Topics Info
  bot.command(["topics", "channels"], async (ctx) => {
    const topicsMsg = [
      "📋 *Привязка топиков супергруппы FoMe:*",
      "",
      "• 💬 *General*: Topic ID `1`",
      "• 🐷 *News*: Topic ID `4`",
      "• 📦 *Chat-History*: Topic ID `12`",
      "• 🚫 *Ideas*: Topic ID `8`",
      "• 📸 *Screenshots*: Topic ID `6`",
      "• 👑 *Deads*: Topic ID `5`",
      "",
      `ID группы: \`${process.env.TELEGRAM_GROUP_CHAT_ID || "-1004436845383"}\``,
    ].join("\n");

    await ctx.reply(topicsMsg, { parse_mode: "Markdown" });
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
