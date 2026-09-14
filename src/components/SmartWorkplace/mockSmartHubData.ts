// src/components/SmartWorkplace/mockSmartHubData.ts

export interface WorkspaceMember {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  department: string;
  status: 'active' | 'pending' | 'offline';
  avatarUrl: string;
  joinedDate: string;
  location?: string;
  assignedSpaces?: string[];
}

export interface ProductivityTask {
  id: string;
  title: string;
  project: string;
  client: string;
  priority: 'high' | 'medium' | 'low';
  progress: number; // 0-100
  status: 'todo' | 'in_progress' | 'review' | 'done';
  dueDate: string;
  assignee: {
    name: string;
    avatarUrl: string;
  };
}

export interface LiveMeetingRoom {
  id: string;
  title: string;
  category: string;
  status: 'live' | 'upcoming' | 'ended';
  participantCount: number;
  participants: {
    name: string;
    avatarUrl: string;
    role: string;
    isSpeaking?: boolean;
    isMuted?: boolean;
  }[];
  previewImageUrl: string;
  topic: string;
  duration: string;
  isScreenSharing: boolean;
  meetingUrl?: string;
  platform?: 'google_meet' | 'zoom' | 'custom';
  scheduledTime?: string;
  date?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'meeting' | 'deadline' | 'focus_block';
  date: string;
  dayOfWeek: number; // 0-6 (Sun-Sat)
  startTime: string;
  endTime: string;
  durationMinutes: number;
  platform?: 'google_meet' | 'zoom' | 'custom';
  meetingUrl?: string;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  isCompleted?: boolean;
  priority?: 'high' | 'medium' | 'low';
  description?: string;
}

export interface TeamActivityItem {
  id: string;
  user: string;
  avatarUrl: string;
  action: string;
  target: string;
  timeAgo: string;
}

export interface ProductivityHourData {
  day: string;
  billableHours: number;
  totalHours: number;
  isPeak?: boolean;
}

export const INITIAL_WORKSPACE_MEMBERS: WorkspaceMember[] = [
  {
    id: 'mem-1',
    fullName: 'Maria Zakharova',
    email: 'maria.z@workhub.io',
    role: 'admin',
    department: 'Operations & Engineering',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'Jan 2024',
    location: 'Zurich HQ',
    assignedSpaces: ['All Projects', 'Security Grid', 'Approvals'],
  },
  {
    id: 'mem-2',
    fullName: 'David Sterling',
    email: 'david.sterling@fintechlabs.io',
    role: 'manager',
    department: 'Engineering Lead',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'Mar 2024',
    location: 'London Studio',
    assignedSpaces: ['Mobile Wallet MVP', 'API Infrastructure'],
  },
  {
    id: 'mem-3',
    fullName: 'Sarah Jenkins',
    email: 'sarah@acmestudio.design',
    role: 'manager',
    department: 'Design & Creative Ops',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'Apr 2024',
    location: 'Berlin Hub',
    assignedSpaces: ['Brand Identity Portal', 'Design Systems'],
  },
  {
    id: 'mem-4',
    fullName: 'Elena Rostova',
    email: 'elena@nordicstyle.co',
    role: 'member',
    department: 'Product Research',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'May 2024',
    location: 'Stockholm Office',
    assignedSpaces: ['User Journey Tests'],
  },
  {
    id: 'mem-5',
    fullName: 'Alex Rivera',
    email: 'alex.rivera@workhub.io',
    role: 'member',
    department: 'Backend Architecture',
    status: 'pending',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'Invited 2d ago',
    location: 'Remote',
    assignedSpaces: ['Cloud Security'],
  },
];

export const INITIAL_PRODUCTIVITY_TASKS: ProductivityTask[] = [
  {
    id: 'task-1',
    title: 'Brand Portal Design System Overhaul',
    project: 'Brand Identity & Web Portal',
    client: 'Acme Design Studio',
    priority: 'high',
    progress: 75,
    status: 'in_progress',
    dueDate: 'Tomorrow, 5:00 PM',
    assignee: {
      name: 'Maria Z.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 'task-2',
    title: 'Biometric Auth & FaceID Flow',
    project: 'Mobile Crypto Wallet MVP',
    client: 'FinTech Labs Inc.',
    priority: 'high',
    progress: 90,
    status: 'review',
    dueDate: 'In 2 days',
    assignee: {
      name: 'David S.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 'task-3',
    title: 'Automated Invoice PDF Engine',
    project: 'Internal Platform Tooling',
    client: 'WorkHub Core',
    priority: 'medium',
    progress: 60,
    status: 'in_progress',
    dueDate: 'Sep 18',
    assignee: {
      name: 'Sarah J.',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 'task-4',
    title: 'Shopify Plus Custom App Webhooks',
    project: 'E-Commerce Expansion',
    client: 'Nordic Style Living',
    priority: 'low',
    progress: 35,
    status: 'todo',
    dueDate: 'Sep 22',
    assignee: {
      name: 'Elena R.',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    },
  },
];

export const LIVE_MEETING_ROOMS: LiveMeetingRoom[] = [
  {
    id: 'room-alpha',
    title: 'Sprint Design Review',
    category: 'Studio Alpha',
    status: 'live',
    participantCount: 5,
    meetingUrl: 'https://meet.google.com/qmv-rtza-jkh',
    platform: 'google_meet',
    scheduledTime: '10:00 - 11:00 AM',
    date: 'Today',
    participants: [
      {
        name: 'Maria Zakharova',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        role: 'Presenter',
        isSpeaking: true,
      },
      {
        name: 'David Sterling',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        role: 'Tech Lead',
        isMuted: false,
      },
      {
        name: 'Sarah Jenkins',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        role: 'Design Lead',
        isMuted: true,
      },
      {
        name: 'Elena Rostova',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
        role: 'Observer',
        isMuted: true,
      },
    ],
    previewImageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=900&auto=format&fit=crop&q=80',
    topic: 'Q3 Mobile Architecture & Deliverables Sign-off',
    duration: '24:18',
    isScreenSharing: true,
  },
  {
    id: 'room-beta',
    title: 'Client Workshop Sync',
    category: 'Executive Suite',
    status: 'live',
    participantCount: 3,
    meetingUrl: 'https://zoom.us/j/8492048591',
    platform: 'zoom',
    scheduledTime: '2:30 - 3:30 PM',
    date: 'Today',
    participants: [
      {
        name: 'Sarah Jenkins',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        role: 'Host',
        isSpeaking: false,
      },
    ],
    previewImageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&auto=format&fit=crop&q=80',
    topic: 'Acme Design Brand Guidelines Review',
    duration: '11:05',
    isScreenSharing: false,
  },
  {
    id: 'room-gamma',
    title: 'Daily Standup & Huddle',
    category: 'Dev Lounge',
    status: 'upcoming',
    participantCount: 8,
    meetingUrl: 'https://meet.google.com/wop-bnva-xyz',
    platform: 'google_meet',
    scheduledTime: '4:00 - 4:30 PM',
    date: 'Today',
    participants: [],
    previewImageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&auto=format&fit=crop&q=80',
    topic: 'Blocker Removal & API Endpoint Release',
    duration: 'Scheduled in 30m',
    isScreenSharing: false,
  },
];

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'cal-1',
    title: 'Sprint Design Review',
    type: 'meeting',
    date: 'Today',
    dayOfWeek: 1, // Monday
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    durationMinutes: 60,
    platform: 'google_meet',
    meetingUrl: 'https://meet.google.com/qmv-rtza-jkh',
    projectName: 'Mobile Crypto Wallet',
    description: 'Q3 Mobile Architecture & Deliverables Sign-off with Lead Engineers.',
  },
  {
    id: 'cal-2',
    title: 'Deep Focus Sprint: Biometric Auth',
    type: 'focus_block',
    date: 'Today',
    dayOfWeek: 1,
    startTime: '11:30 AM',
    endTime: '12:15 PM',
    durationMinutes: 45,
    taskId: 'task-2',
    projectName: 'Mobile Crypto Wallet MVP',
    isCompleted: false,
    description: '45m Pomodoro block for Biometric Auth & FaceID Flow implementation.',
  },
  {
    id: 'cal-3',
    title: 'Client Workshop Sync',
    type: 'meeting',
    date: 'Today',
    dayOfWeek: 1,
    startTime: '02:30 PM',
    endTime: '03:30 PM',
    durationMinutes: 60,
    platform: 'zoom',
    meetingUrl: 'https://zoom.us/j/8492048591',
    projectName: 'Brand Identity Portal',
    description: 'Acme Design Brand Guidelines Review and client stakeholder feedback.',
  },
  {
    id: 'cal-4',
    title: 'Brand Portal CSS Tokens Delivery',
    type: 'deadline',
    date: 'Tomorrow',
    dayOfWeek: 2, // Tuesday
    startTime: '05:00 PM',
    endTime: '05:00 PM',
    durationMinutes: 0,
    priority: 'high',
    projectName: 'Brand Identity & Web Portal',
    description: 'Client signoff cutoff for design token system.',
  },
  {
    id: 'cal-5',
    title: 'Deep Focus Sprint: Invoice PDF Engine',
    type: 'focus_block',
    date: 'Tomorrow',
    dayOfWeek: 2,
    startTime: '09:00 AM',
    endTime: '09:45 AM',
    durationMinutes: 45,
    taskId: 'task-3',
    projectName: 'Internal Platform Tooling',
    isCompleted: false,
    description: 'Automated Invoice PDF generation and digital signature stamping.',
  },
  {
    id: 'cal-6',
    title: 'Cross-Team Architecture Sync',
    type: 'meeting',
    date: 'Wednesday',
    dayOfWeek: 3,
    startTime: '03:00 PM',
    endTime: '03:45 PM',
    durationMinutes: 45,
    platform: 'google_meet',
    meetingUrl: 'https://meet.google.com/arc-sync-hub',
    projectName: 'Cloud Security Grid',
    description: 'Cloud Security Architecture review with Alex Rivera.',
  },
  {
    id: 'cal-7',
    title: 'Deep Focus Sprint: Token Systems',
    type: 'focus_block',
    date: 'Thursday',
    dayOfWeek: 4,
    startTime: '01:00 PM',
    endTime: '01:30 PM',
    durationMinutes: 30,
    taskId: 'task-1',
    projectName: 'Brand Identity & Web Portal',
    isCompleted: true,
    description: 'Completed 30m sprint on design tokens.',
  },
];

export const TEAM_ACTIVITY_FEED: TeamActivityItem[] = [
  {
    id: 'act-1',
    user: 'David S.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80',
    action: 'approved pull request on',
    target: 'Auth Biometric V2',
    timeAgo: '4m ago',
  },
  {
    id: 'act-2',
    user: 'Sarah J.',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80',
    action: 'exported client invoice for',
    target: 'Acme Studio ($4,250)',
    timeAgo: '18m ago',
  },
  {
    id: 'act-3',
    user: 'Maria Z.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80',
    action: 'started 45m deep focus on',
    target: 'Design Tokens Overhaul',
    timeAgo: 'Just now',
  },
];

export const PRODUCTIVITY_HOURS_DATA: ProductivityHourData[] = [
  { day: 'Mon', billableHours: 6.2, totalHours: 7.5 },
  { day: 'Tue', billableHours: 7.8, totalHours: 8.5, isPeak: true },
  { day: 'Wed', billableHours: 6.5, totalHours: 7.8 },
  { day: 'Thu', billableHours: 5.9, totalHours: 7.0 },
  { day: 'Fri', billableHours: 8.1, totalHours: 8.9, isPeak: true },
  { day: 'Sat', billableHours: 2.5, totalHours: 3.0 },
  { day: 'Sun', billableHours: 1.5, totalHours: 1.8 },
];
