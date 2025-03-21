# jena
Jena is a Node.js utility library for managing model context protocols. It exposes structured model metadata and context for integration with the Karen platform. Jena enables AI agents and backend services to interact with application models dynamically, supporting intelligent, context-aware automation and workflows.


X Scraper with Puppeteer
This Node.js script logs into Twitter/X using Puppeteer, navigates to a given user's profile, and extracts their latest 30 tweets.

🔧 Requirements
Node.js (v16 or higher recommended)
npm
📦 Installation
Clone this repo or copy the script into a new folder.

Install dependencies:

```bash 
npm install
```

Create a .env file in the root directory with your Twitter credentials:
ini

TWITTER_USER=your_twitter_username_or_email
TWITTER_PASS=your_twitter_password

⚠️ Use at your own risk. Automating Twitter logins can trigger bot detection or account lockout.

🚀 Usage
```bash
node twitter.login.js <twitter_handle>
```

Replace <twitter_handle> with the handle of the user (without @).

Example:
```bash
node twitter.login.js elonmusk
```

The script will:

Log into Twitter using credentials from .env

Navigate to the specified user's profile

Scroll the page to load tweets
Extract and display the latest 30 tweets in your terminal
📌 Notes

This script uses a headless Chromium browser via Puppeteer.
Avoid overusing this to prevent rate-limiting or account flags.

📄 License MIT

