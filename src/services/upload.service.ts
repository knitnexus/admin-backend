import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import { S3_CONSTANTS } from '../constants';

const s3 = new S3Client({
  region: S3_CONSTANTS.REGION,
  credentials: {
    accessKeyId: S3_CONSTANTS.ACCESS_KEY_ID,
    secretAccessKey: S3_CONSTANTS.SECRET_ACCESS_KEY,
  },
});

export async function uploadToS3(
  file: File,
  folder: string
): Promise<string | undefined> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${uuid()}-${file.name}`;
    const key = `${folder}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: S3_CONSTANTS.BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await s3.send(command);

    const publicUrl = `https://${S3_CONSTANTS.BUCKET_NAME}.s3.${S3_CONSTANTS.REGION}.amazonaws.com/${key}`;
    return publicUrl;
  } catch (error) {
    console.error('File upload to S3 failed:', error);
    return undefined;
  }
}

export async function uploadMultipleToS3(
  files: File[],
  folder: string
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadToS3(file, folder));
  const results = await Promise.all(uploadPromises);
  return results.filter((url): url is string => url !== undefined);
}
