import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageBubble } from "@/components/inbox/MessageBubble";
import { Composer } from "@/components/inbox/Composer";
import { formatMessageTime, getSenderLabel, isOutboundMessage } from "@/components/inbox/inbox-utils";

const STATUS_OPTIONS = ["New", "Open", "Waiting", "Solved"];
const ASSIGNEE_OPTIONS = ["Unassigned", "Emma", "Jonas", "Support Bot"];
const PRIORITY_OPTIONS = ["None", "Low", "Normal", "High"];

export function TicketDetail({
  thread,
  messages,
  attachments,
  ticketState,
  onTicketStateChange,
  onOpenInsights,
  draftValue,
  onDraftChange,
  onInsertDraft,
  canInsertDraft,
  composerMode,
  onComposerModeChange,
  mailboxEmails,
}) {
  if (!thread) {
    return (
      <section className="flex min-h-0 flex-1 flex-col items-center justify-center text-sm text-muted-foreground">
        Select a ticket to view the conversation.
      </section>
    );
  }

  const lastUpdated = formatMessageTime(thread.last_message_at);
  const firstMessage = messages[0] || {};

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden lg:min-w-0">
      <header className="flex-none border-b px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="text-sm font-semibold text-slate-900">
              {getSenderLabel(firstMessage)}
            </div>
            <div className="text-xs text-muted-foreground">{firstMessage?.from_email}</div>
            <div className="text-lg font-semibold text-slate-900">
              {thread.subject || "Untitled ticket"}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={ticketState.status}
              onValueChange={(value) => onTicketStateChange({ status: value })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={ticketState.assignee || "Unassigned"}
              onValueChange={(value) =>
                onTicketStateChange({ assignee: value === "Unassigned" ? null : value })
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNEE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={ticketState.priority || "None"}
              onValueChange={(value) =>
                onTicketStateChange({ priority: value === "None" ? null : value })
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={onOpenInsights}>
              View actions
            </Button>
          </div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">Last update {lastUpdated}</div>
      </header>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
        {messages.map((message) => {
          const direction = isOutboundMessage(message, mailboxEmails) ? "outbound" : "inbound";
          const messageAttachments = attachments.filter(
            (attachment) => attachment.message_id === message.id
          );
          return (
            <MessageBubble
              key={message.id}
              message={message}
              direction={direction}
              attachments={messageAttachments}
            />
          );
        })}
      </div>

      <Composer
        value={draftValue}
        onChange={onDraftChange}
        mode={composerMode}
        onModeChange={onComposerModeChange}
      />
    </section>
  );
}
