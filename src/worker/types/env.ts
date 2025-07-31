export interface Env {
  DB: D1Database;
  FILES: R2Bucket;
  ANALYTICS: AnalyticsEngineDataset;
  CACHE: KVNamespace;
  VECTORIZE: VectorizeIndex;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  RESEND_API_KEY: string;
  OPENAI_API_KEY: string;
  ENVIRONMENT: string;
  APP_URL: string;
  R2_BUCKET_NAME: string;
  R2_PUBLIC_URL: string;
}
