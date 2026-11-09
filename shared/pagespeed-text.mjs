// Textos próprios vinculados ao identificador da auditoria, nunca à nota isolada.
const COPY = {
 'first-contentful-paint': ['Primeiro conteúdo visível (FCP)', 'Tempo até aparecer o primeiro texto ou imagem.', 'Revise o tempo de resposta da página e os arquivos que atrasam a exibição do primeiro conteúdo.'],
 'largest-contentful-paint': ['Maior conteúdo visível (LCP)', 'Tempo até aparecer o maior bloco de conteúdo da tela.', 'Revise a imagem ou o bloco principal da página e priorize seu carregamento.'],
 'total-blocking-time': ['Tempo total de bloqueio (TBT)', 'Tempo acumulado em que tarefas longas bloqueiam a resposta da página durante o teste.', 'Reduza tarefas longas de JavaScript e adie scripts que não são necessários no carregamento inicial.'],
 'cumulative-layout-shift': ['Estabilidade visual (CLS)', 'Mede mudanças inesperadas na posição dos elementos durante o carregamento.', 'Reserve espaço para imagens e conteúdos incorporados e evite inserir elementos que desloquem o conteúdo já exibido.'],
 'speed-index': ['Índice de velocidade', 'Mede a rapidez com que o conteúdo visível da página é apresentado.', 'Priorize os recursos da primeira tela e revise o que atrasa sua exibição.'],
 'link-name': ['Links sem nome acessível', 'Foram encontrados links sem um nome que leitores de tela possam identificar.', 'Adicione texto descritivo aos links. Em links com ícones ou imagens, forneça um nome acessível que explique o destino.'],
 'errors-in-console': ['Erros registrados no navegador', 'O navegador registrou erros durante a análise da página.', 'Peça à equipe técnica que investigue os erros do console e corrija as causas identificadas, como falhas de scripts ou de requisições.'],
 "color-contrast": ["Contraste entre texto e fundo", "O teste apontou contraste insuficiente em parte dos textos.", "Ajuste as cores dos textos e fundos indicados para facilitar a leitura, principalmente para pessoas com baixa visão."],
 "label-content-name-mismatch": ["Rótulos visíveis e nomes acessíveis", "O nome lido por tecnologias assistivas não corresponde ao texto visível em alguns controles.", "Faça o nome acessível incluir o texto que aparece no botão ou link."],
 "button-name": ["Identificação dos botões", "Há botões sem um nome acessível.", "Dê um nome descritivo aos botões, incluindo os que mostram apenas ícones."],
 "image-alt": ["Descrição das imagens", "Há imagens sem a descrição alternativa esperada pelo teste.", "Descreva as imagens informativas no atributo alt e marque as decorativas com alt vazio."],
 "label": ["Identificação dos campos do formulário", "Há campos sem rótulos acessíveis associados.", "Associe um rótulo descritivo a cada campo do formulário."],
 "heading-order": ["Ordem dos títulos", "A sequência de títulos apresenta saltos na hierarquia.", "Organize os níveis de títulos conforme as seções e subseções da página."],
 "html-has-lang": ["Idioma principal da página", "O documento não informa corretamente seu idioma principal.", "Defina o atributo lang do documento de acordo com o idioma do conteúdo."],
 "html-lang-valid": ["Código de idioma da página", "O código de idioma do documento precisa de revisão.", "Use um código de idioma válido no atributo lang, como pt-BR para português brasileiro."],
 "document-title": ["Título da página", "O título do documento não atende à verificação automatizada.", "Defina um título que identifique o assunto e diferencie esta página das demais."],
 "meta-description": ["Descrição para mecanismos de busca", "A descrição da página não atende à verificação automatizada.", "Inclua uma meta description clara e compatível com o conteúdo da página."],
 "link-text": ["Texto dos links", "Alguns links não descrevem claramente o destino.", "Troque textos genéricos por descrições que expliquem o destino do link."],
 "crawlable-anchors": ["Links que podem ser rastreados", "Parte dos links não pode ser seguida pelos mecanismos de busca.", "Use links com endereço válido no atributo href quando houver navegação para outra página."],
 "is-crawlable": ["Permissão de indexação", "O teste encontrou uma restrição à indexação da página.", "Confira se a restrição é intencional antes de alterar diretivas de indexação."],
 "robots-txt": ["Instruções de rastreamento", "O arquivo robots.txt apresenta um problema na verificação.", "Revise a sintaxe e as regras do robots.txt com a equipe responsável pelo site."],
 "canonical": ["Endereço principal da página", "A indicação do endereço canônico não atende à verificação.", "Confira se a URL canônica aponta para a versão correta e acessível do conteúdo."],
 "hreflang": ["Versões de idioma da página", "As referências a versões de idioma precisam de revisão.", "Confira os códigos e endereços informados nos atributos hreflang."],
 "http-status-code": ["Resposta do servidor", "A resposta HTTP da página não atende à verificação.", "Investigue o código de resposta e corrija falhas ou redirecionamentos indevidos."],
 "render-blocking-insight": ["Recursos que atrasam a exibição inicial", "O teste identificou requisições que bloqueiam a apresentação inicial do conteúdo.", "Revise os recursos indicados e adie apenas os que não são necessários para exibir a primeira tela."],
 "network-dependency-tree-insight": ["Sequência de carregamento dos arquivos", "O teste identificou dependências de rede que prolongam o carregamento.", "Revise os encadeamentos de requisições e priorize os recursos essenciais para a primeira tela."],
 "font-display-insight": ["Exibição do texto durante o carregamento", "O carregamento das fontes pode atrasar a exibição do texto.", "Revise a estratégia de carregamento das fontes para manter o texto visível enquanto elas são baixadas."],
 "image-delivery-insight": ["Tamanho e formato das imagens", "O teste encontrou oportunidades de reduzir o peso das imagens.", "Ajuste dimensões, compressão e formato das imagens apontadas, preservando a qualidade necessária."],
 "use-cache-insight": ["Reutilização de arquivos em novas visitas", "A política de cache dos recursos indicados pode ser melhorada.", "Revise o tempo de cache de arquivos estáticos, respeitando a frequência de atualização de cada recurso."],
 "document-latency-insight": ["Tempo de resposta do documento", "O teste identificou demora na obtenção do documento inicial.", "Revise a resposta do servidor, os redirecionamentos e a compressão do documento."],
 "forced-reflow-insight": ["Recálculos do layout", "O teste identificou recálculos de layout forçados durante a execução de scripts.", "Peça à equipe técnica que revise as operações de leitura e alteração do layout indicadas pelo teste."],
 "legacy-javascript-insight": ["Código antigo enviado ao navegador", "O teste identificou código de compatibilidade que pode ser desnecessário em navegadores modernos.", "Revise a configuração de geração do JavaScript conforme os navegadores que o site precisa atender."],
 "lcp-discovery-insight": ["Descoberta do conteúdo principal", "O navegador pode descobrir mais cedo o recurso responsável pelo maior conteúdo visível.", "Revise a prioridade e a forma de carregamento do recurso principal indicado pelo teste."],
 "cls-culprits-insight": ["Elementos que mudam de posição", "O teste identificou elementos associados a mudanças inesperadas no layout.", "Reserve espaço para os elementos indicados e revise conteúdos inseridos durante o carregamento."],
 "unused-javascript": ["JavaScript não utilizado no carregamento", "Parte do código baixado não foi utilizada durante a medição.", "Avalie o carregamento sob demanda do código não essencial, sem remover funcionalidades necessárias."],
 "unused-css-rules": ["Estilos não utilizados no carregamento", "Parte dos estilos baixados não foi utilizada durante a medição.", "Revise os estilos não utilizados e priorize os necessários à primeira tela."],
 "unminified-javascript": ["Compactação do JavaScript", "Os arquivos de JavaScript indicados podem ter seu tamanho reduzido.", "Ative a minificação dos arquivos no processo de publicação do site."],
 "unminified-css": ["Compactação dos estilos", "Os arquivos de estilos indicados podem ter seu tamanho reduzido.", "Ative a minificação do CSS no processo de publicação do site."],
 "long-tasks": ["Tarefas que bloqueiam a resposta", "O teste identificou tarefas longas na execução da página.", "Divida tarefas extensas e adie processamento que não seja necessário no início da visita."],
 "is-on-https": ["Conexão protegida", "A verificação de conexão HTTPS precisa de atenção.", "Revise o certificado e as requisições para que a página e seus recursos usem HTTPS."],
 "uses-deprecated-apis": ["Recursos antigos do navegador", "A página utiliza recursos do navegador que estão em desuso.", "Atualize os trechos de código indicados para alternativas compatíveis e mantidas."],
 "image-aspect-ratio": ["Proporção das imagens", "O teste apontou imagens exibidas com proporções inadequadas.", "Ajuste largura e altura para preservar a proporção original das imagens."],
 "image-size-responsive": ["Resolução das imagens", "Há imagens com resolução inadequada ao tamanho de exibição.", "Forneça imagens com resolução compatível com a área e a densidade de tela utilizadas."],
};
for (const [old,current] of Object.entries({'render-blocking-resources':'render-blocking-insight','critical-request-chains':'network-dependency-tree-insight','font-display':'font-display-insight','uses-optimized-images':'image-delivery-insight','modern-image-formats':'image-delivery-insight','uses-responsive-images':'image-delivery-insight','uses-long-cache-ttl':'use-cache-insight','server-response-time':'document-latency-insight','legacy-javascript':'legacy-javascript-insight'})) COPY[old]=COPY[current];

export function cleanAuditText(value, fallback = '') {
 if (typeof value !== 'string' || !value.trim() || /\{[^}]*\}|\[object Object\]|\b(?:UIStrings\.|i18n::)/.test(value)) return fallback;
 return value.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<[^>]*>/g, '').replace(/`/g, '').slice(0, 1400).trim();
}
// A missing translation must not erase an observation returned by the provider.
export function auditText(audit, localized = true) {
 const known = COPY[audit.id];
 const originalTitle = cleanAuditText(audit.title), originalDescription = cleanAuditText(audit.description);
 const untranslated = !known && !localized && !!(originalTitle || originalDescription);
 const title = known?.[0] || originalTitle || 'Verificação técnica sem título disponível';
 const description = known?.[1] || originalDescription || 'O PageSpeed registrou esta verificação, mas não enviou uma descrição legível.';
 const action = known?.[2] || (untranslated ? 'Descrição original do PageSpeed (tradução pendente): ' + description : description);
 const value = numericAuditValue(audit) || cleanAuditText(audit.displayValue);
 return {title, description, action, evidence: (untranslated ? 'Achado do PageSpeed (texto original): ' : '') + title + (value ? ': ' + value : ''), needsTranslation: untranslated};
}
const numberPT=(value,digits)=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:digits}).format(value);
export function numericAuditValue(audit){
 if(typeof audit.numericValue!=='number'||!Number.isFinite(audit.numericValue))return '';
 if(['first-contentful-paint','largest-contentful-paint','speed-index'].includes(audit.id)&&audit.numericUnit==='millisecond')return numberPT(audit.numericValue/1000,2)+' s';
 if(audit.id==='total-blocking-time'&&audit.numericUnit==='millisecond')return numberPT(audit.numericValue,0)+' ms';
 if(audit.id==='cumulative-layout-shift'&&audit.numericUnit==='unitless')return numberPT(audit.numericValue,3);
 return '';
}
export function metricText(audit) {
 return {label: COPY[audit.id]?.[0] || 'Métrica da página', value: numericAuditValue(audit) || cleanAuditText(audit.displayValue, 'Não informado')};
}
export function warningText(value,localized=true){
 const text=cleanAuditText(value);
 if(!text)return 'O PageSpeed registrou um aviso de execução sem descrição legível.';
 if(/stored data|indexeddb|localstorage|local storage/i.test(text))return 'Dados armazenados no navegador podem ter influenciado esta medição. Compare com uma nova execução sem esses dados.';
 if(/took too long|timed? out|timeout|time limit/i.test(text))return 'Parte da medição atingiu o limite de tempo. Alguns resultados podem estar incompletos; execute uma nova análise para comparar.';
 if(/redirect/i.test(text))return 'O PageSpeed registrou um redirecionamento durante o acesso. Confira se o endereço final corresponde à página desejada.';
 return localized?text:'Aviso original do PageSpeed (tradução pendente): '+text;
}
