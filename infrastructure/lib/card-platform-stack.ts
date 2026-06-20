import {
  Stack,
  type StackProps,
  RemovalPolicy,
  Duration,
  CfnOutput,
} from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { Construct } from 'constructs';

const __dirnameLocal = dirname(fileURLToPath(import.meta.url));
const apiSrc = join(__dirnameLocal, '../../services/api/src');

export interface CardPlatformStackProps extends StackProps {
  envName: string;
}

// 卡密兑换平台 stack。资源按 feature 增量添加：
//   3.data-security：KMS Key + Secrets Manager
//   2.redeem-api：DynamoDB 单表 + Lambda + HTTP API（本文件）
//   6.security-hardening：限流 + 安全头
//   4.audit-observability：指标 + 告警
export class CardPlatformStack extends Stack {
  public readonly fieldKey: kms.Key;
  public readonly hmacSecret: secretsmanager.Secret;
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: CardPlatformStackProps) {
    super(scope, id, props);
    const { envName } = props;
    const prod = envName === 'prod';
    const retain = prod ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;

    // —— 3.data-security ——
    this.fieldKey = new kms.Key(this, 'FieldEncryptionKey', {
      alias: `card/${envName}/field`,
      description: '交付内容字段级加密（SEC-006）',
      enableKeyRotation: true,
      removalPolicy: retain,
    });
    this.hmacSecret = new secretsmanager.Secret(this, 'HmacIndexKey', {
      secretName: `card/${envName}/hmac-key`,
      description: '卡密 HMAC-SHA256 索引密钥（SEC-001）',
      generateSecretString: { passwordLength: 48, excludePunctuation: true },
      removalPolicy: retain,
    });

    // —— 2.redeem-api：DynamoDB 单表 ——
    // PK/SK 通用主键；GSI1 支持售后查询（订单号 / 卡密末四位）；TTL 90 天（D2）
    this.table = new dynamodb.Table(this, 'Table', {
      tableName: `card-redemption-${envName}`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: retain,
    });
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
    });

    // —— Lambda 共享环境与工厂（最小权限逐函数授予）——
    const commonEnv = {
      TABLE_NAME: this.table.tableName,
      KMS_KEY_ID: this.fieldKey.keyId,
      HMAC_SECRET_ID: this.hmacSecret.secretName,
      IP_SALT: `card-${envName}`,
      NODE_OPTIONS: '--enable-source-maps',
    };
    const makeFn = (name: string, entry: string) =>
      new NodejsFunction(this, name, {
        functionName: `card-${envName}-${name}`,
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: join(apiSrc, entry),
        handler: 'handler',
        memorySize: 256,
        timeout: Duration.seconds(10), // 兑换为短同步流程（NFR-001 P95≤2s）
        environment: commonEnv,
        bundling: { format: OutputFormat.ESM, minify: true, sourceMap: true },
      });

    const redeemFn = makeFn('redeem', 'handlers/redeem.ts');
    const getFn = makeFn('get-redemption', 'handlers/get-redemption.ts');
    const supportFn = makeFn('support', 'handlers/support.ts');

    // 最小权限：逐函数授予，不用 * 资源（lambda.md / aws-cdk-iac）
    this.table.grantReadWriteData(redeemFn);
    this.table.grantReadData(getFn);
    this.table.grantReadData(supportFn);
    this.fieldKey.grantEncryptDecrypt(redeemFn);
    this.fieldKey.grantDecrypt(getFn);
    this.hmacSecret.grantRead(redeemFn);

    // —— HTTP API（API Gateway v2）——
    // CORS：前端在 CloudFront 域、API 在 execute-api 域，跨域需开 CORS 预检。
    // preview 放开来源；prod 应收紧到具体 CloudFront 域名。
    const httpApi = new apigw.HttpApi(this, 'HttpApi', {
      apiName: `card-${envName}`,
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [
          apigw.CorsHttpMethod.POST,
          apigw.CorsHttpMethod.GET,
          apigw.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['Content-Type'],
        maxAge: Duration.hours(1),
      },
    });
    httpApi.addRoutes({
      path: '/api/v1/redemptions',
      methods: [apigw.HttpMethod.POST],
      integration: new HttpLambdaIntegration('RedeemInt', redeemFn),
    });
    httpApi.addRoutes({
      path: '/api/v1/redemptions/{id}',
      methods: [apigw.HttpMethod.GET],
      integration: new HttpLambdaIntegration('GetInt', getFn),
    });
    httpApi.addRoutes({
      path: '/api/v1/support/lookup',
      methods: [apigw.HttpMethod.POST],
      integration: new HttpLambdaIntegration('SupportInt', supportFn),
    });

    new CfnOutput(this, 'ApiUrl', { value: httpApi.apiEndpoint });
    new CfnOutput(this, 'TableNameOut', { value: this.table.tableName });
    new CfnOutput(this, 'KmsKeyIdOut', { value: this.fieldKey.keyId });
    new CfnOutput(this, 'HmacSecretIdOut', { value: this.hmacSecret.secretName });

    // —— 6.security-hardening：前端托管 + 传输安全头 ——
    // 静态前端 → S3 + CloudFront（禁塞 Lambda）。HTTPS 强制 + HSTS + CSP（SEC-003/008）。
    const webBucket = new s3.Bucket(this, 'WebBucket', {
      bucketName: `card-${envName}-web-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: retain,
      autoDeleteObjects: !prod,
    });

    const securityHeaders = new cloudfront.ResponseHeadersPolicy(this, 'SecHeaders', {
      responseHeadersPolicyName: `card-${envName}-sec`,
      securityHeadersBehavior: {
        strictTransportSecurity: {
          accessControlMaxAge: Duration.days(730),
          includeSubdomains: true,
          preload: true,
          override: true,
        },
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: cloudfront.HeadersFrameOption.DENY, override: true },
        referrerPolicy: {
          referrerPolicy: cloudfront.HeadersReferrerPolicy.NO_REFERRER,
          override: true,
        },
        contentSecurityPolicy: {
          contentSecurityPolicy:
            "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https:; object-src 'none'; frame-ancestors 'none'",
          override: true,
        },
      },
    });

    const distribution = new cloudfront.Distribution(this, 'WebDist', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(webBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: securityHeaders,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
      ],
    });

    new CfnOutput(this, 'WebBucketName', { value: webBucket.bucketName });
    new CfnOutput(this, 'WebUrl', { value: `https://${distribution.distributionDomainName}` });

    // —— 4.audit-observability：监控与告警（NFR-005）——
    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `card-${envName}`,
    });
    // 兑换接口错误率 + P95 延迟（NFR-001 P95≤2s）
    new cloudwatch.Alarm(this, 'RedeemErrorAlarm', {
      alarmDescription: '兑换接口 Lambda 错误数告警',
      metric: redeemFn.metricErrors({ period: Duration.minutes(5) }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    new cloudwatch.Alarm(this, 'RedeemLatencyP95Alarm', {
      alarmDescription: '兑换接口 P95 延迟超 2s（NFR-001）',
      metric: redeemFn.metricDuration({ period: Duration.minutes(5), statistic: 'p95' }),
      threshold: 2000,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: '兑换接口 调用/错误',
        left: [redeemFn.metricInvocations(), redeemFn.metricErrors()],
      }),
      new cloudwatch.GraphWidget({
        title: '兑换接口 延迟 P95/P50',
        left: [
          redeemFn.metricDuration({ statistic: 'p95' }),
          redeemFn.metricDuration({ statistic: 'p50' }),
        ],
      }),
    );
  }
}
