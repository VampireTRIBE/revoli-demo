import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { sourceDataset } from './modules/media/services/media-data.service.js';

await connectDatabase();
sourceDataset();

app.listen(env.PORT, () => {
  console.info(`[server] BizCom Media API listening on http://localhost:${env.PORT}`);
});
