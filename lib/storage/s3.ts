import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { getServerEnv } from "@/lib/env/server"

type S3Config = {
  accessKeyId: string
  bucket: string
  endpoint?: string
  publicBaseUrl: string
  region: string
  secretAccessKey: string
}

export function getS3Config(): S3Config {
  const serverEnv = getServerEnv()

  return {
    accessKeyId: serverEnv.s3AccessKeyId,
    bucket: serverEnv.s3Bucket,
    endpoint: serverEnv.s3Endpoint,
    publicBaseUrl: serverEnv.s3PublicBaseUrl,
    region: serverEnv.s3Region,
    secretAccessKey: serverEnv.s3SecretAccessKey,
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
