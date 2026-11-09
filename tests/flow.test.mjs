import test from 'node:test';import assert from 'node:assert/strict';import{api,pageSpeed}from'../server/api.mjs';import{aiInput,emptyValues,sampleValues,fingerprint,isStale,publicWebsite,safeValues}from'../shared/briefing.mjs';import{demoAnalysis,reportBlocks}from'../shared/report.mjs';import{createPDF}from'../shared/pdf.mjs';
const values={...emptyValues(),...sampleValues};const req=(v=values)=>new Request('https://example.com/api/analyze',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://example.com'},body:JSON.stringify({values:v})});
test('AI excludes contact data and unknown fields',()=>{assert(!JSON.stringify(aiInput({...values,email:'PRIVATE',cnpj:'PRIVATE',responsavel:'PRIVATE',senha:'PRIVATE',telefone:'PRIVATE'})).includes('PRIVATE'));assert(!Object.keys(safeValues({empresa:'Casa',password:'secret'})).includes('password'))});
test('Public URL rejects credentials and private destinations',()=>{for(const url of ['http://127.0.0.1','http://localhost','http://localhost.local','https://x:y@example.com','ftp://example.com','http://[::1]','https://example.com:8080'])assert.throws(()=>publicWebsite(url));assert.equal(publicWebsite('example.com/path?q=private#hash'),'https://example.com/path')});
test('Missing credentials never fabricate an analysis',async()=>{const r=await api(req(),{});assert.equal(r.status,503);const d=await r.json();assert.equal(d.code,'AI_UNCONFIGURED');assert(!d.analysis)});
test('Malformed inputs and foreign origins fail before external calls',async()=>{assert.equal((await api(req({...values,empresa:{bad:true}}),{})).status,400);assert.equal((await api(req({...values,negocio:'a'.repeat(6001)}),{})).status,400);const r=new Request('https://example.com/api/analyze',{method:'POST',headers:{Origin:'https://evil.test','Content-Type':'application/json'},body:'{}'});assert.equal((await api(r,{})).status,403)});
test('Provider contract keeps real provenance and does not measure an absent site',async()=>{let sent;const r=await api(req({...values,email:'PRIVATE'}),{GEMINI_API_KEY:'fake',GEMINI_MODEL:'fake'},{fetcher:async(u,o)=>{sent=o.body;return Response.json({status:'completed',steps:[{type:'model_output',content:[{type:'text',text:JSON.stringify({...demoAnalysis(),websiteFindings:[]})}]}]})}});assert.equal(r.status,200);const d=await r.json();assert.equal(d.analysis.source,'ai');assert.equal(d.analysis.website.status,'skipped');assert(!sent.includes('PRIVATE'))});
test('Incomplete AI output is rejected',async()=>{const r=await api(req(),{GEMINI_API_KEY:'fake'},{fetcher:async()=>Response.json({status:'completed',steps:[{type:'model_output',content:[{type:'text',text:'{"summary":"Incomplete"}'}]}]})});assert.equal(r.status,502);assert(!(await r.json()).analysis)});
test('PageSpeed keeps missing scores, zero and Portuguese numeric values',async()=>{const d=await pageSpeed('https://example.com',{PAGESPEED_API_KEY:'test'},async()=>Response.json({lighthouseResult:{configSettings:{locale:'en'},categories:{performance:{score:0},seo:{score:1}},audits:{'largest-contentful-paint':{id:'largest-contentful-paint',score:.2,numericValue:2340,numericUnit:'millisecond',displayValue:'{timeInMs, number}'},'cumulative-layout-shift':{id:'cumulative-layout-shift',numericValue:0,numericUnit:'unitless'},'color-contrast':{id:'color-contrast',score:0,title:'Contrast',description:'English'}},runWarnings:[]}}));assert.equal(d.scores[0].value,0);assert.equal(d.scores[1].value,null);assert.equal(d.metrics[1].value,'2,34 s');assert.equal(d.metrics[3].value,'0');assert.match(d.findings.find(f=>f.id==='color-contrast').title,/Contraste/)});
test('Provider error does not generate fake scores',async()=>{const d=await pageSpeed('https://example.com',{PAGESPEED_API_KEY:'fake'},async()=>new Response('',{status:429}));assert.equal(d.status,'error');assert(!d.scores)});
test('PDF contains interview, edited analysis and stale/demo notices',()=>{const p={values:{...values},analysis:demoAnalysis(),analyzedInput:fingerprint(values),example:true};assert(!isStale(p));p.values.negocio+=' Alterado.';assert(isStale(p));const b=reportBlocks(p);assert(b.some(x=>x.text.includes('DESATUALIZADA')));assert(b.some(x=>x.text.includes('PRÉVIA ILUSTRATIVA')));assert(b.some(x=>x.text===p.values.negocio));assert(b.some(x=>x.text===p.analysis.opportunities[2].indicator));const pdf=createPDF(p);assert(pdf.getNumberOfPages()>=3);assert(pdf.output('arraybuffer').byteLength>10000)});

test('Interactions uses stateless typed input and extracts only final text',async()=>{
 const {generateGemini}=await import('../server/gemini.mjs');let sent,url;
 const body={systemInstruction:{parts:[{text:'Português'}]},contents:[{parts:[{text:'Dados de teste'}]}],generationConfig:{responseSchema:{type:'OBJECT',properties:{summary:{type:'STRING'}},required:['summary']},maxOutputTokens:10000}};
 const r=await generateGemini({GEMINI_API_KEY:'test'},body,{fetcher:async(u,o)=>{url=u;sent=JSON.parse(o.body);return Response.json({status:'completed',steps:[{type:'thought',content:[{type:'text',text:'Não incluir'}]},{type:'model_output',content:[{type:'text',text:'{"summary":"Ok"}'}]}]})}});
 assert.equal(url,'https://generativelanguage.googleapis.com/v1/interactions');assert.equal(sent.store,false);assert.equal(sent.input[0].type,'user_input');assert.equal(sent.input[0].content[0].text,'Dados de teste');assert.equal(sent.response_format.schema.type,'object');assert.equal(r.candidates[0].content.parts[0].text,'{"summary":"Ok"}');
});
test('Transient Gemini failure retries and incomplete status cannot become success',async()=>{
 const{generateGemini}=await import('../server/gemini.mjs');const body={contents:[{parts:[{text:'Teste'}]}],generationConfig:{responseSchema:{type:'OBJECT'}}};let calls=0,delay;
 await generateGemini({GEMINI_API_KEY:'test'},body,{wait:async ms=>{delay=ms},fetcher:async()=>++calls===1?Response.json({error:{message:'Unavailable'}},{status:503}):Response.json({status:'completed',steps:[{type:'model_output',content:[{type:'text',text:'{}'}]}]})});assert.equal(calls,2);assert.equal(delay,2000);
 await assert.rejects(generateGemini({GEMINI_API_KEY:'test'},body,{fetcher:async()=>Response.json({status:'incomplete',steps:[{type:'model_output',content:[{type:'text',text:'{}'}]}]})}),{code:'AI_INCOMPLETE_RESPONSE'});
});
test('Provider unavailable has actionable code and 503 HTTP status',async()=>{
 const r=await api(req(),{GEMINI_API_KEY:'fake'},{fetcher:async()=>Response.json({error:{message:'Unavailable'}},{status:503})});assert.equal(r.status,503);const d=await r.json();assert.equal(d.code,'AI_TEMPORARILY_UNAVAILABLE');assert(!d.analysis);
});

test('Timeout switches model without changing input or retaining conversations',async()=>{
 const{generateGemini}=await import('../server/gemini.mjs');const body={contents:[{parts:[{text:'Preservar entrevista'}]}],generationConfig:{responseSchema:{type:'OBJECT'}}};const calls=[];
 const result=await generateGemini({GEMINI_API_KEY:'test'},body,{wait:async()=>{},fetcher:async(u,o)=>{calls.push(JSON.parse(o.body));if(calls.length===1)throw new DOMException('Deadline','TimeoutError');return Response.json({status:'completed',steps:[{type:'model_output',content:[{type:'text',text:'{}'}]}]})}});
 assert.equal(calls[0].model,'gemini-3.1-flash-lite');assert.equal(calls[1].model,'gemini-3.8-flash');assert.deepEqual(calls[0].input,calls[1].input);assert.equal(calls[1].store,false);assert.equal(result.model,calls[1].model);
});
test('Invalid credentials do not trigger another model or another paid request',async()=>{
 const{generateGemini}=await import('../server/gemini.mjs');let calls=0;
 await assert.rejects(generateGemini({GEMINI_API_KEY:'test'},{contents:[{parts:[{text:'Teste'}]}],generationConfig:{responseSchema:{type:'OBJECT'}}},{fetcher:async()=>{calls++;return Response.json({error:{message:'Invalid API key',details:[{reason:'API_KEY_INVALID'}]}},{status:403})}}),{code:'AI_AUTH_REQUIRED'});assert.equal(calls,1);
});

test('Calendar input roundtrips, reaches AI and invalidates an older analysis only when filled',async()=>{
 const {fields,questionIds,sections}=await import('../shared/briefing.mjs');
 const oldValues={...values};delete oldValues.datas;
 const oldFingerprint=JSON.stringify(fields.filter(([k])=>k!=='datas').map(([k])=>oldValues[k]||''));
 assert.equal(fingerprint(oldValues),oldFingerprint);
 const dated=safeValues({...oldValues,datas:'12/08: aniversário confirmado. Não fazer ações de Black Friday.'});
 assert.equal(safeValues(JSON.parse(JSON.stringify(dated))).datas,dated.datas);
 assert(JSON.stringify(aiInput(dated)).includes(dated.datas));
 assert.notEqual(fingerprint(dated),oldFingerprint);
 assert.equal(questionIds.length,11);assert.equal(sections.at(-2).id,'datas');assert.equal(sections.at(-1).id,'interno');
});
test('Calendar output is bounded, editable report content is retained and legacy analyses still export',async()=>{
 const {validateAnalysis}=await import('../server/api.mjs');
 const raw={...demoAnalysis(),websiteFindings:[]};
 assert.equal(validateAnalysis(raw).calendarSuggestions.length,2);
 assert.throws(()=>validateAnalysis({...raw,calendarSuggestions:Array(7).fill(raw.calendarSuggestions[0])}));
 assert.throws(()=>validateAnalysis({...raw,calendarSuggestions:[{occasion:'Incomplete'}]}));
 const analysis={...raw,calendarSuggestions:[{...raw.calendarSuggestions[0],action:'Ação revisada pela equipe'}]};
 const p={values,analysis,analyzedInput:fingerprint(values),example:true};
 const b=reportBlocks(p);assert(b.some(x=>x.text===values.datas));assert(b.some(x=>x.text==='Ação revisada pela equipe'));
 delete analysis.calendarSuggestions;
 assert(reportBlocks(p).some(x=>x.text.includes('antes da inclusão do calendário')));
 assert(createPDF(p).getNumberOfPages()>3);
});
