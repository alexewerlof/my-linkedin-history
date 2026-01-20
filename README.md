# My LinkedIn History

Ever wanted to search your LinkedIn post history but found the LinkedIn UI (site or mobile app) completely useless?

Now you can do that! 🎉

This repo basically provides a simple interface to explore the contents of a LinkedIn data take out zip file.

## How to use it

- [Download your full LinkedIn data](https://www.linkedin.com/help/linkedin/answer/a1339364/downloading-your-account-data) and put it somewhere in your computer (it usually takes a few days till you get the full archive in `.zip` format)
- Uncompress the zip file somewhere
- Run the app and open the local web page that it prints

Now you see all your posts in one page.

To search this page, use the browser's standard search function.

# How to run it

## On your machine

```bash
#Clone the repo
git clone git@github.com:alexewerlof/my-linkedin-history.git
# Install dependencies
npm ci
# Run the server
node server.js --path relative/path/to/your/expanded/linkedin/data/ [--port <port>]
```

## Architecture

- `server.js` creates a tiny node server that unzips the CSV files on the fly
- `index.html` loads `index.js` which sends a request to get the CSV content in JSON format and render it in the browser
