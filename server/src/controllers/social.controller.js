const Post = require('../models/Post.model');
const User = require('../models/User.model');
const Meal = require('../models/Meal.model');
const Notification = require('../models/Notification.model');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/social/post
 */
const createPost = asyncHandler(async (req, res) => {
  const { mealId, caption, visibility } = req.body;

  let mealSnapshot = null;
  if (mealId) {
    const meal = await Meal.findOne({ _id: mealId, userId: req.user._id })
      .select('name calories healthScore mealCategory')
      .lean();
    if (meal) {
      mealSnapshot = {
        name: meal.name,
        calories: meal.calories,
        healthScore: meal.healthScore,
        mealCategory: meal.mealCategory,
      };
    }
  }

  const post = await Post.create({
    userId: req.user._id,
    mealId: mealId || null,
    caption: caption || '',
    imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
    mealSnapshot,
    visibility: visibility || 'public',
  });

  const populated = await Post.findById(post._id)
    .populate('userId', 'name avatar level xp')
    .lean();

  res.status(201).json(new ApiResponse(201, populated, 'Post created'));
});

/**
 * GET /api/social/feed
 */
const getFeed = asyncHandler(async (req, res) => {
  const { lastId, limit = 20, filter = 'global' } = req.query;

  const query = { visibility: 'public' };
  if (lastId) query._id = { $lt: lastId };

  if (filter === 'friends') {
    const user = await User.findById(req.user._id).select('following').lean();
    query.userId = { $in: [...(user.following || []), req.user._id] };
  }

  const posts = await Post.find(query)
    .populate('userId', 'name avatar level xp badges')
    .select('userId mealSnapshot caption imageUrl likes comments visibility createdAt')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .lean();

  const withLiked = posts.map((p) => ({
    ...p,
    likeCount: p.likes.length,
    commentCount: p.comments.length,
    isLiked: p.likes.some((id) => id.toString() === req.user._id.toString()),
    likes: undefined,
  }));

  res.json(new ApiResponse(200, { posts: withLiked, hasMore: posts.length === Number(limit) }, 'Feed fetched'));
});

/**
 * POST /api/social/like/:postId
 */
const likePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post) throw new ApiError(404, 'Post not found');

  const userId = req.user._id.toString();
  const alreadyLiked = post.likes.some((id) => id.toString() === userId);

  if (alreadyLiked) {
    post.likes = post.likes.filter((id) => id.toString() !== userId);
  } else {
    post.likes.push(req.user._id);
    // Notify post owner
    if (post.userId.toString() !== userId) {
      await Notification.create({
        userId: post.userId,
        type: 'social_like',
        message: `${req.user.name} liked your post.`,
        data: { postId: post._id },
      });
    }
  }

  await post.save();
  res.json(new ApiResponse(200, { liked: !alreadyLiked, likeCount: post.likes.length }, 'Like toggled'));
});

/**
 * POST /api/social/comment/:postId
 */
const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const post = await Post.findById(req.params.postId);
  if (!post) throw new ApiError(404, 'Post not found');

  post.comments.push({ userId: req.user._id, text });
  await post.save();

  if (post.userId.toString() !== req.user._id.toString()) {
    await Notification.create({
      userId: post.userId,
      type: 'social_comment',
      message: `${req.user.name} commented on your post.`,
      data: { postId: post._id },
    });
  }

  res.json(new ApiResponse(201, { commentCount: post.comments.length }, 'Comment added'));
});

/**
 * POST /api/social/follow/:userId
 */
const toggleFollow = asyncHandler(async (req, res) => {
  if (req.params.userId === req.user._id.toString()) {
    throw new ApiError(400, 'Cannot follow yourself');
  }

  const target = await User.findById(req.params.userId);
  if (!target) throw new ApiError(404, 'User not found');

  const currentUser = await User.findById(req.user._id);
  const isFollowing = currentUser.following.some((id) => id.toString() === req.params.userId);

  if (isFollowing) {
    currentUser.following = currentUser.following.filter((id) => id.toString() !== req.params.userId);
    target.followers = target.followers.filter((id) => id.toString() !== req.user._id.toString());
  } else {
    currentUser.following.push(req.params.userId);
    target.followers.push(req.user._id);
  }

  await Promise.all([currentUser.save(), target.save()]);

  res.json(new ApiResponse(200, { following: !isFollowing }, isFollowing ? 'Unfollowed' : 'Followed'));
});

/**
 * GET /api/social/leaderboard
 */
const getLeaderboard = asyncHandler(async (req, res) => {
  const { filter = 'global', page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query = {};
  if (filter === 'friends') {
    const user = await User.findById(req.user._id).select('following').lean();
    query._id = { $in: [...(user.following || []), req.user._id] };
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select('name avatar xp level streak badges')
      .sort({ xp: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    User.countDocuments(query),
  ]);

  const ranked = users.map((u, idx) => ({ ...u, rank: skip + idx + 1 }));

  res.json(new ApiResponse(200, { users: ranked, total, page: Number(page) }, 'Leaderboard fetched'));
});

module.exports = { createPost, getFeed, likePost, addComment, toggleFollow, getLeaderboard };
