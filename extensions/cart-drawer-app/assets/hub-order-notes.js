// Order notes (additionalNotesSettings). Mirrors the editor's cart-Items/AdditionalNotes.jsx:
// an expandable row (title + chevron) holding a "Note" button; the button opens a bottom sheet
// inside the drawer with a heading, a textarea and a Save button. The note is saved on the cart.
const CART_PLUS_NOTE_MAX = 500;

const cartPlusNoteEsc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// settings.enabled === false means the section is ON (inverted flag, like the other sections)
window.cartPlusNotesHTML = function (blockId, settings, note = "") {
  if (settings?.enabled !== false) return "";
  const ds = window.__HUB_ACTIVE_CART__?.designSettings || {};
  const iconColor = ds.iconColor || "#000000";
  const expandable = settings.expandable ?? true;
  const collapsedByDefault = settings.collapsedByDefault ?? true;
  const open = expandable ? !collapsedByDefault : true;
  const buttonBg = window.cartPlusBgCss(settings.noteButtonBackground);

  const pencil = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;
  const noteButton = `<div>
      <button type="button" class="cart-plus-note-btn" onclick="cartPlusNotesOpenSheet('${blockId}')" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;padding:6px 12px;border-radius:8px;border:1px solid ${window.__HUB_ACTIVE_CART__?.designSettings?.accentBorder || "rgba(0,0,0,0.15)"};background:${buttonBg || "transparent"};color:inherit;">
        ${pencil}<span>${settings.buttonLabel ?? "Note"}</span>
      </button>
      <div class="cart-plus-note-saved" style="font-size:12px;margin-top:6px;opacity:.8;word-break:break-word;${note ? "" : "display:none;"}">${cartPlusNoteEsc(note)}</div>
    </div>`;

  const chevron = `<span class="cart-plus-note-chevron" style="display:inline-flex;transition:transform .3s ease;transform:${open ? "rotate(180deg)" : "rotate(0deg)"};"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></span>`;

  return `<div id="cart-plus-notes-${blockId}" class="cart-additional-notes cart-plus-public-notes hub-additional-notes" data-open="${open}">
    ${
      expandable
        ? `<button type="button" class="cart-additional-notes__toggle cart-plus-public-component-collapse__dropdown-container" aria-expanded="${open}" onclick="cartPlusNotesToggle('${blockId}')" style="all:unset;cursor:pointer;display:flex;gap:4px;align-items:center;line-height:1;padding:12px 0;"><span>${settings.title || "Add special instructions"}</span>${chevron}</button>
           <div class="cart-plus-note-body" style="display:grid;grid-template-rows:${open ? "1fr" : "0fr"};transition:grid-template-rows .3s ease;"><div style="overflow:hidden;">${noteButton}</div></div>`
        : noteButton
    }
  </div>`;
};

window.cartPlusNotesToggle = function (blockId) {
  const root = document.getElementById(`cart-plus-notes-${blockId}`);
  if (!root) return;
  const open = root.dataset.open !== "true";
  root.dataset.open = String(open);
  root.querySelector(".cart-additional-notes__toggle")?.setAttribute("aria-expanded", String(open));
  const body = root.querySelector(".cart-plus-note-body");
  if (body) body.style.gridTemplateRows = open ? "1fr" : "0fr";
  const chev = root.querySelector(".cart-plus-note-chevron");
  if (chev) chev.style.transform = open ? "rotate(180deg)" : "rotate(0deg)";
};

// shows the saved note under the button (called after every render and after saving)
window.cartPlusNotesSync = function (blockId, note) {
  const saved = document.querySelector(`#cart-plus-notes-${blockId} .cart-plus-note-saved`);
  if (!saved) return;
  saved.textContent = note || "";
  saved.style.display = note ? "" : "none";
  window._cartPlusNoteValue = note || "";
};

window.cartPlusNotesOpenSheet = function (blockId) {
  const drawer = document.getElementById(`hub-cart-drawer-${blockId}`);
  const settings = window.__HUB_ACTIVE_CART__?.additionalNotesSettings || {};
  if (!drawer || document.getElementById(`cart-plus-note-sheet-${blockId}`)) return;
  const ds = window.__HUB_ACTIVE_CART__?.designSettings || {};
  const iconColor = ds.iconColor || "#000000";
  const limit = settings.limitChars ?? true;
  const sheetBg = window.cartPlusBgCss(settings.orderNoteBackground) || "#ffffff";
  const saveBg = window.cartPlusBgCss(settings.saveNoteBackground) || ds.buttonColor || "#303030";

  const wrap = document.createElement("div");
  wrap.id = `cart-plus-note-sheet-${blockId}`;
  wrap.innerHTML = `
    <div class="cart-plus-note-overlay" onclick="cartPlusNotesCloseSheet('${blockId}')" style="position:absolute;inset:0;background:rgba(0,0,0,.45);z-index:100000;"></div>
    <div role="dialog" aria-label="Order note" style="position:absolute;left:0;right:0;bottom:0;z-index:100001;background:${sheetBg};padding:16px;display:flex;flex-direction:column;gap:12px;box-shadow:0 -4px 16px rgba(0,0,0,.12);">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="font-size:13px;font-weight:500;letter-spacing:.04em;text-transform:uppercase;">${settings.heading ?? "Order note"}</div>
        <button type="button" aria-label="Close" onclick="cartPlusNotesCloseSheet('${blockId}')" style="background:none;border:none;cursor:pointer;padding:4px;display:inline-flex;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      </div>
      <textarea id="cart-plus-note-text-${blockId}" class="cart-additional-notes__textarea cart-plus-public-notes__textarea" placeholder="${cartPlusNoteEsc(settings.placeholder || "Add instructions for your order")}" ${limit ? `maxlength="${CART_PLUS_NOTE_MAX}"` : ""} rows="4" oninput="cartPlusNotesInput('${blockId}')" style="width:100%;box-sizing:border-box;padding:10px;border-radius:8px;border:1px solid ${ds.accentBorder || "rgba(0,0,0,.3)"};font-size:14px;font-family:inherit;resize:vertical;"></textarea>
      <button type="button" id="cart-plus-note-save-${blockId}" disabled onclick="cartPlusNotesSave('${blockId}')" style="border:none;cursor:not-allowed;opacity:.5;padding:10px 16px;border-radius:${ds.buttonRadius ?? 6}px;background:${saveBg};color:${ds.buttonTextColor || "#ffffff"};font-size:14px;align-self:flex-start;">${settings.saveLabel ?? "Save note"}</button>
    </div>`;
  drawer.appendChild(wrap);

  const ta = document.getElementById(`cart-plus-note-text-${blockId}`);
  ta.value = window._cartPlusNoteValue || ""; // reopen with the saved note
  window.cartPlusNotesInput(blockId);
  ta.focus();
  window._cartPlusNoteEsc = (e) => e.key === "Escape" && window.cartPlusNotesCloseSheet(blockId);
  window.addEventListener("keydown", window._cartPlusNoteEsc);
};

window.cartPlusNotesCloseSheet = function (blockId) {
  document.getElementById(`cart-plus-note-sheet-${blockId}`)?.remove();
  if (window._cartPlusNoteEsc) window.removeEventListener("keydown", window._cartPlusNoteEsc);
};

window.cartPlusNotesInput = function (blockId) {
  const ta = document.getElementById(`cart-plus-note-text-${blockId}`);
  const save = document.getElementById(`cart-plus-note-save-${blockId}`);
  if (!ta || !save) return;
  const can = ta.value.trim().length > 0;
  save.disabled = !can;
  save.style.opacity = can ? "1" : ".5";
  save.style.cursor = can ? "pointer" : "not-allowed";
};

window.cartPlusNotesSave = async function (blockId) {
  const ta = document.getElementById(`cart-plus-note-text-${blockId}`);
  const save = document.getElementById(`cart-plus-note-save-${blockId}`);
  if (!ta || !ta.value.trim() || save?.disabled) return;
  const note = ta.value.trim();
  if (save) save.disabled = true;
  try {
    await fetch("/cart/update.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    window.cartPlusNotesSync(blockId, note);
    window.cartPlusNotesCloseSheet(blockId);
  } catch (e) {
    console.error("[CartPlus] Saving the order note failed:", e);
    if (save) save.disabled = false;
  }
};
