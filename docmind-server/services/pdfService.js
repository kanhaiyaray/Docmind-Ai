const fs = require('fs');
const pdf = require('pdf-parse');

// Extract text from PDF file
const extractText = async (filePath) => {
  try {
    // Read PDF file
    const dataBuffer = fs.readFileSync(filePath);
    
    // Parse PDF
    const data = await pdf(dataBuffer);
    
    // Extract pages
    const pages = [];
    const pageTexts = data.text.split('\n\n');
    
    // Note: pdf-parse doesn't provide page-by-page extraction directly
    // We'll split by page markers or use a heuristic
    // For better page detection, consider using pdf-lib or pdf2json
    
    // Simple page splitting - improved heuristic
    const pageDelimiters = ['Page ', '', '\x0c', '\f'];
    let currentPage = 1;
    let currentText = '';
    
    const lines = data.text.split('\n');
    for (const line of lines) {
      // Check for page break
      if (line.includes('') || line.includes('\x0c') || line.includes('\f')) {
        if (currentText.trim()) {
          pages.push({
            pageNumber: currentPage,
            text: currentText.trim(),
          });
          currentPage++;
          currentText = '';
        }
        continue;
      }
      
      // Check for page number pattern
      const pageMatch = line.match(/Page\s+(\d+)/i);
      if (pageMatch && parseInt(pageMatch[1]) === currentPage + 1) {
        if (currentText.trim()) {
          pages.push({
            pageNumber: currentPage,
            text: currentText.trim(),
          });
          currentPage = parseInt(pageMatch[1]);
          currentText = '';
        }
        continue;
      }
      
      currentText += line + '\n';
    }
    
    // Add last page
    if (currentText.trim()) {
      pages.push({
        pageNumber: currentPage,
        text: currentText.trim(),
      });
    }
    
    // If we couldn't detect pages properly, distribute text evenly
    if (pages.length === 0 || pages.length < 2) {
      const totalPages = Math.max(1, Math.ceil(data.text.length / 3000));
      const charsPerPage = Math.ceil(data.text.length / totalPages);
      
      for (let i = 0; i < totalPages; i++) {
        const start = i * charsPerPage;
        const end = Math.min(start + charsPerPage, data.text.length);
        pages.push({
          pageNumber: i + 1,
          text: data.text.substring(start, end).trim(),
        });
      }
    }
    
    return {
      pageCount: pages.length,
      pages: pages,
      totalChars: data.text.length,
      metadata: {
        title: data.info?.Title || '',
        author: data.info?.Author || '',
        subject: data.info?.Subject || '',
        keywords: data.info?.Keywords || '',
        creationDate: data.info?.CreationDate,
        modificationDate: data.info?.ModDate,
      },
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

// Get PDF metadata only (without full text)
const getMetadata = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    
    return {
      title: data.info?.Title || '',
      author: data.info?.Author || '',
      subject: data.info?.Subject || '',
      keywords: data.info?.Keywords || '',
      pageCount: data.numpages || 0,
      creationDate: data.info?.CreationDate,
      modificationDate: data.info?.ModDate,
    };
  } catch (error) {
    console.error('PDF metadata error:', error);
    throw new Error(`Failed to get PDF metadata: ${error.message}`);
  }
};

// Validate PDF file
const validatePDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return {
      valid: true,
      pageCount: data.numpages || 0,
      textLength: data.text.length,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
};

module.exports = {
  extractText,
  getMetadata,
  validatePDF,
};
