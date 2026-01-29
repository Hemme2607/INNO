import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export function Composer({
  value,
  onChange,
  mode,
  onModeChange,
}) {
  return (
    <div className="flex-none border-t bg-white px-6 py-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={mode} onValueChange={onModeChange} className="w-fit">
            <TabsList>
              <TabsTrigger value="reply">Reply</TabsTrigger>
              <TabsTrigger value="note">Internal note</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={mode === "reply" ? "Write your reply..." : "Leave an internal note..."}
          rows={5}
          className="min-h-[140px] resize-y"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{mode === "note" ? "Internal note (not sent)" : "Reply"}</span>
          <Button type="button" disabled>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
