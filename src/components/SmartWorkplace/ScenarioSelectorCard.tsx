// src/components/SmartWorkplace/ScenarioSelectorCard.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Check, 
  Zap,
  CheckSquare2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useSmartWorkplaceStore, TaskCategoryFilter } from '../../store/useSmartWorkplaceStore';

const FILTER_TABS: { id: TaskCategoryFilter; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'high', label: 'High Priority' },
  { id: 'done', label: 'Completed' },
  { id: 'all', label: 'All Tasks' },
];

export const ScenarioSelectorCard: React.FC = () => {
  const { 
    tasks, 
    taskFilter, 
    setTaskFilter, 
    toggleTaskCompletion, 
    addNewTask,
    setActiveSprintTaskId,
    activeSprintTaskId,
    launchFocusForTask,
    isSprintRunning
  } = useSmartWorkplaceStore();

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProject, setNewProject] = useState('Brand Identity & Web Portal');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [newDueDate, setNewDueDate] = useState('Today, 5:00 PM');

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'done') return t.status === 'done';
    if (taskFilter === 'high') return t.priority === 'high';
    if (taskFilter === 'today') {
      const lowerDue = t.dueDate.toLowerCase();
      return lowerDue.includes('today') || lowerDue.includes('tomorrow') || t.status === 'in_progress';
    }
    if (taskFilter === 'upcoming') {
      const lowerDue = t.dueDate.toLowerCase();
      return lowerDue.includes('day') || lowerDue.includes('sep') || lowerDue.includes('next') || lowerDue.includes('week');
    }
    return t.status === taskFilter;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addNewTask({
      title: newTitle.trim(),
      project: newProject,
      client: 'Acme Design Studio',
      priority: newPriority,
      dueDate: newDueDate,
    });

    setNewTitle('');
    setIsAddingTask(false);
  };

  return (
    <div className="relative rounded-3xl p-5 bg-[#161920]/80 border border-white/10 backdrop-blur-xl shadow-2xl hover:border-white/20 transition-all duration-300">
      
      {/* Card Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-orange-400">
            <CheckSquare2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Interactive Task Manager</h3>
            <p className="text-[10px] text-slate-400">To-do checklist & Focus Sprint launcher</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-orange-400 px-2 py-0.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <Sparkles className="w-3 h-3" />
          <span>{tasks.filter((t) => t.status !== 'done').length} Pending</span>
        </div>
      </div>

      {/* Workflow Category Filter Tabs (Today, Upcoming, High Priority, Completed, All) */}
      <div className="flex items-center gap-1 pt-3 pb-2 overflow-x-auto">
        {FILTER_TABS.map((tab) => {
          const isActive = taskFilter === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setTaskFilter(tab.id)}
              className={`relative px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'text-white font-semibold bg-white/10 border border-white/15 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              <span>{tab.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="active-task-filter"
                  className="absolute -bottom-1 inset-x-2 h-0.5 rounded-full bg-orange-500" 
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Task List Items */}
      <div className="mt-2 space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {filteredTasks.map((task) => {
            const isDone = task.status === 'done';
            const isFocused = activeSprintTaskId === task.id;

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setActiveSprintTaskId(task.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isFocused 
                    ? 'bg-orange-500/[0.08] border-orange-500/40 shadow-sm ring-1 ring-orange-500/20' 
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/15'
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskCompletion(task.id);
                      }}
                      className="mt-0.5 text-orange-400 hover:text-orange-300 transition shrink-0"
                      title={isDone ? 'Mark Incomplete' : 'Mark Completed'}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 fill-orange-400 text-black" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 hover:text-orange-400" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <h4 className={`text-xs font-semibold tracking-tight truncate ${isDone ? 'line-through text-slate-500' : 'text-white'}`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <span className="truncate">{task.project}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-500 shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          {task.dueDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Priority Badge & Start Focus Action Button */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Priority Tag */}
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase ${
                      task.priority === 'high' 
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25' 
                        : task.priority === 'medium'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                        : 'bg-slate-500/15 text-slate-400 border border-slate-500/25'
                    }`}>
                      {task.priority}
                    </span>

                    {/* Start Focus Action Button linking to Focus Sprint & Focus Mode */}
                    <button
                      onClick={() => launchFocusForTask(task.id, 25)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all active:scale-95 ${
                        isFocused && isSprintRunning
                          ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/40 animate-pulse'
                          : 'bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30'
                      }`}
                      title="Launch Focus Sprint for this task"
                    >
                      <Zap className="w-3 h-3 fill-current" />
                      <span className="hidden sm:inline">Start Focus</span>
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${task.progress}%` }}
                      transition={{ duration: 0.6 }}
                      className={`h-full rounded-full ${
                        isDone 
                          ? 'bg-emerald-500' 
                          : 'bg-gradient-to-r from-orange-500 to-amber-500'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 font-medium shrink-0">
                    {task.progress}%
                  </span>
                </div>

              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredTasks.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-500">
            No tasks found in this view
          </div>
        )}
      </div>

      {/* Bottom Action / Inline Add Task Form */}
      <div className="mt-3 pt-3 border-t border-white/5">
        {isAddingTask ? (
          <form onSubmit={handleCreateTask} className="space-y-2.5 p-3 rounded-2xl bg-black/40 border border-white/10">
            <input 
              type="text"
              autoFocus
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task deliverable title (e.g. Implement Zoom webhook)..."
              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="bg-slate-900 border border-white/15 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              <select
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                className="bg-slate-900 border border-white/15 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="Brand Identity & Web Portal">Brand Identity</option>
                <option value="Mobile Crypto Wallet MVP">Mobile Wallet</option>
                <option value="Internal Platform Tooling">Internal Tooling</option>
                <option value="E-Commerce Expansion">E-Commerce</option>
              </select>

              <div className="relative">
                <input
                  type="text"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  placeholder="Due date (e.g., Today, 5 PM)"
                  className="w-full pl-6 pr-2 py-1 bg-slate-900 border border-white/15 rounded-lg text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <Calendar className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Task</span>
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingTask(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-dashed border-white/15 text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5 text-orange-400" />
            <span>+ Add Task</span>
          </button>
        )}
      </div>

    </div>
  );
};
