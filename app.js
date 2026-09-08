const STARTERS = ["fexa", "fnia", "bonfie"];
const CATALOG = [
  { id: "fexa", name: "Fexa", img: "" },
  { id: "fnia", name: "Frenni", img: "" },
  { id: "bonfie", name: "Bonfie", img: "" },
  { id: "loona", name: "Loona", img: "./img/Loona.png" },
  { id: "diana", name: "Диана", img: "./img/diana.png" },
];
function showOnSite(id) {
  const g = CATALOG.find((x) => x.id === id);
  if (STARTERS.includes(id)) return true;
  return !!(g && g.img);
}
function labelOf(id, fallback) {
  const g = CATALOG.find((x) => x.id === id);
  return (g && g.name) || fallback || id;
}
const cfg = window.FNWP_CONFIG || {};
const ready = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
const sb = ready ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;
const $ = (id) => document.getElementById(id);
const banner = (msg, ok) => {
  const el = $("banner");
  if (!el) return;
  el.className = "show " + (ok ? "ok" : "bad");
  el.textContent = msg;
};
let me = null, profile = null, owned = [];
function showAuth() {
  $("view-auth").classList.remove("hidden");
  $("view-app").classList.add("hidden");
  $("poster").classList.remove("hidden");
  const guest = $("guest");
  if (guest) guest.classList.remove("hidden");
  $("who").textContent = ready ? "гость" : "нет config.js";
  const bal0 = $("sc-bal");
  if (bal0) bal0.classList.remove("on");
}
function showApp() {
  $("view-auth").classList.add("hidden");
  $("view-app").classList.remove("hidden");
  $("poster").classList.add("hidden");
  const guest = $("guest");
  if (guest) guest.classList.add("hidden");
  $("who").textContent = profile ? "@" + profile.nickname : "";
  const bal = $("sc-bal");
  if (bal) {
    bal.textContent = "FNWP 2 \u00b7 " + (profile?.coins ?? 0) + " SC";
    bal.classList.add("on");
  }
  $("btn-admin-tab").classList.toggle("hidden", !profile?.is_admin);
  if ($("coins-label")) $("coins-label").textContent = (profile?.coins ?? 0) + " SC";
  renderMine();
  renderShopGirls();
  if (profile?.is_admin) renderPromoList();
}
function openTab(name) {
  ["donate", "shop", "mine", "promo", "admin"].forEach((t) => {
    const pane = $("tab-" + t);
    if (pane) pane.classList.toggle("hidden", t !== name);
  });
  document.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === name));
}
const copyBtn = $("btn-copy-card");
if (copyBtn) copyBtn.onclick = async () => {
  try {
    await navigator.clipboard.writeText("2204310378445509");
    banner("Номер карты скопирован", true);
  } catch (e) {
    banner("2204 3103 7844 5509");
  }
};
async function askDonate(amount, girlId) {
  if (!sb || !me) return banner("Сначала вход");
  const { error } = await sb.from("donations").insert({
    user_id: me.id, amount_rub: amount, status: "pending",
    comment: girlId || ((profile && profile.nickname) || ""),
  });
  if (error) return banner(error.message);
  banner("Заявка " + amount + " ₽. Карта сверху", true);
}
async function renderShopGirls() {
  const box = $("shop-girls");
  if (!box || !sb) return;
  const { data, error } = await sb.from("girls").select("id,name,price_rub,in_shop").order("price_rub");
  if (error) { box.innerHTML = "<p class='muted'>" + error.message + "</p>"; return; }
  const rows = (data || []).filter((g) => (g.in_shop || g.price_rub > 0) && showOnSite(g.id));
  const pics = Object.fromEntries(CATALOG.map((g) => [g.id, g.img]));
  box.innerHTML = rows.map((g) => {
    const have = owned.includes(g.id);
    const pic = pics[g.id] ? "<img src=\"" + pics[g.id] + "\" alt=\"\">" : "<div class=\"ph\">база</div>";
    const title = labelOf(g.id, g.name);
    return "<article class=\"card girl-card\">" + pic + "<div class=\"meta\"><h3>" + title + "</h3><p class=\"muted\">" + (have ? "уже в аккаунте" : "после оплаты") + "</p><p class=\"price\">" + (have ? "есть" : g.price_rub + " ₽") + "</p>" + (have ? "" : "<button class=\"btn\" data-buy=\"" + g.id + "\" data-sum=\"" + g.price_rub + "\" type=\"button\">Купить " + g.price_rub + " ₽</button>") + "</div></article>";
  }).join("") || "<p class='muted'>витрина пустая</p>";
  box.querySelectorAll("[data-buy]").forEach((b) => { b.onclick = () => askDonate(+b.dataset.sum, b.dataset.buy); });
}
function renderMine() {
  const map = Object.fromEntries(CATALOG.map((g) => [g.id, g]));
  const list = owned.filter(showOnSite);
  if (!list.length) { $("mine-list").innerHTML = "<p class=\"muted\">Пусто.</p>"; return; }
  $("mine-list").innerHTML = list.map((id) => {
    const g = map[id] || { id, name: id, img: "" };
    const pic = g.img ? "<img src=\"" + g.img + "\" alt=\"\">" : "<div class=\"ph\">база</div>";
    return "<article class=\"card inv-card\">" + pic + "<div class=\"meta\"><h3>" + g.name + "</h3></div></article>";
  }).join("");
}
async function loadProfile() {
  const { data, error } = await sb.from("profiles").select("nickname,is_admin,coins").eq("id", me.id).maybeSingle();
  if (error) throw error;
  profile = data;
  const { data: girls, error: gErr } = await sb.from("owned_girls").select("girl_id").eq("user_id", me.id);
  if (gErr) throw gErr;
  owned = (girls || []).map((x) => x.girl_id);
}
document.querySelectorAll("[data-auth]").forEach((b) => {
  b.onclick = () => {
    document.querySelectorAll("[data-auth]").forEach((x) => x.classList.toggle("on", x === b));
    $("form-login").classList.toggle("hidden", b.dataset.auth !== "login");
    $("form-reg").classList.toggle("hidden", b.dataset.auth !== "reg");
  };
});
document.querySelectorAll("[data-tab]").forEach((b) => { b.onclick = () => openTab(b.dataset.tab); });
$("form-login").onsubmit = async (e) => {
  e.preventDefault();
  if (!sb) return banner("нет config.js");
  const fd = new FormData(e.target);
  const { data, error } = await sb.auth.signInWithPassword({ email: fd.get("email"), password: fd.get("password") });
  if (error) return banner(error.message);
  me = data.user;
  try { await loadProfile(); showApp(); banner("Вход ок", true); }
  catch (err) { banner(err.message || String(err)); }
};
$("form-reg").onsubmit = async (e) => {
  e.preventDefault();
  if (!sb) return banner("нет config.js");
  const fd = new FormData(e.target);
  const nickname = String(fd.get("nickname") || "").trim();
  if ((cfg.reservedNicks || []).includes(nickname.toLowerCase())) return banner("Ник зарезервирован");
  const { data, error } = await sb.auth.signUp({ email: fd.get("email"), password: fd.get("password") });
  if (error) return banner(error.message);
  if (!data.user) return banner("Почта занята или нужно письмо");
  const { error: pErr } = await sb.rpc("register_profile", { nick: nickname });
  if (pErr) return banner(pErr.message);
  banner("Аккаунт создан", true);
};
$("btn-out").onclick = async () => { if (sb) await sb.auth.signOut(); me = null; profile = null; owned = []; showAuth(); };
$("btn-promo").onclick = async () => {
  const code = $("promo-code").value.trim();
  if (!code) return banner("Введи код");
  const { data, error } = await sb.rpc("redeem_promo", { p_code: code });
  if (error) return banner(error.message);
  await loadProfile(); showApp();
  banner("Промокод засчитан", true);
};
$("btn-promo-create").onclick = async () => {
  const maxRaw = $("promo-new-max").value.trim();
  const { error } = await sb.rpc("admin_create_promo", {
    p_code: $("promo-new-code").value.trim(),
    p_coins: Math.max(0, Math.floor(Number($("promo-new-coins").value || 0))),
    p_girl: $("promo-new-girl").value.trim() || null,
    p_max: maxRaw === "" ? null : Math.max(1, Math.floor(Number(maxRaw))),
    p_note: $("promo-new-note").value.trim() || null,
  });
  if (error) return banner(error.message);
  banner("Код живой", true);
  renderPromoList();
};
async function renderPromoList() {
  const box = $("promo-list");
  if (!box) return;
  const { data, error } = await sb.from("promo_codes").select("code_norm,coins,girl_id,max_uses,used,active").order("created_at", { ascending: false });
  if (error) { box.textContent = error.message; return; }
  box.innerHTML = (data || []).map((p) => p.code_norm + " \u00b7 " + p.coins + " SC \u00b7 " + (p.girl_id || "без сучки") + " \u00b7 " + p.used + "/" + (p.max_uses ?? "\u221e")).join("<br>") || "пусто";
}
$("btn-grant").onclick = async () => {
  const { error } = await sb.rpc("admin_grant", { target_nick: $("grant-nick").value.trim(), p_girl_id: $("grant-girl").value.trim() });
  if (error) return banner(error.message);
  banner("Выдано", true);
  await loadProfile(); renderMine();
};
(async () => {
  if (!ready) { banner("config.js пустой"); showAuth(); return; }
  const { data } = await sb.auth.getSession();
  if (data.session) {
    me = data.session.user;
    try { await loadProfile(); showApp(); }
    catch (err) { banner(err.message || String(err)); showAuth(); }
  } else showAuth();
})();
