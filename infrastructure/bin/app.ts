import { App } from 'aws-cdk-lib';
import { CardPlatformStack } from '../lib/card-platform-stack.js';

const app = new App();
const env = (app.node.tryGetContext('env') as string) ?? 'preview';

new CardPlatformStack(app, `Wz-${env}`, {
  envName: env,
  description: `卡密兑换平台 ${env} 环境（CDK 管理，禁止控制台漂移）`,
});
