// Enable only after AdSense approves the site and a certified consent flow is configured.
export const adConfig={enabled:false,consentReady:false,client:'',slots:{side:'',footer:'',between:''}};
let loader,observer;const requested=new Set();
function slot(name){const section=document.createElement('aside');section.className='ad-placement ad-'+name;section.setAttribute('aria-label','Advertisement');section.dataset.placement=name;section.innerHTML='<span class="ad-label">Advertisement</span><div class="ad-content"><span class="ad-placeholder">Reserved ad space</span></div>';return section}
export function placeAds(page,finished=false){
 observer?.disconnect();
 // Never place ads in questions, the translator, sign-in, or personal progress.
 if(page==='session'&&!finished)return;
 const main=document.getElementById('main');if(!main)return;
 if(page==='learn'){
  const rail=main.querySelector('.right-rail');if(rail)rail.append(slot('side'));
  const path=main.querySelector('.path-note');if(path)path.after(slot('between'));
 }else if(page==='session'&&finished){main.append(slot('between'))}
 if(['welcome','about','learn','reference'].includes(page))main.append(slot('footer'));
 if(!adConfig.enabled||!adConfig.consentReady||!/^ca-pub-\d{16}$/.test(adConfig.client))return;
 observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);loadSlot(entry.target)}},{rootMargin:'100px'});
 main.querySelectorAll('.ad-placement').forEach(el=>{const name=el.dataset.placement;if(requested.has(name)||!/^\d+$/.test(adConfig.slots[name])){el.hidden=true;return}observer.observe(el)});
}
async function loadSlot(section){
 const name=section.dataset.placement;if(requested.has(name)||!section.isConnected)return;
 // One request per placement per full page load. No automatic refresh or retry loop.
 requested.add(name);
 if(!loader)loader=new Promise((resolve,reject)=>{const script=document.createElement('script');script.async=true;script.crossOrigin='anonymous';script.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+adConfig.client;script.onload=resolve;script.onerror=reject;document.head.append(script)});
 try{await loader;if(!section.isConnected)return;const ad=document.createElement('ins');ad.className='adsbygoogle';ad.style.display='block';ad.dataset.adClient=adConfig.client;ad.dataset.adSlot=adConfig.slots[name];ad.dataset.adFormat='auto';ad.dataset.fullWidthResponsive='true';section.querySelector('.ad-content').replaceChildren(ad);(window.adsbygoogle=window.adsbygoogle||[]).push({});}catch{section.hidden=true}
}
