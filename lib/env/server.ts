type NodeEnv = "development" | "production" | "test"

type ServerEnv = {
  betterAuthSecret: string
  betterAuthUrl: string
  databaseUrl: string
  hostname: string
  isProduction: boolean
  nodeEnv: NodeEnv
  port: number
  s3AccessKeyId: string
  s3Bucket: string
  s3Endpoint?: string
  s3PublicBaseUrl: string
  s3Region: string
  s3SecretAccessKey: string
}

const DEFAULT_HOSTNAME = "0.0.0.0"
const DEFAULT_PORT = 3000

let cachedServerEnv: ServerEnv | undefined

function getNodeEnv(): NodeEnv {
  const nodeEnv = process.env.NODE_ENV

  if (nodeEnv === "production" || nodeEnv === "test") {
    return nodeEnv
  }

  return "development"
}

function readOptionalEnv(name: keyof NodeJS.ProcessEnv) {
  const value = process.env[name]?.trim()

  return value ? value : undefined
}

function readRequiredEnv(name: keyof NodeJS.ProcessEnv) {
  const value = readOptionalEnv(name)

  if (!value) {
    throw new Error(`缺少 ${name} 环境变量。`)
  }

  return value
}

function readUrlEnv(name: keyof NodeJS.ProcessEnv) {
  const value = readRequiredEnv(name)

  try {
    new URL(value)
  } catch {
    throw new Error(`${name} 必须是合法的 URL。`)
  }

  return value
}

function readOptionalUrlEnv(name: keyof NodeJS.ProcessEnv) {
  const value = readOptionalEnv(name)

  if (!value) {
    return undefined
  }

  try {
    new URL(value)
  } catch {
    throw new Error(`${name} 必须是合法的 URL。`)
  }

  return value
}

function readPortEnv() {
  const value = readOptionalEnv("PORT")

  if (!value) {
    return DEFAULT_PORT
  }

  const parsedValue = Number.parseInt(value, 10)

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 1 ||
    parsedValue > 65535
  ) {
    throw new Error("PORT 必须是 1 到 65535 之间的整数。")
  }

  return parsedValue
}

function createServerEnv(): ServerEnv {
  const nodeEnv = getNodeEnv()

  return {
    betterAuthSecret: readRequiredEnv("BETTER_AUTH_SECRET"),
    betterAuthUrl: readUrlEnv("BETTER_AUTH_URL"),
    databaseUrl: readRequiredEnv("DATABASE_URL"),
    hostname: readOptionalEnv("HOSTNAME") ?? DEFAULT_HOSTNAME,
    isProduction: nodeEnv === "production",
    nodeEnv,
    port: readPortEnv(),
    s3AccessKeyId: readRequiredEnv("S3_ACCESS_KEY_ID"),
    s3Bucket: readRequiredEnv("S3_BUCKET"),
    s3Endpoint: readOptionalUrlEnv("S3_ENDPOINT"),
    s3PublicBaseUrl: readUrlEnv("S3_PUBLIC_BASE_URL"),
    s3Region: readRequiredEnv("S3_REGION"),
    s3SecretAccessKey: readRequiredEnv("S3_SECRET_ACCESS_KEY"),
  }
}

export function getServerEnv(): ServerEnv {
  if (!cachedServerEnv) {
    cachedServerEnv = createServerEnv()
  }

  return cachedServerEnv
}

export type { ServerEnv }
