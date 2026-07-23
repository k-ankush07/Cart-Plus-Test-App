(function () {
  const KEY = "_hubItemOrder";

  function read() {
    try {
      const raw = window.sessionStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function write(arr) {
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  function syncWithCart(cart) {
    const variantIds = (cart?.items || []).map((i) => String(i.variant_id));
    const cartSet = new Set(variantIds);
    const order = read();

    const seen = new Set();
    const next = [];
    for (const id of order) {
      if (cartSet.has(id) && !seen.has(id)) {
        next.push(id);
        seen.add(id);
      }
    }
    for (const id of variantIds) {
      if (!seen.has(id)) {
        next.push(id);
        seen.add(id);
      }
    }

    write(next);
    return next;
  }

  function replaceVariant(oldId, newId) {
    const o = String(oldId);
    const n = String(newId);
    if (!n || o === n) return;

    const order = read();
    const oldIdx = order.indexOf(o);
    const newIdx = order.indexOf(n);

    if (oldIdx === -1) {
      if (newIdx === -1) order.push(n);
    } else if (newIdx === -1) {
      order[oldIdx] = n;
    } else {
      order.splice(oldIdx, 1);
    }

    write(order);
  }

  function sortItems(items) {
    const order = read();
    const indexOf = (vid) => {
      const i = order.indexOf(String(vid));
      return i === -1 ? Number.POSITIVE_INFINITY : i;
    };
    return [...items].sort(
      (a, b) => indexOf(a.variant_id) - indexOf(b.variant_id),
    );
  }

  window.hubItemOrder = { syncWithCart, replaceVariant, sortItems };
})();
