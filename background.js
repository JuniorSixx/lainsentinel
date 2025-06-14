if (!chrome || !chrome.runtime || !chrome.declarativeNetRequest) {
  console.error("Chrome API ou DNR não disponível");
} else {
  chrome.runtime.onInstalled.addListener(() => {
    console.log("Extensão instalada ou recarregada");
    garantirProtecaoPadrao();
    carregarBlocklistEAtualizarRegras();
  });

  chrome.runtime.onStartup.addListener(() => {
    console.log("Extensão iniciada (onStartup)");
    carregarBlocklistEAtualizarRegras();
  });

  function garantirProtecaoPadrao() {
    chrome.storage.local.get(["protectionEnabled"], (data) => {
      if (data.protectionEnabled === undefined) {
        chrome.storage.local.set({ protectionEnabled: true });
      }
    });
  }

  function carregarBlocklistEAtualizarRegras() {
    fetch(chrome.runtime.getURL("blocklist.json"))
      .then((res) => res.json())
      .then((rules) => {
        chrome.storage.local.get(["whitelist", "protectionEnabled"], (result) => {
          const { whitelist = [], protectionEnabled = true } = result;

          if (!protectionEnabled) {
            console.warn("🛑 Proteção desativada. Limpando todas as regras...");
            chrome.declarativeNetRequest.updateDynamicRules({
              removeRuleIds: rules.map(rule => rule.id),
              addRules: []
            }).catch((err) => console.error("Erro ao limpar regras DNR:", err));
            return;
          }

          const filteredRules = rules.filter(rule => {
            if (!rule.condition || !rule.condition.urlFilter) return false;
            return !whitelist.some(domain => rule.condition.urlFilter.includes(domain));
          });

          chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: rules.map(rule => rule.id),
            addRules: filteredRules
          })
          .then(() => console.log(`✅ ${filteredRules.length} regras aplicadas via DNR`))
          .catch((err) => console.error("Erro ao atualizar regras DNR:", err));
        });
      })
      .catch((err) => console.error("Erro ao carregar blocklist.json:", err));
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "updateRules") {
      carregarBlocklistEAtualizarRegras();
      sendResponse({ success: true });
      return true;
    }

    if (request.type === "toggleProtection") {
      chrome.storage.local.get("protectionEnabled", ({ protectionEnabled }) => {
        const novoStatus = !protectionEnabled;
        chrome.storage.local.set({ protectionEnabled: novoStatus }, () => {
          console.log(`Proteção ${novoStatus ? "ativada" : "desativada"}`);
          carregarBlocklistEAtualizarRegras();
          sendResponse({ success: true, protectionEnabled: novoStatus });
        });
      });
      return true;
    }
  });

  // ✅ LOGS e ESTATÍSTICAS de BLOQUEIO via onRuleMatchedDebug
  if (chrome.declarativeNetRequest.onRuleMatchedDebug) {
    chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
      const url = info.request.url;
      const ruleId = info.rule.ruleId;
      const resourceType = info.request.resourceType;
      const timestamp = new Date().toISOString();

      chrome.storage.local.get(["logs", "blockStats", "totalBlocked"], (data) => {
        const logs = data.logs || [];
        const blockStats = data.blockStats || {};
        const totalBlocked = data.totalBlocked || 0;

        const logEntry = {
          url,
          ruleId,
          resourceType,
          timestamp
        };

        logs.push(logEntry);
        if (logs.length > 500) logs.shift();

        try {
          const domain = new URL(url).hostname;
          blockStats[domain] = (blockStats[domain] || 0) + 1;
        } catch (e) {
          console.error("Erro ao processar domínio para estatística:", e);
        }

        chrome.storage.local.set({
          logs,
          blockStats,
          totalBlocked: totalBlocked + 1
        });
      });
    });

    console.log("✅ Monitoramento de bloqueios via onRuleMatchedDebug ativado.");
  } else {
    console.warn("⚠️ API onRuleMatchedDebug não disponível. Sem logs de bloqueio.");
  }
}