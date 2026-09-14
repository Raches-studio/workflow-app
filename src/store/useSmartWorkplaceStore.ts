// src/store/useSmartWorkplaceStore.ts
import { create } from 'zustand';
import { 
  WorkspaceMember, 
  INITIAL_WORKSPACE_MEMBERS, 
  ProductivityTask,
  INITIAL_PRODUCTIVITY_TASKS,
  LiveMeetingRoom,
  LIVE_MEETING_ROOMS,
  TeamActivityItem,
  TEAM_ACTIVITY_FEED,
  CalendarEvent,
  INITIAL_CALENDAR_EVENTS
} from '../components/SmartWorkplace/mockSmartHubData';

import { useToastStore } from './useToastStore';

export type AmbienceMode = 'warm' | 'neutral' | 'cold';
export type TaskCategoryFilter = 'all' | 'today' | 'upcoming' | 'high' | 'done' | 'in_progress' | 'review';

interface SmartWorkplaceState {
  // Workplace Ambience & Focus Temperature
  ambienceMode: AmbienceMode;
  setAmbienceMode: (mode: AmbienceMode) => void;

  // Mobile Focus Sprint Timer
  isSprintRunning: boolean;
  sprintRemainingSeconds: number; // 25 min = 1500 seconds
  sprintDurationSeconds: number;
  activeSprintTaskId: string;
  toggleSprintTimer: () => void;
  resetSprintTimer: (durationSeconds?: number) => void;
  setSprintRemainingSeconds: (seconds: number) => void;
  setActiveSprintTaskId: (id: string) => void;
  launchFocusForTask: (taskId: string, durationMinutes?: number) => void;
  launchFocusForCalendarEvent: (event: CalendarEvent) => void;
  onSprintCompleted: () => void;

  // Project Tasks & Workflow Overview
  tasks: ProductivityTask[];
  taskFilter: TaskCategoryFilter;
  setTaskFilter: (filter: TaskCategoryFilter) => void;
  toggleTaskCompletion: (taskId: string) => void;
  addNewTask: (task: { title: string; project: string; client: string; priority: 'high' | 'medium' | 'low'; dueDate: string }) => void;

  // Live Meeting Room & Video Call
  activeMeetingId: string;
  setActiveMeetingId: (id: string) => void;
  meetingRooms: LiveMeetingRoom[];
  isMicMuted: boolean;
  isVideoOn: boolean;
  isMeetingModalOpen: boolean;
  toggleMic: () => void;
  toggleVideo: () => void;
  setMeetingModalOpen: (open: boolean) => void;
  addMeetingRoom: (newRoom: { title: string; category: string; topic: string; meetingUrl: string; platform?: 'google_meet' | 'zoom' | 'custom'; scheduledTime?: string }) => void;
  updateMeetingUrl: (id: string, meetingUrl: string) => void;

  // Interactive Calendar & Schedule
  calendarEvents: CalendarEvent[];
  calendarViewMode: 'week' | 'month';
  setCalendarViewMode: (mode: 'week' | 'month') => void;
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  markCalendarEventCompleted: (id: string) => void;

  // Executive Goals & Focus Mode Modal
  isFocusModalOpen: boolean;
  setFocusModalOpen: (open: boolean) => void;
  dailyGoalProgress: {
    completedDeliverables: number;
    totalDeliverables: number;
    loggedHours: number;
    unbilledAmount: number;
  };
  incrementGoalDeliverable: () => void;

  // Team & Workspace
  members: WorkspaceMember[];
  activityFeed: TeamActivityItem[];
  isInviteModalOpen: boolean;
  setInviteModalOpen: (open: boolean) => void;
  inviteMember: (newMember: { fullName: string; email: string; role: 'admin' | 'manager' | 'member'; department: string }) => void;
  updateMemberRole: (memberId: string, role: 'admin' | 'manager' | 'member') => void;
  removeMember: (memberId: string) => void;

  // Navigation
  activeSubView: 'dashboard' | 'team';
  setActiveSubView: (view: 'dashboard' | 'team') => void;
}

export const useSmartWorkplaceStore = create<SmartWorkplaceState>((set) => ({
  // Ambience
  ambienceMode: 'warm',
  setAmbienceMode: (mode) => set({ ambienceMode: mode }),

  // Mobile Focus Sprint
  isSprintRunning: true,
  sprintRemainingSeconds: 1245, // 20m 45s remaining
  sprintDurationSeconds: 1500, // 25m Pomodoro block
  activeSprintTaskId: 'task-1',
  toggleSprintTimer: () => set((state) => ({ isSprintRunning: !state.isSprintRunning })),
  resetSprintTimer: (durationSeconds = 1500) => set({
    sprintDurationSeconds: durationSeconds,
    sprintRemainingSeconds: durationSeconds,
    isSprintRunning: false,
  }),
  setSprintRemainingSeconds: (seconds) => set({ sprintRemainingSeconds: seconds }),
  setActiveSprintTaskId: (id) => set({ activeSprintTaskId: id }),

  launchFocusForTask: (taskId, durationMinutes = 25) => {
    const durationSeconds = durationMinutes * 60;
    set((state) => {
      const targetTask = state.tasks.find((t) => t.id === taskId);
      useToastStore.getState().showSuccess(
        'Deep Focus Sprint Started! 🎯',
        targetTask ? `Target deliverable: ${targetTask.title} (${durationMinutes}m)` : undefined
      );
      return {
        activeSprintTaskId: taskId,
        sprintDurationSeconds: durationSeconds,
        sprintRemainingSeconds: durationSeconds,
        isSprintRunning: true,
        isFocusModalOpen: true,
      };
    });
  },

  launchFocusForCalendarEvent: (event) => {
    const durationSeconds = (event.durationMinutes || 25) * 60;
    set((state) => {
      const taskId = event.taskId || state.activeSprintTaskId;
      useToastStore.getState().showSuccess(
        'Focus Block Launched! ⚡',
        `Focus block: ${event.title} (${event.durationMinutes || 25}m)`
      );
      return {
        activeSprintTaskId: taskId,
        sprintDurationSeconds: durationSeconds,
        sprintRemainingSeconds: durationSeconds,
        isSprintRunning: true,
        isFocusModalOpen: true,
      };
    });
  },

  onSprintCompleted: () => {
    set((state) => {
      const activeTask = state.tasks.find((t) => t.id === state.activeSprintTaskId);
      useToastStore.getState().showSuccess(
        'Focus Sprint Completed! 🏆',
        activeTask ? `Sprint for "${activeTask.title}" finished. Block marked complete!` : 'Sprint completed!'
      );

      // Automatically mark matching calendar focus block completed
      const updatedCalendar = state.calendarEvents.map((evt) => {
        if (
          evt.type === 'focus_block' &&
          !evt.isCompleted &&
          (evt.taskId === state.activeSprintTaskId || evt.title.toLowerCase().includes(activeTask?.title?.toLowerCase() || ''))
        ) {
          return { ...evt, isCompleted: true };
        }
        return evt;
      });

      // Also update task completion or progress
      const updatedTasks = state.tasks.map((t) => {
        if (t.id === state.activeSprintTaskId) {
          return { ...t, progress: 100, status: 'done' as const };
        }
        return t;
      });

      return {
        isSprintRunning: false,
        sprintRemainingSeconds: 0,
        calendarEvents: updatedCalendar,
        tasks: updatedTasks,
      };
    });
  },

  // Tasks
  tasks: INITIAL_PRODUCTIVITY_TASKS,
  taskFilter: 'all',
  setTaskFilter: (filter) => set({ taskFilter: filter }),
  toggleTaskCompletion: (taskId) => set((state) => ({
    tasks: state.tasks.map((t) => {
      if (t.id === taskId) {
        const isDone = t.status === 'done';
        return {
          ...t,
          status: isDone ? 'in_progress' : 'done',
          progress: isDone ? 70 : 100,
        };
      }
      return t;
    }),
  })),
  addNewTask: (newTask) => set((state) => {
    const task: ProductivityTask = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      project: newTask.project || 'Active Client Project',
      client: newTask.client || 'WorkHub Direct',
      priority: newTask.priority,
      progress: 10,
      status: 'in_progress',
      dueDate: newTask.dueDate || 'Next Week',
      assignee: {
        name: 'Maria Z.',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      },
    };
    useToastStore.getState().showSuccess('Task Added! ✅', task.title);
    return { tasks: [task, ...state.tasks] };
  }),

  // Live Meetings
  activeMeetingId: 'room-alpha',
  setActiveMeetingId: (id) => set({ activeMeetingId: id }),
  meetingRooms: LIVE_MEETING_ROOMS,
  isMicMuted: false,
  isVideoOn: true,
  isMeetingModalOpen: false,
  toggleMic: () => set((state) => ({ isMicMuted: !state.isMicMuted })),
  toggleVideo: () => set((state) => ({ isVideoOn: !state.isVideoOn })),
  setMeetingModalOpen: (open) => set({ isMeetingModalOpen: open }),

  addMeetingRoom: (newRoom) => set((state) => {
    let platform: 'google_meet' | 'zoom' | 'custom' = newRoom.platform || 'custom';
    if (newRoom.meetingUrl.includes('meet.google.com')) platform = 'google_meet';
    else if (newRoom.meetingUrl.includes('zoom.us')) platform = 'zoom';

    const room: LiveMeetingRoom = {
      id: `room-${Date.now()}`,
      title: newRoom.title,
      category: newRoom.category || 'Executive Suite',
      status: 'upcoming',
      participantCount: 1,
      participants: [
        {
          name: 'Maria Zakharova',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          role: 'Host',
        }
      ],
      previewImageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=900&auto=format&fit=crop&q=80',
      topic: newRoom.topic || 'Ad-hoc Team Sync',
      duration: 'Scheduled',
      isScreenSharing: false,
      meetingUrl: newRoom.meetingUrl,
      platform,
      scheduledTime: newRoom.scheduledTime || 'Today, Upcoming',
      date: 'Today',
    };

    useToastStore.getState().showSuccess('Meeting Sync Created! 📹', `Room "${room.title}" ready.`);
    return {
      meetingRooms: [room, ...state.meetingRooms],
      activeMeetingId: room.id,
    };
  }),

  updateMeetingUrl: (id, meetingUrl) => set((state) => {
    let platform: 'google_meet' | 'zoom' | 'custom' = 'custom';
    if (meetingUrl.includes('meet.google.com')) platform = 'google_meet';
    else if (meetingUrl.includes('zoom.us')) platform = 'zoom';

    return {
      meetingRooms: state.meetingRooms.map((r) =>
        r.id === id ? { ...r, meetingUrl, platform } : r
      ),
    };
  }),

  // Interactive Calendar & Schedule
  calendarEvents: INITIAL_CALENDAR_EVENTS,
  calendarViewMode: 'week',
  setCalendarViewMode: (mode) => set({ calendarViewMode: mode }),
  addCalendarEvent: (event) => set((state) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: `cal-${Date.now()}`,
    };
    useToastStore.getState().showSuccess('Calendar Event Added! 📅', newEvent.title);
    return { calendarEvents: [...state.calendarEvents, newEvent] };
  }),
  markCalendarEventCompleted: (id) => set((state) => {
    const target = state.calendarEvents.find((e) => e.id === id);
    const newStatus = target ? !target.isCompleted : true;
    useToastStore.getState().showSuccess(
      newStatus ? 'Block Completed! ✅' : 'Block Marked Active',
      target?.title
    );
    return {
      calendarEvents: state.calendarEvents.map((evt) =>
        evt.id === id ? { ...evt, isCompleted: newStatus } : evt
      ),
    };
  }),

  // Goals & Focus Modal
  isFocusModalOpen: false,
  setFocusModalOpen: (open) => set({ isFocusModalOpen: open }),
  dailyGoalProgress: {
    completedDeliverables: 4,
    totalDeliverables: 6,
    loggedHours: 6.5,
    unbilledAmount: 1420,
  },
  incrementGoalDeliverable: () => set((state) => ({
    dailyGoalProgress: {
      ...state.dailyGoalProgress,
      completedDeliverables: Math.min(
        state.dailyGoalProgress.totalDeliverables,
        state.dailyGoalProgress.completedDeliverables + 1
      ),
    },
  })),

  // Team
  members: INITIAL_WORKSPACE_MEMBERS,
  activityFeed: TEAM_ACTIVITY_FEED,
  isInviteModalOpen: false,
  setInviteModalOpen: (open) => set({ isInviteModalOpen: open }),
  inviteMember: (newMember) => set((state) => {
    const avatarList = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
    ];
    const randomAvatar = avatarList[Math.floor(Math.random() * avatarList.length)];
    const member: WorkspaceMember = {
      id: `mem-${Date.now()}`,
      fullName: newMember.fullName,
      email: newMember.email,
      role: newMember.role,
      department: newMember.department || 'Engineering Team',
      status: 'pending',
      avatarUrl: randomAvatar,
      joinedDate: 'Just now',
      location: 'Remote',
      assignedSpaces: ['General Workspace'],
    };
    return { members: [member, ...state.members], isInviteModalOpen: false };
  }),
  updateMemberRole: (memberId, role) => set((state) => ({
    members: state.members.map((m) => (m.id === memberId ? { ...m, role } : m)),
  })),
  removeMember: (memberId) => set((state) => ({
    members: state.members.filter((m) => m.id !== memberId),
  })),

  // Sub View
  activeSubView: 'dashboard',
  setActiveSubView: (view) => set({ activeSubView: view }),
}));
