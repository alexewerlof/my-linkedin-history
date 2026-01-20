import fs from 'node:fs';
import zlib from 'node:zlib';
import { parse as parseCsv } from 'csv-parse';

async function getZipEntryStream(zipPath, targetFileName) {
  const handle = await fs.promises.open(zipPath, 'r');
  try {
    const stat = await handle.stat();
    const fileSize = stat.size;

    // Search for End of Central Directory Record (EOCD)
    // EOCD is at the end of the file, min size 22 bytes.
    const searchSize = Math.min(fileSize, 65535 + 22);
    const buffer = Buffer.alloc(searchSize);
    await handle.read({ buffer, length: searchSize, position: fileSize - searchSize });

    let eocdOffset = -1;
    for (let i = buffer.length - 22; i >= 0; i--) {
      if (buffer.readUInt32LE(i) === 0x06054b50) {
        eocdOffset = i + (fileSize - searchSize);
        break;
      }
    }

    if (eocdOffset === -1) throw new Error('Invalid ZIP file');

    const bufferOffset = eocdOffset - (fileSize - searchSize);
    const cdRecords = buffer.readUInt16LE(bufferOffset + 10);
    const cdSize = buffer.readUInt32LE(bufferOffset + 12);
    const cdOffset = buffer.readUInt32LE(bufferOffset + 16);

    const cdBuffer = Buffer.alloc(cdSize);
    await handle.read({ buffer: cdBuffer, length: cdSize, position: cdOffset });

    let currentOffset = 0;
    for (let i = 0; i < cdRecords; i++) {
      if (cdBuffer.readUInt32LE(currentOffset) !== 0x02014b50) break;

      const method = cdBuffer.readUInt16LE(currentOffset + 10);
      const compressedSize = cdBuffer.readUInt32LE(currentOffset + 20);
      const fileNameLen = cdBuffer.readUInt16LE(currentOffset + 28);
      const extraLen = cdBuffer.readUInt16LE(currentOffset + 30);
      const commentLen = cdBuffer.readUInt16LE(currentOffset + 32);
      const localHeaderOffset = cdBuffer.readUInt32LE(currentOffset + 42);
      const fileName = cdBuffer.toString('utf8', currentOffset + 46, currentOffset + 46 + fileNameLen);

      if (fileName === targetFileName) {
        const localHeaderBuffer = Buffer.alloc(30);
        await handle.read({ buffer: localHeaderBuffer, length: 30, position: localHeaderOffset });
        
        const localFileNameLen = localHeaderBuffer.readUInt16LE(26);
        const localExtraLen = localHeaderBuffer.readUInt16LE(28);
        const dataOffset = localHeaderOffset + 30 + localFileNameLen + localExtraLen;

        const stream = fs.createReadStream(zipPath, {
          start: dataOffset,
          end: dataOffset + compressedSize - 1
        });

        if (method === 8) return stream.pipe(zlib.createInflateRaw());
        if (method === 0) return stream;
        throw new Error(`Unsupported compression method: ${method}`);
      }

      currentOffset += 46 + fileNameLen + extraLen + commentLen;
    }
    throw new Error(`File ${targetFileName} not found in zip`);
  } finally {
    await handle.close();
  }
}

function cleanShareCommentary(value) {
  // LinkedIn exports ShareCommentary with each line wrapped in quotes.
  return value.replace(/^"/gm, '').replace(/"$/gm, '');
}

export async function* parse(zipFilePath, csvFilePath) {
  const fileStream = await getZipEntryStream(zipFilePath, csvFilePath);

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
