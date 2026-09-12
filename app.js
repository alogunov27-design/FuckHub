const STARTERS = ["fexa", "fnia", "bonfie", "chiku"];
const SC_PRICE = { diana: 3000 };
const RUB_PRICE = { loona: 150 };
const CATALOG = [
  { id: "fexa", name: "Fexa", img: "./img/fexa.png" },
  { id: "fnia", name: "Frenni", img: "./img/frenny.jpg" },
  { id: "bonfie", name: "Bonfie", img: "./img/bonfie.jpg" },
  { id: "chiku", name: "Chiku", img: "./img/Chiku.png" },
  { id: "loona", name: "Loona", img: "./img/Loona.png" },
  { id: "diana", name: "Диана", img: "./img/diana.png" },
];
const CARD_NUM = "2204310378445509";
const CARD_NICE = "2204 3103 7844 5509";
function showOnSite(id) {
  const g = CATALOG.find((x) => x.id === id);
  if (STARTERS.includes(id)) return true;
  return !!(g && g.img);
}
function labelOf(id, fallback) {
  const g = CATALOG.find((x) => x.id === id);
  return (g && g.name) || fallback || id;
}
function makePayCode() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "FF";
  for (let i = 0; i < 5; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return s;
}
function authMsg(err) { return (err && err.message) || "Ошибка"; }
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
let me = null, profile = null, owned = [], lastPayId = null, checksCache = [];
function paintCoins() {
  const bal = $("sc-bal");
  if (bal) { bal.textContent = "FNWP 2 \u00b7 " + (profile?.coins ?? 0) + " SC"; bal.classList.add("on"); }
  if ($("coins-label")) $("coins-label").textContent = (profile?.coins ?? 0) + " SC";
}
function hidePayBox() {
  const box = $("pay-box");
  if (!box) return;
  box.classList.add("hidden");
  box.innerHTML = "";
  lastPayId = null;
}
function showPayBox(code, amount, girlId, payId) {
  const box = $("pay-box");
  if (!box) return;
  lastPayId = payId;
  box.classList.remove("hidden");
  box.innerHTML = "<h3 style='font-family:Unbounded;margin:0 0 8px'>Оплата</h3>"
    + "<p class='muted'>Ник: <b>" + ((profile && profile.nickname) || "-") + "</b></p>"
    + "<p class='muted'>Товар: <b>" + labelOf(girlId, girlId) + "</b></p>"
    + "<p class='muted'>Сумма: <b>" + amount + " ₽</b></p>"
    + "<p class='price' style='font-size:20px'>" + CARD_NICE + "</p>"
    + "<p class='price' style='font-size:26px'>" + code + "</p>"
    + "<button class='btn gold' type='button' id='btn-copy-pay'>Скопировать код</button>"
    + "<button class='btn' type='button' id='btn-i-paid' style='margin-top:10px'>Я оплатил</button>"
    + "<button class='btn ghost' type='button' id='btn-pay-cancel' style='margin-top:10px'>Отмена</button>";
  $("btn-copy-pay").onclick = async () => {
    try { await navigator.clipboard.writeText(code); banner("Код скопирован", true); }
    catch (e) { banner(code); }
  };
  $("btn-i-paid").onclick = () => markSent();
  $("btn-pay-cancel").onclick = () => cancelPay();
}
async function markSent() {
  if (!lastPayId || !sb) return banner("Нет заявки");
  const { error } = await sb.rpc("user_set_pay", { p_id: lastPayId, p_status: "sent" });
  if (error) return banner(error.message);
  hidePayBox();
  banner("Заявка ушла на проверку", true);
}
async function cancelPay() {
  if (!lastPayId || !sb) { hidePayBox(); return; }
  const { error } = await sb.rpc("user_set_pay", { p_id: lastPayId, p_status: "cancelled" });
  if (error) return banner(error.message);
  hidePayBox();
  banner("Заявка отменена", true);
}
function showAuth() {
  $("view-auth").classList.remove("hidden");
  $("view-app").classList.add("hidden");
  $("poster").classList.remove("hidden");
  const guest = $("guest");
  if (guest) guest.classList.remove("hidden");
  $("who").textContent = ready ? "гость" : "нет config.js";
}
function showApp() {
  $("view-auth").classList.add("hidden");
  $("view-app").classList.remove("hidden");
  $("poster").classList.add("hidden");
  const guest = $("guest");
  if (guest) guest.classList.add("hidden");
  $("who").textContent = profile ? "@" + profile.nickname : "";
  paintCoins();
  const admin = !!(profile && profile.is_admin);
  ["btn-admin-tab", "btn-pays-tab", "btn-checks-tab"].forEach((id) => {
    if ($(id)) $(id).classList.toggle("hidden", !admin);
  });
  renderMine();
  renderShopGirls();
  if (admin) { renderPromoList(); renderPays(); renderChecks(); }
  openTab("home");
}
function openTab(name) {
  ["home", "download", "donate", "shop", "mine", "promo", "admin", "pays", "checks"].forEach((t) => {
    const pane = $("tab-" + t);
    if (pane) pane.classList.toggle("hidden", t !== name);
  });
  document.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === name));
  if (name === "pays" && profile && profile.is_admin) renderPays();
  if (name === "checks" && profile && profile.is_admin) renderChecks();
}
window.openTab = openTab;
async function copyCard() {
  try { await navigator.clipboard.writeText(CARD_NUM); banner("Номер скопирован", true); }
  catch (e) { banner(CARD_NICE); }
}
if ($("btn-copy-card")) $("btn-copy-card").onclick = copyCard;
if ($("card-num")) $("card-num").onclick = copyCard;
async function loadPlayerCount() {
  if (!sb) return;
  let n = null;
  try {
    const rpc = await sb.rpc("player_count");
    if (!rpc.error && typeof rpc.data === "number") n = rpc.data;
  } catch (e) {}
  const text = n == null ? "\u2014" : String(n);
  ["player-count", "player-count-guest"].forEach((id) => { const el = $(id); if (el) el.textContent = text; });
}
async function askDonate(amount, girlId) {
  if (!sb || !me) return banner("Сначала вход");
  const code = makePayCode();
  const nick = (profile && profile.nickname) || "";
  const { data, error } = await sb.from("donations").insert({
    user_id: me.id, amount_rub: amount, status: "pending",
    comment: code + "|" + (girlId || "") + "|" + nick,
  }).select("id").single();
  if (error) return banner(error.message);
  showPayBox(code, amount, girlId, data && data.id);
  openTab("shop");
}
async function buyGirlSc(id) {
  if (!sb || !me) return banner("Сначала вход");
  const { error } = await sb.rpc("buy_girl_sc", { p_girl_id: id });
  if (error) return banner(authMsg(error));
  await loadProfile(); paintCoins(); renderMine(); renderShopGirls();
  banner("Куплено", true);
}
async function renderShopGirls() {
  const box = $("shop-girls");
  if (!box || !sb) return;
  const { data, error } = await sb.from("girls").select("id,name,price_rub,in_shop").order("price_rub");
  if (error) { box.innerHTML = "<p class='muted'>" + error.message + "</p>"; return; }
  const rows = (data || []).filter((g) => (g.in_shop || g.price_rub > 0 || SC_PRICE[g.id] || RUB_PRICE[g.id]) && showOnSite(g.id));
  const pics = Object.fromEntries(CATALOG.map((g) => [g.id, g.img]));
  box.innerHTML = rows.map((g) => {
    const have = owned.includes(g.id);
    const sc = SC_PRICE[g.id] || 0;
    const rub = RUB_PRICE[g.id] || Number(g.price_rub) || 0;
    const pic = pics[g.id] ? "<img src='" + pics[g.id] + "' alt=''>" : "<div class='ph'>база</div>";
    const title = labelOf(g.id, g.name);
    let status = "база", price = "бесплатно", buy = "";
    if (have) { status = "уже в аккаунте"; price = "есть"; }
    else if (sc) {
      status = "за SC"; price = sc + " SC";
      buy = "<button class='btn' data-sc='" + g.id + "' type='button'>Купить " + sc + " SC</button>";
    } else if (rub) {
      status = "на карту"; price = rub + " ₽";
      buy = "<button class='btn' data-buy='" + g.id + "' data-sum='" + rub + "' type='button'>Купить " + rub + " ₽</button>";
    }
    return "<article class='card girl-card'>" + pic + "<div class='meta'><h3>" + title + "</h3><p class='muted'>" + status + "</p><p class='price'>" + price + "</p>" + buy + "</div></article>";
  }).join("") || "<p class='muted'>пусто</p>";
  box.querySelectorAll("[data-buy]").forEach((b) => { b.onclick = () => askDonate(+b.dataset.sum, b.dataset.buy); });
  box.querySelectorAll("[data-sc]").forEach((b) => { b.onclick = () => buyGirlSc(b.dataset.sc); });
}
function renderMine() {
  const map = Object.fromEntries(CATALOG.map((g) => [g.id, g]));
  const list = owned.filter(showOnSite);
  if (!$("mine-list")) return;
  if (!list.length) { $("mine-list").innerHTML = "<p class='muted'>Пусто.</p>"; return; }
  $("mine-list").innerHTML = list.map((id) => {
    const g = map[id] || { id, name: id, img: "" };
    const pic = g.img ? "<img src='" + g.img + "' alt=''>" : "<div class='ph'>база</div>";
    return "<article class='card inv-card'>" + pic + "<div class='meta'><h3>" + g.name + "</h3></div></article>";
  }).join("");
}
function parsePay(comment) {
  const p = String(comment || "").split("|");
  return { code: p[0] || "-", girl: p[1] || "-", nick: p[2] || "-" };
}
function cardHtml(d) {
  const p = parsePay(d.comment);
  const st = d.status === "paid" ? "подтверждён" : d.status === "rejected" ? "отказ" : d.status === "sent" ? "оплатил" : "ждёт";
  return "<div class='panel' style='margin:0 0 12px'><p>Ник: <b>" + p.nick + "</b></p><p>Товар: <b>" + labelOf(p.girl, p.girl) + "</b></p><p>Цена: <b>" + d.amount_rub + " ₽</b></p><p>Код: <b>" + p.code + "</b></p><p class='muted'>" + st + "</p>";
}
async function renderPays() {
  const box = $("pay-list");
  if (!box || !sb) return;
  const { data, error } = await sb.rpc("admin_list_pays");
  if (error) { box.textContent = error.message; return; }
  if (!data || !data.length) { box.textContent = "пусто"; return; }
  box.innerHTML = data.map((d) => cardHtml(d)
    + "<button class='btn gold' type='button' data-ok='" + d.id + "'>Подтвердить</button>"
    + "<button class='btn ghost' type='button' data-no='" + d.id + "' style='margin-top:8px'>Отказ</button></div>").join("");
  box.querySelectorAll("[data-ok]").forEach((b) => { b.onclick = () => confirmPay(b.dataset.ok); });
  box.querySelectorAll("[data-no]").forEach((b) => { b.onclick = () => rejectPay(b.dataset.no); });
}
function paintChecks(list) {
  const box = $("check-list");
  if (!box) return;
  if (!list.length) { box.textContent = "пусто"; return; }
  box.innerHTML = list.map((d) => cardHtml(d) + "</div>").join("");
}
async function renderChecks() {
  const box = $("check-list");
  if (!box || !sb) return;
  const { data, error } = await sb.rpc("admin_list_checks");
  if (error) { box.textContent = error.message; return; }
  checksCache = data || [];
  const q = (($("check-q") && $("check-q").value) || "").trim().toUpperCase();
  const list = q ? checksCache.filter((d) => String(d.comment || "").toUpperCase().indexOf(q) >= 0) : checksCache;
  paintChecks(list);
}
async function confirmPay(id) {
  const { error } = await sb.rpc("admin_confirm_pay", { p_id: id });
  if (error) return banner(error.message);
  banner("Выдано", true);
  renderPays();
  renderChecks();
}
async function rejectPay(id) {
  const { error } = await sb.rpc("admin_reject_pay", { p_id: id });
  if (error) return banner(error.message);
  banner("Отказ", true);
  renderPays();
  renderChecks();
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
if ($("btn-check-find")) $("btn-check-find").onclick = () => renderChecks();
if ($("check-q")) $("check-q").onkeydown = (e) => { if (e.key === "Enter") renderChecks(); };
if ($("form-login")) $("form-login").onsubmit = async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const { data, error } = await sb.auth.signInWithPassword({ email: fd.get("email"), password: fd.get("password") });
  if (error) return banner(authMsg(error));
  me = data.user;
  try { await loadProfile(); showApp(); banner("Вход ок", true); }
  catch (err) { banner(authMsg(err)); }
};
if ($("form-reg")) $("form-reg").onsubmit = async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const nickname = String(fd.get("nickname") || "").trim();
  const { data, error } = await sb.auth.signUp({ email: fd.get("email"), password: fd.get("password") });
  if (error) return banner(authMsg(error));
  if (data.session) {
    me = data.user;
    const { error: pErr } = await sb.rpc("register_profile", { nick: nickname });
    if (pErr) return banner(authMsg(pErr));
    await loadProfile(); showApp(); banner("Аккаунт создан", true);
    return;
  }
  banner("Подтверди почту", true);
};
if ($("btn-out")) $("btn-out").onclick = async () => { if (sb) await sb.auth.signOut(); me = null; profile = null; owned = []; showAuth(); };
if ($("btn-promo")) $("btn-promo").onclick = async () => {
  const { error } = await sb.rpc("redeem_promo", { p_code: $("promo-code").value.trim() });
  if (error) return banner(error.message);
  await loadProfile(); showApp(); banner("Промокод ок", true);
};
if ($("btn-promo-create")) $("btn-promo-create").onclick = async () => {
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
  box.innerHTML = (data || []).map((p) => p.code_norm + " · " + p.coins + " SC · " + (p.girl_id || "-")).join("<br>") || "пусто";
}
if ($("btn-grant")) $("btn-grant").onclick = async () => {
  const { error } = await sb.rpc("admin_grant", { target_nick: $("grant-nick").value.trim(), p_girl_id: $("grant-girl").value.trim() });
  if (error) return banner(error.message);
  banner("Выдано", true);
};
(async () => {
  if (!ready) { banner("config.js пустой"); showAuth(); return; }
  loadPlayerCount();
  const { data } = await sb.auth.getSession();
  if (data.session) {
    me = data.session.user;
    try { await loadProfile(); showApp(); }
    catch (err) { banner(err.message || String(err)); showAuth(); }
  } else showAuth();
})();
