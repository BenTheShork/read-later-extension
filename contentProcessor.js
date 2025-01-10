function extractKeywords(text, maxKeywords = 5) {
  const cleanText = text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  const words = cleanText.split(/\s+/);

  const stopwords = new Set([
    "i",
    "me",
    "my",
    "myself",
    "we",
    "our",
    "ours",
    "ourselves",
    "you",
    "your",
    "yours",
    "yourself",
    "yourselves",
    "he",
    "him",
    "his",
    "himself",
    "she",
    "her",
    "hers",
    "herself",
    "it",
    "its",
    "itself",
    "they",
    "them",
    "their",
    "theirs",
    "themselves",
    "what",
    "which",
    "who",
    "whom",
    "this",
    "that",
    "these",
    "those",
    "am",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "having",
    "do",
    "does",
    "did",
    "doing",
    "a",
    "an",
    "the",
    "and",
    "but",
    "if",
    "or",
    "because",
    "as",
    "until",
    "while",
    "of",
    "at",
    "by",
    "for",
    "with",
    "about",
    "against",
    "between",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "to",
    "from",
    "up",
    "down",
    "in",
    "out",
    "on",
    "off",
    "over",
    "under",
    "again",
    "further",
    "then",
    "once",
  ]);

  const filteredWords = words.filter(
    (word) => !stopwords.has(word) && word.length > 2
  );

  const wordFreq = {};
  filteredWords.forEach((word) => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  const keywords = Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);

  return keywords;
}

function categorizeContent(text, title, url) {
  const categories = {
    Technology: [
      "programming",
      "software",
      "hardware",
      "tech",
      "code",
      "developer",
      "api",
      "digital",
      "computer",
      "algorithm",
      "data",
      "github",
    ],
    Science: [
      "research",
      "study",
      "scientific",
      "experiment",
      "discovery",
      "physics",
      "biology",
      "chemistry",
      "science",
    ],
    Business: [
      "market",
      "business",
      "startup",
      "company",
      "investment",
      "finance",
      "entrepreneur",
      "economy",
    ],
    News: ["breaking", "report", "announced", "today", "news", "update"],
    Tutorial: [
      "how to",
      "guide",
      "tutorial",
      "learn",
      "step by step",
      "introduction",
    ],
  };

  const contentText = (title + " " + text).toLowerCase();
  const categoryScores = {};

  for (const [category, keywords] of Object.entries(categories)) {
    categoryScores[category] = keywords.reduce((score, keyword) => {
      const regex = new RegExp(keyword, "gi");
      const matches = contentText.match(regex);
      return score + (matches ? matches.length : 0);
    }, 0);
  }

  const topCategory = Object.entries(categoryScores).sort(
    ([, a], [, b]) => b - a
  )[0][0];

  return topCategory;
}

function generateSummary(text, maxSentences = 3) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length <= maxSentences) return text;

  const wordFreq = {};
  sentences.forEach((sentence) => {
    const words = sentence.toLowerCase().split(/\s+/);
    words.forEach((word) => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
  });

  const sentenceScores = sentences.map((sentence) => {
    const words = sentence.toLowerCase().split(/\s+/);
    const score = words.reduce(
      (total, word) => total + (wordFreq[word] || 0),
      0
    );
    return { sentence, score };
  });

  const topSentences = sentenceScores
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort(
      (a, b) => sentences.indexOf(a.sentence) - sentences.indexOf(b.sentence)
    )
    .map((item) => item.sentence);

  return topSentences.join(" ");
}

function calculateReadingTime(text) {
  const wordsPerMinute = 200;
  const words = text.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return minutes;
}

async function processContent(title, content, url) {
  const keywords = extractKeywords(content);
  const category = categorizeContent(content, title, url);
  const summary = generateSummary(content);
  const readingTime = calculateReadingTime(content);

  return {
    keywords,
    category,
    summary,
    readingTime,
    processedAt: new Date().toISOString(),
  };
}
