(() => {
  const url = "https://raw.githubusercontent.com/alogunov27-design/FuckHub/bd1e41589c17a731038e53e80067575d496db27d/img/fexa.png";
  if (typeof CATALOG !== "undefined") {
    const g = CATALOG.find((x) => x.id === "fexa");
    if (g) g.img = url;
  }
  if (typeof renderShopGirls === "function") renderShopGirls();
  if (typeof renderMine === "function") renderMine();
})();
