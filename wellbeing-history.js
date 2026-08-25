// Adds a dated wellbeing history without changing existing stored data.
(function(){
  const labels={energy:'Энергия',mood:'Настроение',sleep:'Сон',legs:'Ноги',pain:'Колени / поясница'};
  function ensureHistory(){
    const progress=document.getElementById('progress'); if(!progress||document.getElementById('wellbeingHistory'))return;
    const title=document.createElement('div'); title.className='sectionTitle'; title.innerHTML='<h3>Состояние</h3><span>динамика по дням</span>';
    const box=document.createElement('div'); box.id='wellbeingHistory'; box.className='measureCard';
    const measures=progress.querySelector('.sectionTitle'); progress.insertBefore(title,measures); progress.insertBefore(box,measures);
  }
  window.renderWellbeingHistory=function(){
    ensureHistory(); const box=document.getElementById('wellbeingHistory'); if(!box)return;
    const all=state.wellbeing||{};
    const dates=[...new Set(Object.keys(all).map(k=>k.split('|')[0]))].sort().reverse();
    if(!dates.length){box.innerHTML='<div style="color:#7b747d;font-size:13px">Пока записей нет. Заполни чек-лист сегодня — и здесь начнёт собираться твоя история.</div>';return;}
    box.innerHTML=dates.map(date=>{
      const vals=Object.entries(labels).map(([k,l])=>all[date+'|'+k]?'<div style="margin-top:5px"><b>'+l+':</b> '+all[date+'|'+k]+'</div>':'').join('');
      const d=new Date(date+'T12:00:00');
      return '<div class="historyItem" style="margin-bottom:8px"><b>'+d.toLocaleDateString('ru-RU',{weekday:'short',day:'numeric',month:'short'})+'</b>'+vals+'</div>';
    }).join('');
  };
  const oldRender=window.render;
  window.render=function(){oldRender();renderWellbeingHistory()};
  renderWellbeingHistory();
})();