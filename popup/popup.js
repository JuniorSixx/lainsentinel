// Tema visual
chrome.storage.local.get("theme", ({ theme }) => {
  if (theme) {
    const link = document.getElementById("themeStylesheet");
    if (link) link.href = `../themes/theme-${theme}.css`;
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const statusText = document.getElementById("statusText");
  const modeText = document.getElementById("modeText");
  const toggleBtn = document.getElementById("toggleProtection");
  const toggleMode = document.getElementById("toggleMode");
  const alertBox = document.getElementById("heuristicAlert");

  // Atualiza UI
  function updateStatusUI(enabled) {
    statusText.textContent = enabled ? "Ativo" : "Desativado";
    statusText.style.color = enabled ? "#0f0" : "#f33";
    statusText.style.textShadow = enabled ? "0 0 4px #0f0" : "0 0 4px #f33";
  }

  function updateModeUI(hardcore) {
    modeText.textContent = hardcore ? "Hardcore ⚠️" : "Padrão";
    modeText.style.color = hardcore ? "#ffcc00" : "#ccc";
  }

  // Estado inicial
  const { hardcoreMode, protectionEnabled } = await chrome.storage.local.get([
    "hardcoreMode",
    "protectionEnabled"
  ]);

  updateStatusUI(protectionEnabled);
  updateModeUI(hardcoreMode);

  // Alternar proteção
  toggleBtn?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "toggleProtection" }, (res) => {
      if (res?.success) {
        updateStatusUI(res.protectionEnabled);
        const beep = new Audio(chrome.runtime.getURL("../sounds/notify.wav"));
        beep.play();
      }
    });
  });

  // Alternar modo hardcore
  toggleMode?.addEventListener("click", async () => {
    const { hardcoreMode } = await chrome.storage.local.get("hardcoreMode");
    const novo = !hardcoreMode;
    await chrome.storage.local.set({ hardcoreMode: novo });
    chrome.runtime.sendMessage({ type: "updateRules" });
    updateModeUI(novo);
  });

  // Mensagem de script bloqueado
  chrome.runtime.onMessage.addListener((request) => {
    if (request.type === "dangerousInlineScript" && alertBox) {
      alertBox.style.display = "block";
      alertBox.innerText = `⚠️ Scripts perigosos detectados (${request.payload?.length || 1}).`;
    }
  });

  // Botão "Configurações Avançadas"
  document.getElementById("openOptions")?.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
});