// src/components/AIAssistant/AIAssistantDrawer.tsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  PlusCircle, 
  CheckCircle2, 
  Key, 
  Image as ImageIcon,
  Flower2,
  Compass
} from 'lucide-react';
import { AIMessage, TaskBreakdownItem, CurrentAppContext } from '../../types';
import { AIService } from '../../services/aiService';
import { useWorkflowStore } from '../../store/useWorkflowStore';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  appContext: CurrentAppContext;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

export function AIAssistantDrawer({ 
  isOpen, 
  onClose, 
  appContext, 
  initialPrompt, 
  onClearInitialPrompt 
}: AIAssistantDrawerProps) {
  const { projects, addTask } = useWorkflowStore();

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "🌸 Hi there! I'm **Rachel (Raches)**, your personal freelance operations partner and technical mentor. I'm connected to your active screen, projects, and tasks.\n\nStuck on a task or need an engineering review? You can ask me anything or upload a screenshot!",
      timestamp: 'Just now',
      actionType: 'general',
    },
  ]);

  const [input, setInput] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [committedTaskMessageId, setCommittedTaskMessageId] = useState<string | null>(null);
  
  // Settings & API Key
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('workflow_llm_api_key') || '' : '';
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle triggered initial prompt (e.g. from "Get Unstuck" button)
  useEffect(() => {
    if (isOpen && initialPrompt) {
      handleSendMessage(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [isOpen, initialPrompt]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('workflow_llm_api_key', apiKey.trim());
    setShowKeyInput(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (promptToSend?: string) => {
    const prompt = (promptToSend || input).trim();
    if ((!prompt && !selectedImage) || isLoading) return;

    const userMsg: AIMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: prompt || 'Attached screenshot for your review.',
      imageUrl: selectedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    const currentImg = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const assistantReply = await AIService.processUserMessage(
        prompt, 
        [...messages, userMsg], 
        {
          apiKey: apiKey.trim() || undefined,
          appContext,
          imageAttachment: currentImg || undefined,
        }
      );
      setMessages((prev) => [...prev, assistantReply]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Rachel encountered an issue: ${err.message}`,
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyEmail = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCommitTasksToProject = (tasks: TaskBreakdownItem[], messageId: string) => {
    const targetProject = appContext.activeProjectId 
      ? projects.find((p) => p.id === appContext.activeProjectId) || projects[0]
      : projects[0];

    if (!targetProject) {
      alert('Please create at least one project first.');
      return;
    }

    tasks.forEach((t) => {
      addTask(targetProject.id, t.title, t.estimatedHours);
    });

    setCommittedTaskMessageId(messageId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-sky-950/25 backdrop-blur-sm transition-opacity" 
      />

      {/* Raches Slide-over Drawer (Sky Blue, White & Subtle Floral Theme) */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-sky-100 dark:border-sky-900/40 z-10">
        
        {/* --- DRAWER HEADER --- */}
        <div className="p-4 border-b border-sky-100 dark:border-sky-900/40 bg-gradient-to-r from-sky-50 via-white to-sky-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Floral Avatar Icon */}
            <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-400 to-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-400/25 border-2 border-white dark:border-slate-800">
              <Flower2 className="w-5 h-5 text-white animate-spin-slow" />
              <span className="absolute -bottom-1 -right-1 text-[11px] leading-none">🌸</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  Raches
                  <span className="text-xs font-normal text-sky-600 dark:text-sky-400">
                    (Rachel)
                  </span>
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  {apiKey.startsWith('sk-') ? 'OpenAI GPT-4o' : 'Rachel Engine'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span>Freelance Co-pilot & Problem Solver</span>
                <span>•</span>
                <span className="text-sky-500 font-medium">Always Listening</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="p-2 text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-800 transition"
              title="Configure OpenAI API Key"
            >
              <Key className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* --- LIVE WORKSPACE CONTEXT PILL STRIP --- */}
        <div className="px-4 py-2 bg-sky-50/70 dark:bg-sky-950/30 border-b border-sky-100 dark:border-sky-900/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-sky-800 dark:text-sky-300 truncate">
            <Compass className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span className="font-semibold shrink-0">Live Focus:</span>
            <span className="truncate">
              {appContext.activeProjectName || 'No Project'} 
              {appContext.activeTaskTitle && (
                <span className="text-slate-600 dark:text-slate-400"> → {appContext.activeTaskTitle}</span>
              )}
            </span>
          </div>

          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-medium shrink-0 ml-2">
            {appContext.currentPage === 'tracker' ? '⏱ Tracker' : '📁 Projects'}
          </span>
        </div>

        {/* Optional OpenAI API Key Form */}
        {showKeyInput && (
          <form onSubmit={handleSaveKey} className="p-3 bg-sky-50 dark:bg-sky-950/40 border-b border-sky-200 dark:border-sky-800 flex items-center gap-2 text-xs">
            <input
              type="password"
              placeholder="Enter sk-... (Optional: defaults to offline Rachel engine)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg border border-sky-200 dark:border-sky-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
            />
            <button type="submit" className="px-3 py-1.5 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-500">
              Save
            </button>
          </form>
        )}

        {/* Quick Suggested Action Pills */}
        <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto no-scrollbar text-xs">
          <button
            type="button"
            onClick={() =>
              handleSendMessage(
                appContext.activeTaskTitle
                  ? `I'm stuck on "${appContext.activeTaskTitle}". Rachel, help me troubleshoot this step-by-step!`
                  : `I'm stuck on my current task. Rachel, help me get unstuck!`
              )
            }
            className="whitespace-nowrap px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-100 font-medium transition flex items-center gap-1.5"
          >
            <span>🌸 Get Unstuck</span>
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage("Break down client brief: We need a redesigned customer onboarding funnel with phone verification.")}
            className="whitespace-nowrap px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-400 transition"
          >
            📋 Break down brief
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage("How many hours did I log for Acme Design Studio this month?")}
            className="whitespace-nowrap px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-400 transition"
          >
            📊 Hours & Revenue
          </button>
        </div>

        {/* Chat Stream History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-slate-50/50 dark:bg-slate-950/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl p-4 shadow-sm ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-sky-600 to-sky-700 text-white rounded-br-none shadow-sky-600/10'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-sky-100 dark:border-slate-700'
                }`}
              >
                {/* User-attached image thumbnail if present */}
                {m.imageUrl && (
                  <div className="mb-3 rounded-xl overflow-hidden border border-white/20 dark:border-slate-700">
                    <img
                      src={m.imageUrl}
                      alt="Uploaded context"
                      className="max-h-56 w-auto object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Content text with markdown formatting */}
                <div className="whitespace-pre-wrap leading-relaxed text-[13.5px]">
                  {m.content}
                </div>

                {/* --- ACTION CARD 1: TASK BREAKDOWN --- */}
                {m.actionType === 'task_breakdown' && m.actionData?.tasks && (
                  <div className="mt-3 pt-3 border-t border-sky-100 dark:border-slate-700 space-y-2">
                    <div className="space-y-1.5">
                      {m.actionData.tasks.map((task, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-sky-50/50 dark:bg-slate-900 border border-sky-100 dark:border-slate-800 flex items-start justify-between gap-2"
                        >
                          <div>
                            <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                              {task.title}
                            </div>
                            {task.description && (
                              <p className="text-[11px] text-slate-500 mt-0.5">{task.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {task.estimatedHours}h
                            </span>
                            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                              task.priority === 'urgent'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      {committedTaskMessageId === m.id ? (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Added to project tasks!
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCommitTasksToProject(m.actionData!.tasks!, m.id)}
                          className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center gap-1.5 shadow-sm transition"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Commit All {m.actionData.tasks.length} Tasks to Project</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* --- ACTION CARD 2: CLIENT EMAIL DRAFT --- */}
                {m.actionType === 'client_communication' && m.actionData?.email && (
                  <div className="mt-3 pt-3 border-t border-sky-100 dark:border-slate-700 space-y-2">
                    <div className="p-3 rounded-xl bg-sky-50/40 dark:bg-slate-900 border border-sky-100 dark:border-slate-800 text-xs space-y-1.5">
                      <div className="text-slate-500">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">To:</span> {m.actionData.email.recipient}
                      </div>
                      <div className="text-slate-500">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Subject:</span> {m.actionData.email.subject}
                      </div>
                      <div className="pt-2 border-t border-sky-100 dark:border-slate-800 whitespace-pre-wrap text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
                        {m.actionData.email.body}
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyEmail(
                            `Subject: ${m.actionData!.email!.subject}\n\n${m.actionData!.email!.body}`,
                            m.id
                          )
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-100 dark:bg-slate-700 text-sky-800 dark:text-slate-200 hover:bg-sky-200 transition"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Message</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* --- ACTION CARD 3: DATA INSIGHT STATS --- */}
                {m.actionType === 'data_insight' && m.actionData?.insight && (
                  <div className="mt-3 pt-3 border-t border-sky-100 dark:border-slate-700 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-sky-50/50 dark:bg-slate-900 border border-sky-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold uppercase text-slate-400">Total Hours</span>
                        <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                          {m.actionData.insight.totalHours}h
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-sky-50/50 dark:bg-slate-900 border border-sky-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold uppercase text-slate-400">Billable Value</span>
                        <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                          ${m.actionData.insight.totalEarnings}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-sky-700 dark:text-sky-300 p-2 bg-sky-50/60 dark:bg-sky-950/40 rounded-xl w-fit">
              <Flower2 className="w-4 h-4 text-sky-500 animate-spin" />
              <span>Rachel is analyzing your task and screenshot...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* --- IMAGE PREVIEW CHIP (IF SELECTED) --- */}
        {selectedImage && (
          <div className="px-4 py-2 bg-sky-50 dark:bg-slate-800/80 border-t border-sky-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={selectedImage} alt="Attachment preview" className="w-10 h-10 object-cover rounded-lg border border-sky-200" />
              <div className="text-xs">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Image Attached</p>
                <p className="text-[10px] text-slate-400">Rachel will diagnose errors or review this design.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="p-1 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* --- MESSAGE INPUT & IMAGE UPLOAD BAR --- */}
        <div className="p-3.5 border-t border-sky-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Hidden File Input for Image Upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Image Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl border border-sky-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 transition"
              title="Upload Screenshot / Design Mockup"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Text Input */}
            <input
              type="text"
              placeholder={
                appContext.activeTaskTitle 
                  ? `Ask Rachel about "${appContext.activeTaskTitle}"...` 
                  : "Ask Rachel anything, paste brief, or ask to get unstuck..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-sky-200 dark:border-slate-700 bg-sky-50/40 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !selectedImage)}
              className="p-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 disabled:opacity-50 text-white shadow-sm shadow-sky-500/20 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
