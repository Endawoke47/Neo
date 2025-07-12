// Report Routes
import { Router } from 'express';
const router = Router();
router.get('/', (_, res) => {
  res.json({ message: 'Report routes - Coming soon' });
});
export default router;
