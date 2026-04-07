const { Router } = require('express');
const { z } = require('zod');
const { createPost, getFeed, likePost, addComment, toggleFollow, getLeaderboard } = require('../controllers/social.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { upload } = require('../middleware/upload.middleware');

const router = Router();
router.use(authenticate);

router.post('/post', upload.single('image'), createPost);
router.get('/feed', getFeed);
router.post('/like/:postId', likePost);
router.post('/comment/:postId', validate(z.object({ text: z.string().min(1).max(500) })), addComment);
router.post('/follow/:userId', toggleFollow);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
