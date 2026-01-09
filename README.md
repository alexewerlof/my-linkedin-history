# My LinkedIn History

Ever wanted to search your post history but found the LinkedIn UI (site or mobile app) completely useless?

Now you can! 🎉

This repo basically provides a simple interface to explore the contents of a LinkedIn data take out zip file.

## How to use it

- [Download your full LinkedIn data](https://www.linkedin.com/help/linkedin/answer/a1339364/downloading-your-account-data) and put it somewhere in your computer (it usually takes a few days till you get the full archive in `.zip` format)
- Run the server: `node server.js --zip <path_to_your_zip_file> [--port <port>]`
- Open the web page that it prints and see all your posts in one page
- To search this page, use the browser's standard search function

## How does it work?

- `server.js` creates a tiny node server that unzips the CSV files on the fly
- `index.html` loads `index.js` which sends a request to get the CSV content in JSON format and render it in the browser

## Docker

You can also run this project using Docker.

1. Build the image: `docker build -t my-linkedin-history .`
2. Run the container:
   ```bash
   docker run -p 3000:3000 -v /path/to/your/linkedin_data.zip:/data.zip linkedin-history --zip /data.zip
   ```
   Note: You must use an absolute path for the volume mount (`-v`).
