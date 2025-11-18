export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/csediualumni',
  },

  jwt: {
    secret:
      process.env.JWT_SECRET ||
      'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRATION || '7d',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL:
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3000/api/auth/google/callback',
  },

  mail: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || '',
    },
    from: process.env.MAIL_FROM || 'noreply@csediualumni.com',
  },

  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:4200',
  },

  api: {
    url: process.env.API_URL || 'http://localhost:3000',
  },

  payment: {
    gateway: process.env.PAYMENT_GATEWAY || 'sslcommerz',
    sslcommerz: {
      storeId: process.env.SSLCOMMERZ_STORE_ID || '',
      storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD || '',
      sandbox: process.env.SSLCOMMERZ_SANDBOX === 'true' || true,
    },
  },

  systemAdmin: {
    email: process.env.SYSTEM_ADMIN_EMAIL || 'system-admin@csediualumni.com',
    password: process.env.SYSTEM_ADMIN_PASSWORD || '',
    firstName: process.env.SYSTEM_ADMIN_FIRST_NAME || 'System',
    lastName: process.env.SYSTEM_ADMIN_LAST_NAME || 'Administrator',
  },
});
