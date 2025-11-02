import { Context } from 'hono';
import * as companyService from '../services/company.service';
import * as uploadService from '../services/upload.service';
import { onBoardCompany, UnitSchemas } from '../types';
import z from 'zod';

export async function onboard(c: Context) {
  try {
    const body = await c.req.parseBody();
    const formData = await c.req.formData();

    const logoFile = body['companyLogo'] as File | undefined;
    const unitFiles = formData.getAll('unitImages') as File[];

    let companyLogo: string | undefined;
    if (logoFile) {
      companyLogo = await uploadService.uploadToS3(logoFile, 'logos');
      if (!companyLogo) {
        return c.json(
          {
            success: false,
            message: 'Failed to upload company logo',
          },
          400
        );
      }
    }

    let unitImages: string[] = [];
    if (unitFiles && unitFiles.length > 0) {
      const validFiles = unitFiles.filter((file) => file instanceof File);
      if (validFiles.length > 0) {
        unitImages = await uploadService.uploadMultipleToS3(
          validFiles,
          'units'
        );

        if (unitImages.length !== validFiles.length) {
          console.warn(
            `Some unit images failed to upload. Expected: ${validFiles.length}, Got: ${unitImages.length}`
          );
        }
      }
    }
    console.log(unitImages);

    const safeData = onBoardCompany.safeParse({
      name: (body['name'] as string)?.trim(),
      contactNumber: (body['contactNumber'] as string)?.trim(),
      gstNumber: (body['gstNumber'] as string)?.trim(),
      aboutCompany: body['aboutCompany'],
      workType: (body['workType'] as string)?.trim(),
      unitType: (body['unitType'] as string)?.trim(),
      productionCapacity: parseInt(body['productionCapacity'] as string, 10),
      location: body['location']
        ? JSON.parse(body['location'] as string)
        : undefined,
      unitSqFeet: parseInt(body['unitSqFeet'] as string, 10),
      companyLogo: companyLogo,
      unitImages: unitImages,
      machinery: body['machinery']
        ? JSON.parse(body['machinery'] as string)
        : [],
      service: body['services'] ? JSON.parse(body['services'] as string) : [],
      certifications: formData
        .getAll('certifications')
        .map((v) => v.toString().trim()),
    });

    if (!safeData.success) {
      return c.json(
        { success: false, errors: z.treeifyError(safeData.error) },
        400
      );
    }

    const data = safeData.data;
    const company = await companyService.createCompany(data);
    return c.json({ success: true, company });
  } catch (err) {
    console.error('Onboard failed:', err);
    return c.json({ success: false, message: 'Server error', error: err }, 500);
  }
}

export async function listCompanies(c: Context) {
  try {
    const page = Number(c.req.query('page') || 1);
    const limit = Number(c.req.query('limit') || 10);

    const name = c.req.query('name');
    const unitType = c.req.query('unitType');
    const workType = c.req.query('workType');
    const location = c.req.query('location');
    console.log(location);
    console.log('unitType', unitType);

    const filters = {
      name,
      unitType,
      workType,
      location,
    };

    const result = await companyService.getCompanies(filters, { page, limit });

    return c.json({
      success: true,
      data: result.companies,
      pagination: result.pagination,
    });
  } catch (err) {
    console.error('Error fetching companies:', err);
    return c.json({ success: false, message: 'Server error' }, 500);
  }
}

export async function getCompanyById(c: Context) {
  try {
    const companyId = c.req.param('id');
    if (!companyId) {
      return c.json({ success: false, message: 'Company ID is required' }, 400);
    }

    const company = await companyService.getCompanyById(companyId);

    if (!company) {
      return c.json(
        {
          success: false,
          message: 'Company not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: company,
    });
  } catch (err) {
    console.error('Error fetching company by ID:', err);
    return c.json(
      {
        success: false,
        message: 'Server error',
      },
      500
    );
  }
}

export async function editCompany(c: Context) {
  try {
    const companyId = c.req.param('id');
    if (!companyId) {
      return c.json({ success: false, message: 'Company ID is required' }, 400);
    }

    const existingCompany = await companyService.getCompanyById(companyId);
    if (!existingCompany) {
      return c.json({ success: false, message: 'Company not found' }, 404);
    }

    const body = await c.req.parseBody();
    const formData = await c.req.formData();

    const logoFile = body['companyLogo'] as File | undefined;
    let companyLogo: string | undefined =
      existingCompany.companyLogo || undefined;

    if (logoFile) {
      const uploadedLogo = await uploadService.uploadToS3(logoFile, 'logos');
      if (!uploadedLogo) {
        return c.json(
          {
            success: false,
            message: 'Failed to upload company logo',
          },
          400
        );
      }
      companyLogo = uploadedLogo;
    }

    const unitFiles = formData.getAll('unitImages') as File[];
    let unitImages: string[] = existingCompany.unitImages || [];

    if (unitFiles && unitFiles.length > 0) {
      const validFiles = unitFiles.filter((file) => file instanceof File);
      if (validFiles.length > 0) {
        const newImages = await uploadService.uploadMultipleToS3(
          validFiles,
          'units'
        );
        if (newImages.length > 0) {
          unitImages = [...unitImages, ...newImages];
        }
      }
    }

    let locationData = existingCompany.location || null;
    if (body['location']) {
      try {
        const parsedLocation = JSON.parse(body['location'] as string);
        locationData = {
          latitude: Number(parsedLocation.latitude),
          longitude: Number(parsedLocation.longitude),
          ...(parsedLocation.city && { city: parsedLocation.city.trim() }),
          ...(parsedLocation.state && { state: parsedLocation.state.trim() }),
          ...(parsedLocation.pincode && {
            pincode: parsedLocation.pincode.trim(),
          }),
          ...(parsedLocation.address && {
            address: parsedLocation.address.trim(),
          }),
        };
      } catch (err) {
        console.error('Failed to parse location:', err);
        return c.json(
          {
            success: false,
            message: 'Invalid location data format',
          },
          400
        );
      }
    }

    const machineryData = body['machinery']
      ? JSON.parse(body['machinery'] as string)
      : null;
    const servicesData = body['services']
      ? JSON.parse(body['services'] as string)
      : null;

    const newUnitType =
      (body['unitType'] as string)?.trim() || existingCompany.unitType;
    const unitTypeChanged = newUnitType !== existingCompany.unitType;

    if (machineryData && machineryData.length > 0) {
      const validation = companyService.validateMachinery(
        machineryData,
        newUnitType
      );

      if (!validation.valid) {
        return c.json(
          {
            success: false,
            message: validation.error,
            errors: validation.errors,
            machineryIndex: validation.machineryIndex,
          },
          400
        );
      }

      if (unitTypeChanged && existingCompany.machinery.length > 0) {
        console.warn(
          `Unit type changed from ${existingCompany.unitType} to ${newUnitType}. ` +
            `Old machinery will be replaced with new schema-validated machinery.`
        );
      }
    }

    const validationData = {
      name: (body['name'] as string)?.trim() || existingCompany.name,
      contactNumber:
        (body['contactNumber'] as string)?.trim() ||
        existingCompany.contactNumber,
      gstNumber: body['gstNumber']
        ? (body['gstNumber'] as string).trim()
        : existingCompany.gstNumber,
      aboutCompany: body['aboutCompany'] || existingCompany.aboutCompany,
      workType:
        (body['workType'] as string)?.trim() || existingCompany.workType,
      unitType: newUnitType,
      location: locationData,
      unitSqFeet: body['unitSqFeet']
        ? parseInt(body['unitSqFeet'] as string, 10)
        : existingCompany.unitSqFeet,
      productionCapacity: body['productionCapacity']
        ? parseInt(body['productionCapacity'] as string, 10)
        : existingCompany.productionCapacity,
      companyLogo: companyLogo,
      unitImages: unitImages,
      machinery: machineryData,
      service: servicesData,
      certifications:
        formData.getAll('certifications').length > 0
          ? formData.getAll('certifications').map((v) => v.toString().trim())
          : existingCompany.certifications,
    };

    const safeData = onBoardCompany.safeParse(validationData);

    if (!safeData.success) {
      console.error('Validation errors:', safeData.error);
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
    const updatedCompany = await companyService.updateCompany(companyId, data);

    return c.json({
      success: true,
      message: `Company updated successfully.`,
      company: updatedCompany,
    });
  } catch (err) {
    console.error('Edit company failed:', err);
    return c.json(
      {
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? String(err) : undefined,
      },
      500
    );
  }
}

export async function deleteCompany(c: Context) {
  try {
    const companyId = c.req.param('id');
    if (!companyId) {
      return c.json({ success: false, message: 'Company ID is required' }, 400);
    }

    const deletedCompany = await companyService.deleteCompany(companyId);

    if (!deletedCompany) {
      return c.json(
        {
          success: false,
          message: 'Company not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      message: `Company "${deletedCompany.name}" deleted successfully`,
      deletedCompany,
    });
  } catch (err) {
    console.error('Delete company failed:', err);
    return c.json(
      {
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? String(err) : undefined,
      },
      500
    );
  }
}
