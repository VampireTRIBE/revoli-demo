import { Router } from 'express';
import { list } from '../controllers/reads.controller.js';

const router = Router();
router.get('/', list);
export { router as readsRouter };
