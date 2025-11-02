import { prisma } from '../config/prisma';
import { UnitSchemas } from '../types';
import z from 'zod';

export interface CompanyFilters {
  name?: string;
  unitType?: string;
  workType?: string;
  location?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export async function createCompany(data: any) {
  return await prisma.company.create({
    data: {
      name: data.name,
      contactNumber: data.contactNumber,
      gstNumber: data.gstNumber,
      aboutCompany: data.aboutCompany,
      workType: data.workType,
      unitType: data.unitType,
      location: data.location,
      unitSqFeet: data.unitSqFeet,
      productionCapacity: data.productionCapacity,
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
          title: m.title,
          description: m.description,
        })),
      },
    },
    include: {
      machinery: true,
      services: true,
    },
  });
}

export async function getCompanies(
  filters: CompanyFilters,
  pagination: PaginationParams
) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const whereFilters: any = {};
  if (filters.name) {
    whereFilters.name = { contains: filters.name, mode: 'insensitive' };
  }
  if (filters.unitType) {
    whereFilters.unitType = { equals: filters.unitType };
  }
  if (filters.workType) {
    whereFilters.workType = { equals: filters.workType };
  }
  if (filters.location) {
    whereFilters.location = {
      path: ['city'],
      string_contains: filters.location,
      mode: 'insensitive',
    };
  }

  const companies = await prisma.company.findMany({
    where: whereFilters,
    skip,
    take: limit,
    select: {
      id: true,
      name: true,
      companyLogo: true,
      unitType: true,
      workType: true,
      updatedAt: true,
      location: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  const total = await prisma.company.count({ where: whereFilters });
  const totalPages = Math.ceil(total / limit);

  return {
    companies,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

export async function getCompanyById(companyId: string) {
  return await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      machinery: true,
      services: true,
    },
  });
}

export async function updateCompany(companyId: string, data: any) {
  const machineryData = data.machinery;
  const servicesData = data.service;

  return await prisma.$transaction(async (tx) => {
    if (machineryData !== null && machineryData.length >= 0) {
      await tx.machinery.deleteMany({ where: { companyId } });
    }

    if (servicesData !== null && servicesData.length >= 0) {
      await tx.service.deleteMany({
        where: { companyId },
      });
    }

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
        productionCapacity: data.productionCapacity,
        companyLogo: data.companyLogo,
        unitImages: data.unitImages,
        certifications: data.certifications,
        machinery: {
          create:
            data.machinery?.map((m: any) => ({
              unitType: data.unitType as any,
              machineData: m,
              quantity: m.noOfMachines,
            })) || [],
        },
        services: {
          create:
            data.service?.map((s: any) => ({
              title: s.title,
              description: s.description,
            })) || [],
        },
      },
      include: {
        machinery: true,
        services: true,
      },
    });
  });
}

export async function deleteCompany(companyId: string) {
  const existingCompany = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          machinery: true,
          services: true,
        },
      },
    },
  });

  if (!existingCompany) {
    return null;
  }

  await prisma.company.delete({
    where: { id: companyId },
  });

  return {
    id: existingCompany.id,
    name: existingCompany.name,
    deletedMachinery: existingCompany._count.machinery,
    deletedServices: existingCompany._count.services,
  };
}

export function validateMachinery(machineryData: any[], unitType: string) {
  const machineSchema = UnitSchemas[unitType];

  if (!machineSchema) {
    return {
      valid: false,
      error: `No validation schema found for unit type: ${unitType}`,
    };
  }

  for (let i = 0; i < machineryData.length; i++) {
    const result = machineSchema.safeParse(machineryData[i]);
    if (!result.success) {
      return {
        valid: false,
        error: `Invalid machinery data for ${unitType}`,
        errors: z.treeifyError(result.error),
        machineryIndex: i,
      };
    }
  }

  return { valid: true };
}
