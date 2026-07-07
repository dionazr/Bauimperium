import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: 'v1',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(','),

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'bauimperium-jwt-secret-dev',
    accessExpiry: '15m',
    refreshExpiry: '7d',
    refreshExpiryMs: 7 * 24 * 60 * 60 * 1000,
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://bauimperium:bauimperium_secret_2024@localhost:5432/bauimperium',
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  },

  // AI Core
  aiCore: {
    url: process.env.AI_CORE_URL || 'http://localhost:5000',
    apiKey: process.env.AI_CORE_API_KEY || '',
  },

  // Platform Fees
  fees: {
    clientPercentage: 0.02, // 2% vom Auftraggeber
    craftsmanPercentage: 0.04, // 4% vom Auftragnehmer
    escrowInterestRate: 0.025, // 2.5% p.a. Verwahrentgelt
    materialCommission: 0.05, // 5% vom Materialwert
  },

  // Email
  email: {
    host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@bauimperium.de',
  },

  // Upload
  upload: {
    maxFileSize: 50 * 1024 * 1024, // 50 MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'application/pdf',
      'application/x-dwg',
      'application/x-dxf',
    ],
  },
};
