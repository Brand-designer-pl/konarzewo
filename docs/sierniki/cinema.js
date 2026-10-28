/* video-scrub, Premium Web 1.0.0: seek-friendly footage, poster and reduced-motion fallback. */
(()=>{
 'use strict';
 const section=document.querySelector('[data-sier-cinema]');
 if(!section||!window.gsap||!window.ScrollTrigger)return;
 const stage=section.querySelector('.brand-stage'),video=section.querySelector('video');
 const first=section.querySelector('.claim-one'),last=section.querySelector('.claim-two');
 gsap.registerPlugin(ScrollTrigger);
 const media=gsap.matchMedia();
 media.add('(prefers-reduced-motion: no-preference)',()=>{
  let progress=0,loaded=false,failed=false,disposed=false,timeout;
  const seek=()=>{
   if(disposed||failed||document.hidden||video.readyState<2||!Number.isFinite(video.duration)||video.seeking)return;
   const time=Math.min(video.duration-.04,Math.max(0,progress*video.duration));
   if(Math.abs(video.currentTime-time)>.015)video.currentTime=time;
   else if(progress>0)stage.classList.add('has-film-frame');
  };
  const fail=()=>{failed=true;clearTimeout(timeout);stage.classList.remove('has-film-frame');};
  const ready=()=>{clearTimeout(timeout);seek();};
  const sought=()=>{if(disposed||failed)return;if(progress>0)stage.classList.add('has-film-frame');seek();};
  const visibility=()=>{video.pause();if(!document.hidden)seek();};
  const load=()=>{
   if(loaded||failed)return;
   loaded=true;video.src=video.dataset.src;video.load();
   timeout=setTimeout(()=>{if(video.readyState<2)stage.classList.remove('has-film-frame');},12000);
  };
  video.addEventListener('loadeddata',ready);
  video.addEventListener('seeked',sought);
  video.addEventListener('error',fail);
  document.addEventListener('visibilitychange',visibility);
  gsap.fromTo(first.children,{y:25,opacity:0},{y:0,opacity:1,duration:.7,stagger:.07,ease:'power3.out'});
  const head={value:0};
  const timeline=gsap.timeline({scrollTrigger:{trigger:section,start:'top top',end:'+=80%',pin:stage,scrub:true,invalidateOnRefresh:true}});
  timeline.to(head,{value:1,duration:1,ease:'power1.inOut',onUpdate:()=>{
   progress=head.value;
   // Restore the exact original still when the visitor scrolls back to the beginning.
   if(progress>0){load();seek();}else stage.classList.remove('has-film-frame');
   first.inert=progress>.25;first.setAttribute('aria-hidden',String(progress>.25));
   last.inert=progress<.75;last.setAttribute('aria-hidden',String(progress<.75));
  }},0)
  .to(first,{autoAlpha:0,y:-25,duration:.16,ease:'power2.inOut'},.02)
  .fromTo(last,{autoAlpha:0,y:28},{autoAlpha:1,y:0,duration:.2,ease:'power2.inOut'},.64)
  .to(section.querySelector('.brand-shade'),{opacity:.58,duration:.35,ease:'power2.inOut'},.25);
  return ()=>{
   disposed=true;clearTimeout(timeout);timeline.scrollTrigger?.kill();timeline.kill();
   video.removeEventListener('loadeddata',ready);video.removeEventListener('seeked',sought);video.removeEventListener('error',fail);
   document.removeEventListener('visibilitychange',visibility);video.pause();
   stage.classList.remove('has-film-frame');video.removeAttribute('src');video.load();
   first.inert=false;first.removeAttribute('aria-hidden');last.inert=true;last.setAttribute('aria-hidden','true');
  };
 });
 addEventListener('pagehide',()=>video.pause());
})();
