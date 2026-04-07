const { Router } = require('express');
const { z } = require('zod');
const { register, login, refreshToken, logout, getMe, updateProfile, getNotifications, markAllNotificationsRead } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { authRateLimiter } = require('../middleware/rateLimit.middleware');
const { upload } = require('../middleware/upload.middleware');

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/refresh', validate(z.object({ refreshToken: z.string() })), refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, upload.single('avatar'), updateProfile);
router.get('/notifications', authenticate, getNotifications);
router.patch('/notifications/read-all', authenticate, markAllNotificationsRead);

module.exports = router;
