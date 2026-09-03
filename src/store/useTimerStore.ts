// src/store/useTimerStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TimerStatus } from '../types';
import { useWorkflowStore } from './useWorkflowStore';

interface TimerState {
  status: TimerStatus;
  projectId: string;
  taskId: string;
  description: string;
  isBillable: boolean;
  startTime: number | null; // epoch timestamp ms
  pausedDurationMs: number;
  lastPausedAt: number | null; // epoch timestamp ms

  // Actions
  startTimer: (params: { projectId: string; taskId?: string; description?: string; isBillable?: boolean }) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => { loggedDurationSeconds: number } | null;
  discardTimer: () => void;
  setProject: (projectId: string) => void;
  setTask: (taskId: string) => void;
  setDescription: (description: string) => void;
  setIsBillable: (isBillable: boolean) => void;
  
  // Real-time calculation helper
  getElapsedSeconds: () => number;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      projectId: '',
      taskId: '',
      description: '',
      isBillable: true,
      startTime: null,
      pausedDurationMs: 0,
      lastPausedAt: null,

      startTimer: ({ projectId, taskId = '', description = '', isBillable = true }) => {
        const now = Date.now();
        set({
          status: 'running',
          projectId,
          taskId,
          description,
          isBillable,
          startTime: now,
          pausedDurationMs: 0,
          lastPausedAt: null,
        });
      },

      pauseTimer: () => {
        const state = get();
        if (state.status !== 'running') return;
        set({
          status: 'paused',
          lastPausedAt: Date.now(),
        });
      },

      resumeTimer: () => {
        const state = get();
        if (state.status !== 'paused' || !state.lastPausedAt) return;
        const additionalPause = Date.now() - state.lastPausedAt;
        set({
          status: 'running',
          pausedDurationMs: state.pausedDurationMs + additionalPause,
          lastPausedAt: null,
        });
      },

      stopTimer: () => {
        const state = get();
        if (state.status === 'idle' || !state.startTime) return null;

        const now = Date.now();
        let totalElapsedMs = 0;

        if (state.status === 'paused' && state.lastPausedAt) {
          totalElapsedMs = state.lastPausedAt - state.startTime - state.pausedDurationMs;
        } else {
          totalElapsedMs = now - state.startTime - state.pausedDurationMs;
        }

        const totalSeconds = Math.max(1, Math.round(totalElapsedMs / 1000));
        const startTimeISO = new Date(state.startTime).toISOString();
        const endTimeISO = new Date(now).toISOString();

        // Automatically commit into persistent WorkFlow TimeLogs store
        if (state.projectId) {
          useWorkflowStore.getState().addTimeLog({
            projectId: state.projectId,
            taskId: state.taskId || undefined,
            description: state.description.trim() || 'Tracked work session',
            startTime: startTimeISO,
            endTime: endTimeISO,
            durationSeconds: totalSeconds,
            isBillable: state.isBillable,
          });
        }

        // Reset timer to idle
        set({
          status: 'idle',
          startTime: null,
          pausedDurationMs: 0,
          lastPausedAt: null,
          description: '',
          taskId: '',
        });

        return { loggedDurationSeconds: totalSeconds };
      },

      discardTimer: () => {
        set({
          status: 'idle',
          startTime: null,
          pausedDurationMs: 0,
          lastPausedAt: null,
          description: '',
          taskId: '',
        });
      },

      setProject: (projectId: string) => set({ projectId }),
      setTask: (taskId: string) => set({ taskId }),
      setDescription: (description: string) => set({ description }),
      setIsBillable: (isBillable: boolean) => set({ isBillable }),

      getElapsedSeconds: () => {
        const state = get();
        if (state.status === 'idle' || !state.startTime) return 0;

        if (state.status === 'paused' && state.lastPausedAt) {
          const ms = state.lastPausedAt - state.startTime - state.pausedDurationMs;
          return Math.max(0, Math.floor(ms / 1000));
        }

        const ms = Date.now() - state.startTime - state.pausedDurationMs;
        return Math.max(0, Math.floor(ms / 1000));
      },
    }),
    {
      name: 'workflow-active-timer',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
