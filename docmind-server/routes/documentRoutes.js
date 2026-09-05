const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload, handleUploadError } = require('../middleware/uploadMiddleware');
const {
  uploadDocument,
  getDocuments,
  getDocument,
  deleteDocument,
  getDocumentFile,
  updateDocument,
} = require('../controllers/documentController');
const { generateSummary, suggestQuestions } = require('../controllers/extraController');

// All routes are protected
router.use(protect);

// Upload document
router.post(
  '/upload',
  upload.single('document'),
  handleUploadError,
  uploadDocument
);

// Get all documents
router.get('/', getDocuments);

// Get single document
router.get('/:id', getDocument);

// Update document
router.put('/:id', updateDocument);

// Delete document
router.delete('/:id', deleteDocument);

// Get document file
router.get('/:id/file', getDocumentFile);

// Generate summary
router.post('/summary', generateSummary);

// Suggest questions
router.post('/suggest-questions', suggestQuestions);

module.exports = router;
