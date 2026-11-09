# Vóia Briefing | Local e Vercel

Pacote 0.8.0, preparado em 09/11/2026, baseado na versão 7 do site.
React + Vite, API Node.js local e funções Vercel, Gemini, PageSpeed e relatório em PDF.

## 1. Preparar o computador

Instale o Node.js 24 pelo site https://nodejs.org e o VS Code.
O npm acompanha o Node.js. Depois da instalação, reabra o VS Code.
Extraia o ZIP. No VS Code, use Arquivo > Abrir Pasta e selecione a pasta
`voia-briefing`, onde está o arquivo `package.json`.
Abra Terminal > Novo Terminal e confira:

```bash
node -v
npm -v
```

## 2. Instalar e iniciar

No terminal, dentro da pasta do projeto, execute uma vez:

```bash
npm ci
```

Depois execute:

```bash
npm run dev
```

Abra http://localhost:5173 no navegador. Mantenha o terminal aberto.
O comando inicia o Vite e a API local juntos. Não é preciso hospedar um servidor
para testar no computador. Para encerrar, use Ctrl+C.
Nas próximas vezes, basta abrir a pasta e executar `npm run dev`.

No PowerShell, se aparecer bloqueio de execução de `npm.ps1`, use `npm.cmd ci`
e `npm.cmd run dev`, ou selecione o terminal Command Prompt no VS Code.

## 3. Configuração das APIs

Copie `.env.example` para `.env` e preencha suas chaves para uso local.
Na Vercel, cadastre-as em Settings > Environment Variables.
As chaves ficam somente no servidor. Nunca use prefixo VITE_.
O pacote de entrega não inclui o `.env` com credenciais.

- GEMINI_API_KEY: chave para gerar a análise.
- GEMINI_MODEL: modelo principal configurado no projeto.
- GEMINI_FALLBACK_MODEL: modelo alternativo usado em falhas temporárias.
- PAGESPEED_API_KEY: chave para avaliar o site em celular.
- API_PORT: porta local da API, inicialmente 3001.

Depois de editar o `.env`, encerre o terminal com Ctrl+C e execute
`npm run dev` novamente. Chave configurada não significa chave validada:
as consultas reais dependem da validade, permissões e cotas do Google.

## 4. Testar o fluxo

1. Abra o exemplo preenchido para conhecer a ferramenta, ou crie um briefing.
2. Preencha cadastro e entrevista, incluindo a etapa Datas importantes.
3. Revise as respostas no rascunho.
4. Gere a análise com IA. Empresa, segmento e três temas são o mínimo exigido.
5. Edite os direcionamentos e as sugestões de datas, se necessário.
6. Abra Relatório, confira a prévia paginada e baixe o PDF completo.

A prévia ilustrativa da Casa Clara é fictícia e fixa. Ela não usa a API.
Para uma análise real, use Gerar análise com IA. Gemini e PageSpeed precisam
de acesso à internet. A análise pode levar alguns minutos.

As sugestões de calendário são separadas das informações do cliente.
Não há consulta externa a calendários. Confira datas móveis, feriados locais
e eventos antes de aprovar o planejamento. Relatórios antigos precisam de
nova geração da análise para receber sugestões de datas.

## 5. Levar os briefings do site para o computador

No site atual, abra cada briefing que deseja levar e clique em Exportar
entrevista. No projeto local, abra Seus briefings > Importar JSON.
O JSON transfere a entrevista. Para guardar a análise antiga, baixe também o
PDF no site. A análise pode ser gerada novamente no ambiente local.

Os dados ficam no navegador e no endereço em que foram criados, sem banco
central ou sincronização. Por isso, os briefings do site não aparecem sozinhos
no localhost. Use sempre o mesmo endereço e navegador. Limpar os dados do
navegador remove os registros. Não há dados reais de clientes neste ZIP.

## 6. Build e verificação

```bash
npm test
npm run build
npm run preview
```

O build é gerado em `web-dist`. O preview serve o frontend compilado e a API em
http://localhost:3001. Encerre o modo dev antes de iniciar o preview para não
ocupar a mesma porta. O preview é para teste local.

## 7. Problemas comuns

- npm não reconhecido: instale Node.js e reabra o VS Code.
- Porta 3001 ocupada: encerre outra instância ou altere API_PORT no `.env` e reinicie.
- Porta 5173 ocupada: encerre a outra instância que está usando essa porta.
- IA aguardando chave: confira o `.env` na raiz e reinicie `npm run dev`.
- Chave recusada, limite ou demora: confira o aviso na tela; as respostas ficam salvas.
- PageSpeed não concluiu: confira a URL pública e a configuração da chave.
- PDF antigo: retorne ao relatório depois de concluir a edição da análise.

## Organização do código

- src/: interface React, estilos e visualizador de PDF.
- shared/briefing.mjs: perguntas, campos, validação e exemplo.
- shared/report.mjs: conteúdo do relatório e análise ilustrativa.
- shared/pdf.mjs: diagramação e geração do PDF.
- server/api.mjs: validação, prompt, PageSpeed e rota de análise.
- server/gemini.mjs: integração Gemini e tratamento de falhas.
- server/local.mjs: API HTTP e servidor para preview local.
- scripts/dev.mjs: inicialização conjunta da API e do Vite.
- tests/: verificações dos contratos e do relatório.

## Limites desta versão

Esta é a ferramenta interna de onboarding. Não utiliza Meta, Google Sheets,
Tavily ou envio de e-mails. Redes e concorrentes citados não são consultados.
PageSpeed avalia a página informada em celular. Contatos, CNPJ e responsável
são excluídos dos campos enviados à IA. Não inclua credenciais nos textos.

O modo local não tem login e fica restrito ao computador por padrão.
Hospedar apenas `web-dist` não ativa a IA: o deploy também precisa
executar a API e guardar as chaves no servidor. O acesso privado do site de
teste não é transferido para este pacote.

Origem: commit 804c18a22124eb2673ae54299bb0a457e67c85cc.
Adaptações locais: comandos de build portáveis, acesso por localhost e este guia.

## Publicação e entrega

Consulte DEPLOY.md para publicar na Vercel e entregar o build.
As rotas api/analyze.js e api/status.js reutilizam a lógica em server/api.mjs.
