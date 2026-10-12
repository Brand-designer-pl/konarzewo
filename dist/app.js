(()=>{const menu=document.querySelector('.menu-button'),header=document.querySelector('.header');menu?.addEventListener('click',()=>{const on=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',on);header.classList.toggle('menu-open',on)});header?.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>{header.classList.remove('menu-open');menu?.setAttribute('aria-expanded','false')}));const preference=matchMedia('(prefers-reduced-motion: reduce)');
const orbit=document.getElementById('orbit-film');
const originalOrbitSrc=orbit?.dataset.src;
// The cinematic home always opens on the front frame, including a reload.
if(orbit&&!location.hash){if('scrollRestoration' in history)history.scrollRestoration='manual';window.scrollTo({top:0,behavior:'instant'});}
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>n*n*(3-2*n);
if(window.gsap&&window.ScrollTrigger){
 gsap.registerPlugin(ScrollTrigger);
 const mm=gsap.matchMedia();
 mm.add('(prefers-reduced-motion: no-preference)',()=>{
  document.body.classList.remove('is-reduced');
  gsap.fromTo('.hero-panel .eyebrow,.hero-panel h1,.hero-desc,.hero-panel .line-link,.scroll-cue',
   {y:55,autoAlpha:0,clipPath:'inset(100% 0 0 0)'},
   {y:0,autoAlpha:1,clipPath:'inset(0% 0 0 0)',duration:1.15,stagger:.13,ease:'power3.out',delay:.3});
  let trigger,ticker,arrivalTween,initialized=false,raw=0,arrivalShown=false,flying=false,finished=false,activeFilm=orbit,backwards=false;
  const objectUrls=[];
  const root=document.documentElement;
  let savedOverflow=null;
  const lockScroll=()=>{if(savedOverflow!==null)return;savedOverflow=root.style.overflow;root.style.overflow='hidden';};
  const unlockScroll=()=>{if(savedOverflow===null)return;root.style.overflow=savedOverflow;savedOverflow=null;};
  const flight={progress:0};
  const controller=new AbortController();
  const stage=document.querySelector('.stage');
  const replay=document.querySelector('.replay');
  const reverseFilm=orbit?document.createElement('video'):null;
  if(reverseFilm){reverseFilm.id='reverse-film';reverseFilm.muted=true;reverseFilm.playsInline=true;reverseFilm.preload='auto';reverseFilm.setAttribute('aria-hidden','true');reverseFilm.style.opacity='0';orbit.after(reverseFilm);}
  // Both directions play normally; no per-frame currentTime seeking.
  const loadFilm=(film,src)=>{
   if(!film||!src)return;
   fetch(src,{signal:controller.signal,cache:'force-cache'})
    .then(r=>{if(!r.ok)throw Error('Film unavailable');return r.blob();})
    .then(blob=>{if(controller.signal.aborted)return;const url=URL.createObjectURL(blob);objectUrls.push(url);film.src=url;film.load();})
    .catch(()=>{if(!controller.signal.aborted){film.src=src;film.load();}});
  };
  loadFilm(orbit,originalOrbitSrc);loadFilm(reverseFilm,orbit?.dataset.reverseSrc);
  const showArrival=()=>{
   if(arrivalShown)return;arrivalShown=true;gsap.to('.arrival-gradient',{opacity:1,duration:.85,ease:'power2.inOut',overwrite:true});
   gsap.set('.arrival',{autoAlpha:1,y:0});
   arrivalTween=gsap.fromTo('.arrival .eyebrow,.arrival h2,.arrival-facts>span,.arrival .line-link',
    {y:60,autoAlpha:0,clipPath:'inset(100% 0 0 0)'},
    {y:0,autoAlpha:1,clipPath:'inset(0 0 0 0)',duration:.58,stagger:.045,ease:'power3.out',overwrite:true});
  };
  const completeForward=()=>{if(backwards)return;flying=false;finished=true;flight.progress=1;gsap.set('.film-window .shade',{opacity:0});orbit.pause();orbit.dataset.transitionState='complete';showArrival();
   unlockScroll();
   replay.textContent='Wróć do pierwszego kadru';replay.setAttribute('aria-label','Wróć do pierwszego kadru');};
  const completeReverse=()=>{
   if(!backwards)return;flying=false;finished=false;flight.progress=0;gsap.set('.film-window .shade',{opacity:1});reverseFilm.pause();unlockScroll();
   orbit.dataset.transitionState='ready';replay.textContent='Uruchom przelot';replay.setAttribute('aria-label','Uruchom przelot');
  };
  const playDirection=reverse=>{
   const film=reverse?reverseFilm:orbit;
   if(!initialized||flying||(reverse?!finished:finished)||film?.readyState<2)return false;
   backwards=reverse;activeFilm=film;flying=true;
   lockScroll();
   orbit.pause();reverseFilm.pause();film.currentTime=0;film.playbackRate=1;
   if(reverse){gsap.to('.arrival-gradient',{opacity:0,duration:.85,ease:'power2.inOut',overwrite:true});arrivalShown=false;arrivalTween?.kill();gsap.to('.arrival',{autoAlpha:0,y:20,duration:.45,ease:'power2.inOut',overwrite:true});}
   orbit.dataset.transitionState=reverse?'reversing':'playing';
   film.play().then(()=>{if(controller.signal.aborted)return;orbit.style.opacity=reverse?'0':'1';reverseFilm.style.opacity=reverse?'1':'0';gsap.to('.film-window .shade',{opacity:reverse?1:0,duration:reverse?1.4:1.8,ease:reverse?'power2.inOut':'power1.out',overwrite:true});})
    .catch(()=>{flying=false;unlockScroll();orbit.dataset.transitionState=finished?'complete':'ready';if(finished)showArrival();});
   return true;
  };
  const startFlight=()=>playDirection(false);
  const startReverse=()=>playDirection(true);
  if(orbit)trigger=ScrollTrigger.create({trigger:'.cinema',start:'top top',end:'+=1',pin:stage,invalidateOnRefresh:true,onUpdate:self=>{
   raw=self.progress;
   if(flying)return;
   if(self.isActive&&raw>.004&&self.direction>0&&!finished&&!flying)startFlight();
  },onEnterBack:()=>{if(finished&&!flying)startReverse();}});
  const inCinema=()=>trigger&&window.scrollY>=trigger.start-5&&window.scrollY<trigger.end;
  const wheel=e=>{if(!initialized&&inCinema()&&e.deltaY>0){e.preventDefault();return;}if(flying){e.preventDefault();return;}if(inCinema()&&((e.deltaY>0&&startFlight())||(e.deltaY<0&&startReverse())))e.preventDefault();};
  let touchY=0;
  const touchStart=e=>{touchY=e.touches[0]?.clientY||0;};
  const touchMove=e=>{const delta=touchY-(e.touches[0]?.clientY||0);if(flying||(inCinema()&&((delta>8&&startFlight())||(delta< -8&&startReverse()))))e.preventDefault();};
  const keyDown=e=>{
   if(e.target.closest('input,textarea,select,button,a,[contenteditable]'))return;
   const down=['ArrowDown','PageDown','End'].includes(e.key)||(e.key===' '&&!e.shiftKey);
   const up=['ArrowUp','PageUp','Home'].includes(e.key)||(e.key===' '&&e.shiftKey);
   if((down||up)&&(flying||(inCinema()&&(down?startFlight():startReverse()))))e.preventDefault();
  };
  if(orbit){window.addEventListener('wheel',wheel,{passive:false});window.addEventListener('touchstart',touchStart,{passive:true});window.addEventListener('touchmove',touchMove,{passive:false});window.addEventListener('keydown',keyDown);orbit.addEventListener('ended',completeForward);reverseFilm.addEventListener('ended',completeReverse);}
  function setup(){
   if(initialized||!Number.isFinite(orbit?.duration)||orbit.duration<=0)return;
   initialized=true;orbit.dataset.transitionState='ready';
   ticker=()=>{
    if(flying&&Number.isFinite(activeFilm.duration))flight.progress=backwards?1-clamp(activeFilm.currentTime/activeFilm.duration):clamp(activeFilm.currentTime/activeFilm.duration);
    // Reveal during the last 28% of the forward flight, before the camera stops.
    if(flying&&!backwards&&flight.progress>=.72)showArrival();
    // Fade the opening shade with actual playback; restore it when reversing.
    // Shade fades on playback start, independently of per-frame updates.
    const leaving=smooth(clamp(flight.progress/.16));
    gsap.set('.hero-panel',{y:-leaving*85,autoAlpha:1-leaving,clipPath:'inset(0 0 '+(leaving*100)+'% 0)'});
    gsap.set('.scene-label',{autoAlpha:1-leaving,y:-leaving*20});
    document.querySelector('.film-progress span').style.transform='scaleX('+flight.progress+')';
   };
   gsap.ticker.add(ticker);ScrollTrigger.refresh();
   if(window.scrollY>=trigger.end){finished=true;flight.progress=1;gsap.set('.film-window .shade',{opacity:0});orbit.currentTime=orbit.duration-.025;showArrival();}
   else if(trigger.isActive&&raw>.004)startFlight();
  }
  const replayFlight=()=>{if(flying)return;if(finished)startReverse();else startFlight();};
  replay?.addEventListener('click',replayFlight);orbit?.addEventListener('loadedmetadata',setup);if(orbit?.readyState>=1)setup();
  // Premium Web scroll-reveal 1.0.0, adapted for reversible entry and exit.
  const contentSelector='.intro-section>.eyebrow,.intro-grid h2,.intro-grid p,.summary-top>div,.summary-note,#standard>div>.eyebrow,#standard h2,.plot-heading>div,.plot-heading>p,.plot-figure,.plans-heading,.plan-image,.plans-section>.caption,.gallery-section>.eyebrow,.gallery-heading,.gallery,.gallery-section>.caption,.contact>.eyebrow,.contact h2,.form-heading,.form-footer';
  document.querySelectorAll(contentSelector).forEach(el=>{
   const tl=gsap.timeline({scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:.18,invalidateOnRefresh:true}});
   tl.fromTo(el,{opacity:0,y:24},{opacity:1,y:0,duration:.14,ease:'power2.out'})
    .to(el,{opacity:1,y:0,duration:.72,ease:'none'})
    .to(el,{opacity:0,y:-20,duration:.14,ease:'power2.in'});
  });
  // Individual elements enter in short sequences; whole containers stay visible.
  const entranceGroups=[['.summary-grid',':scope > div'],['#standard .accordions',':scope > details'],['.contact-grid',':scope > a'],['.form-fields',':scope > label'],['.plan-info','.plan-area,thead,tbody tr,.floor-note,.line-link'],['.plan-controls','button'],['.price-history','h3,p']];
  entranceGroups.forEach(([groupSelector,itemSelector])=>{
   document.querySelectorAll(groupSelector).forEach(group=>{
    const items=group.querySelectorAll(itemSelector);if(!items.length)return;
    gsap.fromTo(items,{opacity:0,y:22},{opacity:1,y:0,duration:.65,stagger:.085,ease:'power3.out',scrollTrigger:{trigger:group,start:'top 92%',toggleActions:'play reverse play reverse'},clearProps:'transform'});
   });
  });
  document.querySelectorAll('.editorial figure').forEach(el=>{
   gsap.fromTo(el,{y:24,opacity:0},{y:0,opacity:1,duration:.6,ease:'power2.inOut',scrollTrigger:{trigger:el,start:'top bottom',toggleActions:'play reverse play reverse'}});
   gsap.fromTo(el.querySelector('img'),{yPercent:-5,scale:1.1},{yPercent:5,scale:1.1,ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:.6}});
  });
  return()=>{unlockScroll();if(ticker)gsap.ticker.remove(ticker);trigger?.kill();arrivalTween?.kill();orbit?.removeEventListener('loadedmetadata',setup);replay?.removeEventListener('click',replayFlight);window.removeEventListener('wheel',wheel);window.removeEventListener('touchstart',touchStart);window.removeEventListener('touchmove',touchMove);window.removeEventListener('keydown',keyDown);orbit?.removeEventListener('ended',completeForward);reverseFilm?.removeEventListener('ended',completeReverse);controller.abort();orbit?.pause();reverseFilm?.pause();reverseFilm?.remove();objectUrls.forEach(URL.revokeObjectURL);if(orbit){orbit.style.opacity='';orbit.removeAttribute('src');orbit.load();}};
 });
 mm.add('(prefers-reduced-motion: reduce)',()=>{
  document.body.classList.add('is-reduced');orbit?.pause();
  gsap.set('.hero-panel,.stage,.arrival,.arrival-gradient,.film-window .shade',{clearProps:'all'});
 });
}
const floors={parter:{title:'Parter',area:'57,35 m²',rooms:[['Przedsionek','2,90'],['Komunikacja','8,80'],['Biblioteka','8,35'],['Aneks kuchenny','8,30'],['Pokój dzienny','25,80'],['Łazienka','3,20']],note:'Pokój dzienny i aneks kuchenny: 34,10 m². Umeblowanie według dokumentacji architektonicznej.'},poddasze:{title:'Poddasze',area:'48,75 m²',rooms:[['Schody','4,45'],['Komunikacja','4,85'],['Sypialnia główna','14,55'],['Łazienka','7,60'],['Pokój','12,00'],['Pokój','9,75']],note:'Schody: 4,45 m² powierzchni pomocniczej, poza sumą 48,75 m². Powierzchnie po podłodze: pokój 05 — 13,25 m², pokój 06 — 11,05 m², sypialnia główna — 17,40 m². W dokumentacji pomieszczenie 03 oznaczono jako pomieszczenie hobby; wizualizacja pokazuje przykładową aranżację sypialni.'}};let currentFloor='parter',floorView='3d';
function showFloor(key){
 const data=floors[key],img=document.getElementById('floor-image');if(!img)return;currentFloor=key;
 img.onload=()=>{img.onload=null;if(window.gsap&&!preference.matches)gsap.fromTo(img,{opacity:.15},{opacity:1,duration:.45,ease:'power2.out',overwrite:true});};
 img.src='assets/'+key+(floorView==='3d'?'-3d-aligned.svg?v=align23':'.svg');
 img.alt=(floorView==='3d'?'Wizualizacja 3D z góry ':'Uproszczony rzut ')+(key==='parter'?'parteru':'poddasza')+' lokalu 1 z umeblowaniem';
 document.getElementById('floor-title').textContent=data.title;document.getElementById('floor-area').textContent=data.area;document.getElementById('floor-note').textContent=data.note;
 document.getElementById('rooms-list').innerHTML=data.rooms.map((r,i)=>'<tr><td>'+String(i+1).padStart(2,'0')+'</td><td>'+r[0]+'</td><td>'+r[1]+'</td></tr>').join('');
 document.querySelectorAll('[data-floor]').forEach(b=>{const active=b.dataset.floor===key;b.setAttribute('aria-selected',active);b.tabIndex=active?0:-1});
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===floorView)));
 document.getElementById('plan-panel').setAttribute('aria-labelledby','tab-'+key);
}
document.querySelectorAll('[data-floor]').forEach((b,i)=>{
 b.addEventListener('click',()=>showFloor(b.dataset.floor));
 b.addEventListener('keydown',e=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();const keys=['parter','poddasze'];const index=e.key==='Home'?0:e.key==='End'?1:(i+1)%2;showFloor(keys[index]);document.getElementById('tab-'+keys[index]).focus();}});
});
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{floorView=b.dataset.view;showFloor(currentFloor);}));
if(document.getElementById('floor-image')){for(const key of ['parter','poddasze']){const preload=new Image();preload.src='assets/'+key+'-3d-aligned.svg?v=align23';}}
showFloor('parter');
let gi=0;const gallery=[["oferta-01.jpg", "Zdjęcie 1 z galerii oferty źródłowej — wcześniejsza realizacja"], ["oferta-02.jpg", "Zdjęcie 2 z galerii oferty źródłowej — wcześniejsza realizacja"], ["oferta-03.jpg", "Zdjęcie 3 z galerii oferty źródłowej — wcześniejsza realizacja"], ["oferta-04.jpg", "Zdjęcie 4 z galerii oferty źródłowej — wcześniejsza realizacja"], ["oferta-05.jpg", "Zdjęcie 5 z galerii oferty źródłowej — wcześniejsza realizacja"], ["oferta-06.jpg", "Zdjęcie 6 z galerii oferty źródłowej — wcześniejsza realizacja"], ["oferta-07.jpg", "Zdjęcie 7 z galerii oferty źródłowej — wcześniejsza realizacja"], ["oferta-08.jpg", "Zdjęcie 8 z galerii oferty źródłowej — wcześniejsza realizacja"], ["oferta-09.jpg", "Zdjęcie 9 z galerii oferty źródłowej — wcześniejsza realizacja"], ["oferta-10.jpg", "Zdjęcie 10 z galerii oferty źródłowej — wcześniejsza realizacja"], ["oferta-11.jpg", "Zdjęcie 11 z galerii oferty źródłowej — wcześniejsza realizacja"], ["oferta-12.jpg", "Zdjęcie 12 z galerii oferty źródłowej — wcześniejsza realizacja"], ["oferta-13.jpg", "Zdjęcie 13 z galerii oferty źródłowej — wcześniejsza realizacja"], ["oferta-14.jpg", "Zdjęcie 14 z galerii oferty źródłowej — wcześniejsza realizacja"], ["oferta-15.jpg", "Zdjęcie 15 z galerii oferty źródłowej — wcześniejsza realizacja"], ["oferta-16.jpg", "Zdjęcie 16 z galerii oferty źródłowej — wcześniejsza realizacja"], ["oferta-17.jpg", "Zdjęcie 17 z galerii oferty źródłowej — wcześniejsza realizacja"], ["oferta-18.jpg", "Zdjęcie 18 z galerii oferty źródłowej — wcześniejsza realizacja"], ["oferta-19.jpg", "Zdjęcie 19 z galerii oferty źródłowej — wcześniejsza realizacja"], ["oferta-20.jpg", "Zdjęcie 20 z galerii oferty źródłowej — wcześniejsza realizacja"]];function changeGallery(step){gi=(gi+step+gallery.length)%gallery.length;const img=document.getElementById('gallery-image');if(!img)return;img.src='assets/'+gallery[gi][0];img.alt=gallery[gi][1];document.getElementById('gallery-caption').textContent=gallery[gi][1];document.getElementById('gallery-count').textContent=String(gi+1).padStart(2,'0')+' / '+String(gallery.length).padStart(2,'0');if(window.gsap&&!preference.matches)gsap.fromTo(img,{opacity:.4},{opacity:1,duration:.5})}document.getElementById('gallery-prev')?.addEventListener('click',()=>changeGallery(-1));document.getElementById('gallery-next')?.addEventListener('click',()=>changeGallery(1));const contactForm=document.getElementById('contact-form');contactForm?.addEventListener('submit',event=>{event.preventDefault();if(!contactForm.reportValidity())return;const fields=new FormData(contactForm);const body=['Dzień dobry,','',String(fields.get('message')).trim(),'','Imię: '+String(fields.get('name')).trim(),'E-mail: '+String(fields.get('email')).trim(),fields.get('phone')?'Telefon: '+String(fields.get('phone')).trim():''].filter((line,index,all)=>line!==''||index<4).join('\n');const href='mailto:aleksandra@gekkohouse.pl?subject='+encodeURIComponent('Zapytanie o dom w Konarzewie')+'&body='+encodeURIComponent(body);window.location.href=href;document.getElementById('form-status').textContent='Wiadomość jest przygotowana w aplikacji pocztowej. Wyślij ją tam, aby dotarła do biura sprzedaży. Jeśli aplikacja się nie otworzyła, napisz na aleksandra@gekkohouse.pl.';});const plotMap=document.querySelector('.plot-map');const togglePlot=()=>{const active=plotMap.classList.toggle('is-focused');plotMap.setAttribute('aria-pressed',String(active));};plotMap?.addEventListener('click',togglePlot);plotMap?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();togglePlot();}});
const offerSection=document.getElementById('podsumowanie'),offerBar=document.querySelector('.sticky-offer');
if(offerSection&&offerBar){
 document.body.classList.add('has-sticky-offer');
 let offerFrame=0;
 const updateOfferBar=()=>{offerFrame=0;const visible=offerSection.getBoundingClientRect().bottom<=0;offerBar.classList.toggle('is-visible',visible);offerBar.inert=!visible;};
 const queueOfferBar=()=>{if(!offerFrame)offerFrame=requestAnimationFrame(updateOfferBar);};
 window.addEventListener('scroll',queueOfferBar,{passive:true});window.addEventListener('resize',queueOfferBar,{passive:true});window.addEventListener('load',queueOfferBar);new ResizeObserver(queueOfferBar).observe(offerSection);updateOfferBar();
}
})();