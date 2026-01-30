import { Copy, Forward, Reply } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes, formatMessageTime, getSenderLabel } from "@/components/inbox/inbox-utils";
import { Button } from "@/components/ui/button";

export function MessageBubble({ message, direction = "inbound", attachments = [] }) {
  const isOutbound = direction === "outbound";
  const timestamp = formatMessageTime(
    message.received_at || message.sent_at || message.created_at
  );
  const toList = message.to_emails || [];

  const initials = getSenderLabel(message)
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "w-full rounded-xl border p-5 text-sm",
        isOutbound ? "border-blue-100 bg-blue-50/50" : "border-gray-200 bg-white shadow-sm"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            {initials || "?"}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">
              {getSenderLabel(message)}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {message.from_email || ""}
              </span>
            </div>
            {toList.length ? (
              <details className="mt-1 text-xs text-muted-foreground">
                <summary className="cursor-pointer select-none">To: {toList[0]}</summary>
                <div className="mt-1 flex flex-wrap gap-2">
                  {toList.map((email) => (
                    <span key={email} className="rounded-full bg-muted px-2 py-0.5">
                      {email}
                    </span>
                  ))}
                </div>
              </details>
            ) : (
              <div className="mt-1 text-xs text-muted-foreground">
                To: {message.to_emails?.[0] || "—"}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{timestamp}</span>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
              <Reply className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
              <Forward className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-4 text-slate-800 leading-relaxed">
        {message.body_html ? (
          <div
            className="prose prose-sm max-w-none"
            // Trusts email HTML from upstream providers; if needed, sanitize before render.
            dangerouslySetInnerHTML={{ __html: message.body_html }}
          />
        ) : (
          <p className="whitespace-pre-line">
            {message.body_text || message.snippet || "No preview available."}
          </p>
        )}
      </div>
      {attachments.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="rounded-lg border bg-white px-3 py-2 text-xs text-slate-700"
            >
              <div className="font-medium">{attachment.filename || "Attachment"}</div>
              <div className="text-[11px] opacity-70">
                {attachment.size_bytes ? formatBytes(attachment.size_bytes) : ""}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
