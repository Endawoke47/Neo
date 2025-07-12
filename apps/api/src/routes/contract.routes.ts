// Contract Routes
import { Router } from 'express';
const router = Router();
router.get('/', (_, res) => {
  res.json({ message: 'Contract routes - Coming soon' });
});
export default router;
