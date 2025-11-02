import { Hono } from 'hono';
import { cors } from 'hono/cors';
import routes from './routes';
import { errorHandler } from './middleware/error';
import { APP_CONSTANTS } from './constants';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: APP_CONSTANTS.FRONTEND_URL,
    credentials: true,
  })
);

app.use('*', errorHandler);

app.route('/', routes);

export default app;
