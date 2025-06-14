chrome.storage.local.get("theme", ({ theme }) => {
  if (theme) {
    const link = document.getElementById("themeStylesheet");
    if (link) link.href = `../themes/theme-${theme}.css`;
  }
});