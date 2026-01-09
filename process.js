import { parse } from './lib/csv.js';

const zipFilePath = 'Complete_LinkedInDataExport_12-17-2025.zip.zip';
const csvFilePath = 'Shares.csv';

async function main() {
    const j = []
  for await (const record of parse(zipFilePath, csvFilePath)) {
    // console.log(record);
    j.push(record)
  }

  console.log(JSON.stringify(j))
}

main().catch(console.error);