// src/components/SmartWorkplace/ScenarioSelectorCard.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Grid, 
  Cpu, 
  Shield, 
  Calendar, 
  Maximize2, 
  Plus, 
  Check, 
  ChevronLeft, 
  MoreVertical 
} from 'lucide-react';
import { useSmartWorkplaceStore, ScenarioTab } from '../../store/useSmartWorkplaceStore';
import { SMART_ROOMS } from './mockSmartHubData';

const TABS: { id: ScenarioTab; label: string; icon: React.ElementType }[] = [
  { id: 'Rooms', label: 'Rooms', icon: Grid },
  { id: 'Devices', label: 'Devices', icon: Cpu },
  { id: 'Security', label: 'Security', icon: Shield },
  { id: 'Calendar', label: 'Calendar', icon: Calendar },
];

export const ScenarioSelectorCard: React.FC = () => {
  const { 
    activeScenarioTab, 
    setActiveScenarioTab, 
    activeRoomId, 
    setActiveRoomId,
    customRooms,
    addCustomRoom
  } = useSmartWorkplaceStore();

  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const allRooms = [
    ...SMART_ROOMS,
    ...customRooms.map((cr) => ({ id: cr.id, name: cr.name, count: 2, active: true }))
  ];

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    addCustomRoom(newRoomName.trim());
    setNewRoomName('');
    setIsAddingRoom(false);
  };

  return (
    <div className="relative rounded-3xl p-5 bg-[#161920]/80 border border-white/10 backdrop-blur-xl shadow-2xl hover:border-white/20 transition-all duration-300">
      
      {/* Card Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <button className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <h3 className="text-sm font-semibold text-white tracking-tight">New scenario</h3>
        </div>

        <button className="text-slate-400 hover:text-white transition">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Action Category Tabs */}
      <div className="grid grid-cols-4 gap-2 pt-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeScenarioTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveScenarioTab(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-white/10 border-white/20 text-white shadow-lg shadow-black/40'
                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-slate-400'}`} />
              <span className="text-[11px] font-medium tracking-tight">{tab.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="active-scenario-indicator"
                  className="absolute -bottom-1 w-5 h-0.5 rounded-full bg-orange-500" 
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-Section: Rooms List */}
      <div className="mt-4 pt-3.5 border-t border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-xs font-semibold text-white">Active Rooms</span>
            <span className="text-[10px] text-slate-400 font-mono">({allRooms.length})</span>
          </div>

          <button className="text-slate-400 hover:text-white transition" title="Expand Rooms Grid">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Room Chips Flow */}
        <div className="flex flex-wrap items-center gap-2">
          {allRooms.map((room) => {
            const isSelected = activeRoomId === room.id;
            return (
              <button
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-white text-slate-900 border-white font-semibold shadow-md'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <span>{room.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-slate-200 text-slate-800' : 'bg-white/10 text-slate-400'}`}>
                  {room.count}
                </span>
              </button>
            );
          })}

          {/* Add Room Form / Trigger */}
          {isAddingRoom ? (
            <form onSubmit={handleCreateRoom} className="flex items-center gap-1.5">
              <input 
                type="text"
                autoFocus
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Room name..."
                className="w-28 px-2.5 py-1.5 text-xs bg-black/60 border border-orange-500/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <button 
                type="submit"
                className="w-7 h-7 rounded-xl bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button"
                onClick={() => setIsAddingRoom(false)}
                className="text-xs text-slate-400 hover:text-white px-1"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingRoom(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-dashed border-white/15 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add room</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
