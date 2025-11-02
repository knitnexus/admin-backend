import { PrismaClient } from '../generated/prisma';
import z from 'zod';
import { createJobPostSchema } from '../types';

const prisma = new PrismaClient();

export type CreateJobPostData = z.infer<typeof createJobPostSchema>;

export async function createJobPost(data: CreateJobPostData) {
  const jobPost = await prisma.jobPostingForm.create({
    data: {
      unitType: data.unitType,
      orderQuantity: data.orderQuantity,
      shortDescription: data.shortDescription,
      certifications: data.certifications || [],
      detailedDescription: data.detailedDescription || '',
      jobImages: data.jobImages || [],
      location: data.location,
    },
  });

  return jobPost;
}

export async function getJobPosts(
  filters: {
    unitType?: string;
    location?: string;
  },
  pagination: {
    page: number;
    limit: number;
  }
) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters.unitType) {
    where.unitType = filters.unitType;
  }

  if (filters.location) {
    where.location = {
      contains: filters.location,
      mode: 'insensitive',
    };
  }

  const [jobPosts, total] = await Promise.all([
    prisma.jobPostingForm.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.jobPostingForm.count({ where }),
  ]);

  return {
    jobPosts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getJobPostById(id: string) {
  const jobPost = await prisma.jobPostingForm.findUnique({
    where: { id },
  });

  return jobPost;
}

export async function deleteJobPost(id: string) {
  const jobPost = await prisma.jobPostingForm.delete({
    where: { id },
  });

  return jobPost;
}
