// MyFit in-app reminder settings (works while app is open/in background; shows missed reminder on next open)
(function(){
  const KEY='myfit-reminder';
  const defaults={enabled:true,time:'18:00',lastShown:''};
  let cfg;
  try{cfg=Object.assign({},defaults,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){cfg={...defaults}}
  function saveCfg(){localStorage.setItem(KEY,JSON.stringify(cfg));}
  function ensureUI(){
    const plan=document.getElementById('plan'); if(!plan||document.getElementById('reminderCard')) return;
    const card=document.createElement('div'); card.id='reminderCard'; card.className='measureCard'; card.style.marginTop='16px';
    card.innerHTML=`<div class="sectionTitle" style="margin:0 0 12px"><h3>Напоминание</h3><span>внутри MyFit</span></div>
      <div class="field"><label>Время</label><input id="reminderTime" type="time" value="${cfg.time}"></div>
      <label style="display:flex;align-items:center;gap:10px;margin-top:12px"><input id="reminderEnabled" type="checkbox" ${cfg.enabled?'checked':''}> Напоминать мне заполнить MyFit</label>
      <button class="primary" id="notifyPermissionBtn">Разрешить уведомления</button>
      <div id="notifyStatus" style="font-size:12px;color:#7b747d;margin-top:8px"></div>`;
    plan.appendChild(card);
    reminderTime.onchange=e=>{cfg.time=e.target.value||'18:00';saveCfg();schedule()};
    reminderEnabled.onchange=e=>{cfg.enabled=e.target.checked;saveCfg();schedule()};
    notifyPermissionBtn.onclick=async()=>{
      if(!('Notification' in window)){notifyStatus.textContent='На этом устройстве системные уведомления недоступны.';return}
      try{const p=await Notification.requestPermission();notifyStatus.textContent=p==='granted'?'Уведомления разрешены ✓':'Уведомления не разрешены';}catch(e){notifyStatus.textContent='Не удалось запросить разрешение';}
    };
    if('Notification' in window) notifyStatus.textContent=Notification.permission==='granted'?'Уведомления разрешены ✓':'Нажми кнопку, чтобы разрешить уведомления';
  }
  function todayKey(){const d=new Date();return d.toISOString().slice(0,10)}
  function minutesNow(){const d=new Date();return d.getHours()*60+d.getMinutes()}
  function targetMinutes(){const [h,m]=(cfg.time||'18:00').split(':').map(Number);return h*60+m}
  function showReminder(){
    const day=todayKey(); if(cfg.lastShown===day) return;
    cfg.lastShown=day; saveCfg();
    const msg='Лисёнок, пора отметить активность и состояние в MyFit 😏';
    if(typeof showToast==='function') showToast(msg);
    let banner=document.getElementById('reminderBanner');
    if(!banner){banner=document.createElement('div');banner.id='reminderBanner';banner.style.cssText='position:fixed;left:14px;right:14px;top:calc(14px + env(safe-area-inset-top));z-index:50;background:#201d22;color:#fff;padding:14px 16px;border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,.2)';document.body.appendChild(banner)}
    banner.innerHTML=`<b>MyFit напоминает</b><div style="margin-top:4px">${msg}</div><button id="reminderDismiss" style="margin-top:10px;border:0;border-radius:10px;padding:7px 10px">Хорошо</button>`;
    reminderDismiss.onclick=()=>banner.remove();
    if('Notification' in window&&Notification.permission==='granted'){
      try{new Notification('MyFit 🍑',{body:'Пора отметить активность и заполнить чек-лист состояния.'})}catch(e){}
    }
  }
  let timer;
  function schedule(){clearInterval(timer);if(!cfg.enabled)return;timer=setInterval(()=>{if(minutesNow()>=targetMinutes())showReminder()},30000);if(minutesNow()>=targetMinutes())showReminder()}
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&cfg.enabled&&minutesNow()>=targetMinutes())showReminder()});
  const oldRender=window.render;
  if(typeof oldRender==='function') window.render=function(){oldRender();ensureUI()};
  ensureUI();schedule();
})();