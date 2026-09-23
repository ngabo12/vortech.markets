(function () {
  var ADMIN_PASSWORD = "vortech#2026*"; /* ← CHANGE THIS PASSWORD */
  var STORE_KEY = "vortech-articles";
  var SESSION_KEY = "vortech-admin-session";

  var articles = [];
  var editingId = null;
  var currentLang = localStorage.getItem("vortech-lang") || "fr";

  function $(id) { return document.getElementById(id); }

  var loginBox = $("adminLogin");
  var dash = $("adminDash");
  var list = $("adminList");
  var editor = $("adminEditor");

  function esc(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function persist() {
    localStorage.setItem(STORE_KEY, JSON.stringify(articles));
  }

  function loadStore(done) {
    var raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      try { articles = JSON.parse(raw) || []; } catch (e) { articles = []; }
      done();
      return;
    }
    fetch("data/articles.json")
      .then(function (r) { return r.ok ? r.json() : { articles: [] }; })
      .then(function (d) { articles = d.articles || []; persist(); })
      .catch(function () { articles = []; })
      .then(done);
  }

  function slugify(text) {
    return String(text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  /* ---------- Login ---------- */

  function showDash() {
    loginBox.hidden = true;
    dash.hidden = false;
    renderList();
  }

  $("adminLoginBtn").addEventListener("click", function () {
    if ($("adminPass").value === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      $("adminPass").value = "";
      $("loginStatus").textContent = "";
      loadStore(showDash);
    } else {
      $("loginStatus").textContent = currentLang === "en" ? "Wrong password." : "Mot de passe incorrect.";
    }
  });

  /* ---------- List ---------- */

  function renderList() {
    var editLabel = currentLang === "en" ? "Edit" : "Modifier";
    var deleteLabel = currentLang === "en" ? "Delete" : "Supprimer";

    list.innerHTML = articles.map(function (a) {
      var statusClass = a.status === "draft" ? "status-draft" : "status-published";
      var statusLabel = a.status === "draft"
        ? (currentLang === "en" ? "Draft" : "Brouillon")
        : (currentLang === "en" ? "Published" : "Publié");

      return (
        '<div class="admin-item">' +
        '<div class="admin-item-titles"><strong>' + esc(a.title.fr) + "</strong><span>" + esc(a.title.en) + "</span></div>" +
        '<div class="admin-meta"><span class="status-badge ' + statusClass + '">' + statusLabel + "</span><span>" + esc(a.date || "") + "</span></div>" +
        '<div class="admin-actions">' +
        '<button class="btn btn-ghost btn-small" data-action="edit" data-id="' + esc(a.id) + '">' + editLabel + "</button>" +
        '<button class="btn btn-danger btn-small" data-action="delete" data-id="' + esc(a.id) + '">' + deleteLabel + "</button>" +
        "</div></div>"
      );
    }).join("");
  }

  list.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-action]");
    if (!btn) return;

    var id = btn.getAttribute("data-id");

    if (btn.getAttribute("data-action") === "edit") {
      var article = articles.find(function (a) { return a.id === id; });
      if (article) openEditor(article);
    }

    if (btn.getAttribute("data-action") === "delete") {
      var confirmMsg = currentLang === "en" ? "Delete this article?" : "Supprimer cet article ?";
      if (confirm(confirmMsg)) {
        articles = articles.filter(function (a) { return a.id !== id; });
        persist();
        renderList();
      }
    }
  });

  /* ---------- Editor ---------- */

  function openEditor(article) {
    editingId = article ? article.id : null;

    $("editorTitle").textContent = article
      ? (currentLang === "en" ? "Edit article" : "Modifier l’article")
      : (currentLang === "en" ? "New article" : "Nouvel article");

    $("fTitleFr").value = article ? article.title.fr : "";
    $("fTitleEn").value = article ? article.title.en : "";
    $("fCatFr").value = article && article.category ? article.category.fr : "";
    $("fCatEn").value = article && article.category ? article.category.en : "";
    $("fDate").value = article ? (article.date || "") : new Date().toISOString().slice(0, 10);
    $("fStatus").value = article ? (article.status || "published") : "published";
    $("fCover").value = article ? (article.cover || "") : "";
    $("fExFr").value = article ? article.excerpt.fr : "";
    $("fExEn").value = article ? article.excerpt.en : "";
    $("fContentFr").value = article ? article.content.fr : "";
    $("fContentEn").value = article ? article.content.en : "";

    editor.hidden = false;
    editor.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeEditor() {
    editor.hidden = true;
    editingId = null;
  }

  $("newArticleBtn").addEventListener("click", function () { openEditor(null); });
  $("cancelBtn").addEventListener("click", closeEditor);

  $("saveBtn").addEventListener("click", function () {
    var titleFr = $("fTitleFr").value.trim();
    var titleEn = $("fTitleEn").value.trim();

    if (!titleFr || !titleEn) {
      alert(currentLang === "en" ? "Please fill both titles (FR and EN)." : "Veuillez remplir les deux titres (FR et EN).");
      return;
    }

    var id = editingId;
    if (!id) {
      id = slugify(titleFr) || "article-" + Date.now();
      var base = id;
      var n = 2;
      while (articles.some(function (a) { return a.id === id; })) { id = base + "-" + n; n++; }
    }

    var article = {
      id: id,
      date: $("fDate").value || new Date().toISOString().slice(0, 10),
      status: $("fStatus").value,
      category: { fr: $("fCatFr").value.trim(), en: $("fCatEn").value.trim() },
      title: { fr: titleFr, en: titleEn },
      excerpt: { fr: $("fExFr").value.trim(), en: $("fExEn").value.trim() },
      cover: $("fCover").value.trim(),
      content: { fr: $("fContentFr").value, en: $("fContentEn").value }
    };

    if (editingId) {
      articles = articles.map(function (a) { return a.id === editingId ? article : a; });
    } else {
      articles.push(article);
    }

    persist();
    renderList();
    closeEditor();
  });

  /* ---------- Export / Import / Sync ---------- */

  $("exportBtn").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify({ articles: articles }, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "articles.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  $("importFile").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        articles = Array.isArray(data) ? data : (data.articles || []);
        persist();
        renderList();
      } catch (err) {
        alert(currentLang === "en" ? "Invalid JSON file." : "Fichier JSON invalide.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  $("syncBtn").addEventListener("click", function () {
    fetch("data/articles.json?t=" + Date.now())
      .then(function (r) { return r.ok ? r.json() : { articles: [] }; })
      .then(function (d) {
        articles = d.articles || [];
        persist();
        renderList();
      });
  });

  /* ---------- Language re-render for dynamic list ---------- */

  document.addEventListener("vortech:language", function (e) {
    currentLang = e.detail.lang;
    if (!dash.hidden) renderList();
  });

  /* ---------- Init ---------- */

  if (sessionStorage.getItem(SESSION_KEY) === "1") {
    loadStore(showDash);
  }
})();