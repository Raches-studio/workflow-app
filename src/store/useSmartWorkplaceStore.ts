// src/store/useSmartWorkplaceStore.ts
import { create } from 'zustand';
import { 
  WorkspaceMember, 
  INITIAL_WORKSPACE_MEMBERS, 
  SECURITY_CAMERAS, 
  AUDIO_PLAYLIST, 
  AudioTrack,
  SecurityCamera
} from '../components/SmartWorkplace/mockSmartHubData';

export type AmbienceMode = 'warm' | 'neutral' | 'cold';
export type ScenarioTab = 'Rooms' | 'Devices' | 'Security' | 'Calendar';

interface SmartWorkplaceState {
  // Ambience Theme
  ambienceMode: AmbienceMode;
  setAmbienceMode: (mode: AmbienceMode) => void;

  // Speaker / Lighting Control
  speakerPower: boolean;
  speakerVolume: number; // 0 - 100
  speakerLightLevel: number; // 0 - 100
  isMuted: boolean;
  toggleSpeakerPower: () => void;
  setSpeakerVolume: (val: number) => void;
  setSpeakerLightLevel: (val: number) => void;
  toggleMute: () => void;

  // Music Player
  isPlaying: boolean;
  playbackProgress: number; // seconds
  currentTrackIndex: number;
  isLiked: boolean;
  isDisliked: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
  togglePlay: () => void;
  setPlaybackProgress: (seconds: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleLike: () => void;
  toggleDislike: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  currentTrack: () => AudioTrack;

  // Scenario & Rooms
  activeScenarioTab: ScenarioTab;
  setActiveScenarioTab: (tab: ScenarioTab) => void;
  activeRoomId: string;
  setActiveRoomId: (id: string) => void;
  customRooms: { id: string; name: string }[];
  addCustomRoom: (name: string) => void;

  // Security Feeds
  activeCameraId: string;
  setActiveCameraId: (id: string) => void;
  cameras: SecurityCamera[];
  isCameraAudioOn: boolean;
  toggleCameraAudio: () => void;

  // Night Mode
  isNightModeActive: boolean;
  isNightModeModalOpen: boolean;
  nightSettings: {
    softLighting: boolean;
    autoLock: boolean;
    cameraHighAlert: boolean;
    targetTemp: number; // in Celsius (e.g., 20)
  };
  setNightModeModalOpen: (open: boolean) => void;
  toggleNightModeActive: () => void;
  updateNightSettings: (updates: Partial<SmartWorkplaceState['nightSettings']>) => void;

  // Team & Workspace
  members: WorkspaceMember[];
  isInviteModalOpen: boolean;
  setInviteModalOpen: (open: boolean) => void;
  inviteMember: (newMember: { fullName: string; email: string; role: 'admin' | 'manager' | 'member'; department: string }) => void;
  updateMemberRole: (memberId: string, role: 'admin' | 'manager' | 'member') => void;
  removeMember: (memberId: string) => void;

  // Navigation Sub-tab
  activeSubView: 'dashboard' | 'team';
  setActiveSubView: (view: 'dashboard' | 'team') => void;
}

export const useSmartWorkplaceStore = create<SmartWorkplaceState>((set, get) => ({
  // Ambience
  ambienceMode: 'warm',
  setAmbienceMode: (mode) => set({ ambienceMode: mode }),

  // Speaker
  speakerPower: true,
  speakerVolume: 75,
  speakerLightLevel: 75,
  isMuted: false,
  toggleSpeakerPower: () => set((state) => ({ speakerPower: !state.speakerPower })),
  setSpeakerVolume: (val) => set({ speakerVolume: Math.max(0, Math.min(100, val)) }),
  setSpeakerLightLevel: (val) => set({ speakerLightLevel: Math.max(0, Math.min(100, val)) }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  // Music Player
  isPlaying: true,
  playbackProgress: 84, // 1:24
  currentTrackIndex: 0,
  isLiked: true,
  isDisliked: false,
  isShuffle: false,
  isRepeat: false,
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaybackProgress: (seconds) => set({ playbackProgress: seconds }),
  nextTrack: () => set((state) => ({
    currentTrackIndex: (state.currentTrackIndex + 1) % AUDIO_PLAYLIST.length,
    playbackProgress: 0,
    isPlaying: true,
  })),
  prevTrack: () => set((state) => ({
    currentTrackIndex: (state.currentTrackIndex - 1 + AUDIO_PLAYLIST.length) % AUDIO_PLAYLIST.length,
    playbackProgress: 0,
    isPlaying: true,
  })),
  toggleLike: () => set((state) => ({ isLiked: !state.isLiked, isDisliked: false })),
  toggleDislike: () => set((state) => ({ isDisliked: !state.isDisliked, isLiked: false })),
  toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),
  toggleRepeat: () => set((state) => ({ isRepeat: !state.isRepeat })),
  currentTrack: () => AUDIO_PLAYLIST[get().currentTrackIndex] || AUDIO_PLAYLIST[0],

  // Scenario
  activeScenarioTab: 'Rooms',
  setActiveScenarioTab: (tab) => set({ activeScenarioTab: tab }),
  activeRoomId: 'bathroom',
  setActiveRoomId: (id) => set({ activeRoomId: id }),
  customRooms: [],
  addCustomRoom: (name) => set((state) => ({
    customRooms: [...state.customRooms, { id: `room-${Date.now()}`, name }],
  })),

  // Security
  activeCameraId: 'cam-1',
  setActiveCameraId: (id) => set({ activeCameraId: id }),
  cameras: SECURITY_CAMERAS,
  isCameraAudioOn: true,
  toggleCameraAudio: () => set((state) => ({ isCameraAudioOn: !state.isCameraAudioOn })),

  // Night Mode
  isNightModeActive: false,
  isNightModeModalOpen: false,
  nightSettings: {
    softLighting: true,
    autoLock: true,
    cameraHighAlert: true,
    targetTemp: 19.5,
  },
  setNightModeModalOpen: (open) => set({ isNightModeModalOpen: open }),
  toggleNightModeActive: () => set((state) => ({ isNightModeActive: !state.isNightModeActive })),
  updateNightSettings: (updates) => set((state) => ({
    nightSettings: { ...state.nightSettings, ...updates },
  })),

  // Team
  members: INITIAL_WORKSPACE_MEMBERS,
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
      department: newMember.department || 'General Workspace',
      status: 'pending',
      avatarUrl: randomAvatar,
      joinedDate: 'Just now',
      location: 'Remote',
      assignedSpaces: ['General Access'],
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
