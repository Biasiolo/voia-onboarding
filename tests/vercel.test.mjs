import test from 'node:test';
import assert from 'node:assert/strict';
import analyze from '../api/analyze.js';
import status from '../api/status.js';
import { sampleValues } from '../shared/briefing.mjs';
import { demoAnalysis } from '../shared/report.mjs';

const request = (path, options={}) => new Request(`https://briefing.example.com/api/${path}`, options);
const post = (body, origin='https://briefing.example.com') => request('analyze', {
  method:'POST', headers:{'Content-Type':'application/json', Origin:origin}, body,
});

test('Vercel handlers preserve HTTPS, JSON, status codes and server-only credentials', async()=>{
  const saved = {...process.env};
  const originalFetch = globalThis.fetch;
  try {
    process.env.GEMINI_API_KEY='server-secret-test';
    delete process.env.PAGESPEED_API_KEY;
    let calls=0;
    globalThis.fetch=async()=>{
      calls++;
      return Response.json({status:'completed', steps:[{type:'model_output',content:[{
        type:'text',text:JSON.stringify({...demoAnalysis(),websiteFindings:[]}),
      }]}]});
    };
    const s=await status.fetch(request('status'));
    assert.deepEqual(await s.json(),{ai:true,pagespeed:false});
    assert.equal(s.headers.get('cache-control'),'no-store');
    assert.equal((await analyze.fetch(request('analyze'))).status,405);
    assert.equal((await analyze.fetch(post('{broken'))).status,400);
    assert.equal((await analyze.fetch(post('{}','https://foreign.example'))).status,403);
    assert.equal((await analyze.fetch(post('x'.repeat(100001)))).status,413);
    assert.equal(calls,0);
    const result=await analyze.fetch(post(JSON.stringify({values:sampleValues})));
    assert.equal(result.status,200);
    const body=await result.text();
    assert.equal(JSON.parse(body).analysis.source,'ai');
    assert(!body.includes('server-secret-test'));
    assert.equal(calls,1);
    delete process.env.GEMINI_API_KEY;
    assert.equal((await analyze.fetch(post(JSON.stringify({values:sampleValues})))).status,503);
  } finally {
    globalThis.fetch=originalFetch;
    for(const key of Object.keys(process.env)) if(!(key in saved)) delete process.env[key];
    Object.assign(process.env,saved);
  }
});
