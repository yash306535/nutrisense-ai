import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Crown, Users, Globe } from 'lucide-react';
import { socialAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import Avatar from '../components/atoms/Avatar';
import { getLevelProgress } from '../utils/formatters';

const rankColors = ['text-yellow-500', 'text-slate-400', 'text-amber-600'];
const rankIcons = ['🥇', '🥈', '🥉'];

function LeaderboardRow({ user, currentUserId, index }) {
  const isCurrentUser = user._id === currentUserId;
  const levelInfo = getLevelProgress(user.xp || 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
        isCurrentUser ? 'bg-primary/5 border-2 border-primary/20' : 'bg-white border border-slate-100'
      }`}
    >
      {/* Rank */}
      <div className="w-8 text-center">
        {user.rank <= 3 ? (
          <span className="text-xl">{rankIcons[user.rank - 1]}</span>
        ) : (
          <span className={`font-mono font-bold text-sm ${isCurrentUser ? 'text-primary' : 'text-text-muted'}`}>
            #{user.rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <Avatar src={user.avatar} name={user.name} size="md" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-semibold text-sm truncate ${isCurrentUser ? 'text-primary' : 'text-text-primary'}`}>
            {user.name} {isCurrentUser && '(You)'}
          </p>
          <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-medium shrink-0">
            Lv.{levelInfo.level}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {user.streak > 0 && <span className="text-xs text-text-muted">🔥 {user.streak} days</span>}
          {user.badges?.length > 0 && <span className="text-xs text-text-muted">🏅 {user.badges.length}</span>}
        </div>
      </div>

      {/* XP */}
      <div className="text-right">
        <p className="font-mono font-black text-text-primary">{user.xp?.toLocaleString()}</p>
        <p className="text-xs text-text-muted">XP</p>
      </div>
    </motion.div>
  );
}

export default function Leaderboard() {
  const { user: currentUser } = useAuthStore();
  const [filter, setFilter] = useState('global');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', filter, page],
    queryFn: () => socialAPI.getLeaderboard({ filter, page, limit: 20 }).then((r) => r.data.data),
    keepPreviousData: true,
  });

  const users = data?.users || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 lg:pb-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2" style={{ fontFamily: 'Sora' }}>
          <Trophy className="text-yellow-500" size={24} />
          Leaderboard
        </h1>
        <p className="text-text-muted text-sm">Top NutriSense users ranked by XP</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[{ key: 'global', label: 'Global', icon: Globe }, { key: 'friends', label: 'Friends', icon: Users }].map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setPage(1); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f.key ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-text-muted hover:border-primary/50'
            }`}
          >
            <f.icon size={14} /> {f.label}
          </button>
        ))}
      </div>

      {/* Top 3 podium */}
      {!isLoading && users.length >= 3 && page === 1 && (
        <div className="flex items-end justify-center gap-4 py-6 bg-gradient-to-b from-yellow-50 to-transparent rounded-2xl">
          {/* 2nd */}
          <div className="flex flex-col items-center gap-2">
            <Avatar src={users[1]?.avatar} name={users[1]?.name} size="lg" />
            <div className="w-20 h-20 bg-slate-300 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🥈</span>
            </div>
            <p className="text-xs font-semibold text-center">{users[1]?.name?.split(' ')[0]}</p>
            <p className="font-mono text-xs text-text-muted">{users[1]?.xp?.toLocaleString()} XP</p>
          </div>
          {/* 1st */}
          <div className="flex flex-col items-center gap-2">
            <Crown size={20} className="text-yellow-500" />
            <Avatar src={users[0]?.avatar} name={users[0]?.name} size="xl" />
            <div className="w-24 h-28 bg-yellow-100 rounded-xl flex items-center justify-center">
              <span className="text-3xl">🥇</span>
            </div>
            <p className="text-sm font-bold text-center">{users[0]?.name?.split(' ')[0]}</p>
            <p className="font-mono text-sm text-yellow-600 font-bold">{users[0]?.xp?.toLocaleString()} XP</p>
          </div>
          {/* 3rd */}
          <div className="flex flex-col items-center gap-2">
            <Avatar src={users[2]?.avatar} name={users[2]?.name} size="lg" />
            <div className="w-20 h-16 bg-amber-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🥉</span>
            </div>
            <p className="text-xs font-semibold text-center">{users[2]?.name?.split(' ')[0]}</p>
            <p className="font-mono text-xs text-text-muted">{users[2]?.xp?.toLocaleString()} XP</p>
          </div>
        </div>
      )}

      {/* Rankings */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-16 animate-pulse bg-slate-100 rounded-2xl" />)}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <Trophy size={40} className="mx-auto text-text-muted mb-2" />
          <p className="font-bold text-text-primary">No users yet</p>
          <p className="text-text-muted text-sm">Be the first to climb the leaderboard!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u, i) => (
            <LeaderboardRow
              key={u._id}
              user={u}
              currentUserId={currentUser?._id}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm disabled:opacity-50 hover:border-primary transition-colors"
          >
            Prev
          </button>
          <span className="px-4 py-2 text-sm text-text-muted">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm disabled:opacity-50 hover:border-primary transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
