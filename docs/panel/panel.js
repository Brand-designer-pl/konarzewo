(()=>{'use strict';let csrf='',offers=[];const $=s=>document.querySelector(s);const labels={available:'Dostępny',reserved:'Zarezerwowany',sold:'Sprzedany',pending:'Do potwierdzenia'};const money=n=>n===null?'Cena do potwierdzenia':new Intl.NumberFormat('pl-PL',{maximumFractionDigits:0}).format(n)+' zł';const message=t=>{$('#message').textContent=t};
async function api(path,options={}){const response=await fetch('../api/'+path,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json','X-CSRF-Token':csrf,...options.headers}});let result;try{result=await response.json()}catch{throw Error('Panel nie jest jeszcze podłączony do usługi zapisu. Wersja GitHub Pages wymaga uruchomienia serwera panelu.')}if(!response.ok){if(response.status===401&&path!=='login')showLogin();throw Error(result.error||'Nie udało się zapisać zmian.')}return result;}
function setProfile(user){const name=user?.name||'Administrator';$('#profile-name').textContent=name;$('#profile-name').title=user?.email||'';$('#profile-avatar').textContent=name.split(/\s+/).map(s=>s[0]).slice(0,2).join('').toUpperCase();}
function showLogin(){document.body.classList.remove('authenticated');$('#login').hidden=false;$('#dashboard').hidden=true;$('#logout').hidden=true;csrf='';offers=[];$('#offers').replaceChildren();}
const investmentImages = new Map([
 ['Mosina', '../mosina/assets/oferta-front.jpg'],
 ['Sierniki', '../sierniki/assets/oferta-01.webp'],
 ['Konarzewo', '../assets/start.webp'],
 ['Kamionki', '../kamionki/assets/oferta-04.jpg'],
]);
const existingRoutes = new Map([
 ['Mosina', '#investment-mosina'],
 ['Sierniki', '#investment-sierniki'],
 ['Konarzewo', '#investment-konarzewo'],
 ['Kamionki', '#investment-kamionki'],
]);
function investmentRoute(name){
 return existingRoutes.get(name) ?? '#investment/name/'+encodeURIComponent(name);
}
function investmentImage(image,name){
 const photo=investmentImages.get(name);
 image.src=photo ?? '../assets/mario-bud-logo.svg';
 image.alt=photo?'Inwestycja '+name:'';
 if(!photo)image.style.objectFit='contain';
}
function renderInvestmentNav(investments){
 const nav=$('.sidebar nav');
 nav.querySelectorAll('.investment-nav').forEach(link=>link.remove());
 for(const [name,units] of investments){
  const link=document.createElement('a');
  link.className='investment-nav';
  link.href=investmentRoute(name);
  const count=document.createElement('span');
  count.textContent=String(units.length).padStart(2,'0');
  link.append(document.createTextNode(name+' '),count);
  nav.append(link);
 }
}
function renderInvestments(root,investments){const grid=document.createElement('div');grid.className='admin-investment-grid';root.append(grid);for(const [name,units] of investments){const card=document.createElement('a');card.className='admin-investment-card';card.href=investmentRoute(name);card.innerHTML='<div class="investment-photo"><img width="800" height="500" alt=""><span class="investment-count"></span></div><div class="investment-copy"><p class="eyebrow">INWESTYCJA MARIO-BUD</p><div class="investment-name"><h2></h2><span aria-hidden="true">↗</span></div><p class="investment-availability"></p><div class="investment-card-bottom"><strong></strong><span>Zarządzaj lokalami →</span></div></div>';const img=card.querySelector('img');investmentImage(img,name);img.decoding='async';card.querySelector('h2').textContent=name;card.querySelector('.investment-count').textContent=units.length===1?'1 lokal':units.length+' lokale';card.querySelector('.investment-availability').textContent=Object.entries(labels).map(([status,label])=>label+': '+units.filter(o=>o.status===status).length).join(' · ');const prices=units.map(o=>o.price).filter(Number.isFinite);card.querySelector('strong').textContent=prices.length?'od '+money(Math.min(...prices)):'Cena do potwierdzenia';grid.append(card);}}
function unitMiniature(offer){const bounds={a1:[5.3,24.1],a2:[24.1,45.8],b1:[45.8,64.3],b2:[64.3,85.8]};if(offer.investment!=='Konarzewo'||!bounds[offer.id])return null;const [left,right]=bounds[offer.id];const figure=document.createElement('figure');figure.className='unit-miniature';const map=document.createElement('div');map.className='unit-mini-map';map.setAttribute('role','img');map.setAttribute('aria-label','Widok Konarzewa z góry. Kolorem zaznaczono budynek i działkę lokalu '+offer.name.replace(/^Lokal /,'')+'.');map.style.setProperty('--mini-clip',`polygon(${left}% 15.6%,${right}% 15.6%,${right}% 77.8%,${left}% 77.8%)`);map.innerHTML='<img class="mini-clay" src="../konarzewo/assets/osiedle-clay.webp" width="1672" height="941" alt="" loading="lazy" decoding="async"><img class="mini-color" src="../konarzewo/assets/osiedle-color.webp" width="1672" height="941" alt="" loading="lazy" decoding="async">';for(const [id,range] of Object.entries(bounds)){const pin=document.createElement('span');pin.className='mini-unit-label'+(id===offer.id?' is-selected':'');pin.textContent=offers.find(o=>o.id===id)?.name.replace(/^Lokal /,'')||id.toUpperCase();pin.setAttribute('aria-hidden','true');pin.style.left=((range[0]+range[1])/2*1.12972973)+'%';map.append(pin);}const caption=document.createElement('figcaption');caption.textContent='Lokal '+offer.name.replace(/^Lokal /,'')+' · budynek '+offer.id[0].toUpperCase()+' · '+(offer.id.endsWith('1')?'lewa':'prawa')+' część';figure.append(map,caption);return figure;}
function render(){
 const investments=new Map();
 for(const offer of offers){
  if(!investments.has(offer.investment))investments.set(offer.investment,[]);
  investments.get(offer.investment).push(offer);
 }
 renderInvestmentNav(investments);
 const root=$('#offers');root.replaceChildren();
 const selected=[...investments.keys()].find(name=>location.hash===investmentRoute(name));
 const visible=investments.get(selected)??offers;
 $('#dashboard-title').textContent=selected||'Twoje inwestycje';$('#dashboard-description').textContent=selected?'Ceny i dostępność lokali w wybranej inwestycji.':'Wybierz lokalizację, aby zarządzać jej ofertą.';$('#units-heading').hidden=!selected;const context=$('#investment-context');context.replaceChildren();document.querySelectorAll('.sidebar nav a').forEach(a=>{const active=selected?a.hash===investmentRoute(selected):a.hash==='#dashboard';a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});if(selected){const back=document.createElement('a');back.className='back-investments';back.href='#dashboard';back.textContent='← Wszystkie inwestycje';context.append(back);const banner=document.createElement('div');banner.className='selected-investment';const image=document.createElement('img');investmentImage(image,selected);image.width=180;image.height=100;const copy=document.createElement('div');const label=document.createElement('p');label.className='eyebrow';label.textContent='WYBRANA LOKALIZACJA';const name=document.createElement('h2');name.textContent=selected;const count=document.createElement('p');count.textContent=visible.length===1?'1 lokal w inwestycji':visible.length+' lokale w inwestycji';copy.append(label,name,count);banner.append(image,copy);context.append(banner);}$('#stats').replaceChildren();for(const [status,label] of Object.entries(labels)){const div=document.createElement('div');div.className='stat';const strong=document.createElement('strong');strong.textContent=visible.filter(o=>o.status===status).length;div.append(strong,document.createTextNode(label));$('#stats').append(div)}
if(!selected){renderInvestments(root,investments);return;}const grid=document.createElement('div');grid.className='offer-grid';root.append(grid);for(const offer of visible){const form=document.createElement('form');form.className='offer';form.innerHTML='<div class="offer-top"><h3></h3><span class="badge"></span></div><p class="metrics"></p><div class="fields"><label>Cena lokalu (zł)<input name="price" type="number" min="1" max="100000000" step="1" required></label><label>Status<select name="status"><option value="available">Dostępny</option><option value="reserved">Zarezerwowany</option><option value="sold">Sprzedany</option></select></label></div><div class="save-row"><small class="per-meter"></small><button type="submit">Zapisz zmiany</button></div><details><summary>Historia zmian ceny</summary><ul></ul><p>Historia obejmuje zmiany zapisane w tym panelu.</p></details>';
const miniature=unitMiniature(offer);if(miniature)form.prepend(miniature);form.querySelector('h3').textContent=offer.name;const badge=form.querySelector('.badge');badge.textContent=labels[offer.status];badge.classList.add(offer.status);const metrics=[offer.area==null?'Metraż do potwierdzenia':offer.area.toLocaleString('pl-PL')+' m²'+(offer.areaConfirmationPending?' (do potwierdzenia)':'')];
if(offer.plot!=null)metrics.push('część działki '+(offer.plotApproximate?'ok. ':'')+offer.plot+' m²');
if(offer.address)metrics.push(offer.address);
if(offer.address&&offer.parcel)metrics.push('nr działki '+offer.parcel);
form.querySelector('.metrics').textContent=metrics.join(' · ');
if(offer.investment==='Mosina'||offer.discovered===true){
 form.elements.price.required=false;
 form.elements.status.add(new Option(labels.pending,'pending'));
}
form.elements.price.value=offer.price??'';
form.elements.status.value=offer.status;
form.querySelector('.per-meter').textContent=offer.price&&offer.area?new Intl.NumberFormat('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2}).format(offer.price/offer.area)+' zł / m²':'';
const history=form.querySelector('ul');if(!offer.history.length){const li=document.createElement('li');li.textContent='Brak zapisanych zmian ceny.';history.append(li)}for(const entry of [...offer.history].reverse()){const li=document.createElement('li');li.textContent=new Date(entry.at).toLocaleString('pl-PL')+' · '+money(entry.oldPrice)+' → '+money(entry.price);history.append(li)}
form.addEventListener('submit',async e=>{e.preventDefault();if(!form.reportValidity())return;const button=form.querySelector('button');button.disabled=true;try{const result=await api('offers/'+offer.id,{method:'PATCH',body:JSON.stringify({price:form.elements.price.valueAsNumber||null,status:form.elements.status.value,version:offer.version})});offers=offers.map(o=>o.id===offer.id?result.offer:o);render();message('Zapisano zmiany: '+offer.investment+' — '+offer.name+'.')}catch(error){message(error.message)}finally{button.disabled=false}});grid.append(form)}}
async function load(){offers=(await api('offers')).offers;document.body.classList.add('authenticated');$('#login').hidden=true;$('#dashboard').hidden=false;$('#logout').hidden=false;render();}
$('#login-form').addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget,button=form.querySelector('button');button.disabled=true;try{const session=await api('login',{method:'POST',body:JSON.stringify({email:form.elements.email.value,password:form.elements.password.value,remember:form.elements.remember.checked})});csrf=session.csrf;setProfile(session.user);form.elements.password.value='';await load();message('')}catch(error){message(error.message)}finally{button.disabled=false}});
$('#logout').addEventListener('click',async()=>{try{await api('logout',{method:'POST',body:'{}'});showLogin();message('Wylogowano.')}catch(error){message(error.message)}});
window.addEventListener('hashchange',()=>{if($('#dashboard').hidden)return;message('');render();window.scrollTo(0,0);$('#dashboard-title').focus({preventScroll:true});});
(async()=>{try{const session=await api('session');csrf=session.csrf;setProfile(session.user);await load()}catch(error){if(!error.message.includes('Zaloguj się'))message(error.message)}})();})();
