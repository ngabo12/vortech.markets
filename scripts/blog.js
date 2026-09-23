(function () {
  var currentLang = localStorage.getItem("vortech-lang") || "fr";
  var articles = [];

  function pick(obj) {
    if (!obj) return "";
    return obj[currentLang] || obj.fr || "";
  }

  function esc(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function inline(text) {
    return esc(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");
  }

  function renderContent(text) {
    if (!text) return "";
    var blocks = String(text).split(/\n{2,}/);

    return blocks.map(function (block) {
      var lines = block.split("\n");

      if (block.indexOf("## ") === 0) return "<h2>" + inline(block.slice(3)) + "</h2>";
      if (block.indexOf("### ") === 0) return "<h3>" + inline(block.slice(4)) + "</h3>";

      var isList = lines.every(function (l) { return l.trim().indexOf("- ") === 0; });
      if (isList) {
        return "<ul>" + lines.map(function (l) {
          return "<li>" + inline(l.trim().slice(2)) + "</li>";
        }).join("") + "</ul>";
      }

      return "<p>" + inline(block).replace(/\n/g, "<br>") + "</p>";
    }).join("");
  }

  function formatDate(iso, lang) {
    if (!iso) return "";
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  function publishedArticles() {
    return articles
      .filter(function (a) { return a.status !== "draft"; })
      .sort(function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")); });
  }

  function cardHTML(a) {
    var readLabel = currentLang === "en" ? "Read the article" : "Lire l’article";
    var url = "article.html?id=" + encodeURIComponent(a.id);

    return (
      '<article class="card blog-card">' +
      (a.cover ? '<img src="' + esc(a.cover) + '" alt="">' : "") +
      '<div class="blog-card-body">' +
      '<div class="blog-meta"><span class="badge">' + esc(pick(a.category)) + "</span><span>" + formatDate(a.date, currentLang) + "</span></div>" +
      '<h3><a href="' + url + '">' + esc(pick(a.title)) + "</a></h3>" +
      "<p>" + esc(pick(a.excerpt)) + "</p>" +
      '<a class="blog-more" href="' + url + '">' + readLabel + "</a>" +
      "</div></article>"
    );
  }

  function renderList() {
    var grid = document.getElementById("blogGrid");
    var empty = document.getElementById("blogEmpty");
    if (!grid) return;

    var list = publishedArticles();
    grid.innerHTML = list.map(cardHTML).join("");
    if (empty) empty.hidden = list.length !== 0;
  }

  function renderArticle() {
    var root = document.getElementById("articleRoot");
    if (!root) return;

    var id = new URLSearchParams(window.location.search).get("id");
    var article = null;

    for (var i = 0; i < articles.length; i++) {
      if (articles[i].id === id) { article = articles[i]; break; }
    }

    var backLabel = currentLang === "en" ? "← Back to the blog" : "← Retour au blog";

    if (!article) {
      root.innerHTML =
        '<a class="back-link" href="blog.html">' + backLabel + "</a>" +
        '<p class="lead">' + (currentLang === "en" ? "Article not found." : "Article introuvable.") + "</p>";
      return;
    }

    document.title = pick(article.title) + " | The Vortech Letter";

    root.innerHTML =
      '<a class="back-link" href="blog.html">' + backLabel + "</a>" +
      '<div class="article-head">' +
      '<div class="blog-meta"><span class="badge">' + esc(pick(article.category)) + "</span><span>" + formatDate(article.date, currentLang) + "</span></div>" +
      "<h1>" + esc(pick(article.title)) + "</h1>" +
      (pick(article.excerpt) ? '<p class="lead">' + esc(pick(article.excerpt)) + "</p>" : "") +
      "</div>" +
      (article.cover ? '<img class="article-cover" src="' + esc(article.cover) + '" alt="">' : "") +
      '<div class="article-body">' + renderContent(pick(article.content)) + "</div>";
  }

  function load() {
    // 1. MAGIC FIX: Check local storage first (Instant Preview from Admin Panel)
    var localData = localStorage.getItem("vortech-articles");
    if (localData) {
      try {
        articles = JSON.parse(localData) || [];
        renderList();
        renderArticle();
        return; // Stop here, we found the articles locally!
      } catch (e) {}
    }

    // 2. Fallback: Fetch from the server file (with cache-busting)
    fetch("data/articles.json?t=" + Date.now())
      .then(function (r) { return r.ok ? r.json() : { articles: [] }; })
      .then(function (data) { articles = data.articles || []; })
      .catch(function () { articles = []; })
      .then(function () { renderList(); renderArticle(); });
  }

  document.addEventListener("vortech:language", function (e) {
    currentLang = e.detail.lang;
    renderList();
    renderArticle();
  });

  load();
})();