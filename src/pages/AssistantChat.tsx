import { useMemo, useState } from 'react';
import { Bot, Loader2, Send, Sparkles, User } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import { getBackendErrorMessage } from '@/lib/backendClient';
import { askAssistant, type AssistantConversationTurn } from '@/lib/examStorage';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: 'live' | 'fallback';
  keyPoints?: string[];
  nextActions?: string[];
}

function createWelcomeMessage(role: string | null): ChatMessage {
  const intro =
    role === 'admin'
      ? 'I can summarize cohort trends, hardest exams, and at-risk learner patterns.'
      : 'I can explain your score trends, weak areas, and next study actions.';
  return {
    id: 'welcome',
    role: 'assistant',
    content: intro,
    mode: 'fallback',
  };
}

export default function AssistantChat() {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([createWelcomeMessage(role)]);
  const [draft, setDraft] = useState('');
  const [targetStudentId, setTargetStudentId] = useState('');
  const [sending, setSending] = useState(false);

  const studentContextId = useMemo(() => {
    if (role === 'student') {
      return user?.id;
    }
    const trimmed = targetStudentId.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, [role, targetStudentId, user?.id]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft('');
    setSending(true);

    try {
      const history: AssistantConversationTurn[] = nextMessages
        .slice(-10)
        .map((message) => ({ role: message.role, content: message.content }));
      const response = await askAssistant(text, {
        studentId: studentContextId,
        history,
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        mode: response.mode,
        keyPoints: response.keyPoints,
        nextActions: response.nextActions,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error(getBackendErrorMessage(error, 'Assistant request failed'));
      setMessages((prev) => prev.filter((message) => message.id !== userMessage.id));
      setDraft(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
          <p className="mt-1 text-muted-foreground">
            Ask about marks, patterns, trends, and actionable next steps.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                Assistant Chat
              </CardTitle>
              <CardDescription>
                {role === 'admin'
                  ? 'Use student id context for personalized student coaching.'
                  : 'Responses are automatically personalized to your own performance.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-[460px] rounded-md border p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg border px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-accent/10 border-accent/30'
                            : 'bg-muted/40 border-border'
                        }`}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          {message.role === 'user' ? (
                            <User className="h-4 w-4 text-accent" />
                          ) : (
                            <Bot className="h-4 w-4 text-accent" />
                          )}
                          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {message.role}
                          </span>
                          {message.role === 'assistant' && message.mode && (
                            <Badge variant="outline" className="text-[10px]">
                              {message.mode === 'live' ? 'AI Live' : 'Fallback'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed">{message.content}</p>

                        {message.keyPoints && message.keyPoints.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-muted-foreground">Key Points</p>
                            <div className="mt-1 space-y-1">
                              {message.keyPoints.map((point) => (
                                <p key={point} className="text-xs text-muted-foreground">
                                  • {point}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {message.nextActions && message.nextActions.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-muted-foreground">Next Actions</p>
                            <div className="mt-1 space-y-1">
                              {message.nextActions.map((action) => (
                                <p key={action} className="text-xs text-muted-foreground">
                                  • {action}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="space-y-3">
                {role === 'admin' && (
                  <Input
                    value={targetStudentId}
                    onChange={(event) => setTargetStudentId(event.target.value)}
                    placeholder="Optional: student id context (e.g. student-001)"
                  />
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Ask about trends, weak areas, suggested strategy, or cohort performance..."
                    rows={3}
                    className="resize-none"
                  />
                  <Button onClick={handleSend} disabled={sending || draft.trim().length === 0} className="sm:h-auto">
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Prompt Ideas</CardTitle>
              <CardDescription>Use these to get focused responses quickly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {role === 'admin' ? (
                <>
                  <p>• Which exams are hardest this week and why?</p>
                  <p>• Summarize at-risk student trends and remediation steps.</p>
                  <p>• Give me 3 actions to improve overall pass rate.</p>
                </>
              ) : (
                <>
                  <p>• Explain my score trend in simple terms.</p>
                  <p>• What is my weakest question type and how to improve it?</p>
                  <p>• Build me a 7-day study action plan from my recent results.</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
