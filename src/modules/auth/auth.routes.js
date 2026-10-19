const { Router } = require('express');
const authController = require('./auth.controller');
const authMiddleware = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rateLimiter');
const { registerSchema, loginSchema } = require('./auth.schema');

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
