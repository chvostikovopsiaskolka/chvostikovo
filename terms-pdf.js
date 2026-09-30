/* PDFs are built only from server-authorized, immutable acceptance history. */
(function(){
  const encode=s=>new TextEncoder().encode(s);
  const concat=parts=>{const size=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(size);let at=0;for(const p of parts){out.set(p,at);at+=p.length}return out};
  const date=v=>new Intl.DateTimeFormat('sk-SK',{timeZone:'Europe/Bratislava',day:'numeric',month:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(v));
  window.createCustomerTermsPdf=record=>{
    if(!record?.body||!record.terms_version||!record.accepted_at)throw new Error('Potvrdená verzia dokumentu nie je dostupná.');
    const f=window.CHV_TERMS_FONT;if(!f)throw new Error('Písmo PDF sa nenačítalo.');
    const glyph=cp=>f.glyphs[cp]?cp:63;
    const width=(text,size)=>[...text].reduce((sum,ch)=>sum+(f.glyphs[glyph(ch.codePointAt(0))]?.[1]||600)*size/1000,0);
    const hex=text=>[...text].map(ch=>glyph(ch.codePointAt(0)).toString(16).padStart(4,'0')).join('');
    const lines=(text,size)=>{const rows=[];let line='';for(const word of text.split(/\s+/)){if(width(word,size)>511){if(line){rows.push(line);line=''}let part='';for(const ch of word){if(width(part+ch,size)>511){rows.push(part);part=''}part+=ch}line=part;continue}const next=line?line+' '+word:word;if(width(next,size)>511&&line){rows.push(line);line=word}else line=next}if(line)rows.push(line);return rows};
    const pages=[];let content=[],y=796;
    const newPage=()=>{if(content.length)pages.push(content.join('\n'));content=[];y=796};
    const paragraph=(text,size=10.8)=>{const rows=lines(text,size),leading=size*1.42;if(size>12&&y<90)newPage();for(const line of rows){if(y<55)newPage();content.push(`BT /F1 ${size} Tf 1 0 0 1 42 ${y.toFixed(2)} Tm <${hex(line)}> Tj ET`);y-=leading}y-=8};
    paragraph('Podmienky psej škôlky Chvostíkovo',18);
    paragraph('Verzia dokumentu: '+record.terms_version,11);
    paragraph('Psík: '+(record.dog_name||'Neuvedené'),11);
    if(record.owner_name)paragraph('Majiteľ: '+record.owner_name,11);
    paragraph('Elektronicky potvrdené: '+date(record.accepted_at)+' (Europe/Bratislava)',10);
    paragraph('Dokument bol elektronicky potvrdený prostredníctvom zákazníckeho účtu.',10);
    paragraph(record.acceptance_text||'',10);y-=8;
    for(const p of record.body.split(/\n{2,}/).filter(Boolean))paragraph(p,/^\d+\.\s/.test(p)?13:10.8);
    newPage();
    const objects=[null];const add=bytes=>{objects.push(typeof bytes==='string'?encode(bytes):bytes);return objects.length-1};
    const stream=(bytes,extra='')=>concat([encode(`<< /Length ${bytes.length} ${extra} >>\nstream\n`),bytes,encode('\nendstream')]);
    const fontBytes=Uint8Array.from(atob(f.font),ch=>ch.charCodeAt(0));
    const fontFile=add(stream(fontBytes,`/Length1 ${fontBytes.length}`));
    const descriptor=add(`<< /Type /FontDescriptor /FontName /ChvostikovoSans /Flags 32 /FontBBox [-1100 -500 2200 1400] /ItalicAngle 0 /Ascent ${f.ascent} /Descent ${f.descent} /CapHeight 730 /StemV 80 /FontFile2 ${fontFile} 0 R >>`);
    const cps=Object.keys(f.glyphs).map(Number).sort((a,b)=>a-b),map=new Uint8Array((Math.max(...cps)+1)*2);
    for(const cp of cps){const g=f.glyphs[cp][0];map[cp*2]=g>>8;map[cp*2+1]=g&255}
    const cidMap=add(stream(map));
    const widths=cps.map(cp=>cp+' ['+f.glyphs[cp][1]+']').join(' ');
    const cid=add(`<< /Type /Font /Subtype /CIDFontType2 /BaseFont /ChvostikovoSans /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${descriptor} 0 R /DW 600 /W [${widths}] /CIDToGIDMap ${cidMap} 0 R >>`);
    const chunks=[];for(let i=0;i<cps.length;i+=100){const rows=cps.slice(i,i+100);chunks.push(rows.length+' beginbfchar\n'+rows.map(cp=>{const h=cp.toString(16).padStart(4,'0');return `<${h}> <${h}>`}).join('\n')+'\nendbfchar')}
    const unicode=add(stream(encode('/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /ChvostikovoUnicode def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <ffff>\nendcodespacerange\n'+chunks.join('\n')+'\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend')));
    const font=add(`<< /Type /Font /Subtype /Type0 /BaseFont /ChvostikovoSans /Encoding /Identity-H /DescendantFonts [${cid} 0 R] /ToUnicode ${unicode} 0 R >>`);
    const tree=add(''),kids=[];
    pages.forEach((text,index)=>{const footer=`BT /F1 9 Tf 1 0 0 1 42 28 Tm <${hex('Chvostíkovo - '+record.terms_version+' - '+(index+1)+' / '+pages.length)}> Tj ET`;const streamId=add(stream(encode(text+'\n'+footer)));kids.push(add(`<< /Type /Page /Parent ${tree} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${streamId} 0 R >>`))});
    objects[tree]=encode(`<< /Type /Pages /Count ${kids.length} /Kids [${kids.map(id=>id+' 0 R').join(' ')}] >>`);
    const catalog=add(`<< /Type /Catalog /Pages ${tree} 0 R >>`),parts=[encode('%PDF-1.7\n')],offsets=[0];let length=parts[0].length;
    for(let i=1;i<objects.length;i++){offsets.push(length);const item=concat([encode(i+' 0 obj\n'),objects[i],encode('\nendobj\n')]);parts.push(item);length+=item.length}
    const xref=length;parts.push(encode('xref\n0 '+objects.length+'\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+objects.length+' /Root '+catalog+' 0 R >>\nstartxref\n'+xref+'\n%%EOF\n'));
    return new Blob([concat(parts)],{type:'application/pdf'});
  };
})();
