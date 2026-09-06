const fs = require('fs');
const pdf = require('pdf-parse');

// Helper: Convert PDF date format to valid Date
const convertPDFDate = (pdfDate) => {
  if (!pdfDate) return null;
  
  try {
    // PDF date format: D:YYYYMMDDHHmmSS±HH'mm'
    const match = pdfDate.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})([+-])(\d{2})'(\d{2})'/);
    
    if (match) {
      const [, year, month, day, hour, minute, second, sign, tzHour, tzMinute] = match;
      const tzOffset = `${sign}${tzHour}:${tzMinute}`;
      const dateStr = `${year}-${month}-${day}T${hour}:${minute}:${second}${tzOffset}`;
      return new Date(dateStr);
    }
    
    const date = new Date(pdfDate);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    return null;
  }
};

// Extract text from PDF file
const extractText = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    
    const pages = [];
    const lines = data.text.split('\n');
    let currentPage = 1;
    let currentText = '';
    
    for (const line of lines) {
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
    
    if (currentText.trim()) {
      pages.push({
        pageNumber: currentPage,
        text: currentText.trim(),
      });
    }
    
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
        creationDate: convertPDFDate(data.info?.CreationDate),
        modificationDate: convertPDFDate(data.info?.ModDate),
      },
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

// Get PDF metadata only
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
      creationDate: convertPDFDate(data.info?.CreationDate),
      modificationDate: convertPDFDate(data.info?.ModDate),
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