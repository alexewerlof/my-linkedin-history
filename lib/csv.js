import fs from 'node:fs';
import { parse as parseCsv } from 'csv-parse';

function cleanShareCommentary(value) {
  // LinkedIn exports ShareCommentary with each line wrapped in quotes.
  return value.replace(/^"/gm, '').replace(/"$/gm, '');
}

export async function* parse(csvFilePath) {
  const fileStream = fs.createReadStream(csvFilePath);

  // Comments.csv uses backslash escaping, while Shares.csv uses standard double-quote escaping
  const escape = csvFilePath.includes('Shares.csv') ? '"' : '\\';

  const parser = fileStream.pipe(parseCsv({
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    escape,
    relax_column_count: true,
    cast: (value, context) => {
      if (context.column === 'ShareCommentary') {
        return cleanShareCommentary(value);
      }
      return value;
    },
  }));

  for await (const record of parser) {
    yield record;
  }
}
