(function () {
  if (typeof CATALOG !== "undefined") {
    if (!CATALOG.some(function (x) { return x.id === "futa4"; })) {
      CATALOG.push({
        id: "futa4",
        name: "Бабы с яйцами",
        img: "./img/IMG_20260913_071058_397.jpg"
      });
    }
  }
  if (typeof RUB_PRICE !== "undefined") RUB_PRICE.futa4 = 400;

  function strike() {
    document.querySelectorAll(".girl-card, .inv-card").forEach(function (card) {
      var h = card.querySelector("h3");
      if (!h) return;
      if (h.textContent.indexOf("яйц") === -1 && h.textContent.toLowerCase().indexOf("futa4") === -1) return;
      var p = card.querySelector(".price");
      if (p) p.innerHTML = "<s style='opacity:.55;font-weight:700'>450 ₽</s> 400 ₽";
      var btn = card.querySelector("[data-buy='futa4']");
      if (btn) {
        btn.dataset.sum = "400";
        btn.textContent = "Купить 400 ₽";
      }
    });
  }

  function wrap(name) {
    var fn = window[name];
    if (typeof fn !== "function") return;
    window[name] = function () {
      var r = fn.apply(this, arguments);
      if (r && typeof r.then === "function") return r.then(function (x) { strike(); return x; });
      strike();
      return r;
    };
  }
  wrap("renderShopGirls");
  wrap("renderMine");
  if (typeof renderShopGirls === "function") renderShopGirls();
  if (typeof renderMine === "function") renderMine();
  setTimeout(strike, 400);
  setTimeout(strike, 1500);
})();
