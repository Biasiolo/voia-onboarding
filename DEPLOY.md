# Publicar Vóia Briefing 0.8.0

## Vercel: projeto completo

1. Extraia o ZIP e abra a pasta `voia-briefing` (a que contém package.json).
2. Envie o conteúdo dessa pasta para seu repositório e importe-o na Vercel.
   Se o repositório contiver a pasta voia-briefing, selecione-a como Root Directory.
   Alternativa: execute `npx vercel` dentro dessa pasta e siga o login/vínculo.
3. Configuração: Framework Vite; Node.js 24.x; Install Command `npm ci`;
   Build Command `npm run build`; Output Directory `web-dist`.
   O arquivo vercel.json já define os comandos e as funções.
4. Em Settings > Environment Variables, adicione para Production e Preview:
   - GEMINI_API_KEY: chave do Gemini.
   - GEMINI_MODEL: modelo principal, conforme seu .env local.
   - GEMINI_FALLBACK_MODEL: modelo alternativo, conforme seu .env local.
   - PAGESPEED_API_KEY: chave do PageSpeed (opcional; sem ela não há auditoria técnica).
   API_PORT é apenas local. Não use prefixo VITE_ nas chaves.
5. Mantenha Fluid Compute habilitado e confira suporte a 300 segundos na função
   de análise. O projeto limita o trabalho externo a aproximadamente 280 segundos,
   reservando margem para responder antes do limite da função.
6. Faça o deploy. Após alterar variáveis, publique novamente.
7. Abra `/api/status`: deve retornar JSON com ai/pagespeed, nunca HTML.
   `true` significa chave cadastrada; não confirma validade, cota ou permissão.
8. Preencha um briefing de teste e gere a análise; confira o PDF.
   Verifique os logs das funções caso o Google recuse modelo/chave/cota.

As funções em api/ recebem Request/Response nativos da Vercel e reutilizam a
mesma API do modo local. As requisições do frontend são relativas ao domínio
atual, sem URL fixa de localhost. Não é preciso iniciar server/local.mjs na Vercel.

## Build e entrega dos arquivos

```bash
npm ci
npm test
npm run build
```

`web-dist/` contém a interface compilada, já incluída neste ZIP. Para refazer o
build após alterações, execute os comandos acima. O destinatário deve receber
o projeto completo para publicar na Vercel, pois api/, server/, shared/,
package.json, package-lock.json e vercel.json também são necessários.

**Apenas web-dist em uma hospedagem estática não executa Gemini/PageSpeed.**
Se o destino final não for Vercel, ele precisa executar um backend Node.js e
encaminhar `/api/*` para ele, no mesmo domínio. Este pacote não inclui uma
configuração específica para cPanel/PHP, Apache ou outra plataforma.

Para um deploy Vercel pré-compilado (opcional), na máquina de quem possui acesso
à conta/projeto, execute na raiz do projeto:

```bash
npx vercel pull --yes --environment=production
npx vercel build --prod
npx vercel deploy --prebuilt --prod
```

Esse build da Vercel gera `.vercel/output`, com estáticos e funções. É diferente
de `npm run build`, que gera apenas a interface. O pacote entregue não inclui
`.vercel/output`: ele precisa ser gerado com o projeto vinculado à sua conta.
Não compartilhe `.vercel/` inteira: ela pode conter variáveis baixadas da conta.

## Uso local preservado

Copie .env.example para .env e preencha as chaves. Execute `npm run dev`.
Para conferir o build com a API local, execute `npm run preview` e abra
http://localhost:3001. No PowerShell, pode usar npm.cmd se npm.ps1 for bloqueado.

## Limites e validação

- O ZIP de entrega exclui .env, credenciais, node_modules e vínculo de conta.
- A interface, relatório e armazenamento no navegador foram preservados.
- Os briefings não sincronizam entre computadores/domínios. Exporte/importe JSON.
- O projeto não tem login. Para uso interno, configure proteção de acesso na
  hospedagem; a verificação de origem não substitui autenticação.
- O limite de análises em memória vale por instância/IP na Vercel e é aproximado.
  Não é um limite global persistente entre instâncias. Para controle rigoroso
  de uso, é necessário um armazenamento compartilhado ou regra de firewall.
- Testes automatizados cobrem handlers Vercel, validação e análise com Google
  simulado. A validação real das chaves/modelos e da infraestrutura depende do
  primeiro deploy. Nenhuma chamada paga foi necessária para esses testes.

Referências técnicas:
https://vercel.com/docs/functions/runtimes/node-js
https://vercel.com/docs/functions/configuring-functions/duration
https://vercel.com/docs/cli/build
https://vercel.com/docs/cli/deploy
