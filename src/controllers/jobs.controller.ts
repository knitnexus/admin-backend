import { Context } from 'hono';
import * as jobService from '../services/job.service';
import * as uploadService from '../services/upload.service';
import { createJobPostSchema } from '../types';
import z from 'zod';

export async function createJobPost(c: Context) {
  try {
    const body = await c.req.parseBody();
    const formData = await c.req.formData();

    // Handle job images upload
    const jobImageFiles = formData.getAll('jobImages') as File[];
    let jobImages: string[] = [];

    if (jobImageFiles && jobImageFiles.length > 0) {
      const validFiles = jobImageFiles.filter((file) => file instanceof File);
      if (validFiles.length > 0) {
        jobImages = await uploadService.uploadMultipleToS3(validFiles, 'jobs');

        if (jobImages.length !== validFiles.length) {
          console.warn(
            `Some job images failed to upload. Expected: ${validFiles.length}, Got: ${jobImages.length}`
          );
        }
      }
    }

    // Parse and validate form data
    const safeData = createJobPostSchema.safeParse({
      unitType: (body['unitType'] as string)?.trim(),
      orderQuantity: parseInt(body['orderQuantity'] as string, 10),
      shortDescription: (body['shortDescription'] as string)?.trim(),
      certifications: formData
        .getAll('certifications')
        .map((v) => v.toString().trim()),
      detailedDescription: body['detailedDescription']
        ? (body['detailedDescription'] as string).trim()
        : undefined,
      jobImages: jobImages,
      location: (body['location'] as string)?.trim(),
    });

    if (!safeData.success) {
      return c.json(
        {
          success: false,
          message: 'Validation failed',
          errors: z.treeifyError(safeData.error),
        },
        400
      );
    }

    const data = safeData.data;
    const jobPost = await jobService.createJobPost(data);

    return c.json({
      success: true,
      message: 'Job post created successfully',
      jobPost,
    });
  } catch (error) {
    console.error('Create job post failed:', error);
    return c.json(
      {
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      500
    );
  }
}

export async function listJobPosts(c: Context) {
  try {
    const page = Number(c.req.query('page') || 1);
    const limit = Number(c.req.query('limit') || 10);

    const unitType = c.req.query('unitType');
    const location = c.req.query('location');

    const filters = {
      unitType,
      location,
    };

    const result = await jobService.getJobPosts(filters, { page, limit });

    return c.json({
      success: true,
      data: result.jobPosts,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching job posts:', error);
    return c.json({ success: false, message: 'Server error' }, 500);
  }
}

export async function getJobPostById(c: Context) {
  try {
    const jobPostId = c.req.param('id');
    if (!jobPostId) {
      return c.json(
        { success: false, message: 'Job post ID is required' },
        400
      );
    }

    const jobPost = await jobService.getJobPostById(jobPostId);

    if (!jobPost) {
      return c.json(
        {
          success: false,
          message: 'Job post not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: jobPost,
    });
  } catch (error) {
    console.error('Error fetching job post by ID:', error);
    return c.json(
      {
        success: false,
        message: 'Server error',
      },
      500
    );
  }
}

export async function deleteJobPost(c: Context) {
  try {
    const jobPostId = c.req.param('id');
    if (!jobPostId) {
      return c.json(
        { success: false, message: 'Job post ID is required' },
        400
      );
    }

    const deletedJobPost = await jobService.deleteJobPost(jobPostId);

    if (!deletedJobPost) {
      return c.json(
        {
          success: false,
          message: 'Job post not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      message: 'Job post deleted successfully',
      deletedJobPost,
    });
  } catch (error) {
    console.error('Delete job post failed:', error);
    return c.json(
      {
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      500
    );
  }
}
