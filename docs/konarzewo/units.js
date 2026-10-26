(()=>{'use strict';
const bounds={a1:[5.3,24.1],a2:[24.1,45.8],b1:[45.8,64.3],b2:[64.3,85.8]};
const clip=id=>{const [l,r]=bounds[id];return `polygon(${l}% 15.6%,${r}% 15.6%,${r}% 77.8%,${l}% 77.8%)`};
document.querySelectorAll('[data-selected]').forEach(stage=>stage.style.setProperty('--unit-clip',clip(stage.dataset.selected)));
const stage=document.querySelector('[data-estate-interactive]');
if(stage){const pop=stage.querySelector('.estate-popover');let current=null,touchSelection=null;
const select=id=>{current=id;stage.style.setProperty('--unit-clip',clip(id));stage.style.setProperty('--popup-left',`${id[0]==='a'?49:14}%`);stage.classList.add('has-selection');pop.querySelector('.popover-title').textContent=`Lokal ${id.toUpperCase()}`;pop.querySelector('a').href=`lokal-${id}.html`;pop.hidden=false;};
const clear=()=>{current=null;stage.classList.remove('has-selection');pop.hidden=true;};
stage.querySelectorAll('.estate-hit').forEach(link=>{link.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')touchSelection=current});link.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')select(link.dataset.unit)});link.addEventListener('focus',()=>select(link.dataset.unit));link.addEventListener('click',e=>{if(matchMedia('(hover: none)').matches&&touchSelection!==link.dataset.unit){e.preventDefault();select(link.dataset.unit)}})});
stage.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch'&&!stage.contains(document.activeElement))clear()});stage.addEventListener('focusout',e=>{if(!stage.contains(e.relatedTarget))clear()});stage.addEventListener('keydown',e=>{if(e.key==='Escape')clear()});
}
const form=document.querySelector('.unit-overview #contact-form');form?.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const fields=new FormData(form);const body=['Zapytanie o inwestycję Konarzewo','',fields.get('message'),'','Imię: '+fields.get('name'),'E-mail: '+fields.get('email'),'Telefon: '+(fields.get('phone')||'')].join('\n');location.href='mailto:mario.orwat@gmail.com?subject='+encodeURIComponent('Mario-Bud — Konarzewo')+'&body='+encodeURIComponent(body);document.getElementById('form-status').textContent='Wyślij przygotowaną wiadomość w aplikacji pocztowej na mario.orwat@gmail.com.';});
})();
