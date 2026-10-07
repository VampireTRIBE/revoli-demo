import { Router } from 'express';
import multer from 'multer';
import { env } from '../../../config/env.js';
import * as controller from '../controllers/media.controller.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
  fileFilter: (_request, file, callback) => callback(null, /\.(xlsx|zip)$/i.test(file.originalname)),
});

router.get('/periods', controller.periods);
router.get('/overview', controller.overview);
router.get('/platforms', controller.platforms);
router.get('/campaigns', controller.campaigns);
router.get('/brands', controller.brands);
router.get('/segments', controller.segments);
router.get('/reconciliation', controller.reconciliation);
router.get('/funnel', controller.funnel);
router.get('/organic-demand', controller.organicDemand);
router.get('/audit/calculations/platform-cac', controller.calculationAudit);
router.get('/imports', controller.imports);
router.get('/imports/:batchId', controller.importById);
router.post('/import', upload.single('package'), controller.createImport);

export { router as mediaRouter };
