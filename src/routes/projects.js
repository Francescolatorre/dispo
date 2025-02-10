import express from 'express';
const router = express.Router();

// Basic route setup for projects
router.get('/', (req, res) => {
  res.json({ message: 'Projects route' });
});

export default router;
