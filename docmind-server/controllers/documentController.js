const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const Conversation = require('../models/Conversation');
const pdfService = require('../services/pdfService');
const chunkService = require('../services/chunkService');
const embeddingService = require('../services/embeddingService');
const fs = require('fs');
const path = require('path');

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: 'No file uploaded' });
    }

    const { originalname, filename, size, path: filePath } = req.file;

    const document = new Document({
      userId: req.userId,
      title: path.basename(originalname, path.extname(originalname)),
      filename,
      fileUrl: `/uploads/${filename}`,
      fileSize: size,
      status: 'processing',
    });

    await document.save();

    processDocument(document._id, filePath, req.userId).catch((error) => {
      console.error(`❌ Error processing document ${document._id}:`, error);
    });

    res.status(201).json({
      success: true,
      document,
      message: 'Document uploaded successfully. Processing started.',
    });
  } catch (error) {
    console.error('Upload error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Error uploading document' });
  }
};

const processDocument = async (documentId, filePath, userId) => {
  try {
    console.log(`🔄 Processing document ${documentId}...`);

    const document = await Document.findById(documentId);
    if (!document) {
      console.log(`❌ Document ${documentId} not found`);
      return;
    }

    let extraction;
    try {
      extraction = await pdfService.extractText(filePath);
    } catch (extractError) {
      document.status = 'failed';
      document.processingError = `Text extraction failed: ${extractError.message}`;
      await document.save();
      return;
    }

    document.pageCount = extraction.pageCount;
    if (extraction.metadata) document.metadata = extraction.metadata;
    await document.save();

    let totalChunks;
    try {
      totalChunks = await chunkService.chunkDocument(
        documentId,
        userId,
        extraction.pages
      );
    } catch (chunkError) {
      document.status = 'failed';
      document.processingError = `Chunking failed: ${chunkError.message}`;
      await document.save();
      return;
    }

    if (totalChunks === 0) {
      document.status = 'failed';
      document.processingError =
        'No text content extracted from the document.';
      await document.save();
      return;
    }

    try {
      const allChunks = await Chunk.find({ documentId }).sort({ chunkIndex: 1 });
      await embeddingService.generateAndStoreEmbeddings(allChunks);
    } catch (embedError) {
      document.status = 'failed';
      document.processingError = `Embedding generation failed: ${embedError.message}`;
      await document.save();
      return;
    }

    document.status = 'completed';
    await document.save();
    console.log(`✅ Document ${documentId} processed successfully`);
  } catch (error) {
    console.error(`❌ Unhandled error processing document ${documentId}:`, error);
    await Document.findByIdAndUpdate(documentId, {
      status: 'failed',
      processingError: `Processing failed: ${error.message}`,
    });
  }
};

const getDocuments = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const query = { userId: req.userId };
    if (status) query.status = status;
    if (search) query.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const documentsQuery = Document.find(query)
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

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
    res
      .status(500)
      .json({ success: false, message: 'Error fetching documents' });
  }
};

const getDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!document) {
      return res
        .status(404)
        .json({ success: false, message: 'Document not found' });
    }

    res.json({ success: true, document });
  } catch (error) {
    console.error('Get document error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Error fetching document' });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!document) {
      return res
        .status(404)
        .json({ success: false, message: 'Document not found' });
    }

    await Chunk.deleteMany({ documentId: document._id });
    await Conversation.deleteMany({ documentId: document._id });

    const filePath = path.join(__dirname, '..', document.fileUrl.replace(/^\//, ''));
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }

    await document.deleteOne();

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Error deleting document' });
  }
};

const getDocumentFile = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!document) {
      return res
        .status(404)
        .json({ success: false, message: 'Document not found' });
    }

    const filePath = path.join(__dirname, '..', document.fileUrl.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ success: false, message: 'File not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ success: false, message: 'Error fetching file' });
  }
};

const updateDocument = async (req, res) => {
  try {
    const { title, tags, isFavorite } = req.body;
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!document) {
      return res
        .status(404)
        .json({ success: false, message: 'Document not found' });
    }

    if (title) document.title = title;
    if (tags) document.tags = tags;
    if (isFavorite !== undefined) document.isFavorite = isFavorite;

    await document.save();

    res.json({ success: true, document });
  } catch (error) {
    console.error('Update document error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Error updating document' });
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
