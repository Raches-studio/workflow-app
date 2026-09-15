// src/components/SmartWorkplace/TasksView.tsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare2, 
  Plus, 
  Zap, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Search, 
  Sparkles, 
  Check, 
  Target
} from 'lucide-react';
import { useSmartWorkplaceStore, TaskCategoryFilter } from '../../store/useSmartWorkplaceStore';

const FILTER_TABS: { id: TaskCategoryFilter; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'high', label: 'High Priority' },
  { id: 'done', label: 'Completed' },
  { id: 'all', label: 'All Tasks' },
];

export const TasksView: React.FC = () => {
  const { 
    tasks, 
    taskFilter, 
    setTaskFilter, 
    toggleTaskCompletion, 
    addNewTask,
    activeSprintTaskId,
    setActiveSprintTaskId,
    launchFocusForTask,
    isSprintRunning
  } = useSmartWorkplaceStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // New task form fields
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [project, setProject] = useState('Brand Identity & Web Portal');
  const [dueDate, setDueDate] = useState('Today, 5:00 PM');

  const projectsList = useMemo(() => {
    const list = Array.from(new Set(tasks.map((t) => t.project)));
    return ['all', ...list];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesQuery = 
          t.title.toLowerCase().includes(query) ||
          t.project.toLowerCase().includes(query) ||
          t.client.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // Project filter
      if (selectedProject !== 'all' && t.project !== selectedProject) {
        return false;
      }

      // Tab filter
      if (taskFilter === 'all') return true;
      if (taskFilter === 'done') return t.status === 'done';
      if (taskFilter === 'high') return t.priority === 'high';
      if (taskFilter === 'today') {
        const lower = t.dueDate.toLowerCase();
        return lower.includes('today') || lower.includes('tomorrow') || t.status === 'in_progress';
      }
      if (taskFilter === 'upcoming') {
        const lower = t.dueDate.toLowerCase();
        return lower.includes('day') || lower.includes('sep') || lower.includes('next') || lower.includes('week');
      }
      return t.status === taskFilter;
    });
  }, [tasks, taskFilter, searchQuery, selectedProject]);

  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const pendingCount = tasks.length - completedCount;
  const completionPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addNewTask({
      title: title.trim(),
      project,
      client: 'Acme Design Studio',
      priority,
      dueDate,
    });

    setTitle('');
    setIsAddingTask(false);
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Top Header Command Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-[#161920]/80 border border-white/10 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shadow-inner">
              <CheckSquare2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>To-Do & Tasks Command Center</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase">
                  {pendingCount} Active
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage deliverables, track sprint progress, and launch instant Pomodoro Focus blocks
              </p>
            </div>
          </div>
        </div>

        {/* Sprint Completion Progress Meter */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-white/10">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-400" />
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Velocity</div>
              <div className="text-sm font-bold font-mono text-white">
                {completedCount}/{tasks.length} Done ({completionPercentage}%)
              </div>
            </div>
          </div>
          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500" 
              style={{ width: `${completionPercentage}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
        
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {FILTER_TABS.map((tab) => {
            const isActive = taskFilter === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setTaskFilter(tab.id)}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'text-white bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-sm shadow-orange-500/20'
                    : 'text-slate-400 hover:text-white bg-white/[0.02]'
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="tasks-view-active-tab"
                    className="absolute -bottom-1 inset-x-2 h-0.5 rounded-full bg-orange-500" 
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Project Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <input
              type="text"
              placeholder="Search deliverables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
          </div>

          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500 capitalize"
          >
            {projectsList.map((p) => (
              <option key={p} value={p}>
                {p === 'all' ? 'All Projects' : p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inline Quick Add Task Banner */}
      <div className="p-4 rounded-3xl bg-[#161920]/60 border border-white/10 backdrop-blur-xl">
        {isAddingTask ? (
          <form onSubmit={handleCreateTask} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                Create New Task Deliverable
              </span>
              <button 
                type="button" 
                onClick={() => setIsAddingTask(false)}
                className="text-slate-500 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <input
              type="text"
              autoFocus
              required
              placeholder="What deliverable needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Project</label>
                <select
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="Brand Identity & Web Portal">Brand Identity & Web Portal</option>
                  <option value="Mobile Crypto Wallet MVP">Mobile Crypto Wallet MVP</option>
                  <option value="Internal Platform Tooling">Internal Platform Tooling</option>
                  <option value="E-Commerce Expansion">E-Commerce Expansion</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Due Date</label>
                <input
                  type="text"
                  placeholder="e.g. Today, 5 PM"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-md shadow-orange-500/20"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Task</span>
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingTask(true)}
            className="w-full py-3 px-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-dashed border-white/15 text-xs font-semibold transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 text-orange-400" />
            <span>+ Add Task to Queue</span>
          </button>
        )}
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredTasks.map((task) => {
            const isDone = task.status === 'done';
            const isFocused = activeSprintTaskId === task.id;

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setActiveSprintTaskId(task.id)}
                className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  isFocused
                    ? 'bg-orange-500/[0.08] border-orange-500/40 ring-1 ring-orange-500/30 shadow-lg shadow-orange-500/10'
                    : 'bg-[#161920]/80 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Left Side: Checkbox & Title Details */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskCompletion(task.id);
                    }}
                    className="mt-0.5 text-orange-400 hover:text-orange-300 transition shrink-0"
                    title={isDone ? 'Mark Active' : 'Mark Done'}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 fill-orange-400 text-black" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500 hover:text-orange-400" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-sm font-semibold tracking-tight ${isDone ? 'line-through text-slate-500' : 'text-white'}`}>
                        {task.title}
                      </h3>

                      {/* Priority Badge */}
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase ${
                        task.priority === 'high' 
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25' 
                          : task.priority === 'medium'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                          : 'bg-slate-500/15 text-slate-400 border border-slate-500/25'
                      }`}>
                        {task.priority}
                      </span>

                      {isFocused && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-orange-500 text-white uppercase tracking-wider">
                          Active in Dial
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
                      <span className="text-slate-300 font-medium">{task.project}</span>
                      <span>•</span>
                      <span className="text-slate-500">{task.client}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {task.dueDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Progress Bar & Start Focus Action */}
                <div className="flex items-center gap-4 shrink-0" onClick={(e) => e.stopPropagation()}>
                  
                  {/* Progress bar */}
                  <div className="hidden sm:flex items-center gap-2 w-32">
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          isDone 
                            ? 'bg-emerald-500' 
                            : 'bg-gradient-to-r from-orange-500 to-amber-500'
                        }`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold w-8 text-right">
                      {task.progress}%
                    </span>
                  </div>

                  {/* Assignee Avatar */}
                  <div className="hidden md:flex items-center gap-1.5">
                    <img 
                      src={task.assignee.avatarUrl} 
                      alt={task.assignee.name}
                      title={task.assignee.name}
                      className="w-6 h-6 rounded-full object-cover border border-white/10"
                    />
                  </div>

                  {/* Direct Start Focus Button */}
                  <button
                    onClick={() => launchFocusForTask(task.id, 25)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      isFocused && isSprintRunning
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/40 animate-pulse'
                        : 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500 hover:to-amber-500 text-orange-300 hover:text-white border border-orange-500/30'
                    }`}
                    title="Launch 25m Pomodoro Sprint for this task"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Start Focus</span>
                  </button>
                </div>

              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredTasks.length === 0 && (
          <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/5 text-slate-500 text-sm">
            No tasks found in this category.
          </div>
        )}
      </div>

    </div>
  );
};
