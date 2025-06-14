const fs = require('fs');
const { blockedDomains } = require('./blocklist-domains');

const outputFilePath = './blocklist.json';
const rules = [];
let ruleId = 1;

// LIMITE MÁXIMO: 30000 REGRAS (o Chrome trava acima disso)
const MAX_RULES = 30000;

blockedDomains.forEach(domain => {
  if (rules.length >= MAX_RULES) return;

  if (!domain.trim()) return;
  rules.push({
    id: ruleId++,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: `*://${domain}/*`,
      resourceTypes: ["main_frame", "sub_frame", "script"]
    }
  });
});

fs.writeFileSync(outputFilePath, JSON.stringify(rules, null, 2), 'utf8');
console.log(`✅ blocklist.json gerado com ${rules.length} regras (limite Chrome DNR).`);