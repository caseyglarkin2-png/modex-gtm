'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Send, Eye, Mail, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export interface Recipient {
  id: number;
  name: string;
  email: string;
  title?: string;
}

export interface OnePageSendDialogProps {
  accountName: string;
  generatedContentId: number;
  generatedContent: {
    account_name: string;
    content: string;
    version?: number;
    provider_used?: string;
  };
  recipients: Recipient[];
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function OnePageSendDialog({
  accountName,
  generatedContentId,
  generatedContent,
  recipients: allRecipients,
  onSuccess,
  open: controlledOpen,
  onOpenChange: onControlledOpenChange,
  trigger,
}: OnePageSendDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [subject, setSubject] = useState(`MODEX 2026 – Yard Protocol Opportunities at ${accountName}`);
  const [previewMode, setPreviewMode] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onControlledOpenChange || setInternalOpen;

  const handleSelectRecipient = (recipientId: number, checked: boolean) => {
    if (checked) {
      setSelectedRecipients([...selectedRecipients, recipientId]);
    } else {
      setSelectedRecipients(selectedRecipients.filter((id) => id !== recipientId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecipients(allRecipients.map((r) => r.id));
    } else {
      setSelectedRecipients([]);
    }
  };

  const handleSend = async () => {
    if (selectedRecipients.length === 0) {
      toast.error('Select at least one recipient');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/email/send-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName,
          recipients: allRecipients.filter((r) => selectedRecipients.includes(r.id)),
          subject,
          bodyHtml: generatedContent.content,
          generated_content_id: generatedContentId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Send failed: ${response.statusText}`);
      }

      const result = await response.json();
      toast.success(`Sent to ${result.sent} recipient(s)`);
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      toast.error(`Send error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  const selectedCount = selectedRecipients.length;
  const allSelected = selectedRecipients.length === allRecipients.length;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="max-h-screen max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send One-Pager</DialogTitle>
          <DialogDescription>Preview and send this content to selected recipients at {accountName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">One-Pager Preview</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {previewMode ? 'Hide' : 'Show'} Preview
                </Button>
              </div>
              <CardDescription>Version {generatedContent.version || 1} • Provider: {generatedContent.provider_used || 'unknown'}</CardDescription>
            </CardHeader>
            {previewMode && (
              <CardContent>
                <div className="rounded-lg border bg-slate-50 p-4">
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: generatedContent.content }}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Subject Line */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Subject Line</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" />
          </div>

          {/* Recipients Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recipients ({selectedCount})</CardTitle>
                <Badge variant="outline">{selectedCount} selected</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {allRecipients.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm text-amber-700">No recipients found. Add personas to this account first.</p>
                </div>
              ) : (
                <>
                  {/* Select All */}
                  <div className="flex items-center space-x-2 border-b pb-3">
                    <Checkbox
                      id="select-all"
                      checked={allSelected}
                      onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    />
                    <Label htmlFor="select-all" className="cursor-pointer font-medium">
                      Select all {allRecipients.length} recipients
                    </Label>
                  </div>

                  {/* Individual Recipients */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {allRecipients.map((recipient) => (
                      <div key={recipient.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`recipient-${recipient.id}`}
                          checked={selectedRecipients.includes(recipient.id)}
                          onCheckedChange={(checked) => handleSelectRecipient(recipient.id, checked as boolean)}
                        />
                        <Label htmlFor={`recipient-${recipient.id}`} className="cursor-pointer flex-1">
                          <span className="font-medium">{recipient.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{recipient.email}</span>
                          {recipient.title && <span className="text-xs text-muted-foreground ml-2">({recipient.title})</span>}
                        </Label>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={selectedCount === 0 || isSending}
              className="flex-1"
            >
              {isSending ? (
                <>
                  <Mail className="mr-2 h-4 w-4 animate-pulse" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send to {selectedCount} Recipient{selectedCount !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
