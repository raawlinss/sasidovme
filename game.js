// Elements
const img = document.getElementById('characterImg');
const messageEl = document.getElementById('message');
const splat = document.getElementById('splat');
const hitOverlay = document.getElementById('hitOverlay');

// Sounds
const punchSound = document.getElementById('punch-sound');
const slapSound = document.getElementById('slap-sound');
const kickSound = document.getElementById('kick-sound');
const tomatoSound = document.getElementById('tomato-sound');

const CHARACTER_IMAGE_URL = 'https://i.pinimg.com/originals/a7/dd/e4/a7dde433e390cf3e0fc83703b3376b3b.gif';
function getParamSafe(name){
  try{
    const q = new URLSearchParams(location.search);
    const h = new URLSearchParams((location.hash||'').replace(/^#/, ''));
    const b64 = q.get(name+'64') || h.get(name+'64');
    if(b64){ try{ return atob(b64); }catch(_e){} }
    const v = q.get(name) || h.get(name) || localStorage.getItem('cfg_'+name);
    return v || '';
  }catch(_e){ return ''; }
}
function getImageUrl(){
  const urlParam = getParamSafe('img') || CHARACTER_IMAGE_URL;
  return urlParam || '';
}
img.src = getImageUrl() || 'https://i.pinimg.com/736x/4c/39/e1/4c39e1ca04b33004395c13b2247e33f3.jpg';

// Optional per-action external audio links (leave empty to disable)
// You can also pass them via URL/hash/localStorage. For raw URLs with '&', prefer base64 params: apunch64=BASE64(url)
const PUNCH_AUDIO_URL = 'https://www.dropbox.com/scl/fi/m4w7w4kz92a6cqnl47s16/punch-416719.mp3?rlkey=2p73uhu5fhcevdffhdrroedfz&st=aneov7k8&dl=0';
const SLAP_AUDIO_URL  = 'https://www.dropbox.com/scl/fi/2xgw7yd5arl48ix062fh5/cartoon-slap-2-189831.mp3?rlkey=fu79ieuwnd11ead0dmdi183av&st=8tgnyrmn&dl=0';
const KICK_AUDIO_URL  = '';
const TOMATO_AUDIO_URL= 'https://www.dropbox.com/scl/fi/aqqv09g55dg2gg6qgi0dz/tomato-squishwet-103934.mp3?rlkey=7qsv6w65gpwdqfll84ddu579p&st=dka486q6&dl=0';
const AUTOPLAY_AUDIO_URL = 'https://www.dropbox.com/scl/fi/5ut9nvmy2j3aznjbmlv6m/oguz-sasi-yayinda-buyu-yapiyor-made-with-Voicemod.mp3?rlkey=5vphn50mvnsywuyeed9hay5ke&st=zh42dqnr&dl=0';
const AUTOPLAY_AUDIO_URL_2 = 'https://www.dropbox.com/scl/fi/bh0zzhz3758rb4hcrw01j/O-uz-Sasi-Mexicana-Paparayara-Official-Music.mp3?rlkey=zbh6n0410sswe9ppikhayyu1e&st=1g6vsdz7&dl=0';
const OVERRIDE = {
  punch: getParamSafe('apunch') || PUNCH_AUDIO_URL,
  slap:  getParamSafe('aslap')  || SLAP_AUDIO_URL,
  kick:  getParamSafe('akick')  || KICK_AUDIO_URL,
  tomato:getParamSafe('atomato')|| TOMATO_AUDIO_URL,
};

const customAudio = new Audio();
customAudio.preload = 'auto';
customAudio.crossOrigin = 'anonymous';
customAudio.onerror = () => showMessage('Ses yüklenemedi. Linki ve CORS izinlerini kontrol et.');

// Human voice channel (separate, can play together with SFX)
const humanAudio = new Audio();
humanAudio.preload = 'auto';
humanAudio.crossOrigin = 'anonymous';

// If true, play built-in hit SFX together with character voice. You can set to false to only play voice.
const USE_BUILTIN_SFX = true;

function stopAllAudio(){
  try{ punchSound.pause(); punchSound.currentTime = 0; }catch(e){}
  try{ slapSound.pause(); slapSound.currentTime = 0; }catch(e){}
  try{ kickSound.pause(); kickSound.currentTime = 0; }catch(e){}
  try{ tomatoSound.pause(); tomatoSound.currentTime = 0; }catch(e){}
  try{ customAudio.pause(); customAudio.currentTime = 0; }catch(e){}
  try{ humanAudio.pause(); humanAudio.currentTime = 0; }catch(e){}
}

// Public API used by buttons (max speed: SFX and Human start birlikte)
function performAction(type){
  switch(type){
    case 'punch':
      stopAllAudio();
      setRandomActionImage('punch');
      anim(img, 'smack');
      receiveHit();
      showMessage('Yumruk!');
      playSfxNow(OVERRIDE.punch, punchSound);
      playHuman('punch');
      break;
    case 'slap':
      stopAllAudio();
      setRandomActionImage('slap');
      anim(img, 'shake');
      receiveHit();
      showMessage('Tokat!');
      playSfxNow(OVERRIDE.slap, slapSound);
      playHuman('slap');
      break;
    case 'kick':
      stopAllAudio();
      setRandomActionImage('kick');
      anim(img, 'kick-anim');
      receiveHit();
      showMessage('Tekme!');
      playSfxNow(OVERRIDE.kick, kickSound);
      playHuman('kick');
      break;
    case 'tomato':
      stopAllAudio();
      setRandomActionImage('tomato');
      tomatoSplat();
      showMessage('Domates!');
      playSfxNow(OVERRIDE.tomato, tomatoSound);
      playHuman('tomato');
      break;
  }
}

// Helpers
function anim(el, cls){
  el.classList.remove(cls);
  // reflow
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(()=> el.classList.remove(cls), 350);
}

function play(audio){
  try{ audio.currentTime = 0; audio.play(); }catch(e){}
}

function playCustom(url){
  if(!url) return;
  try{
    customAudio.pause();
    customAudio.src = normalizeAudioUrl(url);
    customAudio.currentTime = 0;
    customAudio.play();
  }catch(e){}
}

// Human voices: arrays with random pick
const HUMAN_PUNCH_URLS  = 'https://www.dropbox.com/scl/fi/vs6yl69csu6jnbpd4nhsw/Tokat.mp3?rlkey=w61wj0kv6rtoij9oqlgmox37u&st=597jzraq&dl=0';
const HUMAN_SLAP_URLS   = 'https://www.dropbox.com/scl/fi/0064yh63xzljbikjqof5k/sasi-oyun.mp3?rlkey=99i1yp31kn0b7ey4fu8deioxs&st=gztpdp7n&dl=0';
const HUMAN_KICK_URLS   = 'https://www.dropbox.com/scl/fi/ytvshvcy3211majf8om8j/Tekme.mp3?rlkey=vq8a99z8usvtxdssrgwqp86lt&st=wlh7dpgu&dl=0';
const HUMAN_TOMATO_URLS = 'https://www.dropbox.com/scl/fi/e20bm7gpydpwky6li0l00/O-uz-Sasi-Blazing-Sails-ld-rma-Ve-Delirme-Anlar-AudioTrimmer.com.mp3?rlkey=2aj4cxj7huu5tzafrm8rjl61y&st=2wd29wye&dl=0';

// URL params allow comma-separated list: hpunch, hslap, hkick, htomato
function parseListParam(name){
  const raw = getParamSafe(name) || getParamSafe(name+'64');
  if(!raw) return [];
  const sep = raw.includes('|')? '|' : (raw.includes(';')? ';' : ',');
  return raw.split(sep).map(s => s.trim()).filter(Boolean);
}

function toList(v){
  if(Array.isArray(v)) return v;
  if(typeof v === 'string'){
    const s = v.trim();
    if(!s) return [];
    const sep = s.includes('|')? '|' : (s.includes(';')? ';' : ',');
    return s.split(sep).map(x=>x.trim()).filter(Boolean);
  }
  return [];
}

const HUMAN = {
  punch: [...toList(HUMAN_PUNCH_URLS), ...parseListParam('hpunch')],
  slap:  [...toList(HUMAN_SLAP_URLS),  ...parseListParam('hslap')],
  kick:  [...toList(HUMAN_KICK_URLS),  ...parseListParam('hkick')],
  tomato:[...toList(HUMAN_TOMATO_URLS),...parseListParam('htomato')],
};

function playHuman(action){
  const list = (HUMAN[action]||[]).map(normalizeAudioUrl).filter(Boolean);
  if(!list.length) return;
  // pick random
  const src = list[Math.floor(Math.random()*list.length)];
  try{
    humanAudio.pause();
    humanAudio.src = src;
    humanAudio.currentTime = 0;
    humanAudio.play();
  }catch(e){}
}

function normalizeAudioUrl(url){
  try{
    // Dropbox: convert share to direct
    if(url.includes('dropbox.com')){
      // www.dropbox.com/s/<id>/file?dl=0 -> dl.dropboxusercontent.com/s/<id>/file
      url = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
      url = url.replace(/\?dl=0$/, '')
               .replace(/\?raw=0$/, '')
               .replace(/\?$/, '');
    }
    // Google Drive: /file/d/<id>/view -> uc?export=download&id=<id>
    if(url.includes('drive.google.com')){
      const m = url.match(/\/file\/d\/([^/]+)/);
      if(m && m[1]){
        url = `https://drive.google.com/uc?export=download&id=${m[1]}`;
      }
    }
    // GitHub blob -> raw
    if(url.includes('github.com') && url.includes('/blob/')){
      url = url.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/blob/', '/');
    }
  }catch(_e){}
  return url;
}

function showMessage(s){
  messageEl.textContent = s;
}

function tomatoSplat(){
  const rect = img.getBoundingClientRect();
  // Random point around the face area
  const x = rect.left + rect.width*0.5 + (Math.random()-0.5)*rect.width*0.6;
  const y = rect.top + rect.height*0.35 + (Math.random()-0.5)*rect.height*0.4;

  const stageRect = document.querySelector('.arena').getBoundingClientRect();
  splat.style.left = (x - stageRect.left - 80) + 'px';
  splat.style.top = (y - stageRect.top - 80) + 'px';

  splat.classList.remove('show');
  void splat.offsetWidth;
  splat.classList.add('show');
  setTimeout(()=> splat.classList.remove('show'), 500);
}

function receiveHit(){
  // Flash red overlay
  hitOverlay.classList.remove('flash');
  void hitOverlay.offsetWidth;
  hitOverlay.classList.add('flash');
  // Spawn a few stars near the head
  const wrap = document.querySelector('.character-wrap');
  for(let i=0;i<3;i++){
    const star = document.createElement('div');
    star.className = 'star';
    star.textContent = '⭐';
    const dx = (Math.random()*140-70)+ 'px';
    const dy = (Math.random()*-120-20)+ 'px';
    star.style.setProperty('--dx', dx);
    star.style.setProperty('--dy', dy);
    star.style.left = 'calc(50% - 10px)';
    star.style.top = '20%';
    wrap.appendChild(star);
    setTimeout(()=> star.remove(), 650);
  }
}

// Expose for inline handlers
window.performAction = performAction;

// Fast playback helpers
function playSfxNow(url, builtinEl){
  if(url){
    try{ customAudio.pause(); customAudio.src = normalizeAudioUrl(url); customAudio.currentTime = 0; customAudio.play(); }catch(e){}
    return;
  }
  if(USE_BUILTIN_SFX && builtinEl){ play(builtinEl); }
}

// Per-action image pools (random)
const IMAGE_PUNCH_URLS  = 'https://i.hizliresim.com/9zh2ozm.gif';
const IMAGE_SLAP_URLS   = 'https://i.hizliresim.com/ssg601i.gif';
const IMAGE_KICK_URLS   = 'https://i.hizliresim.com/1vdsfzh.gif';
const IMAGE_TOMATO_URLS = 'https://i.hizliresim.com/rbbz2a6.gif';

function getImagePool(action){
  const map = {
    punch: [IMAGE_PUNCH_URLS,  getParamSafe('ipunch')],
    slap:  [IMAGE_SLAP_URLS,   getParamSafe('islap')],
    kick:  [IMAGE_KICK_URLS,   getParamSafe('ikick')],
    tomato:[IMAGE_TOMATO_URLS, getParamSafe('itomato')],
  };
  const list = [];
  for(const v of (map[action]||[])) list.push(...toList(v));
  return list.filter(Boolean);
}

function setRandomActionImage(action){
  const pool = getImagePool(action);
  if(!pool.length) return;
  const src = pool[Math.floor(Math.random()*pool.length)];
  try{ img.src = normalizeAudioUrl(src); }catch(e){}
}

// Start button: hide splash and play optional intro audio using user gesture
function bindStartButton(){
  const btn = document.getElementById('startBtn');
  const splash = document.getElementById('splash');
  if(!btn || !splash) return;
  let started = false;
  const onClick = () => {
    if(started) return;
    started = true;
    try{
      splash.style.pointerEvents = 'none';
      splash.style.opacity = '0';
      setTimeout(()=>{ try{ splash.remove(); }catch(_e){} }, 180);
    }catch(_e){}
    const url = getParamSafe('auto') || AUTOPLAY_AUDIO_URL;
    if(url){
      try{
        customAudio.pause();
        customAudio.src = normalizeAudioUrl(url);
        customAudio.currentTime = 0;
        customAudio.volume = 1;
        customAudio.play().catch(()=>{});
      }catch(_e){}
    }
    const url2 = getParamSafe('auto2') || AUTOPLAY_AUDIO_URL_2;
    if(url2){
      try{
        const a2 = new Audio();
        a2.preload = 'auto';
        a2.crossOrigin = 'anonymous';
        a2.src = normalizeAudioUrl(url2);
        a2.volume = 0.05;
        a2.play().catch(()=>{});
      }catch(_e){}
    }
  };
  btn.addEventListener('click', onClick, { once: true });
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bindStartButton);
}else{
  bindStartButton();
}
