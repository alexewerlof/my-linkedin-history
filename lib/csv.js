import fs from 'node:fs';
import readline from 'node:readline';
import zlib from 'node:zlib';

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

export async function* parse(zipFilePath, csvFilePath) {
  const fileStream = await getZipEntryStream(zipFilePath, csvFilePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let record = [];
  let field = '';
  let insideQuote = false;
  let lineIndex = 0;
  let headers = [];

  for await (const line of rl) {
    if (insideQuote) {
      field += '\n';
    }

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuote && nextChar === '"') {
          field += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        record.push(field);
        field = '';
      } else {
        field += char;
      }
    }

    if (!insideQuote) {
      record.push(field);
      if (lineIndex === 0) {
        headers = record;
      } else {
        const obj = {};
        for (let i = 0; i < headers.length; i++) {
          obj[headers[i]] = record[i];
        }
        yield obj;
      }
      lineIndex++;
      record = [];
      field = '';
    }
  }
}
