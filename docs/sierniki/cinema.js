/* Two-second native playback in both directions; no scroll seeking or load-time autoplay. */
(()=>{
 'use strict';
 const section=document.querySelector('[data-sier-cinema]');
 if(!section||!window.gsap||!window.ScrollTrigger)return;
 const stage=section.querySelector('.brand-stage'),forward=section.querySelector('video');
 const first=section.querySelector('.claim-one'),last=section.querySelector('.claim-two');
 gsap.registerPlugin(ScrollTrigger);
 const media=gsap.matchMedia();
 media.add('(prefers-reduced-motion: no-preference)',()=>{
  const back=document.createElement('video');back.className='sier-film';back.muted=true;back.playsInline=true;back.preload='none';back.setAttribute('aria-hidden','true');forward.after(back);
  let active=forward,busy=false,finished=false,night=true,pending=null,loaded=false,failed=false,disposed=false,idle,timeout;
  const copy=gsap.timeline({paused:true});
  copy.to({value:0},{value:1,duration:2},0)
   .to(first,{autoAlpha:0,y:-25,duration:.25,ease:'power2.inOut'},.02)
   .fromTo(last,{autoAlpha:0,y:28},{autoAlpha:1,y:0,duration:.3,ease:'power2.inOut'},1.55)
   .to(section.querySelector('.brand-shade'),{opacity:.58,duration:.5,ease:'power2.inOut'},.5);
  const update=()=>{
   if(!busy||!Number.isFinite(active.duration))return;
   const p=Math.min(1,active.currentTime/active.duration),progress=night?p:1-p;
   copy.progress(progress);first.inert=progress>.25;first.setAttribute('aria-hidden',String(progress>.25));last.inert=progress<.75;last.setAttribute('aria-hidden',String(progress<.75));
  };
  const complete=e=>{
   if(!busy||e.currentTarget!==active)return;
   active.pause();gsap.ticker.remove(update);copy.progress(night?1:0);busy=false;finished=night;section.dataset.cinemaState=night?'night':'day';
   first.inert=night;first.setAttribute('aria-hidden',String(night));last.inert=!night;last.setAttribute('aria-hidden',String(!night));
   if(!night){forward.style.opacity='0';back.style.opacity='0';stage.classList.remove('has-film-frame');}
  };
  const fail=()=>{
   failed=true;busy=false;finished=false;pending=null;clearTimeout(timeout);gsap.ticker.remove(update);forward.pause();back.pause();copy.progress(0);
   forward.style.opacity='0';back.style.opacity='0';stage.classList.remove('has-film-frame');section.dataset.cinemaState='day';first.inert=false;first.removeAttribute('aria-hidden');last.inert=true;last.setAttribute('aria-hidden','true');
  };
  const play=toNight=>{
   if(disposed||failed||busy||toNight===finished)return;
   active=toNight?forward:back;
   if(document.hidden||active.readyState<2){pending=toNight;load();return;}
   pending=null;night=toNight;busy=true;active.currentTime=0;
   active.play().then(()=>{
    if(disposed||failed){active.pause();return;}
    forward.style.opacity=night?'1':'0';back.style.opacity=night?'0':'1';stage.classList.add('has-film-frame');section.dataset.cinemaState=night?'playing-night':'playing-day';gsap.ticker.add(update);
   }).catch(fail);
  };
  const ready=()=>{if(forward.readyState>=2&&back.readyState>=2)clearTimeout(timeout);if(pending!==null)play(pending);};
  const load=()=>{
   if(loaded||failed||disposed)return;
   loaded=true;forward.preload='auto';back.preload='auto';forward.src=forward.dataset.src;back.src='assets/dzien-noc-back.mp4?v=two-seconds30';forward.load();back.load();
   timeout=setTimeout(()=>{if(pending!==null)fail();},12000);
  };
  const visibility=()=>{
   if(document.hidden){active.pause();gsap.ticker.remove(update);}
   else if(busy){active.play().then(()=>gsap.ticker.add(update)).catch(fail);}
   else if(pending!==null)play(pending);
  };
  for(const video of [forward,back]){video.addEventListener('loadeddata',ready);video.addEventListener('error',fail);video.addEventListener('ended',complete);}
  document.addEventListener('visibilitychange',visibility);
  const pin=ScrollTrigger.create({trigger:section,start:'top top',end:'+=1',pin:stage,invalidateOnRefresh:true,onEnterBack:()=>{if(finished)play(false);}});
  const atHero=()=>window.scrollY>=pin.start-3&&window.scrollY<=pin.end+3;
  const navigate=delta=>{if(failed||disposed||!atHero())return false;if(busy)return true;if(delta>0&&!finished){play(true);return true;}if(delta<0&&finished){play(false);return true;}return pending!==null;};
  const wheel=e=>{if(e.isTrusted&&Math.abs(e.deltaY)>2&&navigate(e.deltaY))e.preventDefault();};
  let touchY=0;
  const touchStart=e=>{touchY=e.touches[0].clientY;};
  const touchMove=e=>{const delta=touchY-e.touches[0].clientY;if(Math.abs(delta)>8&&navigate(delta))e.preventDefault();};
  const key=e=>{if(e.target.closest('input,textarea,select,button,a,[contenteditable]'))return;const down=['ArrowDown','PageDown'].includes(e.key)||(e.key===' '&&!e.shiftKey),up=['ArrowUp','PageUp'].includes(e.key)||(e.key===' '&&e.shiftKey);if((down||up)&&navigate(down?1:-1))e.preventDefault();};
  addEventListener('wheel',wheel,{passive:false});addEventListener('touchstart',touchStart,{passive:true});addEventListener('touchmove',touchMove,{passive:false});addEventListener('keydown',key);
  section.dataset.cinemaState='day';
  if(window.requestIdleCallback)idle=requestIdleCallback(load,{timeout:1500});else idle=setTimeout(load,1000);
  return ()=>{
   disposed=true;clearTimeout(timeout);if(window.cancelIdleCallback)cancelIdleCallback(idle);else clearTimeout(idle);pin.kill();gsap.ticker.remove(update);copy.kill();forward.pause();back.pause();
   removeEventListener('wheel',wheel);removeEventListener('touchstart',touchStart);removeEventListener('touchmove',touchMove);removeEventListener('keydown',key);
   for(const video of [forward,back]){video.removeEventListener('loadeddata',ready);video.removeEventListener('error',fail);video.removeEventListener('ended',complete);}document.removeEventListener('visibilitychange',visibility);
   stage.classList.remove('has-film-frame');forward.style.removeProperty('opacity');forward.removeAttribute('src');forward.load();back.remove();first.inert=false;first.removeAttribute('aria-hidden');last.inert=true;last.setAttribute('aria-hidden','true');delete section.dataset.cinemaState;
  };
 });
})();
