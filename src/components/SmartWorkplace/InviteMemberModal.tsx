// src/components/SmartWorkplace/InviteMemberModal.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Mail, 
  UserPlus, 
  Shield, 
  Briefcase, 
  User, 
  Check, 
  Building
} from 'lucide-react';
import { useSmartWorkplaceStore } from '../../store/useSmartWorkplaceStore';

interface RoleOption {
  role: 'admin' | 'manager' | 'member';
  title: string;
  badge: string;
  description: string;
  icon: React.ElementType;
  badgeColor: string;
}

const ROLES: RoleOption[] = [
  {
    role: 'admin',
    title: 'Workspace Admin',
    badge: 'Full Access',
    description: 'Can manage billing, security cameras, invite members, and change roles.',
    icon: Shield,
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  {
    role: 'manager',
    title: 'Operations Manager',
    badge: 'Approvals & Spaces',
    description: 'Can control rooms, manage schedules, trigger night modes, and approve hours.',
    icon: Briefcase,
    badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  },
  {
    role: 'member',
    title: 'Team Member',
    badge: 'Standard Access',
    description: 'Can view dashboard, control assigned pods, and log workspace activity.',
    icon: User,
    badgeColor: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  },
];

export const InviteMemberModal: React.FC = () => {
  const { isInviteModalOpen, setInviteModalOpen, inviteMember } = useSmartWorkplaceStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'manager' | 'member'>('member');
  const [department, setDepartment] = useState('Design & Engineering');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isInviteModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      inviteMember({
        fullName: fullName.trim(),
        email: email.trim(),
        role: selectedRole,
        department: department.trim(),
      });
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setFullName('');
        setEmail('');
      }, 1000);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg rounded-3xl p-6 bg-[#161920] border border-white/15 shadow-2xl text-white overflow-hidden"
      >
        {/* Glow backdrop accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Invite Team Member</h3>
              <p className="text-xs text-slate-400">Grant workspace access & smart permissions</p>
            </div>
          </div>

          <button 
            onClick={() => setInviteModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="py-5 space-y-4">
          
          {/* Full Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Full Name
            </label>
            <input 
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jordan Hayes"
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition"
            />
          </div>

          {/* Email Address Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@workhub.io"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition"
              />
            </div>
          </div>

          {/* Department / Unit */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Department / Space
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Building className="w-4 h-4" />
              </div>
              <input 
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Product Engineering, Creative Ops"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition"
              />
            </div>
          </div>

          {/* Role Selection Cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Role & Access Level
            </label>
            <div className="space-y-2">
              {ROLES.map((r) => {
                const isSelected = selectedRole === r.role;
                const Icon = r.icon;

                return (
                  <div
                    key={r.role}
                    onClick={() => setSelectedRole(r.role)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-orange-500/10 border-orange-500/50 shadow-md shadow-orange-500/10'
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-orange-500 text-white' : 'bg-white/10 text-slate-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{r.title}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${r.badgeColor}`}>
                            {r.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          {r.description}
                        </p>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 transition ${
                      isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-600'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setInviteModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-semibold text-xs shadow-lg shadow-orange-500/25 flex items-center gap-2 border border-orange-400/30 transition active:scale-95 disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Sending Invite...</span>
              ) : isSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Invitation Sent!</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Send Workspace Invite</span>
                </>
              )}
            </button>
          </div>

        </form>

      </motion.div>
    </div>
  );
};
