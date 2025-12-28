import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Key, 
  Eye, 
  EyeOff, 
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { mockLLMSettings, emptyLLMSettings } from '@/data/mockData';
import { LLMSettings } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { isAdmin } = useApp();
  const { toast } = useToast();
  const [settings, setSettings] = useState<LLMSettings>(mockLLMSettings);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'valid' | 'invalid' | null>(null);

  const handleSave = async () => {
    if (!isAdmin) return;

    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));

    setSettings({
      ...settings,
      apiKey: apiKey,
      keyStatus: apiKey ? 'SET' : 'NOT_SET',
    });
    setIsSaving(false);
    setTestResult(null);

    toast({
      title: 'Settings saved',
      description: 'Your LLM settings have been updated.',
    });
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    await new Promise((r) => setTimeout(r, 1200));
    
    // Simulate test - in real app would validate with OpenAI
    const isValid = apiKey.startsWith('sk-');
    setTestResult(isValid ? 'valid' : 'invalid');
    setIsTesting(false);

    toast({
      title: isValid ? 'API key is valid' : 'API key is invalid',
      description: isValid 
        ? 'Your OpenAI API key works correctly.' 
        : 'Please check your API key and try again.',
      variant: isValid ? 'default' : 'destructive',
    });
  };

  const getMaskedKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '•'.repeat(key.length);
    return key.slice(0, 7) + '•'.repeat(key.length - 11) + key.slice(-4);
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <PageHeader
          title="Settings"
          description="Configure your organization's LLM settings"
        />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <div>
                <CardTitle className="text-base">LLM Settings</CardTitle>
                <CardDescription>
                  Configure the AI provider for your organization
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Provider */}
            <div className="space-y-2">
              <Label>Provider</Label>
              <div className="flex items-center gap-2">
                <div className="h-10 px-4 rounded-md border bg-muted flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded bg-foreground flex items-center justify-center">
                    <span className="text-background text-xs font-bold">AI</span>
                  </div>
                  OpenAI
                </div>
                <Badge variant="secondary">Only provider</Badge>
              </div>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="apiKey">API Key</Label>
                <Badge
                  variant="outline"
                  className={cn(
                    settings.keyStatus === 'SET'
                      ? 'border-status-ready text-status-ready'
                      : 'border-status-failed text-status-failed'
                  )}
                >
                  {settings.keyStatus === 'SET' ? 'Set' : 'Not set'}
                </Badge>
              </div>
              
              {isAdmin ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showKey ? 'text' : 'password'}
                      placeholder="sk-proj-..."
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        setTestResult(null);
                      }}
                      className="pr-20"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {testResult && (
                    <div
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-lg text-sm',
                        testResult === 'valid'
                          ? 'bg-status-ready/10 text-status-ready'
                          : 'bg-status-failed/10 text-status-failed'
                      )}
                    >
                      {testResult === 'valid' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      {testResult === 'valid' ? 'API key is valid' : 'API key is invalid'}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save changes'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleTest}
                      disabled={!apiKey || isTesting}
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        'Test key'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="h-10 px-3 rounded-md border bg-muted flex items-center text-sm text-muted-foreground">
                    <Key className="w-4 h-4 mr-2" />
                    {settings.keyStatus === 'SET' ? getMaskedKey(settings.apiKey) : 'No API key configured'}
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm">
                    <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">
                      Only admins can change the API key.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                This API key is used by all members in this organization to access AI features. 
                Keep it secure and do not share it publicly.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
