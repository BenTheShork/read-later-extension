document.addEventListener('DOMContentLoaded', () => {
    loadArticles();
    
    document.getElementById('saveButton').addEventListener('click', saveCurrentPage);
    document.getElementById('search').addEventListener('input', (e) => {
        filterArticles(e.target.value);
    });
});

async function saveCurrentPage() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
            showMessage('Cannot save Chrome system pages. Please try on a regular webpage.');
            return;
        }

        const saveButton = document.getElementById('saveButton');
        saveButton.textContent = 'Saving...';
        saveButton.disabled = true;

        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const getContent = () => {
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
                };

                return {
                    title: document.title,
                    url: window.location.href,
                    content: getContent(),
                    timestamp: new Date().toISOString()
                };
            }
        });

        const extractedContent = results[0].result;
        
        const newArticle = {
            ...extractedContent,
            id: Date.now()  
        };

        const { articles = [] } = await chrome.storage.local.get('articles');
        
        const updatedArticles = [newArticle, ...articles];
        
        await chrome.storage.local.set({ articles: updatedArticles });

        renderArticles(updatedArticles);

        showMessage('Page saved successfully!', 'success');

    } catch (error) {
        console.error('Error saving page:', error);
        showMessage(getErrorMessage(error));
    } finally {
        const saveButton = document.getElementById('saveButton');
        saveButton.textContent = 'Save Current Page';
        saveButton.disabled = false;
    }
}

async function loadArticles() {
    try {
        const { articles = [] } = await chrome.storage.local.get('articles');
        renderArticles(articles);
    } catch (error) {
        console.error('Error loading articles:', error);
        showMessage('Failed to load articles');
    }
}

async function filterArticles(searchTerm) {
    try {
        const { articles = [] } = await chrome.storage.local.get('articles');
        const filtered = articles.filter(article => 
            article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.url.toLowerCase().includes(searchTerm.toLowerCase())
        );
        renderArticles(filtered);
    } catch (error) {
        console.error('Error filtering articles:', error);
        showMessage('Failed to filter articles');
    }
}

function renderArticles(articles) {
    const articleList = document.getElementById('articleList');
    
    if (articles.length === 0) {
        articleList.innerHTML = '<p class="no-articles">No articles saved yet.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();
    
    articles.forEach(article => {
        const articleElement = document.createElement('div');
        articleElement.className = 'article-item';
        articleElement.innerHTML = `
            <h3>${escapeHtml(article.title)}</h3>
            <p class="timestamp">${new Date(article.timestamp).toLocaleDateString()}</p>
            <div class="actions">
                <button class="read-btn">Read</button>
                <button class="delete-btn">Delete</button>
            </div>
        `;

        const readBtn = articleElement.querySelector('.read-btn');
        const deleteBtn = articleElement.querySelector('.delete-btn');
        
        readBtn.addEventListener('click', () => openArticle(article.id));
        deleteBtn.addEventListener('click', () => deleteArticle(article.id));
        
        fragment.appendChild(articleElement);
    });

    articleList.innerHTML = '';
    articleList.appendChild(fragment);
}

async function openArticle(id) {
    try {
        const { articles = [] } = await chrome.storage.local.get('articles');
        const article = articles.find(a => a.id === id);
        if (article) {
            chrome.tabs.create({ url: article.url });
        }
    } catch (error) {
        console.error('Error opening article:', error);
        showMessage('Failed to open article');
    }
}

async function deleteArticle(id) {
    try {
        const { articles = [] } = await chrome.storage.local.get('articles');
        const updatedArticles = articles.filter(a => a.id !== id);
        await chrome.storage.local.set({ articles: updatedArticles });
        
        renderArticles(updatedArticles);
        
        showMessage('Article deleted', 'success');
    } catch (error) {
        console.error('Error deleting article:', error);
        showMessage('Failed to delete article');
    }
}

function showMessage(message, type = 'error') {
    const container = document.querySelector('.container');
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.textContent = message;
    
    container.insertBefore(messageElement, container.firstChild);
    
    setTimeout(() => {
        messageElement.remove();
    }, 3000);
}

function getErrorMessage(error) {
    if (error.message.includes('Cannot access contents of url')) {
        return 'Cannot save this page. Try a different webpage.';
    }
    if (error.message.includes('Failed to extract content')) {
        return 'Could not extract content from this page. Please try again.';
    }
    return 'Failed to save the page. Please try again.';
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}