(() => {
  const KEY='myfit-state';
  const COOKIE='myfit-backup';

  function showSaved(ok=true){
    let el=document.getElementById('saveStatus');
    if(!el){
      el=document.createElement('div');
      el.id='saveStatus';
      Object.assign(el.style,{position:'fixed',right:'14px',top:'calc(10px + env(safe-area-inset-top))',zIndex:'50',padding:'8px 11px',borderRadius:'12px',fontSize:'12px',fontWeight:'700',background:ok?'#edf6f0':'#fff0f0',color:ok?'#2f6b4c':'#9a3b3b',boxShadow:'0 6px 22px rgba(0,0,0,.12)',opacity:'0',transition:'opacity .2s'});
      document.body.appendChild(el);
    }
    el.textContent=ok?'Сохранено ✓':'Не удалось сохранить';
    el.style.background=ok?'#edf6f0':'#fff0f0';
    el.style.color=ok?'#2f6b4c':'#9a3b3b';
    el.style.opacity='1';
    clearTimeout(showSaved.t);
    showSaved.t=setTimeout(()=>el.style.opacity='0',1600);
  }

  function openDB(){
    return new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)) return reject(new Error('no indexedDB'));
      const req=indexedDB.open('MyFitDB',1);
      req.onupgradeneeded=()=>{ if(!req.result.objectStoreNames.contains('kv')) req.result.createObjectStore('kv'); };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
  }
  async function idbPut(value){
    const db=await openDB();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction('kv','readwrite');
      tx.objectStore('kv').put(value,KEY);
      tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error);
    });
    db.close();
  }
  async function idbGet(){
    const db=await openDB();
    const value=await new Promise((resolve,reject)=>{
      const tx=db.transaction('kv','readonly');
      const req=tx.objectStore('kv').get(KEY);
      req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
    });
    db.close(); return value;
  }
  function cookieSet(value){
    try{
      const encoded=encodeURIComponent(value);
      if(encoded.length<3500) document.cookie=`${COOKIE}=${encoded}; Max-Age=31536000; Path=/; SameSite=Lax; Secure`;
    }catch(e){}
  }
  function cookieGet(){
    try{
      const p=document.cookie.split('; ').find(x=>x.startsWith(COOKIE+'='));
      return p?decodeURIComponent(p.slice(COOKIE.length+1)):null;
    }catch(e){ return null; }
  }
  async function persist(silent=false){
    let ok=false, payload='';
    try{
      payload=JSON.stringify(state);
      localStorage.setItem(KEY,payload);
      ok=localStorage.getItem(KEY)===payload;
    }catch(e){}
    cookieSet(payload);
    idbPut(payload).catch(()=>{});
    if(!silent) showSaved(ok || !!payload);
    return ok;
  }
  async function restoreIfNeeded(){
    let raw=null;
    try{ raw=localStorage.getItem(KEY); }catch(e){}
    if(!raw) raw=cookieGet();
    if(!raw){ try{ raw=await idbGet(); }catch(e){} }
    if(!raw) return;
    try{
      const restored=JSON.parse(raw);
      if(restored && typeof restored==='object'){
        state={done:{},workoutSets:{},measures:[],...restored};
        try{ localStorage.setItem(KEY,JSON.stringify(state)); }catch(e){}
        render();
      }
    }catch(e){}
  }

  const oldSave=save;
  save=function(){ persist(); render(); };
  toggleSet=function(ei,i){
    const k=todayKey+'|'+ei+'|'+i;
    state.workoutSets[k]=!state.workoutSets[k];
    persist();
    renderExercises();
  };

  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden') persist(true); });
  window.addEventListener('pagehide',()=>persist(true));
  window.addEventListener('beforeunload',()=>persist(true));
  restoreIfNeeded();
})();
