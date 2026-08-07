import { Router } from 'express';
import adminRoutes from '../adminRoutes';
import phase3Routes from '../phase3Routes';
import phase4Routes from '../phase4Routes';
import phase5Routes from '../phase5Routes';
import phase6Routes from '../phase6Routes';
import studioRoutes from '../studioRoutes';
import realEstateRoutes from '../realEstateRoutes';

const router = Router();

// Centralized Router Aggregator
router.use(adminRoutes);
router.use(phase3Routes);
router.use(phase4Routes);
router.use(phase5Routes);
router.use(phase6Routes);
router.use(studioRoutes);
router.use(realEstateRoutes);

export default router;
