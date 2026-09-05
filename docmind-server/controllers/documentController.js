const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const { upload } = require('../middleware/uploadMiddleware');
const pdfService = require('../services/pdfService');
const chunkService = require('../services/chunkService');
const embeddingService = require('../services/embeddingService');
const fs = require('fs');
const path = require('path');

// @desc    Upload document
// @route   POST /api/documents/upload
// @access  Private
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const { originalname, filename, size, path: filePath } = req.file;

    // Create document record
    const document = new Document({
      userId: req.userId,
      title: path.basename(originalname, path.extname(originalname)),
      filename: filename,
      fileUrl: `/uploads/${filename}`,
      fileSize: size,
      status: 'processing',
    });

    await document.save();

    // Process PDF asynchronously
    processDocument(document._id, filePath).catch((error) => {
      console.error(`Error processing document ${document._id}:`, error);
    });

    res.status(201).json({
      success: true,
      document,
      message: 'Document uploaded successfully. Processing started.',
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading document',
    });
  }
};

// Process document (extract text, chunk, embed)
const processDocument = async (documentId, filePath) => {
  try {
    const document = await Document.findById(documentId);
    if (!document) return;

    // Extract text from PDF
    const extraction = await pdfService.extractText(filePath);
    
    // Update document with page count
    document.pageCount = extraction.pageCount;
    await document.save();

    // Chunk the text
    const chunks = await chunkService.chunkDocument(
      documentId,
      document.userId,
      extraction.pages
    );

    // Generate embeddings for chunks
    await embeddingService.generateAndStoreEmbeddings(chunks);

    // Update document status
    document.status = 'completed';
    await document.save();

    // Clean up uploaded file (optional - keep for PDF viewer)
    // fs.unlinkSync(filePath);

    console.log(`✅ Document ${documentId} processed successfully`);
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);
    
    // Update document status to failed
    await Document.findByIdAndUpdate(documentId, {
      status: 'failed',
      processingError: error.message,
    });
  }
};

// @desc    Get all documents
// @route   GET /api/documents
// @access  Private
const getDocuments = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    
    const query = { userId: req.userId };
    if (status) query.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let documentsQuery = Document.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Text search
    if (search) {
      documentsQuery = Document.find({
        ...query,
        $text: { $search: search },
      }).sort({ score: { $meta: 'textScore' } });
    }

    const documents = await documentsQuery;
    const total = await Document.countDocuments(query);

    res.json({
      success: true,
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documents',
    });
  }
};

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private
const getDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    res.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching document',
    });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Delete chunks
    await Chunk.deleteMany({ documentId: document._id });

    // Delete file if exists
    const filePath = path.join(__dirname, '..', document.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await document.deleteOne();

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting document',
    });
  }
};

// @desc    Get document file
// @route   GET /api/documents/:id/file
// @access  Private
const getDocumentFile = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    const filePath = path.join(__dirname, '..', document.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching file',
    });
  }
};

// @desc    Update document metadata
// @route   PUT /api/documents/:id
// @access  Private
const updateDocument = async (req, res) => {
  try {
    const { title, tags, isFavorite } = req.body;
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    if (title) document.title = title;
    if (tags) document.tags = tags;
    if (isFavorite !== undefined) document.isFavorite = isFavorite;

    await document.save();

    res.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating document',
    });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocument,
  deleteDocument,
  getDocumentFile,
  updateDocument,
};
