// src/services/aiToolDefinitions.ts

/**
 * OpenAI / Anthropic Tool Specifications
 * These schemas allow the LLM to trigger deterministic operations within WorkFlow.
 */
export const WORKFLOW_AI_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'query_time_and_earnings',
      description:
        'Query the user database to calculate total hours logged, billable earnings, and unbilled balance for a specific client, project, or date period.',
      parameters: {
        type: 'object',
        properties: {
          clientName: {
            type: 'string',
            description: 'Name or partial name of the client to filter by (e.g. "Acme", "FinTech Labs")',
          },
          projectName: {
            type: 'string',
            description: 'Name or partial name of the project to filter by',
          },
          period: {
            type: 'string',
            enum: ['today', 'this_week', 'this_month', 'last_month', 'all_time'],
            description: 'Time period to aggregate metrics over',
          },
          billableOnly: {
            type: 'boolean',
            description: 'Whether to only count billable hours (defaults to true)',
          },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_tasks_from_breakdown',
      description:
        'Batch-create a list of organized, actionable tasks under a specified project in the user database.',
      parameters: {
        type: 'object',
        properties: {
          projectName: {
            type: 'string',
            description: 'The target project name where tasks will be added',
          },
          tasks: {
            type: 'array',
            description: 'List of tasks to create',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Action-oriented task title' },
                description: { type: 'string', description: 'Brief scope or deliverables' },
                estimatedHours: { type: 'number', description: 'Estimated time in hours' },
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'urgent'],
                  description: 'Priority level of task',
                },
              },
              required: ['title', 'estimatedHours', 'priority'],
            },
          },
        },
        required: ['projectName', 'tasks'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'draft_client_email',
      description:
        'Generate a structured, professional email message for client communication such as payment reminders, project updates, or scope negotiations.',
      parameters: {
        type: 'object',
        properties: {
          recipient: {
            type: 'string',
            description: 'Recipient name or client company name',
          },
          subject: {
            type: 'string',
            description: 'Concise, high-impact email subject line',
          },
          body: {
            type: 'string',
            description: 'Full message body formatted in clean paragraphs',
          },
          tone: {
            type: 'string',
            enum: ['friendly', 'firm', 'formal', 'concise'],
            description: 'The tone employed in the draft',
          },
          messageType: {
            type: 'string',
            enum: ['payment_reminder', 'project_update', 'scope_change', 'cold_outreach'],
            description: 'The intent of the communication',
          },
        },
        required: ['recipient', 'subject', 'body', 'tone', 'messageType'],
      },
    },
  },
] as const;
