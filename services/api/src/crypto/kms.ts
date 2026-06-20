import {
  KMSClient,
  EncryptCommand,
  DecryptCommand,
} from '@aws-sdk/client-kms';

// SEC-006：交付内容字段级加密；密钥经 KMS，与数据库分离。
// 直接用 KMS Encrypt/Decrypt（payload 小，单字段）；client 模块级缓存复用容器。

const client = new KMSClient({});
const KEY_ID = process.env.KMS_KEY_ID ?? '';

export async function encryptField(plaintext: string): Promise<string> {
  if (!KEY_ID) throw new Error('KMS_KEY_ID not configured');
  const out = await client.send(
    new EncryptCommand({
      KeyId: KEY_ID,
      Plaintext: Buffer.from(plaintext, 'utf8'),
    }),
  );
  // 存 base64 密文（CiphertextBlob 已含密钥引用），明文不落库
  return Buffer.from(out.CiphertextBlob!).toString('base64');
}

export async function decryptField(ciphertextB64: string): Promise<string> {
  const out = await client.send(
    new DecryptCommand({
      CiphertextBlob: Buffer.from(ciphertextB64, 'base64'),
    }),
  );
  return Buffer.from(out.Plaintext!).toString('utf8');
}
