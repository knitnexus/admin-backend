import { Hono } from "hono";
import auth from "./auth";
import companies from "./companies";
import {requireAdmin} from "../middleware/auth";

const routes = new Hono();

routes.route("/auth", auth);
routes.route("/companies", companies);

routes.get("/", (c) => c.text("API is running 🚀"));

export default routes;
