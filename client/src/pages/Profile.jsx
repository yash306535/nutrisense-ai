import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit3, Settings, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Avatar from '../components/atoms/Avatar';
import Button from '../components/atoms/Button';
import { goalAPI, authAPI } from '../services/api';
import { getLevelProgress } from '../utils/formatters';
import { BADGE_META, LEVEL_THRESHOLDS } from '../utils/constants';
import confetti from 'canvas-confetti';

export default function Profile() {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');

  const { data: progressData } = useQuery({
    queryKey: ['goal-progress'],
    queryFn: () => goalAPI.getProgress().then((r) => r.data.data),
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('bio', bio);
      return authAPI.updateProfile(fd);
    },
    onSuccess: (res) => {
      updateUser(res.data.data);
      setEditing(false);
      toast.success('Profile updated!');
    },
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const levelInfo = getLevelProgress(user?.xp || 0);
  const earnedBadges = user?.badges || [];

  const fireBadgeConfetti = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#22c55e', '#f97316', '#a855f7'] });
  };

  const allBadges = Object.entries(BADGE_META);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 lg:pb-6 space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar src={user?.avatar} name={user?.name} size="xl" />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold">
                {levelInfo.level}
              </div>
            </div>
            <div>
              {editing ? (
                <div className="space-y-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border-2 border-primary rounded-lg px-3 py-1.5 text-sm font-bold w-40"
                  />
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Add a bio..."
                    className="block border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-64 resize-none h-16"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold text-text-primary" style={{ fontFamily: 'Sora' }}>{user?.name}</h1>
                  <p className="text-sm text-text-muted mt-0.5">{user?.bio || 'No bio yet'}</p>
                  <p className="text-xs text-text-muted mt-1">{user?.email}</p>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                <Button size="sm" onClick={() => updateMutation.mutate()} loading={updateMutation.isPending}>Save</Button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="p-2 rounded-xl hover:bg-slate-100 text-text-muted transition-colors">
                <Edit3 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* XP Bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>Level {levelInfo.level}</span>
            <span className="font-mono">{user?.xp || 0} XP · {levelInfo.xpToNext} to next level</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent to-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-100">
          {[
            { label: 'Day Streak', value: user?.streak || 0, icon: '🔥' },
            { label: 'Badges', value: earnedBadges.length, icon: '🏅' },
            { label: 'Followers', value: user?.followers?.length || 0, icon: '👥' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-lg">{s.icon}</p>
              <p className="font-mono font-bold text-text-primary">{s.value}</p>
              <p className="text-xs text-text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Badge Shelf */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-bold text-text-primary mb-4 flex items-center gap-2">
          🏅 Badge Collection
          <span className="text-xs bg-slate-100 text-text-muted px-2 py-0.5 rounded-full">
            {earnedBadges.length}/{allBadges.length}
          </span>
        </h2>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
          {allBadges.map(([id, meta]) => {
            const earned = earnedBadges.includes(id);
            return (
              <motion.div
                key={id}
                whileHover={{ scale: 1.05 }}
                onClick={() => earned && fireBadgeConfetti()}
                title={`${meta.label}: ${meta.description}`}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl cursor-pointer transition-all ${
                  earned ? 'bg-primary/5 border border-primary/20' : 'opacity-30 grayscale bg-slate-50'
                }`}
              >
                <span className="text-2xl">{meta.icon}</span>
                <span className="text-[9px] text-center text-text-muted leading-tight">{meta.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Goal Summary */}
      {progressData?.goal && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-bold text-text-primary mb-3">Current Goal</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted capitalize">{progressData.goal.goalType?.replace('_', ' ')}</p>
              <p className="font-mono font-bold text-text-primary">{progressData.goal.calorieTarget} kcal/day</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">Progress</p>
              <p className="text-2xl font-mono font-black text-primary">{progressData.progressPct}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <Button variant="danger" fullWidth icon={LogOut} onClick={handleLogout}>
        Sign Out
      </Button>
    </div>
  );
}
