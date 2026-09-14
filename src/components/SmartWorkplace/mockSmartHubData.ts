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

export interface SecurityCamera {
  id: string;
  name: string;
  location: string;
  status: 'live' | 'recording' | 'standby';
  fps: number;
  resolution: string;
  lastUpdated: string;
  imageUrl: string;
  isAudioEnabled: boolean;
}

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
}

export interface EnergyDataPoint {
  day: string;
  kwh: number;
  isPeak?: boolean;
}

export const INITIAL_WORKSPACE_MEMBERS: WorkspaceMember[] = [
  {
    id: 'mem-1',
    fullName: 'Maria Zakharova',
    email: 'maria.z@workhub.io',
    role: 'admin',
    department: 'Operations & Facilities',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'Jan 2024',
    location: 'Zurich HQ',
    assignedSpaces: ['All Rooms', 'Security Grid', 'CCTV Server'],
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
    assignedSpaces: ['Conference Room A', 'Development Lab'],
  },
  {
    id: 'mem-3',
    fullName: 'Sarah Jenkins',
    email: 'sarah@acmestudio.design',
    role: 'manager',
    department: 'Design & Creative',
    status: 'active',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'Apr 2024',
    location: 'Berlin Hub',
    assignedSpaces: ['Design Lounge', 'Audio Suite'],
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
    assignedSpaces: ['Focus Pods'],
  },
  {
    id: 'mem-5',
    fullName: 'Alex Rivera',
    email: 'alex.rivera@workhub.io',
    role: 'member',
    department: 'Security & Automation',
    status: 'pending',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'Invited 2d ago',
    location: 'Remote',
    assignedSpaces: ['Access Control'],
  },
];

export const SECURITY_CAMERAS: SecurityCamera[] = [
  {
    id: 'cam-1',
    name: 'Kitchen & Barista Lounge',
    location: 'West Wing • 1st Floor',
    status: 'live',
    fps: 30,
    resolution: '4K Ultra HD',
    lastUpdated: 'Live Feed',
    // Contemporary open luxury kitchen / office lounge
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80',
    isAudioEnabled: true,
  },
  {
    id: 'cam-2',
    name: 'Executive Boardroom',
    location: 'Main Tower • Floor 4',
    status: 'live',
    fps: 30,
    resolution: '4K Ultra HD',
    lastUpdated: 'Live Feed',
    // High-end minimalist boardroom
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&auto=format&fit=crop&q=80',
    isAudioEnabled: false,
  },
  {
    id: 'cam-3',
    name: 'Atrium & Entrance',
    location: 'Ground Level • Lobby Gate',
    status: 'live',
    fps: 60,
    resolution: '4K HDR',
    lastUpdated: 'Live Feed',
    // Sleek modern architectural glass facade
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&auto=format&fit=crop&q=80',
    isAudioEnabled: true,
  },
];

export const AUDIO_PLAYLIST: AudioTrack[] = [
  {
    id: 'track-1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 200,
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'track-2',
    title: 'Solar Echoes',
    artist: 'Tycho',
    album: 'Epoch Ambient',
    duration: 245,
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'track-3',
    title: 'Midnight City',
    artist: 'M83',
    album: 'Hurry Up, We’re Dreaming',
    duration: 243,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=80',
  },
];

export const ENERGY_WEEKLY_DATA: EnergyDataPoint[] = [
  { day: 'Mon', kwh: 14.8 },
  { day: 'Tue', kwh: 19.4, isPeak: true },
  { day: 'Wed', kwh: 17.6 },
  { day: 'Thu', kwh: 16.2 },
  { day: 'Fri', kwh: 20.1, isPeak: true },
  { day: 'Sat', kwh: 11.5 },
  { day: 'Sun', kwh: 9.8 },
];

export const SMART_ROOMS = [
  { id: 'bathroom', name: 'Bathroom', count: 4, active: true },
  { id: 'living', name: 'Living Room', count: 8, active: true },
  { id: 'kitchen', name: 'Kitchen Bar', count: 6, active: true },
  { id: 'conference', name: 'Conference A', count: 12, active: false },
  { id: 'terrace', name: 'Sky Terrace', count: 3, active: false },
];
