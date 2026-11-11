(function () {
  // Collapsible menus on small screens
  function collapsible(buttonSelector, target) {
    var button = document.querySelector(buttonSelector);
    if (!button || !target) return;
    button.hidden = false;
    target.classList.add("is-collapsible");
    button.addEventListener("click", function () {
      var open = target.classList.toggle("is-open");
      button.setAttribute("aria-expanded", open);
    });
  }
  collapsible(".nav-toggle", document.getElementById("site-nav"));
  collapsible(".sidebar-toggle", document.getElementById("doc-nav"));

  // Keep the current page visible in a long sidebar
  var sidebar = document.querySelector(".sidebar");
  var current = sidebar && sidebar.querySelector("nav a[aria-current]");
  if (current && sidebar.scrollHeight > sidebar.clientHeight) {
    sidebar.scrollTop = current.offsetTop - sidebar.clientHeight / 2;
  }

  // Copy button on code blocks
  if (navigator.clipboard) {
    [].forEach.call(document.querySelectorAll(".prose pre"), function (pre) {
      var box = document.createElement("div");
      box.className = "code";
      pre.parentNode.insertBefore(box, pre);
      box.appendChild(pre);
      var button = document.createElement("button");
      button.type = "button";
      button.className = "copy";
      button.textContent = "Copy";
      button.addEventListener("click", function () {
        navigator.clipboard.writeText(pre.textContent.replace(/\n$/, "")).then(function () {
          button.textContent = "Copied";
          setTimeout(function () { button.textContent = "Copy"; }, 1500);
        });
      });
      box.appendChild(button);
    });
  }

  // Search in the pages of one version, with the Pagefind index of the build
  var search = document.querySelector(".search");
  if (!search) return;
  var input = search.querySelector("input");
  var panel = search.querySelector(".search-results");
  var version = search.dataset.version;
  var pagefind;
  search.hidden = false;

  function load() {
    if (!pagefind) {
      pagefind = import("/pagefind/pagefind.js").then(function (module) {
        module.init();
        return module;
      });
    }
    return pagefind;
  }

  function message(text) {
    var p = document.createElement("p");
    p.textContent = text;
    panel.replaceChildren(p);
    panel.hidden = false;
  }

  function show(items) {
    if (!items.length) return message("No results in " + version + ".");
    panel.replaceChildren.apply(panel, items.map(function (item) {
      var link = document.createElement("a");
      link.href = item.url;
      var title = document.createElement("strong");
      title.textContent = item.title;
      var excerpt = document.createElement("span");
      excerpt.innerHTML = item.excerpt; // escaped text with <mark> from Pagefind
      link.append(title, excerpt);
      return link;
    }));
    panel.hidden = false;
  }

  input.addEventListener("focus", function () {
    load().catch(function () {});
    if (input.value.trim() && panel.childNodes.length) panel.hidden = false;
  });

  input.addEventListener("input", function () {
    var query = input.value.trim();
    if (!query) {
      panel.hidden = true;
      return;
    }
    load()
      .then(function (module) {
        return module.debouncedSearch(query, { filters: { version: version } }, 150);
      })
      .then(function (result) {
        if (!result) return; // a newer search replaced this one
        return Promise.all(result.results.slice(0, 8).map(function (r) { return r.data(); })).then(function (pages) {
          if (input.value.trim() !== query) return;
          var items = [];
          pages.forEach(function (page) {
            // One entry per matching section of a page, at most 3 per page
            var sections = page.sub_results.slice(0, 3);
            sections.forEach(function (section) {
              var title = section.title === page.meta.title ? page.meta.title : page.meta.title + " › " + section.title;
              items.push({ url: section.url, title: title, excerpt: section.excerpt });
            });
          });
          show(items.slice(0, 12));
        });
      })
      .catch(function () {
        message("Search isn't available.");
      });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      panel.hidden = true;
      if (document.activeElement === input) input.blur();
    } else if (event.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
      event.preventDefault();
      input.focus();
    }
  });
  document.addEventListener("click", function (event) {
    if (!search.contains(event.target)) panel.hidden = true;
  });
})();
