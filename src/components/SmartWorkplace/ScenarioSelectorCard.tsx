// src/components/SmartWorkplace/ScenarioSelectorCard.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Check, 
  MoreVertical,
  Layers
} from 'lucide-react';
import { useSmartWorkplaceStore, TaskCategoryFilter } from '../../store/useSmartWorkplaceStore';

const FILTER_TABS: { id: TaskCategoryFilter; label: string }[] = [
  { id: 'all', label: 'All Projects' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Completed' },
];

export const ScenarioSelectorCard: React.FC = () => {
  const { 
    tasks, 
    taskFilter, 
    setTaskFilter, 
    toggleTaskCompletion, 
    addNewTask,
    setActiveSprintTaskId,
    activeSprintTaskId
  } = useSmartWorkplaceStore();

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const newProject = 'Brand Identity & Web Portal';
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('high');

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'all') return true;
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
      dueDate: 'Friday, 5 PM',
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
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Project & Workflow Overview</h3>
            <p className="text-[10px] text-slate-400">Active deliverables & sprint queue</p>
          </div>
        </div>

        <button className="text-slate-400 hover:text-white transition">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Workflow Category Filter Tabs */}
      <div className="flex items-center gap-1.5 pt-3.5 pb-2 overflow-x-auto">
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
                  className="absolute -bottom-1 inset-x-3 h-0.5 rounded-full bg-orange-500" 
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Task List Items */}
      <div className="mt-2 space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
        {filteredTasks.map((task) => {
          const isDone = task.status === 'done';
          const isFocused = activeSprintTaskId === task.id;

          return (
            <div
              key={task.id}
              onClick={() => setActiveSprintTaskId(task.id)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                isFocused 
                  ? 'bg-orange-500/[0.08] border-orange-500/40 shadow-sm' 
                  : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/15'
              }`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskCompletion(task.id);
                    }}
                    className="mt-0.5 text-orange-400 hover:text-orange-300 transition shrink-0"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 fill-orange-400 text-black" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 hover:text-orange-400" />
                    )}
                  </button>

                  <div className="min-w-0">
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

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Priority Tag */}
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    task.priority === 'high' 
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25' 
                      : task.priority === 'medium'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                      : 'bg-slate-500/15 text-slate-400 border border-slate-500/25'
                  }`}>
                    {task.priority}
                  </span>
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

            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-500">
            No tasks in this category
          </div>
        )}
      </div>

      {/* Bottom Action / Inline Add Task Form */}
      <div className="mt-3 pt-3 border-t border-white/5">
        {isAddingTask ? (
          <form onSubmit={handleCreateTask} className="space-y-2 p-2.5 rounded-2xl bg-black/40 border border-white/10">
            <input 
              type="text"
              autoFocus
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task deliverable title..."
              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            
            <div className="flex items-center justify-between gap-2">
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="bg-slate-900 border border-white/15 rounded-lg px-2 py-1 text-[11px] text-slate-300"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Task</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingTask(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-dashed border-white/15 text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5 text-orange-400" />
            <span>Add New Task</span>
          </button>
        )}
      </div>

    </div>
  );
};
