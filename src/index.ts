import { Hono } from 'hono'
import routes from "./routes";
import {errorHandler} from "./middleware/error";
import { cors } from 'hono/cors'
const app = new Hono()
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : [];
app.use(
    "*",
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

app.use("*", errorHandler);

app.route("/", routes);

export default app
