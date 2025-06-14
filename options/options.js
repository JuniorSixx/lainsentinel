// === TEMA ===
chrome.storage.local.get("theme", ({ theme }) => {
  if (theme) {
    const link = document.getElementById("themeStylesheet");
    if (link) link.href = `../themes/theme-${theme}.css`;
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const whitelistField = document.getElementById("whitelist");
  const logsField = document.getElementById("logs");
  const hardcoreCheckbox = document.getElementById("hardcoreMode");
  const statsSummary = document.getElementById("statsSummary");
  const themeSelector = document.getElementById("themeSelector");

  const {
    whitelist = [],
    logs = [],
    blockStats = {},
    totalBlocked = 0,
    hardcoreMode = false,
    theme = "lain"
  } = await chrome.storage.local.get([
    "whitelist", "logs", "blockStats", "totalBlocked", "hardcoreMode", "theme"
  ]);

  whitelistField.value = whitelist.join("\n");
  logsField.value = logs.map(entry => `[${entry.timestamp}] ${entry.url} (Rule ID: ${entry.ruleId})`).join("\n");
  hardcoreCheckbox.checked = hardcoreMode;
  themeSelector.value = theme;

  renderStats(totalBlocked, blockStats);

  document.getElementById("saveWhitelist").addEventListener("click", async () => {
    const entries = whitelistField.value.split("\n").map(e => e.trim()).filter(Boolean);
    await chrome.storage.local.set({ whitelist: entries });
    chrome.runtime.sendMessage({ type: "updateRules" });
    alert("✅ Whitelist salva com sucesso!");
  });

  document.getElementById("clearLogs").addEventListener("click", async () => {
    if (!confirm("Tem certeza que deseja apagar todos os logs?")) return;
    await chrome.storage.local.set({ logs: [], blockStats: {}, totalBlocked: 0 });
    logsField.value = "";
    statsSummary.innerHTML = "Logs limpos.";
  });

  document.getElementById("exportLogs").addEventListener("click", async () => {
    const blob = new Blob([logs.map(e => `[${e.timestamp}] ${e.url} (Rule ID: ${e.ruleId})`).join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({ url, filename: "lain-logs.txt", saveAs: true });
  });

  document.getElementById("exportJson").addEventListener("click", async () => {
    const blob = new Blob([JSON.stringify({ logs, blockStats, totalBlocked }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({ url, filename: "lain-logs.json", saveAs: true });
  });

  document.getElementById("saveMode").addEventListener("click", async () => {
    const checked = hardcoreCheckbox.checked;
    await chrome.storage.local.set({ hardcoreMode: checked });
    chrome.runtime.sendMessage({ type: "updateRules" });
    alert(`✅ Modo ${checked ? "Hardcore" : "Padrão"} salvo!`);
  });

  themeSelector.addEventListener("change", async () => {
    const selected = themeSelector.value;
    await chrome.storage.local.set({ theme: selected });
    alert(`✅ Tema "${selected}" salvo. Reabra a extensão para aplicar.`);
  });
});

// === ESTATÍSTICAS TEXTO SIMPLES ===
function getTopDomains(blockStats) {
  return Object.entries(blockStats).sort((a, b) => b[1] - a[1]).slice(0, 5);
}

function renderStats(totalBlocked, blockStats) {
  const top = getTopDomains(blockStats);
  const statsEl = document.getElementById("statsSummary");
  statsEl.innerHTML = `
    <p>Total de bloqueios: <strong>${totalBlocked}</strong></p>
    <p>Top 5 domínios mais bloqueados:</p>
    <ul>${top.map(([dom, count]) => `<li>${dom}: ${count}</li>`).join("")}</ul>
  `;
}