'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

export interface VersionMetadata {
  tone?: string;
  length?: string;
  variant_slug?: string;
  notes?: string;
}

export interface GeneratedContentVersion {
  id: number;
  version: number;
  account_name: string;
  campaign_id?: number;
  created_at: string;
  published_at?: string;
  external_send_count: number;
  version_metadata?: VersionMetadata;
}

export interface OnePageVersionSelectorProps {
  accountName: string;
  campaignId?: number;
  versions: GeneratedContentVersion[];
  selectedVersionId: number;
  onVersionChange?: (versionId: number) => void;
}

export function OnePageVersionSelector({
  accountName,
  campaignId,
  versions,
  selectedVersionId,
  onVersionChange,
}: OnePageVersionSelectorProps) {
  const [isPublishing, setIsPublishing] = useState<number | null>(null);

  const selectedVersion = versions.find((v) => v.id === selectedVersionId);
  const isPublished = selectedVersion?.published_at !== null && selectedVersion?.published_at !== undefined;

  const handlePublish = async (versionId: number) => {
    setIsPublishing(versionId);
    try {
      const response = await fetch(`/api/ai/generated-content/${versionId}/publish`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to publish version');
      }

      toast.success('Version published');
      // Reload to update UI
      window.location.reload();
    } catch (err) {
      toast.error(`Publish failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsPublishing(null);
    }
  };

  if (versions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">No versions generated yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Version History</CardTitle>
        <CardDescription>{accountName} {campaignId ? `• Campaign ${campaignId}` : ''}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Version Selector Dropdown */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Version</label>
          <Select value={selectedVersionId.toString()} onValueChange={(val) => onVersionChange?.(parseInt(val, 10))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {versions.map((version) => (
                <SelectItem key={version.id} value={version.id.toString()}>
                  Version {version.version}
                  {version.published_at ? ' (Published)' : ' (Draft)'}
                  {version.external_send_count > 0 ? ` • Sent ${version.external_send_count}x` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Version Details */}
        {selectedVersion && (
          <div className="space-y-3 rounded-lg bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Version {selectedVersion.version}</h3>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(selectedVersion.created_at).toLocaleDateString()}
                </p>
              </div>
              {isPublished ? (
                <Badge className="bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Published
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Clock className="mr-1 h-3 w-3" />
                  Draft
                </Badge>
              )}
            </div>

            {selectedVersion.version_metadata && (
              <div className="space-y-2 text-sm">
                {selectedVersion.version_metadata.tone && (
                  <div>
                    <span className="text-muted-foreground">Tone:</span> {selectedVersion.version_metadata.tone}
                  </div>
                )}
                {selectedVersion.version_metadata.length && (
                  <div>
                    <span className="text-muted-foreground">Length:</span> {selectedVersion.version_metadata.length}
                  </div>
                )}
                {selectedVersion.version_metadata.notes && (
                  <div>
                    <span className="text-muted-foreground">Notes:</span> {selectedVersion.version_metadata.notes}
                  </div>
                )}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Sent to {selectedVersion.external_send_count} recipient{selectedVersion.external_send_count !== 1 ? 's' : ''}
            </div>

            {!isPublished && (
              <Button
                size="sm"
                className="w-full"
                onClick={() => handlePublish(selectedVersion.id)}
                disabled={isPublishing === selectedVersion.id}
              >
                {isPublishing === selectedVersion.id ? 'Publishing...' : 'Publish This Version'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
