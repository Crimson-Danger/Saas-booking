declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
  }
}

