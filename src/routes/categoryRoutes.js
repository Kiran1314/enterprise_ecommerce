import express from 'express';
import { createCategory } from '../controllers/categoryController.js';
import { uploadIcon } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// The 'icon' string must match the name of the file input field in your frontend FormData
router.post('/create', uploadIcon.single('icon'), createCategory);

export default router;