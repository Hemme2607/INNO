"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImapGuideModal } from "@/components/integrations/ImapGuideModal";

export function MailboxesHelpCard() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-blue-900 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-200 bg-white">
              <BookOpen className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <h3 className="text-base font-semibold">
                Using One.com, Simply, or others?
              </h3>
              <p className="mt-1 text-sm text-blue-800/80">
                You can use Sona with any provider by connecting via a Gmail proxy.
                It's free, secure, and gives you better spam filtering.
              </p>
            </div>
          </div>
          <Button
            type="button"
            className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
            onClick={() => setIsOpen(true)}
          >
            View Setup Guide
          </Button>
        </div>
      </div>

      <ImapGuideModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
