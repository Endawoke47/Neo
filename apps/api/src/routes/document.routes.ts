// Document Routes
import { Router } from 'express';
const router = Router();
router.get('/', (_, res) => {
  res.json({ message: 'Document routes - Coming soon' });
});
export default router;
