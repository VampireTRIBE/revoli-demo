import { Router } from 'express';
import * as controller from '../controllers/creative.controller.js';

const router = Router();

router.get('/options', controller.options);
router.get('/dashboard', controller.dashboard);

export { router as creativeRouter };
