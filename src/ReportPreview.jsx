import React,{useEffect,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight,LoaderCircle,FileText,RotateCcw} from 'lucide-react';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export default function ReportPreview({project}){
 const [document,setDocument]=useState(null),[page,setPage]=useState(1),[zoom,setZoom]=useState('fit'),[width,setWidth]=useState(700),[loading,setLoading]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0),[pageText,setPageText]=useState('');
 const container=useRef(null),surface=useRef(null);
 useEffect(()=>{
  const observer=new ResizeObserver(([entry])=>setWidth(Math.max(200,entry.contentRect.width-48)));
  if(container.current)observer.observe(container.current);
  return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  let cancelled=false,task;
  setDocument(null);setPage(1);setLoading(true);setError('');setPageText('');
  (async()=>{
   const [{createPDF},pdfjs]=await Promise.all([import('../shared/pdf.mjs'),import('pdfjs-dist')]);
   if(cancelled)return;
   pdfjs.GlobalWorkerOptions.workerSrc=workerUrl;
   task=pdfjs.getDocument({data:new Uint8Array(createPDF(project).output('arraybuffer')),isEvalSupported:false,useWasm:false,disableWorkerRendering:true});
   const doc=await task.promise;
   if(!cancelled)setDocument(doc);
  })().catch(()=>{if(!cancelled){setError('Não foi possível abrir a prévia. Tente novamente ou baixe o PDF pelos botões desta página.');setLoading(false)}});
  return()=>{cancelled=true;task?.destroy().catch(()=>{})};
 },[project.id,project.values,project.analysis,project.analyzedInput,retry]);
 useEffect(()=>{
  if(!document)return;
  let cancelled=false,renderTask;
  setLoading(true);setError('');setPageText('');
  (async()=>{
   const pdfPage=await document.getPage(page);
   if(cancelled)return;
   const base=pdfPage.getViewport({scale:1}),scale=zoom==='fit'?Math.min(width,960)/base.width:Number(zoom)*96/72;
   const viewport=pdfPage.getViewport({scale}),ratio=Math.min(window.devicePixelRatio||1,2);
   const canvas=window.document.createElement('canvas');
   canvas.width=Math.ceil(viewport.width*ratio);canvas.height=Math.ceil(viewport.height*ratio);
   canvas.style.width=`${viewport.width}px`;canvas.style.height=`${viewport.height}px`;
   canvas.setAttribute('aria-hidden','true');
   renderTask=pdfPage.render({canvas,viewport,transform:ratio===1?undefined:[ratio,0,0,ratio,0,0]});
   await renderTask.promise;
   if(cancelled)return;
   surface.current.replaceChildren(canvas);setLoading(false);
   const content=await pdfPage.getTextContent();
   if(!cancelled)setPageText(content.items.map(item=>item.str).join(' '));
  })().catch(err=>{if(!cancelled&&err.name!=='RenderingCancelledException'){setError('Não foi possível exibir esta página. Tente abrir a prévia novamente.');setLoading(false)}});
  return()=>{cancelled=true;renderTask?.cancel()};
 },[document,page,zoom,width]);
 return <section className="pdf-viewer" aria-label="Prévia do PDF final">
  <div className="pdf-toolbar">
   <div className="pdf-toolbar-title"><FileText size={18}/><span>Prévia do PDF<small>Mesma diagramação do arquivo final</small></span></div>
   <div className="pdf-controls">
    <button className="pdf-page-button" disabled={!document||page===1} onClick={()=>setPage(p=>p-1)} aria-label="Página anterior"><ChevronLeft size={18}/></button>
    <label className="pdf-page-label">Página <select aria-label="Página do relatório" value={page} onChange={e=>setPage(Number(e.target.value))} disabled={!document}>{Array.from({length:document?.numPages||1},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select><span>de {document?.numPages||'…'}</span></label>
    <button className="pdf-page-button" disabled={!document||page===document.numPages} onClick={()=>setPage(p=>p+1)} aria-label="Próxima página"><ChevronRight size={18}/></button>
    <select className="pdf-zoom" aria-label="Zoom do relatório" value={zoom} onChange={e=>setZoom(e.target.value)}><option value="fit">Ajustar à largura</option><option value="1">100%</option><option value="1.25">125%</option><option value="1.5">150%</option></select>
   </div>
  </div>
  <div className="pdf-stage" ref={container} aria-busy={loading}>
   {loading&&<div className="pdf-loading" role="status"><LoaderCircle className="spin" size={20}/>Preparando página…</div>}
   {error?<div className="pdf-error" role="alert"><p>{error}</p><button className="outline" onClick={()=>setRetry(n=>n+1)}><RotateCcw size={16}/>Tentar novamente</button></div>:<div className={'pdf-sheet'+(loading?' pdf-sheet-loading':'')} ref={surface} role="img" aria-label={`Página ${page} de ${document?.numPages||1} do relatório`}/>}
   <p className="sr-only">{pageText}</p>
  </div>
  <div className="pdf-caption" aria-live="polite">{document?`${document.numPages} páginas · A4 · Cadastro, entrevista e análise`:'Montando o relatório completo…'}</div>
 </section>
}
