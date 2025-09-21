import type { MiddlewareHandler } from "hono";
import { verify } from "hono/jwt";
import { getCookie } from "hono/cookie";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret";

// Middleware: Require Admin Role
export const requireAdmin: MiddlewareHandler = async (c, next) => {
    // Get token from cookie
    const token = getCookie(c, "token");

    if (!token) {
        return c.json({ success: false, message: "Missing auth cookie" }, 401);
    }


    try {
        // Verify JWT
        const payload = await verify(token, JWT_SECRET);
        c.set("user", payload);

        // Check for admin role
        if (payload.role !== "admin") {
            return c.json({ success: false, message: "Forbidden: Admin only" }, 403);
        }

        await next();
    } catch (err: any) {
        return c.json({ success: false, message: "Unauthorized: " + err.message }, 401);
    }
};
