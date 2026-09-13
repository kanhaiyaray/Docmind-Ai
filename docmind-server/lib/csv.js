// docmind-server/lib/csv.js
const escapeCell = (value) => {
  if (value === null || value === undefined) return '';
  let s;
  if (value instanceof Date) s = value.toISOString();
  else if (typeof value === 'object') s = JSON.stringify(value);
  else s = String(value);

  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;

  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const toCSV = (rows, columns) => {
  const header = columns.map((c) => escapeCell(c.label)).join(',');
  const lines = rows.map((row) =>
    columns
      .map((c) => escapeCell(typeof c.value === 'function' ? c.value(row) : row[c.key]))
      .join(',')
  );
  return '\uFEFF' + [header, ...lines].join('\r\n');
};

const sendCSV = (res, filename, csv) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${filename}-${new Date().toISOString().slice(0, 10)}.csv"`
  );
  res.send(csv);
};

module.exports = { toCSV, sendCSV, escapeCell };
