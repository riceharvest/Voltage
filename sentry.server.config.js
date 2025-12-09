import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.NODE_ENV || 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Console(),
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection(),
  ],
  // Performance monitoring
  tracesSampler: (samplingContext) => {
    // Sample all API routes and important pages
    if (samplingContext.request?.url?.includes('/api/')) {
      return 1.0;
    }
    return 0.1;
  },
  // Alerting configuration
  beforeSend(event, hint) {
    // Filter out known non-critical errors
    if (event.exception) {
      const error = hint.originalException;
      if (error && error.message?.includes('Network request failed')) {
        return null; // Don't send network errors
      }
    }
    return event;
  },
  // Infrastructure monitoring
  maxBreadcrumbs: 50,
  attachStacktrace: true,
  // Enable profiling in production
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
});