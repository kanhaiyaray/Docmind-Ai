const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const pdf = require('pdf-parse');
const pdfPoppler = require('pdf-poppler');
const Tesseract = require('tesseract.js');

// Helper: Convert PDF date format to valid Date
const convertPDFDate = (pdfDate) => {
  if (!pdfDate) return null;
  
  try {
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

// ---------- EXISTING: Extract text from PDF (pdf-parse) ----------
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
          pages.push({ pageNumber: currentPage, text: currentText.trim() });
          currentPage++;
          currentText = '';
        }
        continue;
      }
      const pageMatch = line.match(/Page\s+(\d+)/i);
      if (pageMatch && parseInt(pageMatch[1]) === currentPage + 1) {
        if (currentText.trim()) {
          pages.push({ pageNumber: currentPage, text: currentText.trim() });
          currentPage = parseInt(pageMatch[1]);
          currentText = '';
        }
        continue;
      }
      currentText += line + '\n';
    }
    if (currentText.trim()) {
      pages.push({ pageNumber: currentPage, text: currentText.trim() });
    }
    
    // If no pages detected, split by length
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

// ---------- NEW: OCR fallback for image‑based PDFs ----------
const extractTextWithOCR = async (filePath) => {
  const tempDir = path.join(path.dirname(filePath), 'ocr_temp_' + Date.now());
  await fsPromises.mkdir(tempDir, { recursive: true });

  try {
    // Convert PDF to images (one per page)
    const opts = {
      format: 'png',
      out_dir: tempDir,
      out_prefix: 'page',
      page: null, // all pages
    };
    await pdfPoppler.convert(filePath, opts);

    // Read generated image files
    const files = await fsPromises.readdir(tempDir);
    const imageFiles = files.filter(f => f.endsWith('.png')).sort();

    if (imageFiles.length === 0) {
      throw new Error('No images generated from PDF');
    }

    let fullText = '';
    const pages = [];

    // OCR each image
    for (const imgFile of imageFiles) {
      const imgPath = path.join(tempDir, imgFile);
      const pageNum = parseInt(imgFile.replace('page-', '').replace('.png', ''));
      const { data: { text } } = await Tesseract.recognize(imgPath, 'eng');
      const cleanText = text.trim();
      pages.push({
        pageNumber: pageNum,
        text: cleanText,
      });
      fullText += cleanText + '\n';
    }

    return {
      pageCount: pages.length,
      pages: pages,
      totalChars: fullText.length,
      metadata: {}, // OCR doesn't provide metadata
    };
  } finally {
    // Clean up temporary directory
    await fsPromises.rm(tempDir, { recursive: true, force: true });
  }
};

// ---------- NEW: Smart extraction with fallback ----------
const extractTextWithFallback = async (filePath) => {
  try {
    // Try pdf-parse first
    const result = await extractText(filePath);
    const totalText = result.pages.map(p => p.text).join(' ');
    // If very little text, assume it's image‑based
    if (totalText.trim().length < 100) {
      console.log('⚠️ Low text extraction, attempting OCR...');
      return await extractTextWithOCR(filePath);
    }
    return result;
  } catch (error) {
    console.error('PDF extraction failed, trying OCR:', error.message);
    // On any error, fallback to OCR
    return await extractTextWithOCR(filePath);
  }
};

// ---------- Other existing functions (unchanged) ----------
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
  extractText: extractTextWithFallback, 
  getMetadata,
  validatePDF,
};