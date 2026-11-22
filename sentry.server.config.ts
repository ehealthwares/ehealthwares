import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://2729b1685a4ae722bd445f0cee2cb5b7@o4511611278000128.ingest.us.sentry.io/4511611379187712',
  dataCollection: {},
  // Tracing
  tracesSampleRate: 1.0, // Capture 100% of the transactions
});
