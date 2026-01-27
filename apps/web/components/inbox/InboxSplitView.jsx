"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InboxFilters } from "@/components/inbox/InboxFilters";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatMessageTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getSenderLabel(message) {
  if (message?.from_name) return message.from_name;
  if (message?.from_email) return message.from_email;
  return "Unknown sender";
}

export function InboxSplitView({ messages = [], initialQuery = "", initialUnread = false }) {
  const [selectedId, setSelectedId] = useState(messages?.[0]?.id ?? null);
  const [drafts, setDrafts] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!messages?.length) {
      setSelectedId(null);
      return;
    }
    const stillExists = messages.some((message) => message.id === selectedId);
    if (!stillExists) {
      setSelectedId(messages[0].id);
    }
  }, [messages, selectedId]);

  const selectedMessage = useMemo(
    () => messages.find((message) => message.id === selectedId) || null,
    [messages, selectedId]
  );

  useEffect(() => {
    if (!selectedMessage?.id) return;
    setDrafts((prev) => {
      if (Object.prototype.hasOwnProperty.call(prev, selectedMessage.id)) {
        return prev;
      }
      const seeded = (selectedMessage.ai_draft_text || "").trim();
      if (!seeded) return prev;
      return { ...prev, [selectedMessage.id]: seeded };
    });
  }, [selectedMessage]);

  const draftValue = selectedId ? drafts[selectedId] || "" : "";

  const handleDraftChange = (value) => {
    if (!selectedId) return;
    setDrafts((prev) => ({ ...prev, [selectedId]: value }));
  };

  const handleSend = () => {
    if (!selectedId) return;
    const text = drafts[selectedId]?.trim();
    if (!text) {
      toast.error("Write a reply before sending.");
      return;
    }
    toast.success("Reply ready. Hook sending to your email provider.");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background lg:flex-row">
      <aside className="w-full border-b bg-background lg:max-w-sm lg:border-b-0 lg:border-r">
        <div className="border-b p-4">
          <InboxFilters initialQuery={initialQuery} initialUnread={initialUnread} />
        </div>
        <div className="h-[calc(100vh-12rem)] overflow-y-auto lg:h-[calc(100vh-9rem)]">
          {messages.length ? (
            <div className="divide-y">
              {messages.map((message) => {
                const timestamp =
                  message.received_at || message.sent_at || message.created_at;
                const sender = getSenderLabel(message);
                const isActive = message.id === selectedId;
                return (
                  <button
                    key={message.id}
                    type="button"
                    onClick={() => setSelectedId(message.id)}
                    className={cn(
                      "flex w-full flex-col gap-2 px-4 py-3 text-left transition hover:bg-muted/40",
                      message.is_read ? "bg-background" : "bg-muted/20",
                      isActive && "border-l-2 border-slate-900 bg-muted/40"
                    )}
                    aria-pressed={isActive}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {sender}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(timestamp)}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-slate-800">
                      {message.subject || "No subject"}
                    </div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">
                      {message.snippet || "No preview available."}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-10 text-sm text-muted-foreground">
              No messages yet. Sync will appear here once your mailbox is processed.
            </div>
          )}
        </div>
      </aside>

      <section className="flex h-[calc(100vh-20px)] min-h-0 flex-1 flex-col overflow-hidden">
        {selectedMessage ? (
          <>
            <header className="flex-none border-b px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {getSenderLabel(selectedMessage)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedMessage.from_email || "No sender email"}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {formatMessageTime(
                    selectedMessage.received_at ||
                      selectedMessage.sent_at ||
                      selectedMessage.created_at
                  )}
                  <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                    <SheetTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        View actions
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="flex w-full max-w-md flex-col">
                      <SheetHeader className="mb-4">
                        <SheetTitle>Sona Insights</SheetTitle>
                      </SheetHeader>
                      <Tabs defaultValue="investigation" className="flex flex-1 flex-col">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="investigation" className="gap-2">
                            <Activity className="h-4 w-4" />
                            Sona Actions
                          </TabsTrigger>
                          <TabsTrigger value="customer" className="gap-2">
                            <User className="h-4 w-4" />
                            Customer
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="investigation" className="mt-4 flex-1 overflow-y-auto">
                          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Action timeline
                            </div>
                            <div className="space-y-4">
                              {[
                                {
                                  title: "Identified order #8921 from Shopify",
                                  status: "Found",
                                  time: "10:46 AM",
                                },
                                {
                                  title: "Checking shipping status via GLS API",
                                  status: "In transit",
                                  time: "10:46 AM",
                                },
                                {
                                  title: "Estimated delivery calculation",
                                  status: "Wednesday, Oct 25",
                                  time: "10:46 AM",
                                },
                                {
                                  title: "Applying tone of voice: Friendly Danish shop",
                                  status: null,
                                  time: "10:46 AM",
                                },
                              ].map((item) => (
                                <div key={item.title} className="flex gap-3">
                                  <div className="mt-1 h-2.5 w-2.5 rounded-full border-2 border-blue-500 bg-white" />
                                  <div className="space-y-2">
                                    <div className="text-sm font-semibold text-slate-900">
                                      {item.title}
                                    </div>
                                    {item.status ? (
                                      <div className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                                        {item.status}
                                      </div>
                                    ) : null}
                                    <div className="text-xs text-slate-400">{item.time}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="customer" className="mt-4 flex-1 overflow-y-auto">
                          <div className="space-y-6">
                            <div className="flex flex-col items-center text-center">
                              <div className="h-20 w-20 rounded-3xl bg-slate-100 shadow-sm" />
                              <div className="mt-4 text-lg font-semibold text-slate-900">
                                Emma Nielsen
                              </div>
                              <div className="text-sm text-slate-500">
                                emma.n@gmail.com
                              </div>
                              <div className="mt-3 rounded-full bg-black px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                                Gold member
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
                                <div className="text-xs uppercase tracking-wide text-slate-400">
                                  Spent
                                </div>
                                <div className="mt-2 text-lg font-semibold text-slate-900">
                                  DKK 2.450
                                </div>
                              </div>
                              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
                                <div className="text-xs uppercase tracking-wide text-slate-400">
                                  Orders
                                </div>
                                <div className="mt-2 text-lg font-semibold text-slate-900">
                                  1
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Recent orders
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-semibold text-slate-900">#8921</div>
                                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                                    Shipped
                                  </span>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-3">
                                  <Button variant="outline" size="sm">
                                    Track
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    Refund
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
              <div className="mt-3 text-lg font-semibold text-slate-900">
                {selectedMessage.subject || "No subject"}
              </div>
            </header>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
              <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Latest message
                </div>
                {selectedMessage.body_html ? (
                  <div
                    className="prose prose-sm max-w-none text-slate-800"
                    // Trusts email HTML from upstream providers; if needed, sanitize before render.
                    dangerouslySetInnerHTML={{ __html: selectedMessage.body_html }}
                  />
                ) : (
                  <p className="whitespace-pre-line">
                    {selectedMessage.body_text ||
                      selectedMessage.snippet ||
                      "No preview available."}
                  </p>
                )}
              </div>
              {draftValue ? (
                <div className="ml-auto max-w-2xl rounded-2xl border border-slate-900 bg-slate-900 p-4 text-sm text-white shadow-sm">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Your reply draft
                  </div>
                  <p className="whitespace-pre-line">{draftValue}</p>
                </div>
              ) : (
                <div className="ml-auto max-w-2xl rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Start writing a reply below. Your draft will show up here.
                </div>
              )}
            </div>

            <div className="flex-none border-t bg-white px-6 py-4">
              <div className="flex flex-col gap-3">
                <textarea
                  value={draftValue}
                  onChange={(event) => handleDraftChange(event.target.value)}
                  placeholder="Write your reply..."
                  rows={5}
                  className="min-h-[120px] w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
                    Replies are saved locally until sending is wired up.
                  </div>
                  <Button type="button" onClick={handleSend}>
                    Send reply
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center px-6 py-12 text-sm text-muted-foreground">
            Select a message to start replying.
          </div>
        )}
      </section>
    </div>
  );
}
