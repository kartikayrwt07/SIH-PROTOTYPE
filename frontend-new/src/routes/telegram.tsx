import { createFileRoute } from "@tanstack/react-router";
import { TelegramBotView } from "@/components/telegram/TelegramBotView";

export const Route = createFileRoute("/telegram")({
  component: TelegramBotView,
});
