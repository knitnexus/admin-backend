import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import * as authService from '../services/auth.service';

export const requireAdmin: MiddlewareHandler = async (c, next) => {
  const config = authService.getAuthConfig();
  const token = getCookie(c, config.COOKIE_NAME);

  if (!token) {
    return c.json({ success: false, message: 'Missing auth cookie' }, 401);
  }

  try {
    const payload = await authService.verifyToken(token);
    c.set('user', payload);

    if (payload.role !== 'admin') {
      return c.json({ success: false, message: 'Forbidden: Admin only' }, 403);
    }

    await next();
  } catch (err: any) {
    return c.json(
      { success: false, message: 'Unauthorized: ' + err.message },
      401
    );
  }
};
