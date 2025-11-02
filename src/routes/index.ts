import { Hono } from 'hono';
import auth from './auth.routes';
import companies from './company.routes';
import jobposts from './jobposts';

const routes = new Hono();

routes.route('/auth', auth);
routes.route('/companies', companies);
routes.route('/jobs', jobposts);

routes.get('/', (c) => c.text('API is running'));

export default routes;
