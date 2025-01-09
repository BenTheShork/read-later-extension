chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ articles: [] });
  });
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "saveArticle") {
      saveArticle(request.data);
      sendResponse({ status: "success" });
    }
    return true;
  });
  
  async function saveArticle(articleData) {
    const { articles } = await chrome.storage.local.get('articles');
    const newArticle = {
      id: Date.now(),
      url: articleData.url,
      title: articleData.title,
      content: articleData.content,
      timestamp: new Date().toISOString(),
      tags: [],
      readingProgress: 0
    };
    
    articles.push(newArticle);
    await chrome.storage.local.set({ articles: articles });
  }
  