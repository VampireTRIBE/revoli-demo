import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/bizcom-engine'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().default(50),
  SOURCE_DATA_DIR: z.string().default('src/data'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export const env = schema.parse(process.env);
