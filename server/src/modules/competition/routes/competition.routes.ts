import { Router } from 'express';
import * as controller from '../controllers/competition.controller.js';

const router = Router();

router.get('/options', controller.options);
router.get('/dashboard', controller.dashboard);
router.get('/assets/:competitorId/:captureDate/:assetFile', controller.asset);

export { router as competitionRouter };
