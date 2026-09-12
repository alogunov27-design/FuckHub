window.SC_PRICE = { diana: 1000 };
window.SC_WAS = { diana: 3000 };
(function () {
  const old = window.renderPromoList;
})();
async function renderPromoList() {
  const box = document.getElementById("promo-list");
  if (!box || !sb) return;
  const { data, error } = await sb.from("promo_codes").select("code_norm,coins,girl_id,max_uses,used,active").order("created_at", { ascending: false });
  if (error) { box.textContent = error.message; return; }
  box.innerHTML = (data || []).map((p) => {
    const lim = p.max_uses == null ? "∞" : p.max_uses;
    const on = p.active === false ? " · выкл" : "";
    return p.code_norm + " · " + p.coins + " SC · " + (p.girl_id || "-") + " · " + (p.used || 0) + "/" + lim + on;
  }).join("<br>") || "пусто";
}
