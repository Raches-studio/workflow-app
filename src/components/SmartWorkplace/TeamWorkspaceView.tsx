// src/components/SmartWorkplace/TeamWorkspaceView.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Search, 
  Shield, 
  Briefcase, 
  User, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Mail 
} from 'lucide-react';
import { useSmartWorkplaceStore } from '../../store/useSmartWorkplaceStore';
import { InviteMemberModal } from './InviteMemberModal';

export const TeamWorkspaceView: React.FC = () => {
  const { 
    members, 
    setInviteModalOpen, 
    updateMemberRole, 
    removeMember 
  } = useSmartWorkplaceStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'manager' | 'member'>('all');

  const filteredMembers = members.filter((m) => {
    const matchesSearch = 
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || m.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const totalMembers = members.length;
  const activeCount = members.filter((m) => m.status === 'active').length;
  const pendingCount = members.filter((m) => m.status === 'pending').length;
  const adminCount = members.filter((m) => m.role === 'admin').length;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* Top Workspace Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Members */}
        <div className="p-5 rounded-3xl bg-[#161920]/80 border border-white/10 backdrop-blur-xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Members</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">{totalMembers}</div>
            <span className="text-[10px] text-slate-500">Across 3 studios</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/20 text-orange-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Active Now */}
        <div className="p-5 rounded-3xl bg-[#161920]/80 border border-white/10 backdrop-blur-xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Active Now</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1 flex items-center gap-2">
              {activeCount}
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-[10px] text-slate-500">Connected to spaces</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Admin Seats */}
        <div className="p-5 rounded-3xl bg-[#161920]/80 border border-white/10 backdrop-blur-xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Admin Seats</span>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{adminCount}</div>
            <span className="text-[10px] text-slate-500">Full control access</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Invites */}
        <div className="p-5 rounded-3xl bg-[#161920]/80 border border-white/10 backdrop-blur-xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pending Invites</span>
            <div className="text-2xl font-bold font-mono text-sky-400 mt-1">{pendingCount}</div>
            <span className="text-[10px] text-slate-500">Awaiting confirmation</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Members Management Section */}
      <div className="rounded-3xl p-6 bg-[#161920]/80 border border-white/10 backdrop-blur-xl shadow-2xl">
        
        {/* Controls Bar: Search, Role Filter & Invite Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members by name or email..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter Pills */}
            <div className="flex items-center p-1 rounded-xl bg-black/30 border border-white/10 text-xs">
              {(['all', 'admin', 'manager', 'member'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1 rounded-lg capitalize font-medium transition ${
                    roleFilter === r
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r === 'all' ? 'All Roles' : r}
                </button>
              ))}
            </div>

            {/* Invite Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-semibold text-xs shadow-lg shadow-orange-500/25 border border-orange-400/30 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Team Member</span>
            </motion.button>
          </div>

        </div>

        {/* Members Table / List */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-white/5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pt-2 pl-2">Member</th>
                <th className="pb-3 pt-2">Role & Access</th>
                <th className="pb-3 pt-2">Department</th>
                <th className="pb-3 pt-2">Status</th>
                <th className="pb-3 pt-2 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMembers.map((member) => {
                const isAdmin = member.role === 'admin';
                const isManager = member.role === 'manager';

                return (
                  <tr key={member.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* User info */}
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/15 shrink-0 bg-slate-800">
                          <img 
                            src={member.avatarUrl} 
                            alt={member.fullName} 
                            className="w-full h-full object-cover"
                          />
                          {member.status === 'active' && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#161920]" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-xs sm:text-sm">{member.fullName}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>{member.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge & Switcher */}
                    <td className="py-4">
                      <div className="inline-flex items-center gap-2">
                        {/* Current Role Badge */}
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          isAdmin 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : isManager
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                            : 'bg-slate-500/10 text-slate-300 border-slate-500/20'
                        }`}>
                          {isAdmin ? <Shield className="w-3 h-3" /> : isManager ? <Briefcase className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          <span className="capitalize">{member.role}</span>
                        </span>

                        {/* Inline Role Switcher Select */}
                        <select 
                          value={member.role}
                          onChange={(e) => updateMemberRole(member.id, e.target.value as any)}
                          className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          title="Change Member Role"
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="member">Member</option>
                        </select>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-4 text-slate-300 font-medium">
                      <div>{member.department}</div>
                      <span className="text-[10px] text-slate-500 font-normal">{member.location || 'HQ'}</span>
                    </td>

                    {/* Status */}
                    <td className="py-4">
                      {member.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Pending Invite
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 pr-2 text-right">
                      <button
                        onClick={() => removeMember(member.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Remove Member from Workspace"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                );
              })}

              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                    No workspace members matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Invite Modal */}
      <InviteMemberModal />

    </div>
  );
};
