// routes/auth.ts
import {Context, Hono} from "hono";

import { setCookie, deleteCookie,getCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import * as bcrypt from 'bcrypt-ts';
const auth = new Hono();
const JWT_SECRET = process.env.JWT_SECRET ||"superAdmin" ;
const COOKIE_NAME= "token";
const COOKIE_MAX_AGE =  60* 60*12; // 12 hours

const ADMIN_EMAIL=process.env.ADMIN_EMAIL
const  ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

async  function createToken(email: string) {
   return sign({ email, role: "admin", exp: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE }, JWT_SECRET);
}

function setAuthCookie(c: Context, token: string) {
    setCookie(c, COOKIE_NAME, token, { httpOnly: true, path: "/", maxAge: COOKIE_MAX_AGE, sameSite: "Strict", secure: process.env.NODE_ENV === "production" });
}

auth.post("/login", async (c) => {
    try {
        const { email, password } = await c.req.json();
        console.log(email,password)
        const isPasswordValid = password==ADMIN_PASSWORD
        console.log("this is great ",password,"this is great",ADMIN_PASSWORD)
        // await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
        console.log(isPasswordValid)
        if(email !== ADMIN_EMAIL || !isPasswordValid){
            return c.json({ success: false, message: "Invalid credentials" }, 401);
        }
        const token= await createToken(email)
        setAuthCookie(c,token)
        return c.json({ success: true });
    } catch (err: any) {
        console.log(err);
        return c.json({ success: false, message: "Invalid credentials" }, 401);
    }
});

auth.post("/logout", (c) => {
    deleteCookie(c, COOKIE_NAME, { path: "/" });
    return c.json({ success: true });
});

auth.get("/admin", async (c) => {
    try {
        const token = getCookie(c, COOKIE_NAME);
        if (!token) return c.json({ message: "No token", success: false }, 401);
        const payload = await verify(token, JWT_SECRET);
        if (payload.role !== "admin") {
            return c.json({ message: "Forbidden" }, 403);
        }
        return c.json({ message: "Welcome admin", user: payload,success:true });
    } catch(err) {
        console.error("Admin route error:", err);
        return c.json({ message: "Invalid or expired token" }, 401);
    }
});

export default auth;