export interface IEnvironmentVariables {
  NODE_ENV: string;
  STAGE_ENV: "local" | "development" | "staging" | "production" | "test";
  DATABASE_URL: string;
  BE_PORT: number;
  BE_WS_PORT: number;
  API_BASE_URL: string;
  API_HEALTH_URL: string;
  AWS_S3_REGION: string;
  AWS_S3_ENDPOINT: string;
  AWS_S3_BUCKET_NAME: string;
  AWS_S3_BUCKET_URL: string;
  AWS_S3_PRESIGN_URL_EXPIRY_IN_MINUTES: number;
  DOCUSEAL_API_KEY?: string;
  SENDGRID_API_KEY: string;
  ENABLE_AUDIT_LOGGING?: "true" | "false";
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  WEB_CLIENT_BASE_URL: string;
  SEND_FROM_EMAIL: string;
  ORGANIZATION_OWNER_EMAIL?: string;
  ORGANIZATION_OWNER_PASSWORD?: string;
  SESSION_EXPIRES_IN: number;
  SESSION_UPDATE_AGE: number;
}
