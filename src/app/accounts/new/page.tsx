'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { createAccountWithContext } from '@/lib/actions/create-account-with-context';
import { getVerticalsList } from '@/lib/templates/account-templates';

export default function NewAccountPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    vertical: '',
    parent_brand: '',
    why_now: '',
    primo_angle: '',
    best_intro_path: '',
  });
  const [userModified, setUserModified] = useState({
    why_now: false,
    primo_angle: false,
  });

  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const verticals = getVerticalsList();

  const handleVerticalChange = (vertical: string) => {
    setFormData({ ...formData, vertical });

    // Import template to get context
    const { VERTICAL_TEMPLATES } = require('@/lib/templates/account-templates');
    const key = vertical.toLowerCase().replace(/\s+/g, '-');
    const template = VERTICAL_TEMPLATES[key];
    setSelectedTemplate(template);

    // Auto-fill unless user has customized
    if (!userModified.why_now) {
      setFormData((prev) => ({ ...prev, why_now: template?.sampleWhyNow || '' }));
    }
    if (!userModified.primo_angle) {
      setFormData((prev) => ({ ...prev, primo_angle: template?.samplePrimoAngle || '' }));
    }
  };

  const handleWhyNowChange = (value: string) => {
    setFormData({ ...formData, why_now: value });
    setUserModified({ ...userModified, why_now: true });
  };

  const handlePrimoAngleChange = (value: string) => {
    setFormData({ ...formData, primo_angle: value });
    setUserModified({ ...userModified, primo_angle: true });
  };

  const handleResetToTemplate = () => {
    if (!selectedTemplate) return;
    setFormData((prev) => ({
      ...prev,
      why_now: selectedTemplate.sampleWhyNow,
      primo_angle: selectedTemplate.samplePrimoAngle,
    }));
    setUserModified({ why_now: false, primo_angle: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.vertical || !formData.why_now || !formData.primo_angle) {
      toast.error('Fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await createAccountWithContext({
        name: formData.name,
        vertical: formData.vertical,
        why_now: formData.why_now,
        primo_angle: formData.primo_angle,
        parent_brand: formData.parent_brand || formData.name,
        best_intro_path: formData.best_intro_path,
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to create account');
        return;
      }

      toast.success(`Account created. Generation queued (Job #${result.generation_job_id})`);
      router.push(`/accounts/${formData.name.toLowerCase().replace(/\s+/g, '-')}`);
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Accounts', href: '/accounts' }, { label: 'New' }]} />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create New Account</h1>
        <p className="text-sm text-muted-foreground">Add a new outreach target with vertical-specific context. A one-pager will be auto-generated.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Form Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Name */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Account Name *
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., General Mills"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent_brand" className="text-sm font-medium">
                  Parent Brand (optional)
                </Label>
                <Input
                  id="parent_brand"
                  placeholder="e.g., Mondelēz International"
                  value={formData.parent_brand}
                  onChange={(e) => setFormData({ ...formData, parent_brand: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vertical" className="text-sm font-medium">
                  Vertical *
                </Label>
                <Select value={formData.vertical} onValueChange={handleVerticalChange}>
                  <SelectTrigger id="vertical">
                    <SelectValue placeholder="Select a vertical..." />
                  </SelectTrigger>
                  <SelectContent>
                    {verticals.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && <p className="text-xs text-muted-foreground mt-1">{selectedTemplate.description}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Why Now */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Why Now</CardTitle>
                {selectedTemplate && !userModified.why_now && <Badge variant="secondary">Template</Badge>}
              </div>
              <CardDescription>Signal that drives urgency. Why does this account need to move now?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Why is this company a good target right now?"
                value={formData.why_now}
                onChange={(e) => handleWhyNowChange(e.target.value)}
                className="min-h-[120px]"
              />
              {selectedTemplate && userModified.why_now && (
                <Button variant="outline" size="sm" onClick={handleResetToTemplate} className="w-full">
                  Reset to Template
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Primo Angle */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Primo Angle</CardTitle>
                {selectedTemplate && !userModified.primo_angle && <Badge variant="secondary">Template</Badge>}
              </div>
              <CardDescription>Your competitive hook. Why choose YardFlow?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="What makes YardFlow uniquely valuable to this company?"
                value={formData.primo_angle}
                onChange={(e) => handlePrimoAngleChange(e.target.value)}
                className="min-h-[120px]"
              />
              {selectedTemplate && userModified.primo_angle && (
                <Button variant="outline" size="sm" onClick={handleResetToTemplate} className="w-full">
                  Reset to Template
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Best Intro Path */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Best Intro Path (optional)</CardTitle>
              <CardDescription>How should we approach this account?</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="e.g., 'Operations leadership via supply chain event' or 'Direct to VP Logistics'"
                value={formData.best_intro_path}
                onChange={(e) => setFormData({ ...formData, best_intro_path: e.target.value })}
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Summary & Actions */}
        <div className="space-y-6">
          {/* Scoring Preview */}
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scoring Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">ICP Fit</p>
                  <p className="text-2xl font-bold">{selectedTemplate.defaultScoringRules.icp_fit}/5</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Primo Story Fit</p>
                  <p className="text-2xl font-bold">{selectedTemplate.defaultScoringRules.primo_story_fit}/5</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Strategic Value</p>
                  <p className="text-2xl font-bold">{selectedTemplate.defaultScoringRules.strategic_value}/5</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200">
                  <p className="text-xs text-emerald-900 uppercase font-semibold">Estimated Band</p>
                  <p className="text-2xl font-bold text-emerald-700">Tier 1 / Band A</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validation & Submit */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submission Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {formData.name ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                <span className={formData.name ? 'text-foreground' : 'text-muted-foreground'}>Account name</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {formData.vertical ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                <span className={formData.vertical ? 'text-foreground' : 'text-muted-foreground'}>Vertical selected</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {formData.why_now ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                <span className={formData.why_now ? 'text-foreground' : 'text-muted-foreground'}>Why now filled</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {formData.primo_angle ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                <span className={formData.primo_angle ? 'text-foreground' : 'text-muted-foreground'}>Primo angle filled</span>
              </div>

              <Button
                type="submit"
                disabled={
                  isLoading ||
                  !formData.name ||
                  !formData.vertical ||
                  !formData.why_now ||
                  !formData.primo_angle
                }
                className="w-full mt-4"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                    Creating & Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
