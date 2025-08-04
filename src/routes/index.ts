import { Router } from 'express';
import authRoutes from './auth.routes';
import companyRoutes from './company.routes';
import hmsRoutes from './hms.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HMS API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    schema: '16-table-architecture',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/api', companyRoutes);
router.use('/api', hmsRoutes);

export default router;