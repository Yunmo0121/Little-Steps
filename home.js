/* Little Steps · Cozy Cottage home v1.2.3 — daytime only */
const HOME_VIEW_KEY='little-steps-home-view';

const HOME_COPY={
  outdoor:{
    title:'Outdoor Cottage Garden',
    quote:'“Every adventure begins with a little step.”',
    body:'A peaceful little garden to come back to after every adventure: roses, white fences, clover and warm sunlight.'
  },
  indoor:{
    title:'Indoor Loft',
    quote:'“Home is where little dreams grow.”',
    body:'Up the little staircase is a cozy bed; downstairs, a chair, a teapot and a quiet moment to dream of new journeys.'
  }
};

function homeStarCount(){
  let count=0;
  if(typeof progress !== 'undefined' && progress?.stars){
    for(let chapter=2;chapter<=5;chapter++){
      const stars=progress.stars[chapter];
      if(Array.isArray(stars))count+=new Set(stars.filter(s=>[1,2,3].includes(s))).size;
    }
  }
  return count;
}

function renderHomeBase(){
  const element=document.getElementById('homebase-stars');
  if(element)element.textContent=`${homeStarCount()} / 12`;
}

function setHomeView(view){
  const selected=view==='indoor'?'indoor':'outdoor';
  const shell=document.querySelector('.cozy-home-shell');
  if(!shell)return;
  shell.dataset.homeTime='day';
  shell.dataset.homeView=selected;
  document.body.dataset.gardenTime='day';

  document.querySelectorAll('[data-home-view-button]').forEach(button=>{
    const active=button.dataset.homeViewButton===selected;
    button.classList.toggle('is-active',active);
    button.setAttribute('aria-selected',String(active));
  });
  document.querySelectorAll('[data-home-panel]').forEach(panel=>{
    const active=panel.dataset.homePanel===selected;
    panel.hidden=!active;
    panel.classList.toggle('is-active',active);
  });

  const details=HOME_COPY[selected];
  for(const [id,content] of [
    ['home-note-title',details.title],
    ['home-note-quote',details.quote],
    ['home-note-body',details.body]
  ]){
    const target=document.getElementById(id);
    if(target)target.textContent=content;
  }
  try{localStorage.setItem(HOME_VIEW_KEY,selected)}catch(_){/* private mode */}
}

function initHomeBase(){
  document.body.dataset.gardenTime='day';
  let initialView='outdoor';
  try{initialView=localStorage.getItem(HOME_VIEW_KEY)||'outdoor'}catch(_){/* no storage */}
  setHomeView(initialView);
  renderHomeBase();

  document.querySelectorAll('[data-home-view-button]').forEach(button=>{
    button.addEventListener('click',()=>setHomeView(button.dataset.homeViewButton));
    button.addEventListener('keydown',event=>{
      if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
      event.preventDefault();
      const next=button.dataset.homeViewButton==='outdoor'?'indoor':'outdoor';
      setHomeView(next);
      document.querySelector(`[data-home-view-button="${next}"]`)?.focus();
    });
  });
  document.getElementById('corner-visit-home')?.addEventListener('click',()=>{
    if(typeof showScreen==='function')showScreen('homebase');
  });
  document.getElementById('home-back')?.addEventListener('click',()=>{
    if(typeof showScreen==='function')showScreen('menu');
  });
  document.getElementById('home-visit-chapters')?.addEventListener('click',()=>{
    if(typeof showScreen==='function')showScreen('chapters');
  });
  document.getElementById('home-open-roadmap')?.addEventListener('click',()=>{
    if(typeof showScreen==='function')showScreen('diary');
  });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initHomeBase,{once:true});
else initHomeBase();
