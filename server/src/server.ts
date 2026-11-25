import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { sourceDataset } from './modules/media/services/media-data.service.js';

// Spreadsheet-driven dashboards must start even when a single optional import
// is malformed. An import failure affects that endpoint, not every other tab.
// The historical MongoDB media import is optional and never required for reads.
if (process.env.MONGODB_URI?.trim()) {
  await connectDatabase();
}
try {
  sourceDataset();
} catch (error) {
  console.error('[media] source warmup failed; APIs remain available for diagnosis:', error);
}

app.listen(env.PORT, () => {
  console.info(`[server] BizCom Media API listening on http://localhost:${env.PORT}`);
});
