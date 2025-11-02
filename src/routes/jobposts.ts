import { Hono } from 'hono';
import { requireAdmin } from '../middleware/auth';
import * as jobController from '../controllers/jobs.controller';

const jobposts = new Hono();

jobposts.post('/create', requireAdmin, jobController.createJobPost);
jobposts.get('/', jobController.listJobPosts);
jobposts.get('/:id', jobController.getJobPostById);
jobposts.delete('/:id', requireAdmin, jobController.deleteJobPost);

export default jobposts;
