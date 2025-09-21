// services/cloudinaryService.ts
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuid } from 'uuid';

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a single file to Cloudinary
 * @param file - The File object to upload
 * @param folder - The folder path in Cloudinary (e.g., "logos", "units")
 * @returns Promise<string | undefined> - The secure URL or undefined on failure
 */
export async function uploadToCloudinary(file: File, folder: string): Promise<string | undefined> {
    try {


        // Convert File to buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Generate unique filename
        const fileName = `${uuid()}-${file.name}`;


        const uploadResult = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    resource_type: "auto",
                    folder: folder,
                    public_id: fileName,
                    use_filename: true,
                    unique_filename: false,
                    overwrite: true
                },
                (error, result) => {
                    if (error) {
                        console.error("Cloudinary upload error:", error);
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            ).end(buffer);
        });

        return uploadResult.secure_url;

    } catch (error) {
        console.error("File upload to Cloudinary failed:", error);
        return undefined;
    }
}

/**
 * Upload multiple files to Cloudinary
 * @param files - Array of File objects
 * @param folder - The folder path in Cloudinary
 * @returns Promise<string[]> - Array of successful upload URLs
 */
export async function uploadMultipleToCloudinary(files: File[], folder: string): Promise<string[]> {

    const uploadPromises = files.map(file => uploadToCloudinary(file, folder));

    const results = await Promise.all(uploadPromises);
    console.log(results)

    return results.filter((url): url is string => url !== undefined);
}


export async function saveFile(file: File, folder: string): Promise<string | undefined> {
    return await uploadToCloudinary(file, folder);
}