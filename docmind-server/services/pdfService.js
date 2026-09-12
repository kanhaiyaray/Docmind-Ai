const fs = require('fs');
const pdf = require('pdf-parse');

const convertPDFDate = (pdfDate) => {
  if (!pdfDate) return null;
  try {
    const match = pdfDate.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})([+-])(\d{2})'(\d{2})'/);
    if (match) {
      const [, year, month, day, hour, minute, second, sign, tzHour, tzMinute] = match;
      const tzOffset = `${sign}${tzHour}:${tzMinute}`;
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}${tzOffset}`);
    }
    const date = new Date(pdfDate);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

const dedupeText = (text) => {
  if (!text || text.length < 500) return text;

  const lines = text.split('\n');
  const seen = new Set();
  const out = [];

  for (const line of lines) {
    const key = line.trim();
    if (key.length < 40) { out.push(line); continue; }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }

  const blocks = out.join('\n').split(/\n{2,}/);
  const dedupedBlocks = [];
  let prevBlock = null;

  for (const block of blocks) {
    const norm = block.replace(/\s+/g, ' ').trim();
    if (norm.length === 0) continue;
    if (prevBlock === norm) continue;
    if (dedupedBlocks.some((b) => b.replace(/\s+/g, ' ').trim() === norm)) continue;
    prevBlock = norm;
    dedupedBlocks.push(block);
  }

  return dedupedBlocks.join('\n\n');
};

const extractText = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);

    const rawLength = data.text.length;
    const cleaned = dedupeText(data.text);
    const cleanedLength = cleaned.length;

    console.log(`📄 Raw text length: ${rawLength} chars`);
    console.log(`📄 After dedupe:   ${cleanedLength} chars (${Math.round((1 - cleanedLength / rawLength) * 100)}% removed)`);

    const formFeedSplit = cleaned.split('\f').map((t) => t.trim()).filter((t) => t.length > 0);

    let pages = [];
    if (formFeedSplit.length >= 2) {
      pages = formFeedSplit.map((text, i) => ({ pageNumber: i + 1, text }));
    } else {
      const approxCharsPerPage = 2500;
      const totalPages = Math.max(1, Math.ceil(cleaned.length / approxCharsPerPage));
      for (let i = 0; i < totalPages; i++) {
        const start = i * approxCharsPerPage;
        const end = Math.min(start + approxCharsPerPage, cleaned.length);
        pages.push({ pageNumber: i + 1, text: cleaned.substring(start, end).trim() });
      }
    }

    const totalText = pages.map((p) => p.text).join(' ');
    if (totalText.trim().length < 100) {
      throw new Error('This appears to be a scanned or image-based PDF. We only support text-based PDFs with selectable text.');
    }

    return {
      pageCount: pages.length,
      pages,
      totalChars: cleanedLength,
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
    throw new Error(`Failed to get PDF metadata: ${error.message}`);
  }
};

const validatePDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return { valid: true, pageCount: data.numpages || 0, textLength: data.text.length };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

module.exports = { extractText, getMetadata, validatePDF };