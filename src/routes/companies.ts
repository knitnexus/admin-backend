
import { Hono } from 'hono';
import { PrismaClient } from "../generated/prisma";

import {requireAdmin} from "../middleware/auth";
import { onBoardCompany} from "../lib/types";
import z from "zod";
import {uploadToS3, uploadMultipleToS3} from "../services/ImageUploads";
import {companyController} from "../services/company";



const prisma = new PrismaClient();
const companyRoute = new Hono();



companyRoute.post("/onboard",requireAdmin ,companyController.onboard);
companyRoute.get("/list",requireAdmin ,companyController.listCompanies);
companyRoute.get("/:id",requireAdmin ,companyController.getCompanyById);
companyRoute.put("/:id",requireAdmin ,companyController.editCompany);
companyRoute.delete("/:id",requireAdmin ,companyController.deleteCompany);

// @ts-ignore
export default companyRoute;

