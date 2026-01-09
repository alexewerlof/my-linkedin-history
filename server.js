import http from 'node:http';
import fs from 'node:fs';
import { URL } from 'node:url';
import { extname } from 'node:path';
import { parse } from './lib/csv.js';

// Parse command line arguments
const args = process.argv.slice(2);

function getArg(flag) {
    const index = args.indexOf(flag);
    return index !== -1 && args[index + 1] ? args[index + 1] : null;
}

const zipPath = getArg('--zip');
const port = getArg('--port') || 3000;
// White list which files to serve
const fileAllowList = [
    'index.html',
    'index.css',
    'index.js',
    'node_modules/jj/lib/bundle.js',
]

if (!zipPath) {
    console.error('Usage: node server.js --zip <path_to_zip_file> [--port <port>]');
    process.exit(1);
}

if (!fs.existsSync(zipPath)) {
    console.error(`Error: File not found: ${zipPath}`);
    process.exit(1);
}

function sendJSON(res, code, data) {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

function sendError(res, code, message) {
    sendJSON(res, code, { error: message });
}

function sendResults(res, results) {
    sendJSON(res, 200, results);
}

function getFileContentType(fileName) {
    switch (extname(fileName.toLowerCase())) {
        case '.html':
            return 'text/html';
        case '.css':
            return 'text/css';
        case '.js':
            return 'application/javascript';
    }
}

const server = http.createServer(async (req, res) => {
    console.log(req.method, req.url)
    // Enable CORS for frontend access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method !== 'GET') {
        sendError(res, 405, 'Method Not Allowed');
        return;
    }

    if (url.pathname === '/') {
        res.writeHead(302, { 'Location': '/index.html' });
        res.end();
        return;
    }

    const staticFileName = url.pathname.slice(1);

    if (fileAllowList.includes(staticFileName)) {
        const contentType = getFileContentType(staticFileName);
        if (!contentType) {
            sendError(res, 404, 'Invalid file extension');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });

        const filePath = staticFileName;
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
        return;
    }

    const unzipPrefix = '/unzip/';

    if (!url.pathname.startsWith(unzipPrefix)) {
        sendError(res, 404, 'Not Found');
        return;
    }

    const filePath = url.pathname.slice(unzipPrefix.length);

    try {
        const records = [];
        // Use the existing lib/csv.js to parse the file from zip
        for await (const record of parse(zipPath, filePath)) {
            records.push(record);
        }

        sendResults(res, records);
    } catch (err) {
        console.error('Error processing file:', err);
        // Check if error is due to file not found in zip
        const statusCode = err.message.includes('not found in zip') ? 404 : 500;
        sendError(res, statusCode, err.message);
    }
});

server.listen(port, () => {
    console.log(`Serving zip file: ${zipPath}`);
    console.log(`Open http://localhost:${port}`);
});
