export function parseCSVText(text) {
  const source = text.replace(/^\uFEFF/, '');
  const records = [];
  let record = [];
  let value = '';
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (inQuotes) {
      if (character === '"' && source[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        value += character;
      }
    } else if (character === '"' && value === '') {
      inQuotes = true;
    } else if (character === ',') {
      record.push(value.trim());
      value = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && source[index + 1] === '\n') index += 1;
      record.push(value.trim());
      if (record.some(cell => cell !== '')) records.push(record);
      record = [];
      value = '';
    } else {
      value += character;
    }
  }

  if (inQuotes) throw new Error('CSV contains an unclosed quoted field.');
  if (value !== '' || record.length) {
    record.push(value.trim());
    if (record.some(cell => cell !== '')) records.push(record);
  }
  if (records.length < 2) return [];

  const headers = records.shift().map(header => header.trim().toLowerCase());
  if (headers.some(header => !header) || new Set(headers).size !== headers.length) {
    throw new Error('CSV headers must be present and unique.');
  }

  return records.map((cells, index) => {
    if (cells.length > headers.length && cells.slice(headers.length).some(cell => cell)) {
      throw new Error(`CSV row ${index + 2} has more values than the header row.`);
    }
    return Object.fromEntries(headers.map((header, column) => [header, cells[column] || '']));
  });
}
