import { Context } from 'hono';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import * as authService from '../services/auth.service';

export async function login(c: Context) {
  try {
    const { email, password } = await c.req.json();
    console.log(email, password);

    const isValid = await authService.validateCredentials(email, password);
    console.log(
      'this is great ',
      password,
      'this is great',
      process.env.ADMIN_PASSWORD
    );
    console.log(isValid);

    if (!isValid) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401);
    }

    const token = await authService.createToken(email);
    const config = authService.getAuthConfig();

    setCookie(c, config.COOKIE_NAME, token, {
      httpOnly: true,
      path: '/',
      maxAge: config.COOKIE_MAX_AGE,
      sameSite: 'None',
      secure: true,
    });

    return c.json({ success: true });
  } catch (err: any) {
    console.log(err);
    return c.json({ success: false, message: 'Invalid credentials' }, 401);
  }
}

export function logout(c: Context) {
  const config = authService.getAuthConfig();
  deleteCookie(c, config.COOKIE_NAME, {
    path: '/',
    sameSite: 'None',
    secure: true,
  });
  return c.json({ success: true });
}

export async function getAdmin(c: Context) {
  try {
    const config = authService.getAuthConfig();
    const token = getCookie(c, config.COOKIE_NAME);

    if (!token) {
      return c.json({ message: 'No token', success: false }, 401);
    }

    const payload = await authService.verifyToken(token);

    if (payload.role !== 'admin') {
      return c.json({ message: 'Forbidden' }, 403);
    }

    return c.json({ message: 'Welcome admin', user: payload, success: true });
  } catch (err) {
    console.error('Admin route error:', err);
    return c.json({ message: 'Invalid or expired token' }, 401);
  }
}
