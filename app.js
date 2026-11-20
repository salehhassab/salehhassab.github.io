(function () {
  "use strict";

  var TERMS = window.TERMS || [];
  var RESEARCH = window.RESEARCH || [];
  var SITE = window.SITE || { title: "الثقافة الإسلامية", subtitle: "موسوعة ثقافية وأبحاث", tagline: "", bio: "", email: "" };
  var app = document.getElementById("app");

  var ALPHABET = "ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي".split(" ");

  // ---------- أدوات ----------
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // توحيد الكتابة العربية للبحث: حذف التشكيل والتطويل، وتوحيد الهمزات والتاء المربوطة والألف المقصورة
  function norm(s) {
    return String(s || "")
      .replace(/[ً-ٰٟـ]/g, "")
      .replace(/[أإآٱ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .toLowerCase()
      .trim();
  }

  // الكلمة بعد حذف «ال» التعريف — للترتيب الأبجدي على طريقة المعاجم
  function sortKey(term) {
    var n = norm(term);
    if (n.indexOf("ال") === 0 && n.length > 3) n = n.slice(2);
    return n;
  }
  function firstLetter(term) { return sortKey(term).charAt(0); }

  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function sortedTerms() {
    return TERMS.slice().sort(function (a, b) {
      return sortKey(a.term).localeCompare(sortKey(b.term), "ar");
    });
  }

  function paragraphs(text) {
    return String(text || "").split(/\n\s*\n/).map(function (p) {
      return "<p>" + esc(p.trim()) + "</p>";
    }).join("");
  }

  function termCard(t) {
    return '<a class="card" href="#term-' + esc(t.id) + '">' +
      '<div class="term-title">' + esc(t.term) + "</div>" +
      '<div class="term-foreign">' + esc(t.foreign) + "</div>" +
      "<p>" + esc(t.summary) + "</p>" +
      '<div class="chips"><span class="tag">' + esc(t.field) + "</span></div>" +
      "</a>";
  }

  function termChip(id) {
    var t = byId(TERMS, id);
    if (!t) return "";
    return '<a class="tag warm" href="#term-' + esc(t.id) + '">' + esc(t.term) + "</a>";
  }

  function paperItem(p) {
    return '<article class="paper">' +
      '<div class="paper-year">' + esc(p.year) + "</div>" +
      "<div>" +
      '<h3><a href="#' + esc(p.id) + '">' + esc(p.title) + "</a></h3>" +
      '<div class="venue">' + esc(p.venue) + "</div>" +
      '<p class="abstract">' + esc(p.abstract) + "</p>" +
      '<div class="chips">' + (p.terms || []).map(termChip).join("") + "</div>" +
      "</div></article>";
  }

  function setTitle(t) {
    document.title = (t ? t + " — " : "") + SITE.title;
  }

  // ---------- الصفحات ----------
  function viewHome() {
    setTitle("");
    var featured = TERMS[Math.floor((new Date().getDate()) % Math.max(TERMS.length, 1))];
    var latest = RESEARCH.slice().sort(function (a, b) { return b.year - a.year; }).slice(0, 2);
    var fields = {};
    TERMS.forEach(function (t) { fields[t.field] = 1; });

    app.innerHTML =
      '<section class="hero">' +
        "<div>" +
          '<h1 class="hero-title">' + esc(SITE.title) + "</h1>" +
          (SITE.subtitle ? '<p class="hero-sub">' + esc(SITE.subtitle) + "</p>" : "") +
          '<p class="lead">' + esc(SITE.tagline) + "</p>" +
          '<form class="search" id="home-search" role="search">' +
            '<input type="search" id="home-q" placeholder="ابحث عن مصطلح… مثل: هوية، تراث، Culture" aria-label="البحث في الموسوعة">' +
          "</form>" +
          '<div class="stats">' +
            '<div class="stat"><b>' + TERMS.length + "</b><span>مصطلحاً</span></div>" +
            '<div class="stat"><b>' + RESEARCH.length + "</b><span>أبحاث</span></div>" +
            '<div class="stat"><b>' + Object.keys(fields).length + "</b><span>حقول معرفية</span></div>" +
          "</div>" +
        "</div>" +
        (featured ?
        '<aside class="hero-card">' +
          '<div class="label">مصطلح اليوم</div>' +
          "<h3>" + esc(featured.term) + "</h3>" +
          '<div class="foreign">' + esc(featured.foreign) + "</div>" +
          "<p>" + esc(featured.summary) + "</p>" +
          '<a href="#term-' + esc(featured.id) + '">اقرأ المدخل كاملاً ←</a>' +
        "</aside>" : "") +
      "</section>" +

      '<div class="section-head"><h2>أحدث الأبحاث</h2><a href="#research">كل الأبحاث ←</a></div>' +
      latest.map(paperItem).join("") +

      '<div class="section-head"><h2>من الموسوعة</h2><a href="#encyclopedia">تصفّح الموسوعة ←</a></div>' +
      '<div class="grid">' + sortedTerms().slice(0, 6).map(termCard).join("") + "</div>";

    document.getElementById("home-search").addEventListener("submit", function (e) {
      e.preventDefault();
      encState.q = document.getElementById("home-q").value;
      encState.letter = "";
      location.hash = "encyclopedia";
    });
  }

  var encState = { q: "", letter: "", field: "" };

  function viewEncyclopedia() {
    setTitle("الموسوعة");
    var fields = [];
    TERMS.forEach(function (t) { if (fields.indexOf(t.field) < 0) fields.push(t.field); });
    var present = {};
    TERMS.forEach(function (t) { present[firstLetter(t.term)] = 1; });

    app.innerHTML =
      '<div class="crumbs"><a href="#">الرئيسية</a> / الموسوعة</div>' +
      "<h1>الموسوعة الثقافية</h1>" +
      '<p class="muted">مداخل مرتبة ترتيباً أبجدياً بحسب أصل الكلمة دون «ال» التعريف. البحث يتجاهل التشكيل واختلاف الهمزات.</p>' +
      '<div class="search"><input type="search" id="enc-q" placeholder="ابحث بالعربية أو بالمقابل الأجنبي…" aria-label="البحث"></div>' +
      '<div class="toolbar">' +
        '<select id="enc-field" aria-label="الحقل المعرفي"><option value="">كل الحقول المعرفية</option>' +
          fields.map(function (f) { return '<option value="' + esc(f) + '">' + esc(f) + "</option>"; }).join("") +
        "</select>" +
        '<span class="muted" id="enc-count"></span>' +
      "</div>" +
      '<div class="alphabet" id="enc-alpha">' +
        '<button class="all" data-l="">الكل</button>' +
        ALPHABET.map(function (l) {
          return '<button data-l="' + l + '"' + (present[l] ? "" : " disabled") + ">" + l + "</button>";
        }).join("") +
      "</div>" +
      '<div id="enc-results"></div>';

    var qEl = document.getElementById("enc-q");
    var fEl = document.getElementById("enc-field");
    qEl.value = encState.q;
    fEl.value = encState.field;

    qEl.addEventListener("input", function () { encState.q = qEl.value; renderList(); });
    fEl.addEventListener("change", function () { encState.field = fEl.value; renderList(); });
    document.getElementById("enc-alpha").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || b.disabled) return;
      encState.letter = b.getAttribute("data-l");
      renderList();
    });
    renderList();
    if (encState.q) qEl.focus();
  }

  function renderList() {
    var q = norm(encState.q);
    var list = sortedTerms().filter(function (t) {
      if (encState.field && t.field !== encState.field) return false;
      if (encState.letter && firstLetter(t.term) !== encState.letter) return false;
      if (q) {
        var hay = norm([t.term, t.foreign, t.summary, t.body, t.field, t.root].join(" "));
        return hay.indexOf(q) >= 0;
      }
      return true;
    });

    // ترتيب النتائج: ما يطابق المصطلح نفسه أولاً
    if (q) {
      list.sort(function (a, b) {
        var ah = norm(a.term + " " + a.foreign).indexOf(q) >= 0 ? 0 : 1;
        var bh = norm(b.term + " " + b.foreign).indexOf(q) >= 0 ? 0 : 1;
        return ah - bh;
      });
    }

    Array.prototype.forEach.call(document.querySelectorAll("#enc-alpha button"), function (b) {
      b.classList.toggle("active", b.getAttribute("data-l") === encState.letter);
    });
    document.getElementById("enc-count").textContent = list.length + " مدخل";

    var out = document.getElementById("enc-results");
    if (!list.length) {
      out.innerHTML = '<div class="empty">لا توجد مداخل مطابقة. جرّب كلمة أخرى أو أزل التصفية.</div>';
      return;
    }
    if (q) {
      out.innerHTML = '<div class="grid">' + list.map(termCard).join("") + "</div>";
      return;
    }
    var groups = {};
    list.forEach(function (t) { var l = firstLetter(t.term); (groups[l] = groups[l] || []).push(t); });
    out.innerHTML = ALPHABET.filter(function (l) { return groups[l]; }).map(function (l) {
      return '<section class="letter-group"><div class="letter-head">' + l + "</div>" +
        '<div class="grid">' + groups[l].map(termCard).join("") + "</div></section>";
    }).join("");
  }

  function viewTerm(id) {
    var t = byId(TERMS, id);
    if (!t) return viewNotFound();
    setTitle(t.term);
    var papers = RESEARCH.filter(function (p) { return (p.terms || []).indexOf(t.id) >= 0; });
    var related = (t.related || []).map(function (rid) { return byId(TERMS, rid); }).filter(Boolean);

    app.innerHTML =
      '<div class="crumbs"><a href="#">الرئيسية</a> / <a href="#encyclopedia">الموسوعة</a> / ' + esc(t.term) + "</div>" +
      '<div class="entry">' +
        "<article>" +
          '<header class="entry-head"><h1>' + esc(t.term) + '</h1><div class="foreign">' + esc(t.foreign) + "</div></header>" +
          '<p class="summary">' + esc(t.summary) + "</p>" +
          '<div class="body">' + paragraphs(t.body) + "</div>" +
          (related.length ?
            '<section class="block"><h2>مصطلحات ذات صلة</h2><div class="grid">' + related.map(termCard).join("") + "</div></section>" : "") +
          (papers.length ?
            '<section class="block"><h2>أبحاث تتناول هذا المصطلح</h2>' + papers.map(paperItem).join("") + "</section>" : "") +
          ((t.sources || []).length ?
            '<section class="block"><h2>المراجع</h2><ol class="sources">' +
              t.sources.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol></section>" : "") +
        "</article>" +
        '<aside class="side">' +
          "<dl>" +
            "<dt>المقابل الأجنبي</dt><dd dir=\"ltr\" style=\"text-align:right\">" + esc(t.foreign) + "</dd>" +
            (t.root ? '<dt>الجذر</dt><dd class="root">' + esc(t.root) + "</dd>" : "") +
            '<dt>الحقل المعرفي</dt><dd><span class="tag">' + esc(t.field) + "</span></dd>" +
          "</dl>" +
          '<button class="btn" id="cite-btn">نسخ صيغة الاستشهاد</button>' +
          '<div class="cite-box" id="cite-box" hidden></div>' +
        "</aside>" +
      "</div>";

    document.getElementById("cite-btn").addEventListener("click", function () {
      var today = new Date().toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" });
      var url = location.href;
      var text = "«" + t.term + "»، " + SITE.title + (SITE.subtitle ? ": " + SITE.subtitle : "") + "، " + url + "، تاريخ الاطلاع: " + today + ".";
      var box = document.getElementById("cite-box");
      box.hidden = false;
      box.textContent = text;
      var btn = this;
      try {
        navigator.clipboard.writeText(text).then(function () {
          btn.textContent = "تم النسخ ✓";
        }, function () { btn.textContent = "انسخ النص أدناه"; });
      } catch (e) { btn.textContent = "انسخ النص أدناه"; }
    });
  }

  var resState = { year: "" };

  function viewResearch() {
    setTitle("الأبحاث");
    var years = [];
    RESEARCH.forEach(function (p) { if (years.indexOf(p.year) < 0) years.push(p.year); });
    years.sort(function (a, b) { return b - a; });

    app.innerHTML =
      '<div class="crumbs"><a href="#">الرئيسية</a> / الأبحاث</div>' +
      "<h1>الأبحاث والدراسات</h1>" +
      '<div class="toolbar"><select id="res-year" aria-label="السنة"><option value="">كل السنوات</option>' +
        years.map(function (y) { return '<option value="' + y + '">' + y + "</option>"; }).join("") +
      "</select></div>" +
      '<div id="res-list"></div>';

    var sel = document.getElementById("res-year");
    sel.value = resState.year;
    function render() {
      var list = RESEARCH.slice().sort(function (a, b) { return b.year - a.year; })
        .filter(function (p) { return !resState.year || String(p.year) === resState.year; });
      document.getElementById("res-list").innerHTML = list.length ? list.map(paperItem).join("") :
        '<div class="empty">لا توجد أبحاث.</div>';
    }
    sel.addEventListener("change", function () { resState.year = sel.value; render(); });
    render();
  }

  function viewPaper(id) {
    var p = byId(RESEARCH, id);
    if (!p) return viewNotFound();
    setTitle(p.title);
    app.innerHTML =
      '<div class="crumbs"><a href="#">الرئيسية</a> / <a href="#research">الأبحاث</a></div>' +
      '<article style="max-width:780px">' +
        '<header class="entry-head"><h1 style="font-size:2.1rem">' + esc(p.title) + "</h1>" +
          '<div class="muted">' + esc(p.venue) + " — " + esc(p.year) + "</div></header>" +
        "<h2>الملخص</h2><p>" + esc(p.abstract) + "</p>" +
        ((p.keywords || []).length ? '<h2 style="font-size:1.2rem">الكلمات المفتاحية</h2><div class="chips">' +
          p.keywords.map(function (k) { return '<span class="tag">' + esc(k) + "</span>"; }).join("") + "</div>" : "") +
        ((p.terms || []).length ? '<section class="block"><h2>مصطلحات من الموسوعة</h2><div class="grid">' +
          p.terms.map(function (tid) { var t = byId(TERMS, tid); return t ? termCard(t) : ""; }).join("") + "</div></section>" : "") +
        '<div class="block">' +
          (p.pdf ? '<a class="btn primary" href="' + esc(p.pdf) + '">تحميل البحث (PDF)</a>' :
                   '<span class="muted">سيُضاف رابط ملف البحث هنا.</span>') +
        "</div>" +
      "</article>";
  }

  function viewAbout() {
    setTitle("عن الموقع");
    app.innerHTML =
      '<div class="crumbs"><a href="#">الرئيسية</a> / عن الموقع</div>' +
      '<section class="about">' +
        "<h1>عن الموقع</h1>" +
        '<p class="bio">' + esc(SITE.bio) + "</p>" +
        '<h2 style="font-size:1.3rem">التواصل</h2>' +
        '<p>البريد الإلكتروني: <span dir="ltr">' + esc(SITE.email) + "</span></p>" +
      "</section>";
  }

  // ---------- صفحة التواصل (عبر خدمة Web3Forms) ----------
  function viewContact() {
    setTitle("تواصل معنا");
    var key = (SITE.contactKey || "").trim();
    app.innerHTML =
      '<div class="crumbs"><a href="#">الرئيسية</a> / تواصل معنا</div>' +
      '<section class="contact">' +
        "<h1>تواصل معنا</h1>" +
        '<p class="muted">يسعدنا تلقي استفساراتكم واقتراحاتكم، ومقترحات المصطلحات والملاحظات العلمية على المداخل.</p>' +
        (key ? "" : '<div class="form-alert warn">نموذج التواصل غير مفعّل بعد: يلزم إضافة مفتاح الخدمة (contactKey) في ملف data/research.js.</div>') +
        '<form id="contact-form" class="contact-form" novalidate>' +
          '<div class="field-row">' +
            '<label>الاسم<input type="text" name="name" required autocomplete="name"></label>' +
            '<label>البريد الإلكتروني<input type="email" name="email" required autocomplete="email" dir="ltr"></label>' +
          "</div>" +
          '<label>نوع الرسالة<select name="topic">' +
            "<option>استفسار عام</option><option>اقتراح مصطلح للموسوعة</option>" +
            "<option>ملاحظة علمية على مدخل أو بحث</option><option>أخرى</option>" +
          "</select></label>" +
          '<label>الرسالة<textarea name="message" rows="7" required></textarea></label>' +
          '<input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off">' +
          '<button type="submit" class="btn primary"' + (key ? "" : " disabled") + ">إرسال الرسالة</button>" +
          '<div id="form-status" class="form-alert" hidden></div>' +
        "</form>" +
      "</section>";

    var form = document.getElementById("contact-form");
    var status = document.getElementById("form-status");
    function show(kind, msg) { status.hidden = false; status.className = "form-alert " + kind; status.textContent = msg; }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!key) return;
      if (!form.checkValidity()) { show("err", "يرجى تعبئة الاسم والبريد الإلكتروني والرسالة بشكل صحيح."); return; }
      var data = {
        access_key: key,
        subject: "رسالة جديدة من موقع " + SITE.title + ": " + form.topic.value,
        from_name: SITE.title,
        name: form.name.value,
        email: form.email.value,
        topic: form.topic.value,
        message: form.message.value,
        botcheck: form.botcheck.checked
      };
      var btn = form.querySelector("button");
      btn.disabled = true; btn.textContent = "جارٍ الإرسال…";
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (res.success) { form.reset(); show("ok", "شكراً لك، وصلت رسالتك وسنرد عليك قريباً بإذن الله."); }
        else { show("err", "تعذّر الإرسال، يرجى المحاولة لاحقاً."); }
      }).catch(function () {
        show("err", "تعذّر الاتصال بالخادم، تحقق من الإنترنت وحاول مرة أخرى.");
      }).then(function () { btn.disabled = false; btn.textContent = "إرسال الرسالة"; });
    });
  }

  function viewNotFound() {
    setTitle("غير موجود");
    app.innerHTML = '<div class="empty"><h2>الصفحة غير موجودة</h2><p><a href="#">العودة إلى الرئيسية</a></p></div>';
  }

  // ---------- التوجيه ----------
  function route() {
    var h = decodeURIComponent(location.hash.replace(/^#/, ""));
    var section = "home";
    if (!h) viewHome();
    else if (h === "encyclopedia") { section = "encyclopedia"; viewEncyclopedia(); }
    else if (h === "research") { section = "research"; viewResearch(); }
    else if (h === "about") { section = "about"; viewAbout(); }
    else if (h === "contact") { section = "contact"; viewContact(); }
    else if (h.indexOf("term-") === 0) { section = "encyclopedia"; viewTerm(h.slice(5)); }
    else if (byId(RESEARCH, h)) { section = "research"; viewPaper(h); }
    else viewNotFound();

    Array.prototype.forEach.call(document.querySelectorAll(".nav a"), function (a) {
      a.classList.toggle("active", a.getAttribute("data-route") === section);
    });
    document.querySelector(".nav").classList.remove("open");
    window.scrollTo(0, 0);
  }

  // ---------- التهيئة ----------
  Array.prototype.forEach.call(document.querySelectorAll('[data-site="title"]'), function (el) {
    el.textContent = SITE.title;
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-site="subtitle"]'), function (el) {
    el.textContent = SITE.subtitle || "";
  });
  document.getElementById("year").textContent = new Date().getFullYear();
  var toggle = document.querySelector(".menu-toggle");
  toggle.addEventListener("click", function () {
    var nav = document.querySelector(".nav");
    nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", nav.classList.contains("open"));
  });

  window.addEventListener("hashchange", route);
  route();
})();
