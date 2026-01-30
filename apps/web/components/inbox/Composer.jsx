import { Bold, Italic, Link2, List, Paperclip, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Composer({
  value,
  onChange,
  draftLoaded = false,
  canSend = false,
  onSend,
  mode,
  onModeChange,
}) {
  const isNote = mode === "note";

  return (
    <div className={`flex-none border-t px-6 py-4 ${isNote ? "bg-yellow-50" : "bg-white"}`}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={mode} onValueChange={onModeChange} className="w-fit">
            <TabsList className={isNote ? "bg-yellow-100 text-yellow-900" : ""}>
              <TabsTrigger value="reply">Reply</TabsTrigger>
              <TabsTrigger value="note">Internal note</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Button type="button" variant="ghost" size="icon">
              <Bold className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon">
              <Italic className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon">
              <List className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon">
              <Link2 className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon">
              <Sparkles className="h-4 w-4" />
            </Button>
            <span className="ml-2 text-xs text-muted-foreground">Use template</span>
          </div>
        </div>
        {draftLoaded ? (
          <div className="text-xs font-medium text-amber-700">✨ AI Draft loaded</div>
        ) : null}
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={mode === "reply" ? "Write your reply..." : "Leave an internal note..."}
          rows={5}
          className={`min-h-[160px] resize-y ${isNote ? "bg-yellow-50" : ""}`}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{mode === "note" ? "Internal note (not sent)" : "Reply"}</span>
          <div className="flex items-center">
            <Button type="button" disabled={!canSend} onClick={onSend}>
              Send
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-l-none border-l-0"
                  disabled={!canSend}
                >
                  ▼
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Send & Close</DropdownMenuItem>
                <DropdownMenuItem>Send & Snooze</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
