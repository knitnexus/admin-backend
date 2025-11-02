import { Hono } from 'hono';
import { requireAdmin } from '../middleware/auth';
import * as companyController from '../controllers/company.controller';

const companies = new Hono();

companies.post('/onboard', requireAdmin, companyController.onboard);
companies.get('/list', requireAdmin, companyController.listCompanies);
companies.get('/:id', requireAdmin, companyController.getCompanyById);
companies.put('/:id', requireAdmin, companyController.editCompany);
companies.delete('/:id', requireAdmin, companyController.deleteCompany);

export default companies;
