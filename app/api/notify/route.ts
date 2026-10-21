import { NextResponse } from "next/server";
import { bot } from "@/lib/bot";
import { InlineKeyboard } from "grammy";

export const dynamic = "force-dynamic";

interface NotifyPayload {
  event: "server_started" | "server_stopping" | "tps_drop" | string;
  secret?: string;
  message?: string;
  topicId?: number;
  tps?: number;
  mspt?: number;
  players?: number;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as NotifyPayload;
    const headerSecret =
      req.headers.get("x-notify-secret") ||
      req.headers.get("x-telegram-bot-api-secret-token");
    const configuredSecret =
      process.env.TELEGRAM_WEBHOOK_SECRET || "fome_secret_webhook_2026";

    // Validate secret token
    if (body.secret !== configuredSecret && headerSecret !== configuredSecret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const groupChatId = process.env.TELEGRAM_GROUP_CHAT_ID || "-1004436845383";
    const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ex-server-web.vercel.app";
    const botUsername = "fdihjdfhjfdjhfdjh_bot";

    const keyboard = new InlineKeyboard()
      .url("🗺️ 3D Карта / Радар", webAppUrl)
      .url("🎮 Пульт в ЛС", `https://t.me/${botUsername}`);

    let notificationText = "";
    let targetThreadId: number | undefined = undefined;

    if (body.event === "server_started") {
      notificationText = [
        "🟢 *Сервер запущен и готов к игре!*",
        "",
        "• Адрес: `soroqn.exaroton.me`",
        "• Мир полностью загружен, заходите!",
      ].join("\n");
      // Send start to General (undefined) and News (4)
    } else if (body.event === "server_stopping") {
      notificationText = "🛑 *Сервер останавливается...* Сохранение мира.";
    } else if (body.event === "tps_drop") {
      notificationText = [
        "⚠️ *ВНИМАНИЕ: ПРОСАДКА ПРОИЗВОДИТЕЛЬНОСТИ / TPS!*",
        "",
        `• Текущий TPS: *${body.tps ?? "низкий"}* (норма: 20.0)`,
        `• Время тика (MSPT): *${body.mspt ?? ">50"} ms*`,
        `• Игроков онлайн: *${body.players ?? 0}*`,
        "",
        "ℹ️ _Возможные причины: скопление сотен мобов, перегруженные воронки/редстоун-схемы или активная генерация новых чанков._",
      ].join("\n");
      targetThreadId = process.env.TELEGRAM_TOPIC_STATUS ? Number(process.env.TELEGRAM_TOPIC_STATUS) : undefined;
    } else {
      notificationText = body.message || `ℹ️ Оповещение от сервера: ${body.event}`;
      targetThreadId = body.topicId;
    }

    // Send primary notification
    try {
      await bot.api.sendMessage(groupChatId, notificationText, {
        message_thread_id: targetThreadId,
        parse_mode: "Markdown",
        reply_markup: keyboard,
      });
    } catch {
      // Fallback: send to general channel without message_thread_id
      await bot.api.sendMessage(groupChatId, notificationText, {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      });
    }

    // If server_started or server_stopping, duplicate to News topic (4)
    if (body.event === "server_started" || body.event === "server_stopping") {
      try {
        await bot.api.sendMessage(groupChatId, notificationText, {
          message_thread_id: 4, // News topic
          parse_mode: "Markdown",
          reply_markup: keyboard,
        });
      } catch {
        // Ignore if news topic is unreachable
      }
    }

    return NextResponse.json({ ok: true, delivered: true });
  } catch (err) {
    console.error("[Notify Error]", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "FoMe Server Notification Webhook" });
}
