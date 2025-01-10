# Read Later Extension

A Chrome extension that helps you save articles for later reading with smart content processing. It automatically extracts key information from articles including reading time, summary, and relevant keywords.

## Features

- Save articles with one click
- Automatic content categorization
- Keyword extraction
- Reading time estimation
- Article summarization
- Clean reading interface
- Search through saved articles
- Quick access to recent saves

## Installation

1. Clone this repository
```bash
git clone https://github.com/yourusername/read-later-extension.git
```

2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

- Click the extension icon to open the interface
- Click "Save Current Page" to save the current article
- Use tabs to switch between recent and all saved articles
- Search through your saved articles using the search bar
- Click "Read" to open the article in a new tab

## Technical Implementation

The extension uses:
- Chrome Extension Manifest V3
- Natural Language Processing for content analysis
- TF-IDF algorithm for keyword extraction
- Local storage for saving articles

## Future Improvements

- Export saved articles
- Custom categories
- Article highlighting
- Notes and annotations
- Sync across devices
