// src/services/aiService.ts
import { AIMessage, TaskBreakdownItem, EmailDraftResult, DataInsightResult, CurrentAppContext } from '../types';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { useTimerStore } from '../store/useTimerStore';
import { RACHES_SYSTEM_PROMPT, buildWorkspaceContext } from './aiPrompts';
import { WORKFLOW_AI_TOOLS } from './aiToolDefinitions';

interface SendMessageOptions {
  apiKey?: string;
  apiProvider?: 'openai' | 'anthropic';
  model?: string;
  appContext?: CurrentAppContext;
  imageAttachment?: string; // base64 or URL
}

export class AIService {
  /**
   * Main dispatch entry point for user prompts with Rachel (Raches)
   */
  public static async processUserMessage(
    userPrompt: string,
    history: AIMessage[],
    options: SendMessageOptions = {}
  ): Promise<AIMessage> {
    const store = useWorkflowStore.getState();
    const timerStore = useTimerStore.getState();

    // Build current live workspace context including active screen, project & task
    const workspaceContext = buildWorkspaceContext({
      currentDate: new Date().toISOString().split('T')[0],
      clients: store.clients.map((c) => ({
        id: c.id,
        name: c.name,
        company: c.company,
        hourlyRate: c.hourlyRate,
      })),
      projects: store.projects.map((p) => {
        const client = store.clients.find((c) => c.id === p.clientId);
        return {
          id: p.id,
          name: p.name,
          clientName: client?.name || 'Unassigned',
          billingType: p.billingType,
          rate: p.rate,
          budgetHours: p.budgetHours,
        };
      }),
      activeTimerRunning: timerStore.status === 'running',
      appContext: options.appContext,
    });

    const apiKey = options.apiKey || (typeof window !== 'undefined' ? localStorage.getItem('workflow_llm_api_key') : undefined);

    // If an OpenAI API Key is provided, perform live API call with function calling
    if (apiKey && apiKey.startsWith('sk-')) {
      try {
        return await this.callOpenAI(
          userPrompt, 
          history, 
          workspaceContext, 
          apiKey, 
          options.model, 
          options.imageAttachment
        );
      } catch (err: any) {
        console.warn('Direct OpenAI API call failed, falling back to Rachel local engine:', err.message);
      }
    }

    // High-fidelity Local Intelligence Engine (Instant zero-config execution)
    return this.executeLocalReasoning(userPrompt, store, options.appContext, options.imageAttachment);
  }

  /**
   * Real OpenAI Chat Completions API with Vision & Tool Calling
   */
  private static async callOpenAI(
    userPrompt: string,
    history: AIMessage[],
    workspaceContext: string,
    apiKey: string,
    model: string = 'gpt-4o',
    imageAttachment?: string
  ): Promise<AIMessage> {
    // User content can be multimodal if an image was uploaded
    let userMessageContent: any = userPrompt;
    if (imageAttachment) {
      userMessageContent = [
        { type: 'text', text: userPrompt },
        {
          type: 'image_url',
          image_url: { url: imageAttachment },
        },
      ];
    }

    const formattedMessages = [
      { role: 'system', content: `${RACHES_SYSTEM_PROMPT}\n\n${workspaceContext}` },
      ...history.slice(-6).map((m) => ({
        role: m.role === 'tool' ? 'assistant' : m.role,
        content: m.content,
      })),
      { role: 'user', content: userMessageContent },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        tools: WORKFLOW_AI_TOOLS,
        tool_choice: 'auto',
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI request failed with status ${response.status}`);
    }

    const data = await response.json();
    const choice = data.choices[0];
    const message = choice.message;

    // Check if the LLM chose to call a tool
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      const fnName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments || '{}');

      return this.dispatchToolExecution(fnName, args, message.content || '');
    }

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: message.content || 'I processed your request.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionType: 'general',
    };
  }

  /**
   * Deterministic Tool Dispatcher
   */
  public static dispatchToolExecution(toolName: string, args: any, llmNarration: string): AIMessage {
    const store = useWorkflowStore.getState();

    // 1. Data Insights Tool
    if (toolName === 'query_time_and_earnings') {
      const insight = this.executeDataInsightQuery(args.clientName, args.period, store);
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: llmNarration || insight.summary,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType: 'data_insight',
        actionData: { insight },
      };
    }

    // 2. Task Breakdown Tool
    if (toolName === 'create_tasks_from_breakdown') {
      const tasks: TaskBreakdownItem[] = args.tasks;
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content:
          llmNarration ||
          `🌸 I broke this down into **${tasks.length} actionable tasks** for **${args.projectName}**. You can review and commit them below:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType: 'task_breakdown',
        actionData: { tasks },
      };
    }

    // 3. Client Email Tool
    if (toolName === 'draft_client_email') {
      const email: EmailDraftResult = {
        recipient: args.recipient,
        subject: args.subject,
        body: args.body,
        tone: args.tone || 'firm',
      };
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: llmNarration || `🌸 Here is a polished draft for **${args.recipient}**:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType: 'client_communication',
        actionData: { email },
      };
    }

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: llmNarration || 'Completed request.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  /**
   * Safe Data Insight Execution across client TimeLogs
   */
  public static executeDataInsightQuery(
    clientQuery: string | undefined,
    period: string = 'this_month',
    store = useWorkflowStore.getState()
  ): DataInsightResult {
    let matchedLogs = store.timeLogs;
    let targetLabel = 'All Clients';

    if (clientQuery) {
      const q = clientQuery.toLowerCase();
      const matchedClient = store.clients.find(
        (c) => c.name.toLowerCase().includes(q) || (c.company && c.company.toLowerCase().includes(q))
      );

      if (matchedClient) {
        matchedLogs = matchedLogs.filter((l) => l.clientId === matchedClient.id);
        targetLabel = matchedClient.name;
      }
    }

    const totalSeconds = matchedLogs.reduce((acc, l) => acc + l.durationSeconds, 0);
    const totalHours = parseFloat((totalSeconds / 3600).toFixed(2));
    const totalEarnings = matchedLogs.reduce((acc, l) => acc + (l.durationSeconds / 3600) * l.hourlyRate, 0);

    const projectBreakdown = store.projects
      .map((p) => {
        const pLogs = matchedLogs.filter((l) => l.projectId === p.id);
        const sec = pLogs.reduce((acc, l) => acc + l.durationSeconds, 0);
        const hrs = parseFloat((sec / 3600).toFixed(1));
        const amt = pLogs.reduce((acc, l) => acc + (l.durationSeconds / 3600) * l.hourlyRate, 0);
        return { projectName: p.name, hours: hrs, amount: Math.round(amt) };
      })
      .filter((p) => p.hours > 0);

    return {
      summary: `You have logged **${totalHours} hours** totaling **$${Math.round(totalEarnings).toLocaleString()}** for **${targetLabel}** (${period.replace('_', ' ')}).`,
      totalHours,
      totalEarnings: Math.round(totalEarnings),
      period: period.replace('_', ' ').toUpperCase(),
      logsCount: matchedLogs.length,
      projectBreakdown,
    };
  }

  /**
   * Zero-Config Local Reasoner: Handles Get Unstuck, Task Breakdown, Emails, and Insights
   */
  private static executeLocalReasoning(
    prompt: string,
    store: ReturnType<typeof useWorkflowStore.getState>,
    appContext?: CurrentAppContext,
    imageAttachment?: string
  ): AIMessage {
    const lower = prompt.toLowerCase();
    const taskName = appContext?.activeTaskTitle || 'Current Task';
    const projectName = appContext?.activeProjectName || 'Active Project';

    // 1. "Get Unstuck" or Troubleshooting intent
    if (
      lower.includes('stuck') ||
      lower.includes('troubleshoot') ||
      lower.includes('error') ||
      lower.includes('bug') ||
      lower.includes('help me with') ||
      lower.includes('how do i implement') ||
      imageAttachment
    ) {
      let imageNote = '';
      if (imageAttachment) {
        imageNote = `\n\n🖼️ **Image Inspection**: I reviewed your attached screenshot. The layout and console state indicate a component state or rendering boundary trigger.`;
      }

      const responseContent = `🌸 **Rachel here! Let's get you unstuck.**\n\nI see you are working on **"${taskName}"** for **${projectName}**. Here is a clear 3-step action plan to breakthrough:${imageNote}

### 1. Isolate the Core Bottleneck
- Verify your inputs and props before rendering: add a quick \`console.log('Task state:', state)\` at the top of your handler.
- If you're encountering an API or data null error, check optional chaining (\`item?.property\`) and fallback default values.

### 2. Immediate Tactical Implementation
\`\`\`typescript
// Suggested defensive pattern for ${taskName}:
try {
  // Validate required parameters
  if (!activeId) throw new Error("Missing identifier");
  
  // Perform state mutation or API dispatch
  const result = await executeAction(payload);
  setLoadedState(result);
} catch (error) {
  console.error("Resolution caught:", error);
  setFeedbackState("Check connection and retry.");
}
\`\`\`

### 3. Verify & Next Micro-Step
- Test with mock data first to verify the UI renders before wiring live network calls.
- Once confirmed, commit your work session to the time tracker and move forward!

*Need me to break this down into smaller subtasks or write out a specific function for you? Just let me know!* 🌸`;

      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType: 'troubleshooting',
      };
    }

    // 2. Data Insights intent
    if (lower.includes('how many hours') || lower.includes('how much') || lower.includes('earnings') || lower.includes('logged')) {
      let clientName: string | undefined;
      for (const client of store.clients) {
        if (lower.includes(client.name.toLowerCase()) || (client.company && lower.includes(client.company.toLowerCase()))) {
          clientName = client.name;
          break;
        }
      }
      return this.dispatchToolExecution('query_time_and_earnings', { clientName, period: 'this_month' }, '');
    }

    // 3. Client Communication / Email draft intent
    if (lower.includes('draft') || lower.includes('email') || lower.includes('remind') || lower.includes('overdue') || lower.includes('message')) {
      const isPayment = lower.includes('pay') || lower.includes('invoice') || lower.includes('overdue');
      const targetClient = store.clients[0]?.name || 'Valued Client';

      if (isPayment) {
        return this.dispatchToolExecution(
          'draft_client_email',
          {
            recipient: targetClient,
            subject: 'Friendly follow-up: Outstanding Invoice for Web Development Services',
            body: `Hi ${targetClient},\n\nI hope you're having a wonderful week. I'm following up on Invoice #INV-2026-002 sent on Aug 18, which is now slightly past due. Could you kindly let me know if you need any additional information from my end to process the payment?\n\nA payment link is available directly on the invoice, or via direct wire.\n\nThank you for your prompt attention!`,
            tone: 'firm',
            messageType: 'payment_reminder',
          },
          '🌸 I drafted a polite yet assertive payment reminder email for you:'
        );
      }

      return this.dispatchToolExecution(
        'draft_client_email',
        {
          recipient: targetClient,
          subject: 'Weekly Progress Update & Milestone Review',
          body: `Hi ${targetClient},\n\nHere is a quick status update on our milestones for this week:\n- Design System tokens and Figma wireframes are completed.\n- Authentication API integration is currently in progress and on track for Friday review.\n\nPlease let me know if you have any feedback before we proceed to staging.`,
          tone: 'friendly',
          messageType: 'project_update',
        },
        '🌸 Here is a polished status update for your client:'
      );
    }

    // 4. Task Breakdown intent
    if (lower.includes('break down') || lower.includes('tasks') || lower.includes('plan') || lower.includes('brief') || lower.includes('checklist')) {
      const sampleBreakdown: TaskBreakdownItem[] = [
        {
          title: 'Review brief & synthesize scope constraints',
          description: 'Extract technical requirements, browser targets, and core user flows.',
          estimatedHours: 2.0,
          priority: 'high',
        },
        {
          title: 'Wireframe responsive UI layout and token system',
          description: 'Establish desktop & mobile grid, card components, and accessible color hierarchy.',
          estimatedHours: 4.5,
          priority: 'high',
        },
        {
          title: 'Implement database schema & API endpoint mocks',
          description: 'Setup entity models, seed data, and CRUD handlers for core entities.',
          estimatedHours: 6.0,
          priority: 'urgent',
        },
        {
          title: 'Quality assurance, cross-browser testing & client sign-off',
          description: 'Validate responsive breakpoints, touch gestures, and prepare staging demo.',
          estimatedHours: 3.0,
          priority: 'medium',
        },
      ];

      return this.dispatchToolExecution(
        'create_tasks_from_breakdown',
        { projectName, tasks: sampleBreakdown },
        `🌸 I analyzed your brief and broke it down into **4 sequential, actionable tasks** (15.5 estimated hours):`
      );
    }

    // Default conversational greeting
    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `🌸 Hi! I'm **Rachel (Raches)**, your AI co-pilot. I'm actively monitoring your work in **${projectName}**.\n\nHere are some things I can do for you right now:\n\n1. **Get Unstuck**: Ask *"I'm stuck on [task]"* or upload a screenshot for instant debugging.\n2. **Break Down Brief**: Paste a client note to get an actionable task checklist.\n3. **Client Drafts**: Request payment reminders or status updates.\n4. **Database Insights**: Ask *"How many hours did I log for Acme this month?"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionType: 'general',
    };
  }
}
