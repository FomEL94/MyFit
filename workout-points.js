// MyFit workout scoring patch: each completed exercise contributes 1/6 of 50 workout points.
(function(){
  function exDone(date, ei){
    const e=exercises[ei];
    for(let i=0;i<e[3];i++) if(!state.workoutSets[date+'|'+ei+'|'+i]) return false;
    return true;
  }
  window.workoutPoints=function(date){
    const completed=exercises.reduce((n,e,ei)=>n+(exDone(date,ei)?1:0),0);
    return completed===exercises.length?50:Math.round(completed*50/exercises.length);
  };
  window.completedExercises=function(date){return exercises.reduce((n,e,ei)=>n+(exDone(date,ei)?1:0),0)};
  const oldDayPoints=window.dayPoints;
  window.dayPoints=function(d){
    if(!(d.getDay()>=1&&d.getDay()<=5)) return 0;
    const k=iso(d);
    const wp=workoutPoints(k);
    const walk=state.done[key(k,'walk')]?50:0;
    const stairs=state.done[key(k,'stairs')]?50:0;
    return Math.min(100,wp+walk+stairs);
  };
  const oldRenderExercises=window.renderExercises;
  window.renderExercises=function(){
    oldRenderExercises();
    const root=document.getElementById('exerciseList');
    if(!root)return;
    root.querySelectorAll('.exercise').forEach((box,ei)=>{
      const e=exercises[ei];
      const pts=Math.round(50/exercises.length);
      const note=document.createElement('div');
      note.style.cssText='font-size:12px;color:#7b747d;margin-top:8px';
      note.textContent=(exDone(todayKey,ei)?'✓ Выполнено · ':'')+'≈ '+pts+' баллов из тренировочных 50';
      box.appendChild(note);
    });
    let summary=document.getElementById('workoutScoreSummary');
    if(!summary){summary=document.createElement('div');summary.id='workoutScoreSummary';summary.style.cssText='background:#f7eef0;border-radius:16px;padding:12px 14px;margin:12px 0;font-weight:700';root.parentNode.insertBefore(summary,root)}
    const n=completedExercises(todayKey),p=workoutPoints(todayKey);
    summary.textContent='Выполнено упражнений: '+n+' из '+exercises.length+' · '+p+' / 50 баллов';
  };
  const oldToggleSet=window.toggleSet;
  window.toggleSet=function(ei,i){oldToggleSet(ei,i);state.done[key(todayKey,'workout')]=completedExercises(todayKey)===exercises.length;try{localStorage.setItem('myfit-state-v2',JSON.stringify(state));localStorage.setItem('myfit-state',JSON.stringify(state))}catch(e){}renderExercises();render()};
  window.finishWorkout=function(){
    state.done[key(todayKey,'workout')]=completedExercises(todayKey)===exercises.length;
    const p=workoutPoints(todayKey),n=completedExercises(todayKey);
    workoutDialog.close();
    showToast(n===exercises.length?'Все 6 упражнений — полные 50 баллов 🍑😏':'Сделано '+n+' из '+exercises.length+'. Забираешь '+p+' из 50 баллов — и это тоже считается.');
    persist();
  };
  const oldRender=window.render;
  window.render=function(){
    oldRender();
    if(today.getDay()>=1&&today.getDay()<=5){
      const task=[...document.querySelectorAll('#taskList .task')].find(x=>x.textContent.includes('Домашняя тренировка'));
      if(task){const sm=task.querySelector('small');if(sm)sm.textContent='6 упражнений · '+workoutPoints(todayKey)+' / 50 баллов · нажми, чтобы открыть';task.classList.toggle('done',completedExercises(todayKey)===exercises.length)}
    }
  };
  render();
})();