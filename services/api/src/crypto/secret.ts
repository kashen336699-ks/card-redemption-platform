import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

// SEC-001：HMAC 密钥存 Secrets Manager，与 DynamoDB 分离。
// 模块级缓存：容器复用期内只取一次；取失败显式抛错，不静默降级。

const client = new SecretsManagerClient({});
const SECRET_ID = process.env.HMAC_SECRET_ID ?? '';

let cached: string | undefined;

export async function getHmacKey(): Promise<string> {
  if (cached) return cached;
  if (!SECRET_ID) throw new Error('HMAC_SECRET_ID not configured');
  const out = await client.send(new GetSecretValueCommand({ SecretId: SECRET_ID }));
  const key = out.SecretString;
  if (!key) throw new Error('HMAC secret empty');
  cached = key;
  return key;
}

// 测试用：清缓存
export function __resetHmacKeyCache(): void {
  cached = undefined;
}
