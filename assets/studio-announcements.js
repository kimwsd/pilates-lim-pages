window.renderLimAnnouncements = function renderAnnouncements() {
  const host = document.getElementById("lim-announcements");
  if (!host || host.dataset.rendered) return;
  host.dataset.rendered = 'true';
  const preview = location.hash === "#lim-preview";
  let content;
  if (preview) {
    try {
      const draft = JSON.parse(sessionStorage.getItem("lim:promo-preview"));
      if (!draft || Date.now() >= draft.expires) return;
      content = draft.items;
    } catch { return; }
  } else {
    content = JSON.parse(host.dataset.items || "{}");
  }

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function linkAddress(value) {
    if (!value || /[\s\\]/.test(value)) return null;
    if (/^https:\/\//.test(value)) {
      try { return new URL(value).href; } catch { return null; }
    }
    if (!/^\/(?!\/)/.test(value)) return null;
    if (location.hostname === "kimwsd.github.io" && /^\/lim-uploads\/[a-f0-9]{64}\.(webp|png|jpeg)$/.test(value)) return "/pilates-lim-pages/assets/" + value.split("/").pop();
    return location.hostname === "kimwsd.github.io" || location.protocol === "file:"
      ? "https://pilateslim.co.kr" + value : value;
  }
  function appendCopy(parent, item, kind) {
    const src = preview && /^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(item.image)
      ? item.image : linkAddress(item.image);
    if (src) {
      const image = element("img");
      image.alt = "";
      image.src = src;
      image.addEventListener("error", () => image.remove());
      parent.append(image);
    }
    const copy = element("div", "", "lim-promo-copy");
    const title = element(kind === "banner" ? "strong" : "h2", item.title);
    if (kind === "popup") title.id = "lim-popup-title";
    copy.append(title);
    if (item.body) copy.append(element("p", item.body));
    const href = linkAddress(item.link);
    if (item.action && href) {
      const link = element("a", item.action, "lim-promo-link");
      link.href = href;
      copy.append(link);
    }
    parent.append(copy);
  }
  function active(item) {
    if (!item?.enabled || !item.title.trim()) return false;
    if (preview) return true;
    const now = Date.now();
    return (!item.start || Date.parse(item.start + "+09:00") <= now)
      && (!item.end || now < Date.parse(item.end + "+09:00"));
  }
  if (active(content.banner)) {
    const banner = element("aside", "", "lim-promo-banner");
    banner.setAttribute("aria-label", "스튜디오 알림");
    appendCopy(banner, content.banner, "banner");
    host.append(banner);
    host.hidden = false;
  }
  if (!active(content.popup)) return;
  const key = JSON.stringify(content.popup);
  if (!preview) {
    try {
      const dismissed = JSON.parse(localStorage.getItem("lim:popup-hidden"));
      if (dismissed?.key === key && dismissed.until > Date.now()) return;
    } catch { /* An unavailable browser store still permits a normal dismissal. */ }
  }
  const dialog = element("dialog", "", "lim-promo-dialog");
  dialog.setAttribute("aria-labelledby", "lim-popup-title");
  appendCopy(dialog, content.popup, "popup");
  const actions = element("div", "", "lim-promo-actions");
  const today = element("button", "오늘 하루 보지 않기");
  const close = element("button", "닫기");
  close.autofocus = true;
  close.onclick = () => dialog.close();
  today.onclick = () => {
    if (!preview) {
      const day = 86400000, offset = 9 * 3600000;
      const until = (Math.floor((Date.now() + offset) / day) + 1) * day - offset;
      try { localStorage.setItem("lim:popup-hidden", JSON.stringify({key, until})); } catch {}
    }
    dialog.close();
  };
  actions.append(today, close);
  dialog.append(actions);
  document.body.append(dialog);
  dialog.addEventListener("close", () => dialog.remove(), {once:true});
  dialog.addEventListener("click", e => {
    if (e.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) dialog.close();
  });
  dialog.showModal();
};
if (document.currentScript?.hasAttribute("data-static")) window.renderLimAnnouncements();
else window.dispatchEvent(new Event("lim:announcements-ready"));
