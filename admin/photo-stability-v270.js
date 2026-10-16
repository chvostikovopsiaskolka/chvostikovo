/* Retain decoded image nodes while unrelated text changes; no signed URL churn. */
function adminStableHtmlV270(host,markup){
 if(!host)return;
 if(host.__stableMarkupV270===markup)return;
 const old=new Map();host.querySelectorAll('img').forEach(img=>{const key=img.dataset.adminPhotoKey||img.getAttribute('src');if(!old.has(key))old.set(key,[]);old.get(key).push(img)});
 const template=document.createElement('template');template.innerHTML=markup;
 template.content.querySelectorAll('img').forEach(img=>{const key=img.dataset.adminPhotoKey||img.getAttribute('src'),previous=old.get(key)?.shift();if(previous){previous.alt=img.alt;img.replaceWith(previous)}});
 host.replaceChildren(template.content);host.__stableMarkupV270=markup;
}
window.adminStableHtmlV270=adminStableHtmlV270;
