// backblazeS3Test.ts

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  ListBucketsCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import * as dotenv from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = dotenv.config({ path: resolve(__dirname, '../../../../.env') });


console.log('\nEnvironment variables loaded:');
console.log('- S3_PROVIDER:', process.env.S3_PROVIDER || 'NOT SET');
console.log('- AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? `SET (${process.env.AWS_ACCESS_KEY_ID.substring(0, 8)}...)` : 'NOT SET');
console.log('- AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? `SET (length: ${process.env.AWS_SECRET_ACCESS_KEY.length})` : 'NOT SET');
console.log('- S3_REGION:', process.env.S3_REGION || 'NOT SET');
console.log('- S3_ENDPOINT:', process.env.S3_ENDPOINT || 'NOT SET');
console.log('- S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME || 'NOT SET');
console.log('========================\n');

// --- Configuration ---
const S3_PROVIDER = process.env.S3_PROVIDER || "AWS"; // "AWS" or "BACKBLAZE"
console.log(`Using S3 provider: ${S3_PROVIDER}`);
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const S3_REGION = process.env.S3_REGION;
const S3_ENDPOINT = process.env.S3_ENDPOINT; // Required for Backblaze, optional for AWS
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

console.log(`Using S3 bucket: ${S3_BUCKET_NAME}`);


// Validate essential environment variables
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !S3_REGION || !S3_BUCKET_NAME) {
  console.error("Error: Missing essential environment variables.");
  console.error("Please ensure AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_REGION, and S3_BUCKET_NAME are set.");
  process.exit(1);
}

// For Backblaze, S3_ENDPOINT is mandatory
if (S3_PROVIDER === "BACKBLAZE" && !S3_ENDPOINT) {
  console.error("Error: S3_ENDPOINT is mandatory when S3_PROVIDER is 'BACKBLAZE'.");
  process.exit(1);
}

// Configure the S3 client based on the provider
const s3Config = {
  region: S3_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
  // If an endpoint is provided (e.g., for Backblaze), use it.
  // Otherwise, the SDK will use the default AWS S3 endpoint for the specified region.
  endpoint: S3_ENDPOINT,
  forcePathStyle: S3_PROVIDER === "BACKBLAZE", // Backblaze prefers path style
};

const s3Client = new S3Client(s3Config);

console.log(`Initialized S3 Client for provider: ${S3_PROVIDER}`);
if (S3_ENDPOINT) {
  console.log(`Using custom endpoint: ${S3_ENDPOINT}`);
}
console.log(`Using region: ${S3_REGION}`);
console.log(`Targeting bucket: ${S3_BUCKET_NAME}`);

/**
 * Uploads a file to the specified S3-compatible bucket.
 * @param key The object key (path/filename) in the bucket.
 * @param body The content to upload (string, Buffer, or Readable stream).
 * @returns A Promise that resolves when the upload is complete.
 */
async function uploadFile(key: string, body: string | Buffer | Readable): Promise<void> {
    try {
        const command = new PutObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: key,
            Body: body,
        });
        await s3Client.send(command);
        console.log(`Successfully uploaded ${key}`);
    } catch (error) {
        console.error(`Error uploading ${key}:`, error);
        throw error;
    }
}

/**
 * Bulk uploads multiple files to the specified S3-compatible bucket.
 * @param files Array of objects with { key, body } for each file.
 * @returns A Promise that resolves when all uploads are complete.
 */
async function uploadFilesBulk(
    files: { key: string; body: string | Buffer | Readable }[]
): Promise<void> {
    const results = await Promise.allSettled(
        files.map(({ key, body }) => uploadFile(key, body))
    );
    results.forEach((result, idx) => {
        const { key } = files[idx];
        if (result.status === "fulfilled") {
            console.log(`Bulk upload: Successfully uploaded ${key}`);
        } else {
            console.error(`Bulk upload: Failed to upload ${key}:`, result.reason);
        }
    });
}

/**
 * Downloads a file from the specified S3-compatible bucket.
 * @param key The object key (path/filename) in the bucket.
 * @returns A Promise that resolves with the content as a string, or null if not found.
 */
async function downloadFile(key: string): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });
    const { Body } = await s3Client.send(command);

    if (Body instanceof Readable) {
      const chunks: Buffer[] = [];
      for await (const chunk of Body) {
        chunks.push(chunk);
      }
      const content = Buffer.concat(chunks).toString("utf-8");
      console.log(`Successfully downloaded ${key}. Content length: ${content.length}`);
      return content;
    } else if (Body) {
      // For non-streaming bodies (e.g., Blob, ArrayBuffer, etc.)
      const content = await Body.transformToString();
      console.log(`Successfully downloaded ${key}. Content length: ${content.length}`);
      return content;
    } else {
      console.log(`No content found for ${key}`);
      return null;
    }
  } catch (error: any) {
    if (error.name === "NoSuchKey") {
      console.warn(`File not found: ${key}`);
      return null;
    }
    console.error(`Error downloading ${key}:`, error);
    throw error;
  }
}

/**
 * Lists objects in the specified S3-compatible bucket.
 * @param prefix An optional prefix to filter objects.
 * @returns A Promise that resolves with an array of object keys.
 */
async function listObjects(prefix?: string): Promise<string[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
      Prefix: prefix,
    });
    const { Contents } = await s3Client.send(command);

    const keys = Contents ? Contents.map((obj) => obj.Key!).filter(Boolean) : [];
    console.log(`Successfully listed ${keys.length} objects (prefix: ${prefix || 'none'}):`);
    keys.forEach((key) => console.log(`- ${key}`));
    return keys;
  } catch (error) {
    console.error(`Error listing objects:`, error);
    throw error;
  }
}

/**
 * Deletes a file from the specified S3-compatible bucket.
 * @param key The object key (path/filename) to delete.
 * @returns A Promise that resolves when the deletion is complete.
 */
async function deleteFile(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
    console.log(`Successfully deleted ${key}`);
  } catch (error) {
    console.error(`Error deleting ${key}:`, error);
    throw error;
  }
}

/**
 * Lists all buckets accessible by the credentials.
 * Note: Backblaze B2 currently supports a maximum of 100 buckets per account.
 * @returns A Promise that resolves with an array of bucket names.
 */
async function listBuckets(): Promise<string[]> {
  try {
    const command = new ListBucketsCommand({});
    const { Buckets } = await s3Client.send(command);

    const bucketNames = Buckets ? Buckets.map((bucket) => bucket.Name!).filter(Boolean) : [];
    console.log(`Successfully listed ${bucketNames.length} buckets:`);
    bucketNames.forEach((name) => console.log(`- ${name}`));
    return bucketNames;
  } catch (error) {
    console.error(`Error listing buckets:`, error);
    throw error;
  }
}

// --- Main execution function ---
async function main() {
  console.log("\n--- Starting S3 Compatibility Test ---");

  // Example usage:
  const testFileName = "test-file-hello-world.txt";
  const testFileContent = "Hello, S3-compatible world! This is a test file.";
  const anotherTestFile = "folder/another-test-file.json";
  const anotherFileContent = JSON.stringify({ message: "This is another test file in a folder." });

  try {
    // 1. List all buckets
    await listBuckets();

    // 2. Upload a file
    await uploadFile(testFileName, testFileContent);

    // 3. Upload another file in a "folder"
    await uploadFile(anotherTestFile, anotherFileContent);

    // 4. List objects in the bucket
    await listObjects();

    // 5. List objects with a prefix
    await listObjects("folder/");

    // 6. Download the first file
    const downloadedContent = await downloadFile(testFileName);
    console.log(`Content of ${testFileName}: \n"${downloadedContent}"`);

    // 7. Download the second file
    const downloadedAnotherContent = await downloadFile(anotherTestFile);
    console.log(`Content of ${anotherTestFile}: \n"${downloadedAnotherContent}"`);

    // 8. Attempt to download a non-existent file
    await downloadFile("non-existent-file.txt");

    // 9. Delete the first file
    await deleteFile(testFileName);

    // 10. Delete the second file
    await deleteFile(anotherTestFile);

    // 11. Verify deletion by listing objects again
    await listObjects();

  } catch (error) {
    console.error("\n--- S3 Compatibility Test Failed ---");
    console.error(error);
  } finally {
    console.log("\n--- S3 Compatibility Test Finished ---");
  }
}

// Run the main function
main();
