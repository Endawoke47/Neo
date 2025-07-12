// Dispute Routes
import { Router } from 'express';
const router = Router();
router.get('/', (_, res) => {
  res.json({ message: 'Dispute routes - Coming soon' });
});
export default router;
