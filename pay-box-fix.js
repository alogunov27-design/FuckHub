function savePayMemo(obj) {
  try { localStorage.setItem("fnwp_last_pay", JSON.stringify(obj)); } catch (e) {}
}
function loadPayMemo() {
  try { return JSON.parse(localStorage.getItem("fnwp_last_pay") || "null"); } catch (e) { return null; }
}
function clearPayMemo() {
  try { localStorage.removeItem("fnwp_last_pay"); } catch (e) {}
}
function showPayBox(code, amount, girlId, payId) {
  const box = document.getElementById("pay-box");
  if (!box) return;
  lastPayId = payId;
  savePayMemo({ code: code, amount: amount, girlId: girlId, payId: payId });
  box.classList.remove("hidden");
  box.innerHTML = "<h3 style='font-family:Unbounded;margin:0 0 8px'>Оплата</h3>"
    + "<p class='muted'>Ник: <b>" + ((profile && profile.nickname) || "-") + "</b></p>"
    + "<p class='muted'>Товар: <b>" + labelOf(girlId, girlId) + "</b></p>"
    + "<p class='muted'>Сумма: <b>" + amount + " ₽</b></p>"
    + "<p class='muted'>Карта для перевода</p>"
    + "<p class='price' style='font-size:20px'>" + CARD_NICE + "</p>"
    + "<p class='muted' style='margin:12px 0 6px'><b>Этот код вставь в комментарий перевода.</b> Без него платёж не найдём. Сохрани код, если закроешь страницу.</p>"
    + "<p class='price' style='font-size:28px;letter-spacing:.08em;user-select:all'>" + code + "</p>"
    + "<button class='btn gold' type='button' id='btn-copy-pay'>Скопировать код</button>"
    + "<button class='btn ghost' type='button' id='btn-copy-card2' style='margin-top:10px'>Скопировать карту</button>"
    + "<button class='btn' type='button' id='btn-i-paid' style='margin-top:10px'>Я оплатил</button>"
    + "<button class='btn ghost' type='button' id='btn-pay-cancel' style='margin-top:10px'>Отмена</button>";
  document.getElementById("btn-copy-pay").onclick = async () => {
    try { await navigator.clipboard.writeText(code); banner("Код скопирован. Вставь его в комментарий перевода", true); }
    catch (e) { banner(code); }
  };
  document.getElementById("btn-copy-card2").onclick = async () => {
    try { await navigator.clipboard.writeText(CARD_NUM); banner("Номер карты скопирован", true); }
    catch (e) { banner(CARD_NICE); }
  };
  document.getElementById("btn-i-paid").onclick = () => markSent();
  document.getElementById("btn-pay-cancel").onclick = () => cancelPay();
}
const _hidePayBox = hidePayBox;
hidePayBox = function () {
  _hidePayBox();
};
const _markSent = markSent;
markSent = async function () {
  await _markSent();
  clearPayMemo();
};
const _cancelPay = cancelPay;
cancelPay = async function () {
  await _cancelPay();
  clearPayMemo();
};
const memo = loadPayMemo();
if (memo && memo.code && document.getElementById("pay-box")) {
  showPayBox(memo.code, memo.amount, memo.girlId, memo.payId);
}
