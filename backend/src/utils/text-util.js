
function fallbackTitle(message) {
  const t = String(message || "").trim().replace(/\s+/g, " ");
  return t.length > 50 ? t.slice(0, 47) + "..." : (t || "New chat");
}

module.exports = {
    fallbackTitle
}