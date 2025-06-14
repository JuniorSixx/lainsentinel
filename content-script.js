// Carrega a blocklist da extensão dinamicamente
async function carregarBlocklist() {
  try {
    const res = await fetch(chrome.runtime.getURL("blocklist.json"));
    const json = await res.json();
    return json.urls || [];
  } catch (err) {
    console.error("Erro ao carregar blocklist.json:", err);
    return [];
  }
}

// Detecta scripts maliciosos carregados na página
async function detectarScriptsMaliciosos() {
  const blocklist = await carregarBlocklist();
  if (!blocklist.length) return;

  const scripts = Array.from(document.querySelectorAll("script[src]"));
  const scriptsSuspeitos = [];

  for (const script of scripts) {
    const src = script.src;
    if (blocklist.some(mal => src.includes(mal))) {
      scriptsSuspeitos.push(src);
    }
  }

  if (scriptsSuspeitos.length > 0) {
    exibirOverlay(scriptsSuspeitos);

    chrome.runtime.sendMessage({
      type: "dangerousInlineScript",
      payload: scriptsSuspeitos
    });

    const timestamp = new Date().toLocaleString();
    chrome.storage.local.set({
      lastBlock: { timestamp, urls: scriptsSuspeitos }
    });

    chrome.storage.local.get(["blockLogs"], ({ blockLogs = [] }) => {
      const logs = [...blockLogs];
      for (const url of scriptsSuspeitos) {
        logs.push(`[${timestamp}] Detectado script: ${url}`);
      }
      chrome.storage.local.set({ blockLogs: logs });
    });
  }
}

// Mostra o overlay visual para scripts maliciosos
function exibirOverlay(urls) {
  const existing = document.getElementById("lain-block-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "lain-block-overlay";
  overlay.innerHTML = `
    <div class="lain-block-message">
      ⚠️ <strong>${urls.length}</strong> script(s) suspeitos detectados pela <strong>Lain Sentinel</strong>.
      <ul>${urls.slice(0, 3).map(url => `<li>${url}</li>`).join("")}</ul>
    </div>
  `;

  const style = document.createElement("style");
  style.textContent = `
    #lain-block-overlay {
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.85);
      color: #ff00cc;
      border: 1px solid #ff00cc;
      border-radius: 10px;
      padding: 14px 18px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      z-index: 99999;
      box-shadow: 0 0 12px #ff00cc;
      animation: fadeIn 0.4s ease;
      max-width: 360px;
    }
    #lain-block-overlay ul {
      margin-top: 10px;
      padding-left: 20px;
      list-style-type: square;
      color: #faa;
      font-size: 12px;
    }
    #lain-block-overlay strong {
      color: #ff55dd;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  document.body.appendChild(style);
  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.remove();
    style.remove();
  }, 6000);
}

// Inicia detecção ao carregar DOM
window.addEventListener("DOMContentLoaded", detectarScriptsMaliciosos);

// =============================================
// Novo bloco: Banner de Bloqueio de Domínio
// =============================================

chrome.runtime.sendMessage(
  { type: 'checkSiteBlocked', url: window.location.href },
  (response) => {
    if (response && response.blocked) {
      const banner = document.createElement('section');
      banner.setAttribute('role', 'alert');
      banner.setAttribute('aria-live', 'assertive');
      banner.style.position = 'fixed';
      banner.style.top = '0';
      banner.style.left = '0';
      banner.style.width = '100%';
      banner.style.background = '#ff0055';
      banner.style.color = '#ffffff';
      banner.style.textAlign = 'center';
      banner.style.padding = '12px';
      banner.style.fontFamily = 'Courier New, monospace';
      banner.style.fontSize = '15px';
      banner.style.fontWeight = 'bold';
      banner.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)';
      banner.style.zIndex = '999999';
      banner.style.opacity = '0';
      banner.style.transition = 'opacity 0.5s ease';

      const message = document.createElement('p');
      message.textContent = '⚠️ Este site foi bloqueado pela extensão Lain Sentinel.';
      message.style.margin = '0';
      banner.appendChild(message);

      document.body.appendChild(banner);

      // Fade-in
      requestAnimationFrame(() => {
        banner.style.opacity = '1';
      });

      // Remove após 8 segundos
      setTimeout(() => {
        banner.remove();
      }, 8000);
    }
  }
);
