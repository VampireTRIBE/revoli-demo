import { Router, static as serveStatic } from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import multer from 'multer';
import { env } from '../../../config/env.js';
import * as controller from '../controllers/media.controller.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
  fileFilter: (_request, file, callback) => callback(null, /\.(xlsx|zip)$/i.test(file.originalname)),
});

const campaignAssetCandidates=[resolve(process.cwd(),'server/data/media-campaign-assets'),resolve(process.cwd(),'data/media-campaign-assets')];
const campaignAssetDir=campaignAssetCandidates.find(existsSync);
if (campaignAssetDir) router.use('/campaign-thumbnails',serveStatic(campaignAssetDir,{dotfiles:'deny',fallthrough:false}));
router.get('/periods', controller.periods);
router.get('/history', controller.history);
router.get('/ga4-v4', controller.ga4V4);
router.get('/union-coop', controller.unionCoop);
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
