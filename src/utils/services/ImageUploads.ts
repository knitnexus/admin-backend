// services/s3Service.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";

// Configuration
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";


export async function uploadToS3(file: File, folder: string): Promise<string | undefined> {
    try {
        const buffer = Buffer.from(await file.arrayBuffer());

        // Generate unique filename
        const fileName = `${uuid()}-${file.name}`;
        const key = `${folder}/${fileName}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: file.type,

        });

        await s3.send(command);


        const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        return publicUrl;
    } catch (error) {
        console.error("File upload to S3 failed:", error);
        return undefined;
    }
}


export async function uploadMultipleToS3(files: File[], folder: string): Promise<string[]> {
    const uploadPromises = files.map(file => uploadToS3(file, folder));
    const results = await Promise.all(uploadPromises);
    console.log('S3 upload results:', results);
    return results.filter((url): url is string => url !== undefined);
}


export async function saveFile(file: File, folder: string): Promise<string | undefined> {
    return await uploadToS3(file, folder);
}