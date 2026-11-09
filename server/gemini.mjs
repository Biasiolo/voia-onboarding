// Only diagnostic codes are logged. Provider messages, inputs and credentials stay private.
export class GeminiError extends Error {
 constructor(message,code,retryable=false){super(message);this.code=code;this.retryable=retryable;}
}
export function classifyGeminiError(status,payload={}){
 const message=String(payload.error?.message||'').toLowerCase();
 const reason=(payload.error?.details||[]).map(d=>d.reason||'').join(' ');
 if(/location.*not supported|country.*not supported|region.*not supported/.test(message))return new GeminiError('A análise por IA está indisponível para a localização da integração. A equipe da Vóia precisa revisar o serviço.','AI_REGION_UNSUPPORTED');
 if(/API_KEY_INVALID|API_KEY_EXPIRED|API_KEY_SERVICE_BLOCKED/.test(reason)||/api key.*(not valid|invalid|expired|leaked)/.test(message))return new GeminiError('A conexão com a IA precisa ser atualizada pela equipe da Vóia. O briefing foi preservado.','AI_AUTH_REQUIRED');
 if(status===401||status===403)return new GeminiError('O serviço de IA não autorizou esta análise. A equipe da Vóia precisa revisar a integração.','AI_ACCESS_DENIED');
 if(status===402)return new GeminiError('A análise por IA está indisponível por um limite da conta do serviço. A equipe da Vóia precisa revisar a integração.','AI_BILLING_REQUIRED');
 if(status===429)return new GeminiError('O serviço de IA atingiu o limite de uso neste momento. Tente novamente mais tarde.','AI_RATE_LIMIT');
 if(status===404)return new GeminiError('O modelo de IA configurado está indisponível. A equipe da Vóia precisa atualizar a integração.','AI_MODEL_UNAVAILABLE');
 if(status===408||status>=500)return new GeminiError('O serviço de IA está temporariamente indisponível. Tente novamente em alguns minutos.','AI_TEMPORARILY_UNAVAILABLE',true);
 return new GeminiError('O serviço de IA não conseguiu processar a análise. A equipe da Vóia precisa revisar a integração.','AI_REQUEST_REJECTED');
}
// Convert the former generateContent payload to the current stateless Interactions API.
export function interactionRequest(model,body){
 function schema(node){if(Array.isArray(node))return node.map(schema);if(!node||typeof node!=='object')return node;return Object.fromEntries(Object.entries(node).map(([k,v])=>[k,k==='type'&&typeof v==='string'?v.toLowerCase():schema(v)]));}
 return{model,store:false,system_instruction:body.systemInstruction?.parts?.map(p=>p.text||'').join('\n')||'',
 input:body.contents.map(c=>({type:'user_input',content:c.parts.filter(p=>typeof p.text==='string').map(p=>({type:'text',text:p.text}))})),
 response_format:{type:'text',mime_type:'application/json',schema:schema(body.generationConfig.responseSchema)},
 generation_config:{thinking_level:'low',max_output_tokens:body.generationConfig.maxOutputTokens||10000}};
}
export function interactionText(data){
 if(data.status!=='completed')throw new GeminiError('A IA não entregou a análise completa. Seus dados foram preservados; tente novamente.','AI_INCOMPLETE_RESPONSE');
 const text=(data.steps||[]).filter(s=>s.type==='model_output').flatMap(s=>s.content||[]).filter(c=>c.type==='text'&&typeof c.text==='string').map(c=>c.text).join('');
 if(!text.trim())throw new GeminiError('A IA retornou uma resposta vazia. Tente novamente.','AI_INVALID_RESPONSE',true);
 return text;
}
export async function generateGemini(env,body,{fetcher=fetch,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),timeout=250000}={}){
 const primary=env.GEMINI_MODEL||'gemini-3.1-flash-lite';
 const fallback=env.GEMINI_FALLBACK_MODEL||(primary==='gemini-3.1-flash-lite'?'gemini-3.8-flash':'gemini-3.1-flash-lite');
 let model=primary;
 if(![primary,fallback].every(m=>/^[a-zA-Z0-9.-]+$/.test(m)))throw new GeminiError('A configuração da IA precisa ser revisada pela equipe da Vóia.','AI_MODEL_UNAVAILABLE');
 const deadline=Date.now()+timeout;
 let failure;
 for(let attempt=1;attempt<=2;attempt++){
  model=attempt===1?primary:fallback;
  const payload=JSON.stringify(interactionRequest(model,body));
  const started=Date.now();let httpStatus;
  try{
   const remaining=deadline-Date.now();if(remaining<=0)throw new DOMException('Timeout','TimeoutError');
   const response=await fetcher('https://generativelanguage.googleapis.com/v1/interactions',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},body:payload,signal:AbortSignal.timeout(Math.max(1,Math.min(120000,remaining)))});
   httpStatus=response.status;
   let data;try{data=await response.json()}catch{throw new GeminiError('A IA retornou uma resposta incompleta. Tente novamente em alguns minutos.','AI_INVALID_RESPONSE',true)}
   if(!response.ok)throw classifyGeminiError(response.status,data);
   const text=interactionText(data);
   console.info(JSON.stringify({event:'gemini_complete',api:'interactions-v1',model,attempt,elapsedMs:Date.now()-started}));
   return{model,candidates:[{content:{parts:[{text}]}}]};
  }catch(error){
   failure=error instanceof GeminiError?error:new GeminiError('A IA não respondeu no tempo disponível. Seus dados foram preservados. Tente novamente em alguns minutos.','AI_TIMEOUT',true);
   console.error(JSON.stringify({event:'gemini_failure',api:'interactions-v1',model,httpStatus,code:failure.code,attempt,elapsedMs:Date.now()-started}));
   if(!failure.retryable||attempt===2)throw failure;
  }
  if(deadline-Date.now()<4000)throw failure;
  await wait(2000*attempt);
 }
 throw failure;
}
