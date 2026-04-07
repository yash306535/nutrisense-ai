import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Users, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { socialAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import Avatar from '../components/atoms/Avatar';
import NutritionBadge from '../components/molecules/NutritionBadge';
import { formatRelativeTime } from '../utils/formatters';

const categoryEmoji = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };

function PostCard({ post, currentUser }) {
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');

  const likeMutation = useMutation({
    mutationFn: () => socialAPI.likePost(post._id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-feed'] }),
  });

  const commentMutation = useMutation({
    mutationFn: () => socialAPI.addComment(post._id, { text: comment }),
    onSuccess: () => {
      setComment('');
      qc.invalidateQueries({ queryKey: ['social-feed'] });
    },
  });

  const followMutation = useMutation({
    mutationFn: () => socialAPI.toggleFollow(post.userId._id),
    onSuccess: () => {
      toast.success('Follow status updated');
      qc.invalidateQueries({ queryKey: ['social-feed'] });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      {/* Post Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <Avatar src={post.userId?.avatar} name={post.userId?.name} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-text-primary text-sm">{post.userId?.name}</p>
              <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-medium">Lv.{post.userId?.level}</span>
            </div>
            <p className="text-xs text-text-muted">{formatRelativeTime(post.createdAt)}</p>
          </div>
        </div>
        {currentUser && post.userId?._id !== currentUser._id && (
          <button
            onClick={() => followMutation.mutate()}
            className="px-3 py-1 rounded-full border border-slate-200 text-xs font-medium hover:border-primary hover:text-primary transition-colors"
          >
            Follow
          </button>
        )}
      </div>

      {/* Meal Card */}
      {post.mealSnapshot && (
        <div className="mx-4 mb-3 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span>{categoryEmoji[post.mealSnapshot.mealCategory] || '🍽️'}</span>
              <span className="text-xs text-text-muted capitalize">{post.mealSnapshot.mealCategory}</span>
            </div>
            <p className="font-bold text-text-primary text-sm">{post.mealSnapshot.name}</p>
            <p className="font-mono text-secondary text-sm font-bold">{post.mealSnapshot.calories} kcal</p>
          </div>
          {post.mealSnapshot.healthScore > 0 && (
            <NutritionBadge score={post.mealSnapshot.healthScore} size="sm" />
          )}
        </div>
      )}

      {/* Caption */}
      {post.caption && (
        <p className="px-4 pb-3 text-sm text-text-primary">{post.caption}</p>
      )}

      {/* Post Image */}
      {post.imageUrl && (
        <img src={post.imageUrl} alt="meal" className="w-full max-h-64 object-cover" />
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-4 border-t border-slate-50">
        <button
          onClick={() => likeMutation.mutate()}
          className={`flex items-center gap-1.5 transition-colors ${post.isLiked ? 'text-error' : 'text-text-muted hover:text-error'}`}
        >
          <Heart size={18} fill={post.isLiked ? 'currentColor' : 'none'} />
          <span className="text-sm font-medium">{post.likeCount || 0}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-text-muted hover:text-primary transition-colors"
        >
          <MessageCircle size={18} />
          <span className="text-sm font-medium">{post.commentCount || 0}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-3 space-y-2 border-t border-slate-50 pt-2">
          <div className="flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-slate-100 rounded-xl px-3 py-1.5 text-sm outline-none"
              onKeyDown={(e) => e.key === 'Enter' && comment.trim() && commentMutation.mutate()}
            />
            <button
              onClick={() => comment.trim() && commentMutation.mutate()}
              className="px-3 py-1.5 bg-primary text-white text-xs rounded-xl hover:bg-primary/90"
            >
              Post
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function Social() {
  const { user } = useAuthStore();
  const [filter, setFilter] = useState('global');

  const {
    data: pages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['social-feed', filter],
    queryFn: ({ pageParam }) =>
      socialAPI.getFeed({ filter, lastId: pageParam, limit: 10 }).then((r) => r.data.data),
    getNextPageParam: (last) => {
      if (!last.hasMore || !last.posts.length) return undefined;
      return last.posts[last.posts.length - 1]._id;
    },
  });

  const posts = pages?.pages.flatMap((p) => p.posts) || [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 lg:pb-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'Sora' }}>Social Feed</h1>
          <p className="text-text-muted text-sm">See what the community is eating</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('global')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'global' ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-text-muted hover:border-primary/50'}`}
        >
          <Globe size={14} /> Global
        </button>
        <button
          onClick={() => setFilter('friends')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'friends' ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-text-muted hover:border-primary/50'}`}
        >
          <Users size={14} /> Friends
        </button>
      </div>

      {/* Group Challenge Banner */}
      <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-2xl p-4 border border-accent/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-text-primary">🏆 30-Day No Sugar Challenge</p>
            <p className="text-xs text-text-muted mt-0.5">47 members · Day 12</p>
          </div>
          <button className="px-3 py-1.5 bg-accent text-white text-xs rounded-xl font-medium">Join</button>
        </div>
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 animate-pulse bg-slate-100 rounded-2xl" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Users size={40} className="mx-auto text-text-muted mb-3" />
          <p className="font-bold text-text-primary">No posts yet</p>
          <p className="text-text-muted text-sm mt-1">
            {filter === 'friends' ? 'Follow people to see their posts' : 'Be the first to share a meal!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} currentUser={user} />
          ))}
        </div>
      )}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full py-3 border-2 border-slate-200 rounded-xl text-sm text-text-muted hover:border-primary hover:text-primary transition-colors"
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
