import type { MiddlewareHandler } from "hono";

export const errorHandler: MiddlewareHandler = async (c, next) => {
    try {
        await next();
    } catch (err: any) {
        console.error("Error:", err);
        return c.json({ success: false, message: err.message || "Internal Server Error" }, 500);
    }
};
