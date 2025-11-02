import { Hono } from 'hono';
import * as authController from '../controllers/auth.controller';

const auth = new Hono();

auth.post('/login', authController.login);
auth.post('/logout', authController.logout);
auth.get('/admin', authController.getAdmin);

export default auth;
