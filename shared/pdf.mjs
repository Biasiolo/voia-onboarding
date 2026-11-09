import {jsPDF} from 'jspdf';
import {reportBlocks} from './report.mjs';
import {logoBase64} from './logo.mjs';
import {regularFont,boldFont} from './fonts.mjs';

// The screen and PDF share the same content. Only its presentation changes here.
export function createPDF(project){
 const pdf=new jsPDF({unit:'mm',format:'a4',compress:true});
 const W=210,M=18,CW=W-2*M,TOP=32,BOTTOM=276,PAD=6;
 const ink=[0,0,0],muted=[99,101,97],line=[218,220,213],paper=[245,246,241];
 let y=TOP,part='Cadastro e entrevista',sectionNumber=0;
 pdf.addFileToVFS('VoiaRegular.ttf',regularFont);pdf.addFont('VoiaRegular.ttf','Voia','normal');
 pdf.addFileToVFS('VoiaBold.ttf',boldFont);pdf.addFont('VoiaBold.ttf','Voia','bold');
 pdf.setProperties({title:`Briefing estratégico | ${project.values.empresa||'Vóia'}`,author:'Vóia Agency',subject:'Cadastro, entrevista e análise estratégica'});
 const clean=t=>String(t??'').replace(/[\u2013\u2014]/g,'-').replace(/•/g,' / ').replace(/[\u{1F000}-\u{1FAFF}]/gu,'');
 function font(size=10.3,bold=false,color=ink){pdf.setFont('Voia',bold?'bold':'normal');pdf.setFontSize(size);pdf.setTextColor(...color)}
 function header(){
  pdf.setFillColor(...ink);pdf.rect(M,11,31,11,'F');pdf.addImage('data:image/png;base64,'+logoBase64,'PNG',M+4,13,23,6.5);
  font(7.6,true,muted);pdf.text('BRIEFING ESTRATÉGICO',W-M,15,{align:'right'});
  font(7.4,false,muted);pdf.text(part,W-M,20,{align:'right'});
  pdf.setDrawColor(...line);pdf.setLineWidth(.25);pdf.line(M,26,W-M,26);
 }
 function newPage(){pdf.addPage();y=TOP;header()}
 function ensure(h){if(y+h>BOTTOM&&y>TOP+.1)newPage()}
 header();
 const styles={
  eyebrow:{size:8,bold:true,color:muted,gap:3},title:{size:29,bold:true,gap:5},
  subheading:{size:12.5,bold:true,gap:3},label:{size:8,bold:true,color:muted,gap:1},
  text:{size:10,gap:2.5},note:{size:8.2,color:muted,gap:3},
  warning:{size:8.5,bold:true,gap:2},bullet:{size:10.3,gap:3.5},metric:{size:12,bold:true,gap:3}
 };
 function tokens(blocks,width){return blocks.flatMap(b=>{
  const s={...(styles[b.kind]||styles.text)};if(b.kind==='title'&&b.text.length>70)s.size=b.text.length>140?18:23; font(s.size,s.bold,s.color||ink);
  const text=(b.kind==='bullet'?'- ':'')+clean(b.text);
  const ls=pdf.splitTextToSize(text,width),lh=s.size*.35278*(b.kind==='title'?1.2:1.45);
  return ls.map((text,i)=>({text,...s,lh,h:lh+(i===ls.length-1?s.gap:0),keep:(i===ls.length-1&&['label','subheading','eyebrow'].includes(b.kind))?2:0}));
 })}
 const height=ts=>ts.reduce((s,t)=>s+t.h,0);
 function paint(ts,x,top){let at=top;for(const t of ts){font(t.size,t.bold,t.color||ink);pdf.text(t.text,x,at+t.lh*.78);at+=t.h}}
 function flow(blocks,{card=false,dark=false,keepWithHeading=false}={}){
  let ts=tokens(blocks,CW-(card?PAD*2:0)),continued=false;
  const total=height(ts)+(card?PAD*2:0);
  if(total<=BOTTOM-TOP&&!keepWithHeading)ensure(total);
  while(ts.length){
   const cap=BOTTOM-y-(card?PAD*2:0)-(continued?6:0);let used=0,n=0;
   for(;n<ts.length;n++){
    const t=ts[n],following=ts.slice(n+1,n+1+t.keep).reduce((s,a)=>s+a.h,0);
    if(used+t.h+following>cap)break;used+=t.h;
   }
   if(!n){newPage();continue}
   // Keep at least two lines on the continuation whenever possible.
   if(ts.length-n===1&&n>2&&!ts[n-1].keep){n--;used-=ts[n].h}
   const chunk=ts.slice(0,n),h=used+(card?PAD*2:0)+(continued?6:0);
   if(card){pdf.setFillColor(...(dark?ink:paper));pdf.roundedRect(M,y,CW,h,2,2,'F')}
   if(continued){font(7.4,true,dark?[200,202,195]:muted);pdf.text('CONTINUAÇÃO',M+(card?PAD:0),y+(card?PAD:0)+3)}
   paint(dark?chunk.map(t=>({...t,color:t.bold?[255,255,255]:[226,228,221]})):chunk,M+(card?PAD:0),y+(card?PAD:0)+(continued?6:0));
   y+=h+(card?4:0);ts=ts.slice(n);if(ts.length){newPage();continued=true}
  }
 }
 function heading(text,firstHeight=35){
  const ts=tokens([{kind:'subheading',text}],CW-16),h=Math.max(12,height(ts)+4);
  ensure(h+Math.min(firstHeight,90));
  sectionNumber++;pdf.setFillColor(...ink);pdf.roundedRect(M,y+1,10,8,1,1,'F');
  font(8,true,[255,255,255]);pdf.text(String(sectionNumber).padStart(2,'0'),M+5,y+6.3,{align:'center'});
  paint(ts,M+15,y+1);y+=h;
 }
 function grid(pairs,score=false){
  const gap=5,col=(CW-gap)/2;
  for(let i=0;i<pairs.length;i+=2){
   const row=pairs.slice(i,i+2).map(p=>{const ts=tokens([{kind:'label',text:p.label},{kind:score?'metric':'text',text:p.value}],col-10);return score?ts:ts.map(t=>({...t,size:t.bold?7.5:9.1,lh:t.bold?3.85:4.65,h:t.bold?4.45:5.45}))});
   const h=Math.max(...row.map(height))+(score?12:8);ensure(h);
   // Long values remain complete; use full-width flowing panels if a row cannot fit a page.
   if(h>BOTTOM-TOP){for(const p of pairs.slice(i,i+2))flow([{kind:'label',text:p.label},{kind:'text',text:p.value}],{card:true});continue}
   row.forEach((ts,j)=>{const x=M+j*(col+gap);pdf.setFillColor(...paper);pdf.roundedRect(x,y,col,h,1.5,1.5,'F');paint(ts,x+5,y+(score?6:4))});y+=h+3;
  }
  y+=3;
 }
 const blocks=reportBlocks(project);let i=0;
 while(i<blocks.length){
  const b=blocks[i];
  if(b.kind==='part'){
   part='Análise e direcionamentos';sectionNumber=0;newPage();
   flow([{kind:'eyebrow',text:b.text},{kind:'title',text:'Análise e\ndirecionamentos'}]);y+=2;i++;continue;
  }
  if(b.kind==='heading'){
   let end=i+1;while(end<blocks.length&&!['heading','part'].includes(blocks[end].kind))end++;
   const content=blocks.slice(i+1,end);
   if(b.text==='Dados cadastrais'){
    const pairs=[];for(let j=0;j<content.length;j+=2)pairs.push({label:content[j].text,value:content[j+1]?.text||''});
    const first=height(tokens(content.slice(0,2),(CW-5)/2-12))+16;
    heading(b.text,first);grid(pairs);newPage();
   }else{
    const groups=[];let group=[];
    for(const item of content){if(item.kind==='subheading'&&group.length){groups.push(group);group=[]}group.push(item)}if(group.length)groups.push(group);
    const first=groups[0]||[];const estimate=height(tokens(first,CW-PAD*2))+PAD*2+5;
    heading(b.text,estimate);let firstCard=true;
    for(const g of groups){
     // Metric tiles preserve the original text and actual/null values.
     let start=0;
     while(start<g.length){
      if(g[start].kind==='metric'){
       let stop=start;while(stop<g.length&&g[stop].kind==='metric')stop++;
       grid(g.slice(start,stop).map(m=>{const k=m.text.indexOf(':');return{label:m.text.slice(0,k),value:m.text.slice(k+1).trim()}}),true);start=stop;
      }else{
       let stop=start;while(stop<g.length&&g[stop].kind!=='metric')stop++;
       flow(g.slice(start,stop),{card:true,dark:b.text==='Leitura geral',keepWithHeading:firstCard});firstCard=false;start=stop;
      }
     }
    }
   }
   y+=3;i=end;continue;
  }
  flow([b],{card:b.kind==='warning'});i++;
 }
 const count=pdf.getNumberOfPages();
 for(let p=1;p<=count;p++){
  pdf.setPage(p);pdf.setDrawColor(...line);pdf.line(M,283,W-M,283);
  font(7.3,false,muted);pdf.text(project.example?'VÓIA AGENCY / EXEMPLO FICTÍCIO':'VÓIA AGENCY / USO INTERNO',M,289);
  font(7.5,true,ink);pdf.text(`${String(p).padStart(2,'0')} / ${String(count).padStart(2,'0')}`,W-M,289,{align:'right'});
 }
 return pdf;
}
export function downloadPDF(p){const name=(p.values.empresa||'cliente').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').toLowerCase();createPDF(p).save(`voia-briefing-${name}.pdf`)}
