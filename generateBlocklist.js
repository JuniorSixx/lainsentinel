const fs = require('fs');

const inputFilePath = './urlhaus.txt';
const outputFilePath = './blocklist-domains.js';

function extractDomain(url) {
    try {
        const parsedUrl = new URL(url.trim());
        return parsedUrl.hostname.replace(/^www\./, ''); // Remove o www. se houver
    } catch (error) {
        return null; // Ignora linhas inválidas
    }
}

function generateBlocklist() {
    const rawData = fs.readFileSync(inputFilePath, 'utf8');
    const lines = rawData.split('\n');

    const domains = new Set();

    lines.forEach(line => {
        const domain = extractDomain(line);
        if (domain) {
            domains.add(domain);
        }
    });

    const domainArray = Array.from(domains).sort();

    let output = `export const blockedDomains = [\n`;

    domainArray.forEach(domain => {
        output += `    '${domain}',\n`;
    });

    output += `];\n`;

    fs.writeFileSync(outputFilePath, output, 'utf8');
    console.log(`✅ Blocklist gerada com ${domainArray.length} domínios em: ${outputFilePath}`);
}

generateBlocklist();