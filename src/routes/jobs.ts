
import { Hono } from 'hono';
import { PrismaClient } from "../generated/prisma";

import {requireAdmin} from "../middleware/auth";
import {jobPostingSchema, onBoardCompany} from "../lib/types";
import z from "zod";
import {uploadToS3, uploadMultipleToS3} from "../services/ImageUploads";

const prisma = new PrismaClient();
const jobPostRoute = new Hono();

jobPostRoute.post("/create",requireAdmin ,async (c)=>{

    try {

        const formData = await c.req.formData();

        const jobFiles  = formData.getAll("jobImages") as File[];

        let jobImages: string[] = [];
        if (jobFiles && jobFiles.length > 0) {
            const validFiles = jobFiles.filter(file => file instanceof File);
            if(validFiles.length>0) {
                jobImages = await uploadMultipleToS3(validFiles, "jobs");

                if (jobImages.length !== validFiles.length) {
                    console.warn(`Some unit images failed to upload. Expected: ${validFiles.length}, Got: ${jobImages.length}`);
                }
            }

        }



        const safeData = jobPostingSchema.safeParse({

            unitType: formData.get("unitType")?.toString().trim(),
            orderQuantity: formData.get("orderQuantity") ? parseInt(formData.get("orderQuantity") as string, 10) : undefined,
            shortDescription: formData.get("shortDescription")?.toString().trim(),
            certifications: formData.getAll("certifications").map(v => v.toString().trim()),
            detailedDescription: formData.get("detailedDescription")?.toString().trim(),
            jobImages: jobImages,
            location: formData.get("location")



        });

        if (!safeData.success) {
            return c.json({ success: false, errors: z.treeifyError(safeData.error) }, 400);
        }

        const data = safeData.data; //

        const jobpost = await prisma.jobPosting.create({
            data: {
                unitType: data.unitType,
                orderQuantity:data.orderQuantity,
                shortDescription:data.shortDescription,
                certifications:data.certifications,
                detailedDescription:data.detailedDescription,
                jobImages:data.jobImages,
                location:data.location,
            }
        });
        return c.json({ success: true, jobpost });



    }catch (err) {
        console.error("Onboard failed:", err);
        return c.json({ success: false, message: "Server error", error: err }, 500);
    }

})

// @ts-ignore
export default jobPostRoute;

