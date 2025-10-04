import { Hono } from "hono";
import auth from "./auth";
import companies from "./companies";
import Jobs from "./jobs";


const routes = new Hono();

routes.route("/auth", auth);
routes.route("/companies", companies);
routes.route("/jobs", Jobs);

routes.get("/", (c) => c.text("API is running 🚀"));

export default routes;
