(() => {
  "use strict";

  const STORAGE_KEY = "long-no-ears-links-v1";
  const sampleItems = [
    {
      title: "GitHub",
      url: "https://github.com",
      note: "代码仓库与项目协作",
      active: true,
    },
    {
      title: "MDN Web Docs",
      url: "https://developer.mozilla.org/zh-CN/",
      note: "前端开发参考资料",
      active: true,
    },
    {
      title: "稍后阅读",
      url: "https://example.com",
      note: "暂时停用的示例网址",
      active: false,
    },
  ];

  const els = {
    form: document.querySelector("#linkForm"),
    urlInput: document.querySelector("#urlInput"),
    titleInput: document.querySelector("#titleInput"),
    noteInput: document.querySelector("#noteInput"),
    defaultActive: document.querySelector("#defaultActive"),
    formError: document.querySelector("#formError"),
    fileInput: document.querySelector("#fileInput"),
    linkList: document.querySelector("#linkList"),
    emptyState: document.querySelector("#emptyState"),
    totalCount: document.querySelector("#totalCount"),
    masterToggle: document.querySelector("#masterToggle"),
    loadExample: document.querySelector("#loadExample"),
    exportData: document.querySelector("#exportData"),
    clearAll: document.querySelector("#clearAll"),
    toast: document.querySelector("#toast"),
    saveStatus: document.querySelector("#saveStatus"),
  };

  let items = loadItems();
  let currentFilter = "all";
  let toastTimer;

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function cleanItem(item) {
    if (!item || typeof item !== "object") return null;
    const url = normalizeUrl(String(item.url || "").trim());
    const title = String(item.title || item.text || "").trim();
    if (!isValidUrl(url) || !title) return null;
    return {
      id: String(item.id || makeId()),
      title: title.slice(0, 80),
      url,
      note: String(item.note || "").trim().slice(0, 160),
      active: item.active !== false,
    };
  }

  function loadItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : parsed.items;
      return Array.isArray(list) ? list.map(cleanItem).filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  function saveItems() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    els.saveStatus.textContent = "已自动保存";
  }

  function normalizeUrl(value) {
    if (!value) return "";
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  }

  function isValidUrl(value) {
    try {
      const parsed = new URL(value);
      return ["http:", "https:"].includes(parsed.protocol) && Boolean(parsed.hostname);
    } catch {
      return false;
    }
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => els.toast.classList.remove("is-visible"), 2300);
  }

  function setFormError(message = "") {
    els.formError.textContent = message;
  }

  function visibleItems() {
    if (currentFilter === "active") return items.filter((item) => item.active);
    if (currentFilter === "inactive") return items.filter((item) => !item.active);
    return items;
  }

  function render() {
    const visible = visibleItems();
    els.linkList.replaceChildren();
    els.totalCount.textContent = String(items.length);
    els.emptyState.hidden = visible.length !== 0;

    visible.forEach((item) => els.linkList.appendChild(createCard(item)));

    document.querySelectorAll(".filter-tab").forEach((button) => {
      const selected = button.dataset.filter === currentFilter;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
    });

    const allActive = items.length > 0 && items.every((item) => item.active);
    els.masterToggle.title = allActive ? "停用全部网址" : "启用全部网址";
    els.masterToggle.setAttribute("aria-label", els.masterToggle.title);
  }

  function createCard(item) {
    const card = document.createElement("article");
    card.className = `link-card${item.active ? "" : " is-off"}`;

    const switchLabel = document.createElement("label");
    switchLabel.className = "card-switch";
    switchLabel.title = item.active ? "点击停用" : "点击启用";

    const switchInput = document.createElement("input");
    switchInput.type = "checkbox";
    switchInput.checked = item.active;
    switchInput.setAttribute("aria-label", `${item.active ? "停用" : "启用"}${item.title}`);
    switchInput.addEventListener("change", () => toggleItem(item.id));

    const switchUi = document.createElement("span");
    switchUi.className = "card-switch-ui";
    switchUi.setAttribute("aria-hidden", "true");
    switchUi.appendChild(document.createElement("span"));
    switchLabel.append(switchInput, switchUi);

    const main = document.createElement("div");
    main.className = "card-main";

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = item.title;

    const link = document.createElement("a");
    link.className = "card-url";
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = compactUrl(item.url);

    main.append(title, link);
    if (item.note) {
      const note = document.createElement("p");
      note.className = "card-note";
      note.textContent = item.note;
      main.appendChild(note);
    }

    const actions = document.createElement("div");
    actions.className = "card-actions";
    actions.append(
      createAction("↗", "打开网址", () => window.open(item.url, "_blank", "noopener,noreferrer")),
      createAction("⧉", "复制网址", () => copyUrl(item.url)),
      createAction("×", "删除网址", () => deleteItem(item.id), "delete"),
    );

    card.append(switchLabel, main, actions);
    return card;
  }

  function createAction(symbol, label, handler, extraClass = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `card-action ${extraClass}`.trim();
    button.title = label;
    button.setAttribute("aria-label", label);
    button.textContent = symbol;
    button.addEventListener("click", handler);
    return button;
  }

  function compactUrl(value) {
    try {
      const parsed = new URL(value);
      const path = parsed.pathname === "/" ? "" : parsed.pathname;
      return `${parsed.hostname}${path}`;
    } catch {
      return value;
    }
  }

  function toggleItem(id) {
    items = items.map((item) => (item.id === id ? { ...item, active: !item.active } : item));
    saveItems();
    render();
  }

  function deleteItem(id) {
    const item = items.find((entry) => entry.id === id);
    items = items.filter((entry) => entry.id !== id);
    saveItems();
    render();
    if (item) showToast(`已删除“${item.title}”`);
  }

  async function copyUrl(url) {
    try {
      await navigator.clipboard.writeText(url);
      showToast("网址已复制");
    } catch {
      showToast("当前浏览器不允许自动复制，请手动复制地址");
    }
  }

  function addItem(item) {
    const cleaned = cleanItem(item);
    if (!cleaned) return false;
    items.unshift(cleaned);
    saveItems();
    render();
    return true;
  }

  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    setFormError();

    const url = normalizeUrl(els.urlInput.value.trim());
    const title = els.titleInput.value.trim();
    if (!isValidUrl(url)) {
      setFormError("请输入有效的网址，例如 https://example.com");
      els.urlInput.focus();
      return;
    }
    if (!title) {
      setFormError("请填写显示文字");
      els.titleInput.focus();
      return;
    }

    addItem({ url, title, note: els.noteInput.value, active: els.defaultActive.checked });
    els.form.reset();
    els.defaultActive.checked = true;
    showToast("网址已添加");
    els.urlInput.focus();
  });

  document.querySelectorAll(".filter-tab").forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      render();
    });
  });

  els.masterToggle.addEventListener("click", () => {
    if (items.length === 0) {
      showToast("列表还是空的，先添加一条网址吧");
      return;
    }
    const shouldActivate = items.some((item) => !item.active);
    items = items.map((item) => ({ ...item, active: shouldActivate }));
    saveItems();
    render();
    showToast(shouldActivate ? "已启用全部网址" : "已停用全部网址");
  });

  els.loadExample.addEventListener("click", () => {
    const existingUrls = new Set(items.map((item) => item.url));
    const added = sampleItems.filter((item) => !existingUrls.has(item.url)).map(cleanItem).filter(Boolean);
    if (!added.length) {
      showToast("示例网址已经在列表中");
      return;
    }
    items = [...added, ...items];
    saveItems();
    render();
    showToast(`已加载 ${added.length} 条示例`);
  });

  els.clearAll.addEventListener("click", () => {
    if (!items.length) {
      showToast("列表已经是空的");
      return;
    }
    if (!window.confirm("确定要清空全部网址吗？此操作无法撤销。")) return;
    items = [];
    saveItems();
    render();
    showToast("列表已清空");
  });

  els.exportData.addEventListener("click", () => {
    if (!items.length) {
      showToast("没有可导出的网址");
      return;
    }
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "龙没有耳朵-网址备份.json";
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("备份文件已下载");
  });

  els.fileInput.addEventListener("change", async () => {
    const file = els.fileInput.files && els.fileInput.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsedItems = parseImport(text, file.name);
      if (!parsedItems.length) {
        showToast("没有识别到有效的网址文字");
      } else {
        const existingUrls = new Set(items.map((item) => item.url));
        const newItems = parsedItems.filter((item) => !existingUrls.has(item.url));
        items = [...newItems, ...items];
        saveItems();
        render();
        showToast(`已导入 ${newItems.length} 条网址`);
      }
    } catch {
      showToast("文件读取失败，请检查格式");
    } finally {
      els.fileInput.value = "";
    }
  });

  function parseImport(text, fileName) {
    const trimmed = text.trim();
    if (!trimmed) return [];
    if (/\.json$/i.test(fileName) || trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        const list = Array.isArray(parsed) ? parsed : parsed.items;
        return Array.isArray(list) ? list.map(cleanItem).filter(Boolean) : [];
      } catch {
        return [];
      }
    }

    return trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const parts = line.split(/\s*[|,\t]\s*/).filter(Boolean);
        if (parts.length < 2) return null;
        const urlPartIndex = parts.findIndex((part) => /^(https?:\/\/|www\.)/i.test(part) || /\.[a-z]{2,}(\/|$)/i.test(part));
        if (urlPartIndex === -1) return null;
        const url = parts[urlPartIndex];
        const title = parts.find((part, index) => index !== urlPartIndex) || url;
        return cleanItem({ title, url, active: true });
      })
      .filter(Boolean);
  }

  render();
})();
