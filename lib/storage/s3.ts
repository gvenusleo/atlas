import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

type S3Config = {
  accessKeyId: string
  bucket: string
  endpoint?: string
  publicBaseUrl: string
  region: string
  secretAccessKey: string
}

function getEnv(name: keyof NodeJS.ProcessEnv) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`缺少 ${name}，无法完成对象存储上传。`)
  }

  return value
}

export function getS3Config(): S3Config {
  return {
    accessKeyId: getEnv("S3_ACCESS_KEY_ID"),
    bucket: getEnv("S3_BUCKET"),
    endpoint: process.env.S3_ENDPOINT,
    publicBaseUrl: getEnv("S3_PUBLIC_BASE_URL"),
    region: getEnv("S3_REGION"),
    secretAccessKey: getEnv("S3_SECRET_ACCESS_KEY"),
  }
}

export function createS3Client() {
  const config = getS3Config()

  return new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: config.endpoint,
    forcePathStyle: Boolean(config.endpoint),
    region: config.region,
  })
}

export function getPublicAssetUrl(objectKey: string) {
  const { publicBaseUrl } = getS3Config()
  const normalizedBaseUrl = publicBaseUrl.endsWith("/")
    ? publicBaseUrl.slice(0, -1)
    : publicBaseUrl

  return `${normalizedBaseUrl}/${objectKey}`
}

export async function createPresignedUploadUrl(input: {
  contentType: string
  objectKey: string
}) {
  const client = createS3Client()
  const { bucket } = getS3Config()

  const command = new PutObjectCommand({
    Bucket: bucket,
    ContentType: input.contentType,
    Key: input.objectKey,
  })

  return getSignedUrl(client, command, { expiresIn: 60 * 5 })
}
