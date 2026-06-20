// 卡密/商品导入脚本（ADR-0001 D5：MVP-1 用脚本导入，无管理后台）。
// 写入一个商品 + 一份库存（KMS 加密交付内容）+ 一张卡密（HMAC 索引）。
// 用法（环境变量取自 cdk 输出）：
//   TABLE_NAME=card-redemption-preview \
//   KMS_KEY_ID=<keyId> HMAC_SECRET_ID=card/preview/hmac-key \
//   AWS_REGION=<region> \
//   node services/api/scripts/seed.mjs "ABCD-EFGH-JKLM-NPQR" "XX会员季卡" "QH7M-9XKD-22LP-AB6F"
import { createHmac } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { KMSClient, EncryptCommand } from '@aws-sdk/client-kms';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const [codeRaw, productName = 'XX会员季卡', deliveryText = 'DEMO-DELIVERY-CONTENT'] =
  process.argv.slice(2);
const TABLE = process.env.TABLE_NAME;
const KMS_KEY_ID = process.env.KMS_KEY_ID;
const HMAC_SECRET_ID = process.env.HMAC_SECRET_ID;
if (!codeRaw || !TABLE || !KMS_KEY_ID || !HMAC_SECRET_ID) {
  console.error('需要参数 <code> 与环境变量 TABLE_NAME / KMS_KEY_ID / HMAC_SECRET_ID');
  process.exit(1);
}

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const kms = new KMSClient({});
const sm = new SecretsManagerClient({});

const normalize = (s) => s.replace(/[\s\-_]+/g, '').trim().toUpperCase();

const sku = 'SKU-DEMO-1';
const invId = `inv-${Date.now()}`;

const secret = (await sm.send(new GetSecretValueCommand({ SecretId: HMAC_SECRET_ID }))).SecretString;
const codeHmac = createHmac('sha256', secret).update(normalize(codeRaw), 'utf8').digest('hex');
const cipher = Buffer.from(
  (await kms.send(new EncryptCommand({ KeyId: KMS_KEY_ID, Plaintext: Buffer.from(deliveryText, 'utf8') })))
    .CiphertextBlob,
).toString('base64');

// 商品
await ddb.send(
  new PutCommand({
    TableName: TABLE,
    Item: { PK: `PRODUCT#${sku}`, SK: 'META', name: productName, deliveryType: 'code', status: 'ON' },
  }),
);
// 库存（加密交付内容）
await ddb.send(
  new PutCommand({
    TableName: TABLE,
    Item: { PK: `PRODUCT#${sku}`, SK: `INV#${invId}`, invId, invStatus: 'AVAILABLE', encryptedPayload: cipher },
  }),
);
// 卡密（HMAC 索引，不存明文）
await ddb.send(
  new PutCommand({
    TableName: TABLE,
    Item: { PK: `CARD#${codeHmac}`, SK: 'META', productSku: sku, status: 'AVAILABLE', expiresAt: 0 },
  }),
);

console.log('已导入：');
console.log('  商品:', productName, '(', sku, ')');
console.log('  库存:', invId, '(交付内容已 KMS 加密)');
console.log('  卡密:', normalize(codeRaw), '→ HMAC', codeHmac.slice(0, 12) + '…');
console.log('现在可用该卡密兑换测试成功路径。');
