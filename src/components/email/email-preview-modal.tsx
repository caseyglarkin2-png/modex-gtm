'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Send, Mail, AlertCircle } from 'lucide-react';

interface EmailPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  body: string;
  recipientEmail: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function EmailPreviewModal({
  open,
  onOpenChange,
  subject,
  body,
  recipientEmail,
  onConfirm,
  isLoading = false,
}: EmailPreviewModalProps) {
  const isValidEmail = recipientEmail.includes('@');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Preview Email
          </DialogTitle>
          <DialogDescription>
            Review before sending to {recipientEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Recipient */}
          <div className="px-4 py-3 bg-muted/30 rounded-lg space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">TO</p>
            <p className="text-sm break-all">{recipientEmail}</p>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">SUBJECT</p>
            <div className="px-3 py-2 bg-muted/20 rounded-md border border-border">
              <p className="text-sm break-words">{subject}</p>
            </div>
          </div>

          {/* Body Preview */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">BODY</p>
            <div className="px-3 py-2 bg-white dark:bg-slate-950 rounded-md border border-border min-h-[200px] max-h-[400px] overflow-auto">
              <div
                className="text-sm prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            </div>
          </div>

          {/* Warnings */}
          {!isValidEmail && (
            <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-700 dark:text-amber-400">
                <p className="font-semibold">Invalid email address</p>
                <p>Enter a valid email before sending.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            <Badge variant="secondary" className="font-mono">
              {body.length} chars
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading || !isValidEmail}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
