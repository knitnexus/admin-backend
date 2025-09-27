
import { Hono } from 'hono';
import { PrismaClient } from "../generated/prisma";

import {requireAdmin} from "../middleware/auth";
import { onBoardCompany} from "../lib/types";
import z from "zod";
import {uploadToS3, uploadMultipleToS3} from "../services/ImageUploads";



const prisma = new PrismaClient();
const companyRoute = new Hono();



companyRoute.post("/onboard",requireAdmin ,async (c)=>{

    try {

        const body=await c.req.parseBody();
        const formData = await c.req.formData();


        const logoFile = body["companyLogo"] as File | undefined;
        const unitFiles  = formData.getAll("unitImages") as File[];

        let companyLogo: string | undefined;
        if (logoFile) {
            companyLogo= await uploadToS3(logoFile,"logos")
            if(!companyLogo){
                return c.json({
                    success: false,
                    message: "Failed to upload company logo"
                }, 400);

            }
        }

        let unitImages: string[] = [];
        if (unitFiles && unitFiles.length > 0) {
            const validFiles = unitFiles.filter(file => file instanceof File);
            if(validFiles.length>0) {
                unitImages = await uploadMultipleToS3(validFiles, "units");

                if (unitImages.length !== validFiles.length) {
                    console.warn(`Some unit images failed to upload. Expected: ${validFiles.length}, Got: ${unitImages.length}`);
                }
            }

        }
        console.log(unitImages)


        const safeData = onBoardCompany.safeParse({
            name: (body["name"] as string)?.trim(),
            contactNumber: (body["contactNumber"] as string)?.trim(),
            gstNumber: (body["gstNumber"] as string)?.trim(),
            aboutCompany: body["aboutCompany"],
            workType: (body["workType"] as string)?.trim(),
            unitType: (body["unitType"] as string)?.trim(),
            location: body["location"] ? JSON.parse(body["location"] as string) : undefined,
            unitSqFeet: parseInt(body["unitSqFeet"] as string, 10),
            companyLogo:companyLogo,
            unitImages: unitImages,
            machinery: body["machinery"] ? JSON.parse(body["machinery"] as string) : [],
            service: body["services"] ? JSON.parse(body["services"] as string) : [],
            certifications: formData.getAll("certifications").map(v => v.toString().trim()),
        });


        if (!safeData.success) {
            return c.json({ success: false, errors: z.treeifyError(safeData.error) }, 400);
        }

        const data = safeData.data; // ✅ fully validated + typed


        const company = await prisma.company.create({
            data: {
                name:data.name,
                contactNumber:data.contactNumber,
                gstNumber:data.gstNumber,
                aboutCompany:data.aboutCompany,
                workType: data.workType,
                unitType: data.unitType,
                location:data.location,
                unitSqFeet:data.unitSqFeet,
                companyLogo:data.companyLogo,
                unitImages:data.unitImages,
                certifications:data.certifications,
                machinery: {
                    create: data.machinery?.map((m: any) => ({
                        unitType: data.unitType as any,
                        machineData: m,
                        quantity: m.noOfMachines,
                    })),
                },
                services: {
                    create: data.service?.map((m: any) => ({
                        title: m.title, // ✅ matches Prisma
                        description: m.description,
                    })),
                },
            },
            include:{
                machinery:true,
                services:true
            }
        });
        return c.json({ success: true, company });



    }catch (err) {
        console.error("Onboard failed:", err);
        return c.json({ success: false, message: "Server error", error: err }, 500);
    }

})

// @ts-ignore
export default companyRoute;

