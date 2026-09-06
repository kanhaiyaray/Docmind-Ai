const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const { upload } = require('../middleware/uploadMiddleware');
const pdfService = require('../services/pdfService');
const chunkService = require('../services/chunkService');
const embeddingService = require('../services/embeddingService');
const fs = require('fs');
const path = require('path');

const uploadDocument = async (req, res) => {
  try {
    console.log('📤 Upload request received');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    console.log(`📄 File: ${req.file.originalname}, Size: ${req.file.size} bytes`);

    const { originalname, filename, size, path: filePath } = req.file;

    const document = new Document({
      userId: req.userId,
      title: path.basename(originalname, path.extname(originalname)),
      filename: filename,
      fileUrl: `/uploads/${filename}`,
      fileSize: size,
      status: 'processing',
    });

    await document.save();
    console.log(`📝 Document record created: ${document._id}`);

    setTimeout(() => {
      processDocument(document._id, filePath, req.userId).catch((error) => {
        console.error(`❌ Error processing document ${document._id}:`, error);
      });
    }, 100);

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

const processDocument = async (documentId, filePath, userId) => {
  try {
    console.log(`🔄 Processing document ${documentId}...`);
    
    const document = await Document.findById(documentId);
    if (!document) {
      console.log(`❌ Document ${documentId} not found`);
      return;
    }

    console.log(`📖 Extracting text from PDF...`);
    const extraction = await pdfService.extractText(filePath);
    console.log(`✅ Extracted ${extraction.pageCount} pages, ${extraction.totalChars} characters`);
    
    document.pageCount = extraction.pageCount;
    if (extraction.metadata) {
      document.metadata = extraction.metadata;
    }
    await document.save();

    console.log(`🧩 Chunking document...`);
    const batchSize = 10;
    let totalChunks = 0;
    
    for (let i = 0; i < extraction.pages.length; i += batchSize) {
      const pageBatch = extraction.pages.slice(i, i + batchSize);
      const chunks = await chunkService.chunkDocument(
        documentId,
        userId,
        pageBatch
      );
      totalChunks += chunks;
      console.log(`✅ Processed pages ${i + 1}-${Math.min(i + batchSize, extraction.pages.length)}`);
      
      if (global.gc) {
        global.gc();
      }
    }
    
    console.log(`✅ Created ${totalChunks} total chunks`);

    console.log(`🧠 Generating embeddings...`);
    const allChunks = await Chunk.find({ documentId }).sort({ chunkIndex: 1 });
    
    const embedBatchSize = 50;
    for (let i = 0; i < allChunks.length; i += embedBatchSize) {
      const batch = allChunks.slice(i, i + embedBatchSize);
      await embeddingService.generateAndStoreEmbeddings(batch);
      console.log(`🧠 Processed embeddings for ${Math.min(i + embedBatchSize, allChunks.length)}/${allChunks.length} chunks`);
      
      if (global.gc) {
        global.gc();
      }
    }

    document.status = 'completed';
    await document.save();
    console.log(`✅ Document ${documentId} processed successfully`);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted temporary file: ${filePath}`);
      }
    } catch (cleanupError) {
      console.log(`⚠️ Could not delete temp file: ${cleanupError.message}`);
    }

  } catch (error) {
    console.error(`❌ Error processing document ${documentId}:`, error);
    
    await Document.findByIdAndUpdate(documentId, {
      status: 'failed',
      processingError: error.message,
    });
  }
};

module.exports = {
  uploadDocument,
};
