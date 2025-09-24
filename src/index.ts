import { Hono } from 'hono'
import routes from "./routes";
import {errorHandler} from "./middleware/error";
import { cors } from 'hono/cors'
const app = new Hono()
const FRONTEND_SERVICE_URL = process.env.FRONTEND_SERVICE_URL || ""

app.use(
    "*",
    cors({
        origin: FRONTEND_SERVICE_URL,
        credentials: true,
    })
);

app.use("*", errorHandler);

app.route("/", routes);

export default app
