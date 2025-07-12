// AI Routes
import { Router } from 'express';
const router = Router();
router.get('/', (_, res) => {
  res.json({ message: 'AI routes - Coming soon' });
});
export default router;
