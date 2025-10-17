

import { PrismaClient } from "../generated/prisma";

import {requireAdmin} from "../middleware/auth";
import {onBoardCompany, UnitSchemas} from "../lib/types";
import z from "zod";
import {uploadToS3, uploadMultipleToS3} from "./ImageUploads";
import { Hono, Context } from 'hono';
const prisma = new PrismaClient();
const companyRoute = new Hono();



export const companyController= {


// @ts-ignore
    onboard:async (c: Context) => {

        try {

            const body = await c.req.parseBody();
            const formData = await c.req.formData();


            const logoFile = body["companyLogo"] as File | undefined;
            const unitFiles = formData.getAll("unitImages") as File[];

            let companyLogo: string | undefined;
            if (logoFile) {
                companyLogo = await uploadToS3(logoFile, "logos")
                if (!companyLogo) {
                    return c.json({
                        success: false,
                        message: "Failed to upload company logo"
                    }, 400);

                }
            }

            let unitImages: string[] = [];
            if (unitFiles && unitFiles.length > 0) {
                const validFiles = unitFiles.filter(file => file instanceof File);
                if (validFiles.length > 0) {
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
                companyLogo: companyLogo,
                unitImages: unitImages,
                machinery: body["machinery"] ? JSON.parse(body["machinery"] as string) : [],
                service: body["services"] ? JSON.parse(body["services"] as string) : [],
                certifications: formData.getAll("certifications").map(v => v.toString().trim()),
            });


            if (!safeData.success) {
                return c.json({success: false, errors: z.treeifyError(safeData.error)}, 400);
            }

            const data = safeData.data; // ✅ fully validated + typed


            const company = await prisma.company.create({
                data: {
                    name: data.name,
                    contactNumber: data.contactNumber,
                    gstNumber: data.gstNumber,
                    aboutCompany: data.aboutCompany,
                    workType: data.workType,
                    unitType: data.unitType,
                    location: data.location,
                    unitSqFeet: data.unitSqFeet,
                    companyLogo: data.companyLogo,
                    unitImages: data.unitImages,
                    certifications: data.certifications,
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
                include: {
                    machinery: true,
                    services: true
                }
            });
            return c.json({success: true, company});


        } catch (err) {
            console.error("Onboard failed:", err);
            return c.json({success: false, message: "Server error", error: err}, 500);
        }

    },
    listCompanies: async (c: Context) => {
          try {
              const page = Number(c.req.query('page') || 1)
              const limit = Number(c.req.query('limit') || 10)
              const skip = (page - 1) * limit

              const name = c.req.query('name')
              const unitType = c.req.query('unitType')
              const workType = c.req.query('workType')
              const location = c.req.query('location')
              console.log(location)
            console.log("unitType",unitType)
              // Build dynamic filters
              const filters: any = {}
              if (name) filters.name = { contains: name, mode: 'insensitive' }
              if (unitType) filters.unitType = { equals: unitType}
              if (workType) filters.workType = { equals: workType,  }
              if (location) {
                  filters.location = {
                      path: ['city'],
                      string_contains: location,
                      mode: 'insensitive'
                  };
              }

              const companies = await prisma.company.findMany({
                  where: filters,


                  skip,
                  take: limit,
                  select: {
                      id: true,
                      name: true,
                      companyLogo: true,
                      unitType: true,
                      workType: true,
                      updatedAt: true,
                      location:true,
                  },
                  orderBy: { updatedAt: 'desc' },
              })
              const total = await prisma.company.count({ where: filters })
              const totalPages = Math.ceil(total / limit)
              return c.json({
                  success: true,
                  data: companies,
                  pagination: {
                      total,
                      page,
                      limit,
                      totalPages,
                  },
              })
          } catch (err) {
              console.error('Error fetching companies:', err)
              return c.json({ success: false, message: 'Server error' }, 500)
          }
          },
    getCompanyById:async(c: Context) => {
                try {
                    const companyId = c.req.param('id')
                    if (!companyId) {
                        return c.json({ success: false, message: 'Company ID is required' }, 400)
                    }
                    const company=await prisma.company.findUnique({
                        where:{id:companyId},
                        include:{
                            machinery:true,
                            services:true
                        }
                    })
                    if (!company) {
                        return c.json({
                            success: false,
                            message: 'Company not found'
                        }, 404);
                    }
                    return c.json({
                        success: true,
                        data: company
                    });


                }
                catch (err) {
                    console.error('Error fetching company by ID:', err)
                    return c.json({
                        success: false,
                        message: 'Server error'
                    }, 500);
                }
          },
    editCompany:async(c: Context) => {
        try {
            const companyId = c.req.param('id')
            if (!companyId) {
                return c.json({ success: false, message: 'Company ID is required' }, 400)
            }
            const existingCompany = await prisma.company.findUnique({
                where: { id: companyId },
                include:{machinery:true,services:true}
            })
            if (!existingCompany) {
                return c.json({ success: false, message: 'Company not found' }, 404)
            }

            const body = await c.req.parseBody();
            const formData = await c.req.formData();

            const logoFile = body["companyLogo"] as File | undefined;
            let companyLogo: string | undefined = existingCompany.companyLogo || undefined;

            if (logoFile) {
                const uploadedLogo = await uploadToS3(logoFile, "logos");
                if (!uploadedLogo) {
                    return c.json({
                        success: false,
                        message: "Failed to upload company logo"
                    }, 400);
                }
                companyLogo = uploadedLogo;
            }
            const unitFiles = formData.getAll("unitImages") as File[];
            let unitImages: string[] = existingCompany.unitImages || [];

            if (unitFiles && unitFiles.length > 0) {
                const validFiles = unitFiles.filter(file => file instanceof File);
                if (validFiles.length > 0) {
                    const newImages = await uploadMultipleToS3(validFiles, "units");
                    if (newImages.length > 0) {
                        // Append new images to existing ones
                        unitImages = [...unitImages, ...newImages];
                    }
                }
            }
            let locationData = existingCompany.location || null;
            if (body["location"]) {
                try {
                    const parsedLocation = JSON.parse(body["location"] as string);
                    locationData = {
                        latitude: Number(parsedLocation.latitude),
                        longitude: Number(parsedLocation.longitude),
                        ...(parsedLocation.city && { city: parsedLocation.city.trim() }),
                        ...(parsedLocation.state && { state: parsedLocation.state.trim() }),
                        ...(parsedLocation.pincode && { pincode: parsedLocation.pincode.trim() }),
                        ...(parsedLocation.address && { address: parsedLocation.address.trim() })
                    };
                } catch (err) {
                    console.error("Failed to parse location:", err);
                    return c.json({
                        success: false,
                        message: "Invalid location data format"
                    }, 400);
                }
            }
            const machineryData = body["machinery"] ? JSON.parse(body["machinery"] as string) : null;
            const servicesData = body["services"] ? JSON.parse(body["services"] as string) : null;


            const newUnitType = (body["unitType"] as string)?.trim() || existingCompany.unitType;
            const unitTypeChanged = newUnitType !== existingCompany.unitType;

            if (machineryData && machineryData.length > 0) {
                const machineSchema = UnitSchemas[newUnitType];

                if (!machineSchema) {
                    return c.json({
                        success: false,
                        message: `No validation schema found for unit type: ${newUnitType}`
                    }, 400);
                }
                for (let i = 0; i < machineryData.length; i++) {
                    const result = machineSchema.safeParse(machineryData[i]);
                    if (!result.success) {
                        console.error(`Machinery validation failed for index ${i}:`, result.error);
                        return c.json({
                            success: false,
                            message: `Invalid machinery data for ${newUnitType}`,
                            errors: z.treeifyError(result.error),
                            machineryIndex: i
                        }, 400);
                    }
                }
                if (unitTypeChanged && existingCompany.machinery.length > 0) {
                    console.warn(
                        `Unit type changed from ${existingCompany.unitType} to ${newUnitType}. ` +
                        `Old machinery will be replaced with new schema-validated machinery.`
                    );
                }
            }  const validationData = {
                name: (body["name"] as string)?.trim() || existingCompany.name,
                contactNumber: (body["contactNumber"] as string)?.trim() || existingCompany.contactNumber,
                gstNumber: body["gstNumber"] ? (body["gstNumber"] as string).trim() : existingCompany.gstNumber,
                aboutCompany: body["aboutCompany"] || existingCompany.aboutCompany,
                workType: (body["workType"] as string)?.trim() || existingCompany.workType,
                unitType: newUnitType,
                location: locationData,
                unitSqFeet: body["unitSqFeet"] ? parseInt(body["unitSqFeet"] as string, 10) : existingCompany.unitSqFeet,
                companyLogo: companyLogo,
                unitImages: unitImages,
                machinery: machineryData,
                service: servicesData,
                certifications: formData.getAll("certifications").length > 0
                    ? formData.getAll("certifications").map(v => v.toString().trim())
                    : existingCompany.certifications,
            };
            const safeData = onBoardCompany.safeParse(validationData);

            if (!safeData.success) {
                console.error("Validation errors:", safeData.error);
                return c.json({
                    success: false,
                    message: "Validation failed",
                    errors: z.treeifyError(safeData.error)
                }, 400);
            }

            const data = safeData.data;
            const updatedCompany = await prisma.$transaction(async (tx) => {
                // Delete existing machinery if unitType changed or if new machinery provided
                if (machineryData !== null && machineryData.length >= 0) {
                    await tx.machinery.deleteMany({ where: { companyId } });
                }
                // Delete existing services if new services provided
                if (servicesData !== null && servicesData.length >= 0) {
                    await tx.service.deleteMany({
                        where: { companyId }
                    });
                }

                // Update company with new data
                return await tx.company.update({
                    where: { id: companyId },
                    data: {
                        name: data.name,
                        contactNumber: data.contactNumber,
                        gstNumber: data.gstNumber,
                        aboutCompany: data.aboutCompany,
                        workType: data.workType,
                        unitType: data.unitType,
                        location: data.location,
                        unitSqFeet: data.unitSqFeet,
                        companyLogo: data.companyLogo,
                        unitImages: data.unitImages,
                        certifications: data.certifications,
                        // Create new machinery with validated data
                        machinery: {
                            create: data.machinery?.map((m: any) => ({
                                unitType: data.unitType as any,
                                machineData: m,
                                quantity: m.noOfMachines,
                            })) || [],
                        },
                        // Create new services
                        services: {
                            create: data.service?.map((s: any) => ({
                                title: s.title,
                                description: s.description,
                            })) || [],
                        },
                    },
                    include: {
                        machinery: true,
                        services: true
                    }
                });
            });

            return c.json({
                success: true,
                message: `Company updated successfully.`,
                company: updatedCompany
            });


            }catch (err) {
            console.error("Edit company failed:", err);
            return c.json({
                success: false,
                message: "Server error",
                error: process.env.NODE_ENV === 'development' ? String(err) : undefined
            }, 500);
        }

    },
    deleteCompany: async(c:Context)=>{
        try {
            const companyId = c.req.param('id')
            if (!companyId) {
                return c.json({ success: false, message: 'Company ID is required' }, 400)
            }
            const existingCompany = await prisma.company.findUnique({
                where: { id: companyId },
                select: {
                    id: true,
                    name: true,
                    _count: {
                        select: {
                            machinery: true,
                            services: true
                        }
                    }
                }
            });

            if (!existingCompany) {
                return c.json({
                    success: false,
                    message: 'Company not found'
                }, 404);
            }
            await prisma.company.delete({
                where: { id: companyId }
            });
            return c.json({
                success: true,
                message: `Company "${existingCompany.name}" deleted successfully`,
                deletedCompany: {
                    id: existingCompany.id,
                    name: existingCompany.name,
                    deletedMachinery: existingCompany._count.machinery,
                    deletedServices: existingCompany._count.services
                }
            });


        } catch (err) {
            console.error("Delete company failed:", err);
            return c.json({
                success: false,
                message: "Server error",
                error: process.env.NODE_ENV === 'development' ? String(err) : undefined
            }, 500);
        }
    }
}



