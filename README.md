# My LinkedIn History

Ever wanted to search your LinkedIn post history but found the LinkedIn UI (site or mobile app) completely useless?

Now you can do that! 🎉

This repo basically provides a simple interface to explore the contents of a LinkedIn data take out zip file.

## How to use it

- [Download your full LinkedIn data](https://www.linkedin.com/help/linkedin/answer/a1339364/downloading-your-account-data) and put it somewhere in your computer (it usually takes a few days till you get the full archive in `.zip` format)
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
node server.js --zip </path/to/your/linkedin_data.zip> [--port <port>]
```

## Docker

You can also run this project using Docker.

```bash
# Build the image
docker build -t my-linkedin-history .
# Run the container ()
docker run --name linkedin-history -p 3000:3000 -v /absolute/path/to/your/linkedin_data.zip:/data.zip linkedin-history --zip /data.zip
```

**Note: You must use an absolute path for the volume mount**

## Podman

You can also use Podman.

```bash
# Build the image
podman build -t my-linkedin-history .
# Run the container
podman run --name linkedin-history -p 3000:3000 -v /absolute/path/to/your/linkedin_data.zip:/data.zip:Z my-linkedin-history --zip /data.zip
```
**Note: The :Z option is required on SELinux-enabled systems**

## Architecture

- `server.js` creates a tiny node server that unzips the CSV files on the fly
- `index.html` loads `index.js` which sends a request to get the CSV content in JSON format and render it in the browser
