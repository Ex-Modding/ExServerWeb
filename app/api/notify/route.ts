import { NextResponse } from "next/server";
import { bot } from "@/lib/bot";
import { InlineKeyboard } from "grammy";

export const dynamic = "force-dynamic";

interface NotifyPayload {
  event: "server_started" | "server_stopping" | string;
  secret?: string;
  message?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as NotifyPayload;
    const headerSecret = req.headers.get("x-notify-secret") || req.headers.get("x-telegram-bot-api-secret-token");
    const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET || "fome_secret_webhook_2026";

    // Validate secret token
    if (body.secret !== configuredSecret && headerSecret !== configuredSecret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const groupChatId = process.env.TELEGRAM_GROUP_CHAT_ID || "-1004436845383";
    const topicGeneral = Number(process.env.TELEGRAM_TOPIC_GENERAL || "1");
    const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ex-server-web.vercel.app";
    const botUsername = "fdihjdfhjfdjhfdjh_bot";

    const keyboard = new InlineKeyboard()
      .url("🗺️ 3D Карта мира", webAppUrl)
      .url("🎮 Пульт в ЛС", `https://t.me/${botUsername}`);

    let notificationText = "";

    if (body.event === "server_started") {
      notificationText = [
        "🟢 *Сервер запущен и готов к игре!*",
        "",
        "• Адрес: `soroqn.exaroton.me`",
        "• Мир полностью загружен, заходите!",
      ].join("\n");
    } else if (body.event === "server_stopping") {
      notificationText = "🛑 *Сервер останавливается...* Сохранение мира.";
    } else {
      notificationText = body.message || `ℹ️ Оповещение от сервера: ${body.event}`;
    }

    // Send to supergroup General topic
    await bot.api.sendMessage(groupChatId, notificationText, {
      message_thread_id: topicGeneral,
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });

    return NextResponse.json({ ok: true, delivered: true });
  } catch (err) {
    console.error("[Notify Error]", err);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "FoMe Server Notification Webhook" });
}
