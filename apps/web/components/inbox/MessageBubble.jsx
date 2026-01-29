import { cn } from "@/lib/utils";
import { formatBytes, formatMessageTime, getSenderLabel } from "@/components/inbox/inbox-utils";

export function MessageBubble({ message, direction = "inbound", attachments = [] }) {
  const isOutbound = direction === "outbound";
  const timestamp = formatMessageTime(
    message.received_at || message.sent_at || message.created_at
  );

  return (
    <div className={cn("flex flex-col gap-2", isOutbound ? "items-end" : "items-start")}> 
      <div
        className={cn(
          "max-w-2xl rounded-2xl border px-4 py-3 text-sm shadow-sm",
          isOutbound
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-slate-200 bg-white text-slate-900"
        )}
      >
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className={isOutbound ? "text-slate-200" : "text-slate-500"}>
            {getSenderLabel(message)}
          </span>
          <span className={isOutbound ? "text-slate-300" : "text-slate-400"}>{timestamp}</span>
        </div>
        <div className="mt-2">
          {message.body_html ? (
            <div
              className={cn(
                "prose prose-sm max-w-none",
                isOutbound ? "prose-invert" : "text-slate-800"
              )}
              // Trusts email HTML from upstream providers; if needed, sanitize before render.
              dangerouslySetInnerHTML={{ __html: message.body_html }}
            />
          ) : (
            <p className="whitespace-pre-line">
              {message.body_text || message.snippet || "No preview available."}
            </p>
          )}
        </div>
      </div>
      {attachments.length ? (
        <div className={cn("flex flex-wrap gap-2", isOutbound ? "justify-end" : "")}> 
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs",
                isOutbound
                  ? "border-slate-700 bg-slate-800 text-slate-100"
                  : "border-slate-200 bg-slate-50 text-slate-700"
              )}
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
