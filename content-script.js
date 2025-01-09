chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractContent") {
      const article = {
        title: document.title,
        url: window.location.href,
        content: getMainContent(),
        timestamp: new Date().toISOString()
      };
      sendResponse({ data: article });
    }
    return true; 
  });
  
  function getMainContent() {
    const selectors = [
      'article',
      '[role="main"]',
      '.main-content',
      '#main-content',
      'main',
      '.post-content',
      '.article-content'
    ];
  
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.innerText;
      }
    }
  
    return document.body.innerText;
  }
  