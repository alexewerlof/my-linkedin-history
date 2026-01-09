import { parse } from './lib/csv.js';

const zipFilePath = 'Complete_LinkedInDataExport_12-17-2025.zip.zip';
const csvFilePath = 'Shares.csv';

async function main() {
  for await (const record of parse(zipFilePath, csvFilePath)) {
    console.log(record);
  }
}

main().catch(console.error);