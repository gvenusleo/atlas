import * as crypto from "node:crypto";

type BunPasswordApi = {
  hash(password: string, options: { algorithm: "argon2id" }): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
};

type NodeArgon2Parameters = {
  memory: number;
  message: string;
  nonce: Buffer;
  parallelism: number;
  passes: number;
  tagLength: number;
};

type NodeCryptoWithArgon2 = typeof crypto & {
  argon2Sync?: (
    algorithm: "argon2id",
    parameters: NodeArgon2Parameters,
  ) => Buffer;
};

type ParsedArgon2Hash = {
  digest: Buffer;
  memory: number;
  parallelism: number;
  passes: number;
  salt: Buffer;
};

const argon2HashPattern =
  /^\$argon2id\$v=(\d+)\$m=(\d+),t=(\d+),p=(\d+)\$([^$]+)\$([^$]+)$/u;

const defaultArgon2Memory = 65536;
const defaultArgon2Passes = 2;
const defaultArgon2Parallelism = 1;
const defaultArgon2SaltBytes = 32;
const defaultArgon2TagLength = 32;

function getBunPassword() {
  // Next.js is typed against Node by default, so access Bun lazily.
  return (
    globalThis as typeof globalThis & {
      Bun?: {
        password?: BunPasswordApi;
      };
    }
  ).Bun?.password;
}

function getNodeArgon2Sync() {
  const nodeCrypto = crypto as NodeCryptoWithArgon2;
  return typeof nodeCrypto.argon2Sync === "function"
    ? nodeCrypto.argon2Sync
    : null;
}

function encodeArgon2Base64(buffer: Buffer) {
  return buffer.toString("base64").replace(/=+$/u, "");
}

function decodeArgon2Base64(value: string) {
  const remainder = value.length % 4;
  const padding = remainder === 0 ? "" : "=".repeat(4 - remainder);
  return Buffer.from(`${value}${padding}`, "base64");
}

function formatArgon2Hash({
  digest,
  memory,
  parallelism,
  passes,
  salt,
}: ParsedArgon2Hash) {
  return `$argon2id$v=19$m=${memory},t=${passes},p=${parallelism}$${encodeArgon2Base64(salt)}$${encodeArgon2Base64(digest)}`;
}

function parseArgon2Hash(passwordHash: string): ParsedArgon2Hash | null {
  const match = argon2HashPattern.exec(passwordHash);

  if (!match || match[1] !== "19") {
    return null;
  }

  return {
    digest: decodeArgon2Base64(match[6]),
    memory: Number(match[2]),
    parallelism: Number(match[4]),
    passes: Number(match[3]),
    salt: decodeArgon2Base64(match[5]),
  };
}

function assertPasswordRuntime() {
  if (getBunPassword() || getNodeArgon2Sync()) {
    return;
  }

  throw new Error(
    "Atlas password hashing requires Bun.password or node:crypto argon2 support.",
  );
}

function hashPasswordWithNode(password: string) {
  const argon2Sync = getNodeArgon2Sync();

  if (!argon2Sync) {
    assertPasswordRuntime();
    throw new Error("Node argon2 support is unavailable.");
  }

  const salt = crypto.randomBytes(defaultArgon2SaltBytes);
  const digest = argon2Sync("argon2id", {
    memory: defaultArgon2Memory,
    message: password,
    nonce: salt,
    parallelism: defaultArgon2Parallelism,
    passes: defaultArgon2Passes,
    tagLength: defaultArgon2TagLength,
  });

  return formatArgon2Hash({
    digest,
    memory: defaultArgon2Memory,
    parallelism: defaultArgon2Parallelism,
    passes: defaultArgon2Passes,
    salt,
  });
}

function verifyPasswordWithNode(password: string, passwordHash: string) {
  const argon2Sync = getNodeArgon2Sync();

  if (!argon2Sync) {
    assertPasswordRuntime();
    throw new Error("Node argon2 support is unavailable.");
  }

  const parsedHash = parseArgon2Hash(passwordHash);

  if (!parsedHash) {
    return false;
  }

  const digest = argon2Sync("argon2id", {
    memory: parsedHash.memory,
    message: password,
    nonce: parsedHash.salt,
    parallelism: parsedHash.parallelism,
    passes: parsedHash.passes,
    tagLength: parsedHash.digest.length,
  });

  return crypto.timingSafeEqual(digest, parsedHash.digest);
}

export async function hashPassword(password: string) {
  const bunPassword = getBunPassword();

  if (bunPassword) {
    return bunPassword.hash(password, {
      algorithm: "argon2id",
    });
  }

  return hashPasswordWithNode(password);
}

export async function verifyPassword(password: string, passwordHash: string) {
  const bunPassword = getBunPassword();

  if (bunPassword) {
    try {
      return await bunPassword.verify(password, passwordHash);
    } catch {
      return false;
    }
  }

  return verifyPasswordWithNode(password, passwordHash);
}
