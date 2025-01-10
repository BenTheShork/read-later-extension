document.addEventListener("DOMContentLoaded", () => {
  initializeTabs();
  loadArticles();

  document
    .getElementById("saveButton")
    .addEventListener("click", saveCurrentPage);
  document.getElementById("search").addEventListener("input", (e) => {
    filterArticles(e.target.value);
  });
});

function initializeTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      document
        .querySelectorAll(".tab-panel")
        .forEach((panel) => panel.classList.remove("active"));

      button.classList.add("active");
      const targetPanel = document.getElementById(button.dataset.tab);
      if (targetPanel) {
        targetPanel.classList.add("active");
      }

      loadArticles();
    });
  });
}

async function saveCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (
      !tab.url ||
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://")
    ) {
      showMessage(
        "Cannot save Chrome system pages. Please try on a regular webpage."
      );
      return;
    }

    const saveButton = document.getElementById("saveButton");
    saveButton.innerHTML =
      '<span class="material-icons loading">sync</span> Processing...';
    saveButton.disabled = true;

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["contentProcessor.js"],
    });

    const extractedContent = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const getContent = () => {
          const selectors = [
            "article",
            '[role="main"]',
            ".main-content",
            "#main-content",
            "main",
            ".post-content",
            ".article-content",
          ];

          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
              return element.innerText;
            }
          }
          return document.body.innerText;
        };

        return {
          title: document.title,
          url: window.location.href,
          content: getContent(),
        };
      },
    });

    const content = extractedContent[0].result;

    const processedData = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (content) => {
        return processContent(content.title, content.content, content.url);
      },
      args: [content],
    });

    const smartData = processedData[0].result;

    const newArticle = {
      ...content,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...smartData,
    };

    const { articles = [] } = await chrome.storage.local.get("articles");
    const updatedArticles = [newArticle, ...articles];
    await chrome.storage.local.set({ articles: updatedArticles });

    showMessage("Page processed and saved!", "success");
    loadArticles();
  } catch (error) {
    console.error("Error saving page:", error);
    showMessage(getErrorMessage(error));
  } finally {
    const saveButton = document.getElementById("saveButton");
    saveButton.innerHTML =
      'Save Current Page';
    saveButton.disabled = false;
  }
}

async function loadArticles() {
  try {
    const { articles = [] } = await chrome.storage.local.get("articles");
    const activeTab = document.querySelector(".tab-button.active");

    if (!activeTab) return;

    const tabName = activeTab.dataset.tab;
    const containerName =
      tabName === "recent" ? "recentArticleList" : "allArticleList";
    const articlesToShow =
      tabName === "recent" ? articles.slice(0, 5) : articles;

    renderArticles(articlesToShow, containerName);
  } catch (error) {
    console.error("Error loading articles:", error);
    showMessage("Failed to load articles");
  }
}

async function filterArticles(searchTerm) {
  try {
    const { articles = [] } = await chrome.storage.local.get("articles");
    const filtered = articles.filter(
      (article) =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.url.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeTab = document.querySelector(".tab-button.active");
    if (!activeTab) return;

    const tabName = activeTab.dataset.tab;
    const containerName =
      tabName === "recent" ? "recentArticleList" : "allArticleList";
    const articlesToShow =
      tabName === "recent" ? filtered.slice(0, 5) : filtered;

    renderArticles(articlesToShow, containerName);
  } catch (error) {
    console.error("Error filtering articles:", error);
    showMessage("Failed to filter articles");
  }
}

function renderArticles(articles, containerId) {
  const articleList = document.getElementById(containerId);
  if (!articleList) return;

  if (articles.length === 0) {
    articleList.innerHTML = '<p class="no-articles">No articles saved yet.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();

  articles.forEach((article) => {
    const articleElement = document.createElement("div");
    articleElement.className = "article-item";
    articleElement.innerHTML = `
            <div class="article-header">
                <h3>${escapeHtml(article.title)}</h3>
                <span class="category-badge">${
                  article.category || "Uncategorized"
                }</span>
            </div>
            <div class="article-meta">
                <span class="reading-time">
                    <span class="material-icons">schedule</span>
                    ${article.readingTime} min read
                </span>
                <span class="timestamp">
                    <span class="material-icons">calendar_today</span>
                    ${new Date(article.timestamp).toLocaleDateString()}
                </span>
            </div>
            ${
              article.summary
                ? `
                <div class="article-summary">
                    <p>${escapeHtml(article.summary)}</p>
                </div>
            `
                : ""
            }
            <div class="article-keywords">
                ${(article.keywords || [])
                  .map(
                    (keyword) =>
                      `<span class="keyword-chip">${escapeHtml(keyword)}</span>`
                  )
                  .join("")}
            </div>
            <div class="actions">
                <button class="read-btn">
                    <span class="material-icons">open_in_new</span>
                    Read
                </button>
                <button class="delete-btn">
                    <span class="material-icons">delete</span>
                    Delete
                </button>
            </div>
        `;

    const readBtn = articleElement.querySelector(".read-btn");
    const deleteBtn = articleElement.querySelector(".delete-btn");

    readBtn.addEventListener("click", () => openArticle(article.id));
    deleteBtn.addEventListener("click", () => deleteArticle(article.id));

    fragment.appendChild(articleElement);
  });

  articleList.innerHTML = "";
  articleList.appendChild(fragment);
}

async function openArticle(id) {
  try {
    const { articles = [] } = await chrome.storage.local.get("articles");
    const article = articles.find((a) => a.id === id);
    if (article) {
      chrome.tabs.create({ url: article.url });
    }
  } catch (error) {
    console.error("Error opening article:", error);
    showMessage("Failed to open article");
  }
}

async function deleteArticle(id) {
  try {
    const { articles = [] } = await chrome.storage.local.get("articles");
    const updatedArticles = articles.filter((a) => a.id !== id);
    await chrome.storage.local.set({ articles: updatedArticles });

    loadArticles();
    showMessage("Article deleted", "success");
  } catch (error) {
    console.error("Error deleting article:", error);
    showMessage("Failed to delete article");
  }
}

function showMessage(message, type = "error") {
  const container = document.querySelector(".container");
  if (!container) return;

  const existingMessage = document.querySelector(".message");
  if (existingMessage) {
    existingMessage.remove();
  }

  const messageElement = document.createElement("div");
  messageElement.className = `message message-${type}`;
  messageElement.textContent = message;

  container.insertBefore(messageElement, container.firstChild);

  setTimeout(() => {
    messageElement.remove();
  }, 3000);
}

function getErrorMessage(error) {
  if (error.message.includes("Cannot access contents of url")) {
    return "Cannot save this page. Try a different webpage.";
  }
  if (error.message.includes("Failed to extract content")) {
    return "Could not extract content from this page. Please try again.";
  }
  return "Failed to save the page. Please try again.";
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
