(()=>{
 const image=document.getElementById('kam-plan-image');if(!image)return;
 const assets={'0':{'2d':'assets/parter-2d-aligned.webp','3d':'assets/parter-3d-corrected-aligned.webp'},'1':{'2d':'assets/pietro-2d-aligned.webp','3d':'assets/pietro-3d-aligned.webp'}};
 let floor='0',view='3d';
 const update=()=>{
  image.src=assets[floor][view];image.alt=(view==='3d'?'Wizualizacja 3D ':'Rzut 2D ')+(floor==='0'?'parteru':'piętra');
  document.getElementById('kam-floor-title').textContent=floor==='0'?'Parter':'Piętro bez skosów';
  const template=document.getElementById('kam-floor-'+floor),table=document.getElementById('kam-room-table');if(template&&table)table.innerHTML=template.innerHTML;
  document.querySelectorAll('[data-kam-floor]').forEach(button=>button.setAttribute('aria-pressed',String(button.getAttribute('data-kam-floor')===floor)));
  document.querySelectorAll('[data-kam-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.getAttribute('data-kam-view')===view)));
 };
 document.querySelectorAll('[data-kam-floor]').forEach(button=>button.addEventListener('click',()=>{floor=button.getAttribute('data-kam-floor');update();}));
 document.querySelectorAll('[data-kam-view]').forEach(button=>button.addEventListener('click',()=>{view=button.getAttribute('data-kam-view');update();}));

 update();
})();
