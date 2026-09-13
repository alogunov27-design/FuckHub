(function () {
  window.FUTA4_GIRLS = ["fexa_chlen", "frenni_chlen", "bonfie_chlen", "chiku_chlen"];
  var packImg = "./img/IMG_20260913_071058_397.jpg";
  var extras = [
    { id: "futa4", name: "Бабы с яйцами", img: packImg },
    { id: "fexa_chlen", name: "Fexa_chlen", img: packImg },
    { id: "frenni_chlen", name: "Frenni_chlen", img: packImg },
    { id: "bonfie_chlen", name: "Bonfie_chlen", img: packImg },
    { id: "chiku_chlen", name: "Chiku_chlen", img: packImg }
  ];
  if (typeof CATALOG !== "undefined") {
    extras.forEach(function (g) {
      if (!CATALOG.some(function (x) { return x.id === g.id; })) CATALOG.push(g);
    });
  }
  if (typeof RUB_PRICE !== "undefined") RUB_PRICE.futa4 = 400;

  var _mine = window.renderMine;
  if (typeof _mine === "function") {
    window.renderMine = function () {
      var hide = { fexa_chlen: 1, frenni_chlen: 1, bonfie_chlen: 1, chiku_chlen: 1 };
      var old = owned && owned.slice();
      if (Array.isArray(owned)) owned = owned.filter(function (id) { return !hide[id]; });
      var r = _mine.apply(this, arguments);
      if (old) owned = old;
      return r;
    };
  }

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
