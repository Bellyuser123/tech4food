import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { authRateLimiter } from '../middlewares/authRateLimiter.js';

export const authRouter = Router();

authRouter.post('/login', authRateLimiter, AuthController.login);
authRouter.post('/register', authRateLimiter, AuthController.register);
authRouter.get('/me', requireAuth, AuthController.me);
