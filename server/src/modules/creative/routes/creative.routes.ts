import { Router } from 'express';
import * as controller from '../controllers/creative.controller.js';

const router = Router();

router.get('/options', controller.options);
router.get('/dashboard', controller.dashboard);
router.get('/cleo', controller.cleo);

export { router as creativeRouter };
