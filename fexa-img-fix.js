(function () {
  const URL = "https://cdn.jsdelivr.net/gh/alogunov27-design/FuckHub@bd1e41589c17a731038e53e80067575d496db27d/img/fexa.png";
  function patchCatalog() {
    if (typeof CATALOG === "undefined") return;
    const g = CATALOG.find(function (x) { return x.id === "fexa"; });
    if (g) g.img = URL;
  }
  function patchDom() {
    document.querySelectorAll("img").forEach(function (img) {
      const s = img.getAttribute("src") || "";
      if (s.indexOf("fexa") !== -1 && s.indexOf("bd1e415") === -1 && s.indexOf("jsdelivr") === -1) {
        img.src = URL;
      }
    });
  }
  function wrap(name) {
    const fn = window[name];
    if (typeof fn !== "function") return;
    window[name] = function () {
      patchCatalog();
      const r = fn.apply(this, arguments);
      patchDom();
      return r;
    };
  }
  patchCatalog();
  wrap("renderShopGirls");
  wrap("renderMine");
  if (typeof renderShopGirls === "function") renderShopGirls();
  if (typeof renderMine === "function") renderMine();
  patchDom();
  setTimeout(patchDom, 400);
  setTimeout(patchDom, 1500);
})();
