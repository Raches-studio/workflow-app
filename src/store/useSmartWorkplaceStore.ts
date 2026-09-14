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
  TEAM_ACTIVITY_FEED
} from '../components/SmartWorkplace/mockSmartHubData';

export type AmbienceMode = 'warm' | 'neutral' | 'cold';
export type TaskCategoryFilter = 'all' | 'in_progress' | 'review' | 'done';

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
