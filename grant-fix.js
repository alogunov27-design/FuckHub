async function adminGive() {
  const nick = (document.getElementById("grant-nick") || {}).value || "";
  const girl = ((document.getElementById("grant-girl") || {}).value || "").trim();
  const sc = Math.floor(Number((document.getElementById("grant-sc") || {}).value || 0));
  if (!nick.trim()) return banner("Нужен ник");
  if (!girl && !(sc > 0)) return banner("Укажи тянку или SC");
  if (girl) {
    const { error } = await sb.rpc("admin_grant", { target_nick: nick.trim(), p_girl_id: girl });
    if (error) return banner(error.message);
  }
  if (sc > 0) {
    const { error } = await sb.rpc("admin_grant_sc", { target_nick: nick.trim(), p_coins: sc });
    if (error) return banner(error.message);
  }
  banner("Выдано" + (girl ? " " + girl : "") + (sc > 0 ? " +" + sc + " SC" : ""), true);
}
const grantBtn = document.getElementById("btn-grant");
if (grantBtn) grantBtn.onclick = () => adminGive();
