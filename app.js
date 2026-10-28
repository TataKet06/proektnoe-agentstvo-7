import {CASE,MISSIONS,GLOSSARY,FIELD_LABELS} from './content.js';
import {STORAGE_KEY,initialState,hydrate,escapeHTML as e,isCorrect,hasAnswer,isUnlocked,canComplete,markAnswer,completeMission,xp,nextMission,nextTask,fieldOwner} from './engine.js';

const app=document.querySelector('#app');
let state=load();
const drafts={};
const feedback={};
let route={view:'route'};
let saveNotice=false;

const paths={
 book:'<path d="M4 5h6a4 4 0 0 1 4 4v11H8a4 4 0 0 1-4-4V5Z"/><path d="M14 8a3 3 0 0 1 3-3h4v11a4 4 0 0 1-4 4h-3"/>',
 route:'<circle cx="6" cy="5" r="2"/><circle cx="18" cy="19" r="2"/><path d="M8 5h8a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h8"/>',
 passport:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
 guide:'<path d="M4 4h6a4 4 0 0 1 4 4v13a4 4 0 0 0-4-3H4V4Z"/><path d="M14 8a4 4 0 0 1 4-4h3v14h-3a4 4 0 0 0-4 3"/>',
 teacher:'<path d="m3 8 9-5 9 5-9 5-9-5Z"/><path d="M7 11v5c3 3 7 3 10 0v-5M21 8v7"/>',
 radar:'<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6 6M7 8a6 6 0 0 0 0 8M9 10a3 3 0 0 0 0 4"/>',
 focus:'<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/><circle cx="12" cy="12" r="4"/>',
 compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-3 6-5 2 2-6 6-2Z"/>',
 branch:'<path d="M12 21V9M12 12 5 5M12 12l7-7M5 10V5h5M14 5h5v5"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 11h18m-13 4h2m4 0h2"/>',
 shield:'<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z"/><path d="m8 12 3 3 5-6"/>',
 checklist:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v4H9V3Zm-1 9 1 1 2-2m2 1h3m-8 5 1 1 2-2m2 1h3"/>',
 mic:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11v2a7 7 0 0 0 14 0v-2M12 20v2m-4 0h8"/>',
 arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
 back:'<path d="M20 12H5m6-6-6 6 6 6"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
 star:'<path d="m12 3 3 6 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1 3-6Z"/>',
 light:'<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 3H9c0-1 0-2-1-3Z"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',
 down:'<path d="m6 9 6 6 6-6"/>',
 up:'<path d="m6 15 6-6 6 6"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
 print:'<path d="M7 7V3h10v4M7 17H4V9h16v8h-3M7 14h10v7H7v-7Z"/>',
 copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
 spark:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/>',
 reset:'<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
};
const icon=(name,cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.spark}</svg>`;
const btn=(action,text,options={})=>`<button type="button" class="btn ${options.class||''}" data-action="${action}" ${options.attrs||''}>${options.icon?icon(options.icon):''}<span>${text}</span>${options.arrow?icon('arrow'):''}</button>`;
const navItems=[['route','route','Маршрут'],['passport','passport','Мой проект'],['guide','guide','Справочник'],['teacher','teacher','Учителю']];
const done=()=>state.completed.length;
const teamName=()=>state.team.trim()||'Команда 7 класса';
function load(){try{return hydrate(JSON.parse(localStorage.getItem(STORAGE_KEY)));}catch{return initialState();}}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}catch{if(!saveNotice){saveNotice=true;toast('Браузер не сохранил прогресс. Скачайте паспорт перед закрытием.');}return false;}}
function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('visible'),4000);}
function navigate(view,id,step=0){const hash=view==='mission'?`#mission/${id}/${step}`:`#${view}`;if(location.hash===hash){render();window.scrollTo({top:0,behavior:'instant'});}else location.hash=hash;}
function readRoute(){
  const [view,id,step]=location.hash.replace(/^#/,'').split('/');
  if(view==='mission'){
    const mid=Number(id),st=Number(step||0);
    if(mid>=1&&mid<=8&&Number.isInteger(mid)&&Number.isInteger(st)&&st>=0&&st<=3){
      if(!isUnlocked(state,mid))return {view:'locked',id:mid};
      const first=nextTask(state,mid);
      return {view:'mission',id:mid,step:Math.min(st,first)};
    }
  }
  return {view:['route','passport','guide','teacher'].includes(view)?view:'route'};
}
function shell(content){
  const active=route.view==='mission'||route.view==='locked'?'route':route.view;
  const nav=navItems.map(([view,ic,text])=>`<a class="nav-item ${view===active?'active':''}" href="#${view}" ${view===active?'aria-current="page"':''}>${icon(ic)}<span>${text}</span></a>`).join('');
  return `<aside class="sidebar"><a class="brand" href="#route"><img src="./icon.svg" alt="" width="43" height="43"><span>Проектное<br>агентство<small>УЧЕБНЫЙ КВЕСТ · 7 КЛАСС</small></span></a><nav aria-label="Основная навигация">${nav}</nav><div class="sidebar-bottom"><div class="small-label">ВАШЕ ДЕЛО</div><p>Школьный<br>книжный обмен</p><div class="sidebar-progress"><span style="width:${done()/8*100}%"></span></div><span class="muted">${done()} из 8 миссий пройдено</span><div class="save-message">${icon('check')} Прогресс сохраняется<br>в этом браузере</div></div></aside>
  <div class="main-wrap"><header class="topbar"><a class="mobile-brand" href="#route"><img src="./icon.svg" alt="" width="34" height="34"><span>Проектное агентство</span></a><span class="topbar-label">7 класс <span> / </span> Проектная деятельность</span><span class="xp-chip">${icon('spark')}<b>${xp(state)}</b> опыт</span></header><main id="main" tabindex="-1">${content}</main><footer class="app-footer">Учебная версия · Школьный книжный обмен</footer></div><nav class="mobile-nav" aria-label="Навигация на телефоне">${nav}</nav>`;
}
function home(){
  const current=nextMission(state);const complete=done()===8;
  return `<section class="hero"><div class="hero-copy"><span class="eyebrow"><span class="status-dot"></span> ДЕЛО № 07 · ШКОЛЬНАЯ БИБЛИОТЕКА</span><h1 id="screen-title" tabindex="-1">У хороших идей<br>есть <em>план.</em></h1><p class="hero-text">Откройте проектное агентство. Пройдите восемь миссий и превратите школьный книжный обмен в понятный проект.</p><div class="hero-tags"><span>${icon('clock')}35–40 минут</span><span>${icon('route')}8 миссий</span><span>${icon('passport')}1 паспорт проекта</span></div><div class="hero-actions">${btn(complete?'passport':'start',complete?'Открыть мой проект':state.startedAt?'Продолжить квест':'Принять заказ',{class:'primary',arrow:true})}<span class="hero-small">${complete?'Маршрут пройден. Паспорт можно сохранить.':state.startedAt?`Следующая остановка: «${e(MISSIONS[current-1].title)}»`:'Можно играть одному или командой из 2–3 человек.'}</span></div></div><div class="dossier"><div class="dossier-top"><span>КАРТОЧКА ЗАКАЗА</span>${icon('book')}</div><div class="dossier-stamp">БИБЛИОТЕКА<br><b>× 7 КЛАСС</b></div><h2>${CASE.title}</h2><p>${CASE.brief}</p><div class="dossier-lines"><div><span>Для кого</span><b>Семиклассники</b></div><div><span>Срок проекта</span><b>4 учебные недели</b></div><div><span>Результат</span><b>Пробный обмен книгами</b></div></div><span class="dossier-note">Сначала — замысел. Затем — реальные действия.</span></div></section>
  <section class="team-strip" aria-label="Ваша команда"><div class="team-icon">${icon('teacher')}</div><div><label for="team-name">Как называется ваша команда?</label><p>Название попадёт в паспорт проекта.</p></div><input id="team-name" maxlength="60" placeholder="Например, «Книжный патруль»" value="${e(state.team)}" autocomplete="off"></section>
  <section class="route-section"><div class="section-heading"><div><span class="eyebrow muted">ШАГ ЗА ШАГОМ</span><h2>Маршрут агентства</h2></div><span class="progress-count"><b>${done()}</b> / 8</span></div><div class="mission-grid">${MISSIONS.map(m=>missionCard(m)).join('')}</div></section>
  ${done()>0?`<section class="passport-teaser"><div>${icon('passport')}<div><h3>Ваш проект уже складывается</h3><p>Формулировки из миссий собираются в одном месте.</p></div></div>${btn('passport','Посмотреть паспорт',{class:'secondary',arrow:true})}</section>`:''}`;
}
function missionCard(m){
  const completed=state.completed.includes(m.id);const unlocked=isUnlocked(state,m.id);const current=nextMission(state)===m.id&&!completed;
  return `<button class="mission-card ${m.color} ${completed?'completed':''} ${current?'current':''} ${!unlocked?'locked':''}" data-action="open-mission" data-id="${m.id}" ${!unlocked?'aria-disabled="true"':''} aria-label="Миссия ${m.id}. ${e(m.title)}. ${completed?'Пройдена':unlocked?'Доступна':'Откроется после предыдущей миссии'}"><div class="mission-card-top"><span class="mission-icon">${icon(m.icon)}</span><span class="mission-status">${completed?`${icon('check')}Пройдено`:current?'Ваша следующая миссия':unlocked?'Доступно':`${icon('lock')}Пока закрыто`}</span></div><div class="mission-card-main"><span class="mission-number">0${m.id}</span><div><h3>${m.title}</h3><p>${m.subtitle}</p></div></div><div class="mission-card-bottom"><span>${completed?`Знак «${m.badge}»`:`3 задания + часть паспорта`}</span><span>${completed?icon('check'):unlocked?icon('arrow'):icon('lock')}</span></div></button>`;
}
function missionScreen(){
  const m=MISSIONS[route.id-1];const step=route.step;
  const q=step<3?m.tasks[step]:null;
  return `<div class="mission-layout"><aside class="mission-context"><a href="#route" class="back-link">${icon('back')}Все миссии</a><div class="mission-context-card ${m.color}"><span class="mission-icon large">${icon(m.icon)}</span><span class="eyebrow">МИССИЯ 0${m.id} / 08</span><h2>${m.title}</h2><p>${m.intro}</p><div class="context-foot">${icon('clock')}Около ${m.minutes}</div></div><div class="context-note">${icon('info')}<p>${m.note}</p></div><a href="#guide" class="text-link">${icon('guide')}Заглянуть в справочник</a></aside>
  <section class="task-area"><div class="task-progress" aria-label="Шаг ${step+1} из 4">${[0,1,2,3].map(i=>`<span class="${i<step?'past':i===step?'active':''}"><i>${i<step?icon('check'):i+1}</i><b>${i===3?'В паспорт':`Задание ${i+1}`}</b></span>`).join('')}</div>${q?taskCard(m,q):notesCard(m)}</section></div>`;
}
function draftFor(q){
  if(!Object.hasOwn(drafts,q.id))drafts[q.id]=state.answers[q.id]!==undefined?structuredClone(state.answers[q.id]):q.type==='order'?q.items.map(x=>x.id):q.type==='multi'?[]:q.type==='match'?{}:'';
  return drafts[q.id];
}
function taskCard(m,q){
  const answer=draftFor(q);const solved=!!state.solved[q.id];
  const result=feedback[q.id]||(solved?{correct:true}:null);
  const typeLabels={single:'ВЫБЕРИТЕ ОДИН ОТВЕТ',multi:'ОТМЕТЬТЕ ПОДХОДЯЩЕЕ',match:'НАЙДИТЕ СООТВЕТСТВИЯ',order:'СОБЕРИТЕ ПО ПОРЯДКУ'};
  let controls='';
  if(q.type==='single'||q.type==='multi')controls=`<fieldset class="options"><legend class="sr-only">${e(q.question)}</legend>${q.options.map((o,i)=>{const checked=q.type==='single'?answer===o.id:answer.includes(o.id);return `<label class="option ${checked?'selected':''} ${solved&&checked?'right':''}"><input id="${q.id}-${o.id}" data-question="${q.id}" type="${q.type==='single'?'radio':'checkbox'}" name="${q.id}" value="${o.id}" ${checked?'checked':''} ${solved?'disabled':''}><span class="option-marker">${q.type==='single'?String.fromCharCode(А.charCodeAt(0)+i):icon('check')}</span><span>${e(o.text)}</span></label>`;}).join('')}</fieldset>`;
  if(q.type==='match')controls=`<div class="match-list">${q.rows.map((r,i)=>`<div class="match-row"><label for="${q.id}-${r.id}"><span class="row-index">${i+1}</span>${e(r.text)}</label><select id="${q.id}-${r.id}" data-question="${q.id}" data-row="${r.id}" ${solved?'disabled':''}><option value="">Выберите соответствие</option>${q.choices.map(c=>`<option value="${c.id}" ${answer[r.id]===c.id?'selected':''}>${e(c.text)}</option>`).join('')}</select></div>`).join('')}</div>`;
  if(q.type==='order')controls=`<p class="order-instruction">Меняйте порядок кнопками со стрелками.</p><ol class="order-list">${answer.map((id,i)=>{const item=q.items.find(x=>x.id===id);return `<li><span class="order-index">${i+1}</span><span class="order-text">${e(item.text)}</span><span class="order-buttons"><button data-action="move" data-question="${q.id}" data-item="${id}" data-dir="-1" aria-label="Поднять: ${e(item.text)}" ${i===0||solved?'disabled':''}>${icon('up')}</button><button data-action="move" data-question="${q.id}" data-item="${id}" data-dir="1" aria-label="Опустить: ${e(item.text)}" ${i===answer.length-1||solved?'disabled':''}>${icon('down')}</button></span></li>`;}).join('')}</ol>`;
  return `<div class="task-card"><span class="eyebrow muted">${typeLabels[q.type]}</span><h1 id="screen-title" tabindex="-1">${e(q.question)}</h1>${controls}<div class="feedback ${result?result.correct?'success':'retry':''}" ${result?'role="status"':'hidden'}><span class="feedback-icon">${icon(result?.correct?'check':'light')}</span><div><b>${result?.correct?'Улика найдена · +10 опыта':'Попробуем ещё'}</b><p>${result?e(q.explanation):''}</p></div></div><div class="hint-box" ${state.hints[q.id]?'':'hidden'}>${icon('light')}<p>${e(q.hint)}</p></div><div class="task-actions">${solved?btn('next-task',route.step===2?'Заполнить паспорт':'Следующее задание',{class:'primary',arrow:true}):btn('check','Проверить',{class:'primary',attrs:`${hasAnswer(q,answer)?'':'disabled'}`})}${btn('hint',state.hints[q.id]?'Подсказка открыта':'Нужна подсказка',{class:'quiet',icon:'light',attrs:`${state.hints[q.id]?'disabled':''}`})}</div><p class="task-reassurance">Повторные попытки и подсказки доступны без штрафов.</p></div>`;
}
// Cyrillic answer markers use their own alphabet, avoiding Latin look-alikes.
const А='А';
function notesCard(m){
  const already=state.completed.includes(m.id);
  return `<form id="mission-notes" class="task-card notes-card" novalidate><span class="eyebrow muted">ДОБАВИМ В ВАШ ПРОЕКТ</span><h1 id="screen-title" tabindex="-1">Один шаг —<br>и часть паспорта готова.</h1><p class="notes-intro">Сформулируйте решение команды. Это ваш черновик для обсуждения с учителем.</p>${m.fields.map(f=>`<div class="field"><label for="field-${f.id}">${e(f.label)}</label><textarea id="field-${f.id}" name="${f.id}" data-field="${f.id}" minlength="${f.min}" maxlength="${f.max}" rows="${f.rows}" placeholder="${e(f.placeholder)}" aria-describedby="meta-${f.id}">${e(state.notes[f.id]||'')}</textarea><div class="field-meta" id="meta-${f.id}"><span data-counter="${f.id}">${(state.notes[f.id]||'').length} / ${f.max}</span><span>Сохраняется автоматически</span></div><p class="field-error" data-error="${f.id}" hidden></p><details class="example"><summary>Посмотреть пример</summary><p>${e(f.example).replaceAll('\n','<br>')}</p></details></div>`).join('')}<div class="note-check">${icon('info')}<span>Приложение проверит заполнение полей. Смысл и качество ваших формулировок обсудите с учителем.</span></div><button type="submit" class="btn primary wide"><span>${already?'Сохранить изменения':'Завершить миссию'}</span>${icon('check')}</button></form>`;
}
function passportSections(print=false){return FIELD_LABELS.map(([id,label])=>{const value=state.notes[id]?.trim();const owner=fieldOwner(id);const editable=owner&&isUnlocked(state,owner.id)&&owner.tasks.every(t=>state.solved[t.id]);return `<section class="passport-section ${!value?'empty':''}"><div class="passport-section-title"><h3>${e(label)}</h3>${!print&&editable?`<button class="edit-button" data-action="edit-field" data-field="${id}" aria-label="Изменить: ${e(label)}">Изменить</button>`:''}</div><p>${value?e(value).replaceAll('\n','<br>'):'Появится после соответствующей миссии.'}</p></section>`;}).join('');}
function passportScreen(){
  return `<section class="page-intro"><span class="eyebrow">ИЗ МИССИЙ — В ОДИН ДОКУМЕНТ</span><h1 id="screen-title" tabindex="-1">Мой проект</h1><p>Все ваши формулировки собраны здесь. Их можно дополнить, сохранить и обсудить с учителем.</p></section><div class="passport-layout"><article class="passport-paper"><div class="paper-top"><span class="paper-mark">ПА / 07</span><span class="paper-status ${done()===8?'ready':''}">${done()===8?'МАРШРУТ ПРОЙДЕН':'ЧЕРНОВИК'} · ${done()}/8</span></div><span class="eyebrow muted">ПАСПОРТ ТРЕНИРОВОЧНОГО ПРОЕКТА</span><h2>${e(state.notes.theme?.trim()||CASE.subtitle)}</h2><p class="paper-team">${e(teamName())}</p><div class="paper-facts"><span>7 класс</span><span>Практико-ориентированный</span><span>Срок: 4 учебные недели</span></div>${passportSections()}<p class="paper-footnote">Это план учебного проекта. Фактические результаты следует добавить после проведения книжного обмена.</p></article><aside class="passport-tools"><div class="tool-card"><span class="mission-icon mint">${icon('download')}</span><h3>Сохранить работу</h3><p>Текстовый файл удобно отправить учителю. Для PDF откройте печать и выберите сохранение в файл, если оно доступно на вашем устройстве.</p>${btn('download','Скачать паспорт .txt',{class:'primary wide',icon:'download'})}${btn('print','Печать / PDF',{class:'secondary wide',icon:'print'})}${btn('copy','Скопировать текст',{class:'quiet wide',icon:'copy'})}</div><div class="tool-card badges-panel"><h3>Знаки агентства</h3><div class="badges">${MISSIONS.map(m=>`<div class="badge ${state.completed.includes(m.id)?m.color:'not-earned'}" title="${e(m.badge)}">${icon(state.completed.includes(m.id)?m.icon:'lock')}<span>${e(m.badge)}</span></div>`).join('')}</div></div>${done()<8?btn('start','Вернуться к миссиям',{class:'secondary wide',arrow:true}):`<div class="completion-note">${icon('check')}Все восемь миссий пройдены. Следующий шаг — обсудить план и подготовиться к реальному обмену.</div>`}</aside></div>`;
}
function guide(){return `<section class="page-intro"><span class="eyebrow">МОЖНО ПОДСМОТРЕТЬ</span><h1 id="screen-title" tabindex="-1">Справочник агента</h1><p>Короткие объяснения помогут разобраться в заданиях и уточнить свой проект.</p></section><label class="search-field">${icon('focus')}<span class="sr-only">Найти понятие</span><input id="glossary-search" type="search" placeholder="Найти: цель, гипотеза, продукт…" autocomplete="off"></label><div class="glossary-grid">${GLOSSARY.map(([word,text])=>`<details class="glossary-item" data-term="${e((word+' '+text).toLocaleLowerCase('ru'))}"><summary>${e(word)}${icon('down')}</summary><p>${e(text)}</p></details>`).join('')}</div><p id="no-terms" class="empty-search" hidden>Такого понятия пока нет. Попробуйте другое слово.</p><div class="gentle-note">${icon('light')}Тема, цель и продукт связаны, но отвечают на разные вопросы: «о чём?», «какого результата хотим?» и «что получим?».</div>`;}
function answerLabel(q){
  if(q.type==='single')return q.options.find(o=>o.id===q.correct).text;
  if(q.type==='multi')return q.correct.map(id=>q.options.find(o=>o.id===id).text).join(' · ');
  if(q.type==='order')return q.correct.map((id,i)=>`${i+1}. ${q.items.find(o=>o.id===id).text}`).join('\n');
  return q.rows.map(row=>`${row.text} → ${q.choices.find(o=>o.id===q.correct[row.id]).text}`).join('\n');
}
function teacher(){return `<section class="page-intro"><span class="eyebrow">МАТЕРИАЛЫ ДЛЯ ВЕДУЩЕГО</span><h1 id="screen-title" tabindex="-1">Учителю</h1><p>Тренировочный квест на один урок. Можно работать индивидуально или по 2–3 человека с одним телефоном.</p></section><div class="teacher-grid"><article class="tool-card lesson"><h2>Урок на 35–40 минут</h2><ol class="lesson-timeline"><li><b>0–5 мин</b><span>Представить заказ, выбрать название команды и обсудить исходную проблему.</span></li><li><b>5–30 мин</b><span>Пройти миссии 1–7. По необходимости выбирать подсказки и обсуждать ответы.</span></li><li><b>30–35 мин</b><span>Пройти финальную миссию и представить замысел за 60 секунд.</span></li><li><b>35–40 мин</b><span>Обсудить рефлексию и сохранить паспорта. Темп можно подстроить под класс.</span></li></ol></article><article class="tool-card"><h2>Как оценивать</h2><p>Автоматически проверяются 24 закрытых задания. За каждое верное решение начисляется 10 единиц опыта; подсказки и повторные попытки баллы не снижают.</p><p>Открытые ответы сохраняются в паспорт. Их содержание оценивает учитель.</p><ul class="teacher-checklist"><li>Проблема конкретна и понятны участники.</li><li>Цель соответствует проблеме, задачи ведут к цели.</li><li>Продукт полезен; план посилен и включает сроки.</li><li>Источники проверяемы, критерии связаны с целью.</li></ul></article></div><section class="teacher-save gentle-note">${icon('info')}<div><b>Работы остаются на устройствах учеников.</b><p>В этой версии нет общего журнала класса. Попросите команды скачать или скопировать паспорт и передать его привычным способом. Прогресс сохраняется в текущем браузере; приватный режим или очистка данных могут его удалить.</p></div></section><div class="section-heading"><div><span class="eyebrow muted">ОТВЕТЫ И ОБЪЯСНЕНИЯ</span><h2>Ключ к 24 заданиям</h2></div></div><div class="answer-keys">${MISSIONS.map(m=>`<details class="answer-mission"><summary><span>0${m.id}</span><div><b>${m.title}</b><small>${m.subtitle}</small></div>${icon('down')}</summary><div class="answers-body">${m.tasks.map((q,i)=>`<article><span class="small-label">ЗАДАНИЕ ${i+1}</span><h3>${e(q.question)}</h3><p class="key-answer">${e(answerLabel(q)).replaceAll('\n','<br>')}</p><p>${e(q.explanation)}</p></article>`).join('')}</div></details>`).join('')}</div><section class="reset-panel"><div><h3>Следующая команда</h3><p>Перед новым прохождением сохраните текущий паспорт.</p></div>${btn('ask-reset','Начать заново',{class:'secondary',icon:'reset'})}</section>`;}
function locked(){return `<section class="empty-state"><span class="mission-icon lavender">${icon('lock')}</span><h1 id="screen-title" tabindex="-1">Эта миссия ещё впереди</h1><p>Сначала завершите предыдущую миссию, чтобы шаги проекта сложились в понятный маршрут.</p>${btn('start','К текущей миссии',{class:'primary',arrow:true})}</section>`;}
function render({scroll=false,focusId=null}={}){
  route=readRoute();
  const views={route:home,mission:missionScreen,passport:passportScreen,guide,teacher,locked};
  app.innerHTML=shell(views[route.view]());
  document.title=`${route.view==='mission'?`Миссия ${route.id} · `:route.view==='passport'?'Мой проект · ':''}Проектное агентство`;
  if(scroll){window.scrollTo({top:0,behavior:'instant'});document.querySelector('#screen-title')?.focus({preventScroll:true});}
  if(focusId)document.getElementById(focusId)?.focus({preventScroll:true});
}
function currentQuestion(){return route.view==='mission'&&route.step<3?MISSIONS[route.id-1].tasks[route.step]:null;}
function start(){if(!state.startedAt){state.startedAt=new Date().toISOString();save();}const id=nextMission(state);navigate('mission',id,nextTask(state,id));}
function showModal(content){
  document.querySelector('#modal-root').innerHTML=`<dialog id="main-dialog" class="modal"><button class="modal-close" data-modal-action="close" aria-label="Закрыть">${icon('close')}</button>${content}</dialog>`;
  const dialog=document.querySelector('#main-dialog');
  dialog.addEventListener('click',event=>{const b=event.target.closest('[data-modal-action]');if(b){const action=b.dataset.modalAction;dialog.close();if(action==='next'){if(done()===8)navigate('passport');else start();}if(action==='reset'){state=initialState();Object.keys(drafts).forEach(k=>delete drafts[k]);Object.keys(feedback).forEach(k=>delete feedback[k]);save();navigate('route');render();toast('Можно начинать новый квест.');}}});
  dialog.showModal();
}
function winMission(m){showModal(`<div class="mission-icon celebration ${m.color}">${icon(m.icon)}</div><span class="eyebrow">МИССИЯ 0${m.id} ЗАВЕРШЕНА</span><h2>${done()===8?'Заказ принят в работу!':'Ещё один шаг к проекту.'}</h2><p>Вы получили знак <b>«${m.badge}»</b>. Ваша формулировка уже в паспорте проекта.</p><div class="modal-progress"><b>${done()} / 8</b><span>миссий пройдено</span></div><button class="btn primary wide" data-modal-action="next">${done()===8?'Открыть готовый паспорт':'К следующей миссии'}${icon('arrow')}</button>`);}
function passportText(){return ['ПРОЕКТНОЕ АГЕНТСТВО · 7 КЛАСС','Паспорт тренировочного проекта',`Команда: ${teamName()}`,`Тип: практико-ориентированный. Срок: 4 учебные недели.`,`Пройдено миссий: ${done()} из 8. Опыт: ${xp(state)} из 240.`,...FIELD_LABELS.flatMap(([id,label])=>['',label.toUpperCase(),state.notes[id]?.trim()||'Пока не заполнено.']),'','Это план проекта. Фактические результаты добавляются после проведения книжного обмена.'].join('\n');}
function buildPrint(){document.querySelector('#print-passport').innerHTML=`<header><span>ПРОЕКТНОЕ АГЕНТСТВО · 7 КЛАСС</span><h1>Паспорт тренировочного проекта</h1><h2>${e(state.notes.theme?.trim()||CASE.subtitle)}</h2><p>Команда: ${e(teamName())}<br>Тип: практико-ориентированный · Срок: 4 учебные недели<br>Пройдено миссий: ${done()} из 8</p></header>${passportSections(true)}<p>Это план проекта. Фактические результаты добавляются после проведения книжного обмена.</p>`;}
function download(){const blob=new Blob(['\uFEFF'+passportText()],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Паспорт_проекта_книжный_обмен.txt';a.hidden=true;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('Паспорт подготовлен для сохранения.');}
async function copy(){try{await navigator.clipboard.writeText(passportText());toast('Паспорт скопирован.');}catch{showModal(`<h2>Текст паспорта</h2><p>Выделите и скопируйте текст.</p><textarea class="copy-area" readonly>${e(passportText())}</textarea>`);}}

app.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  const action=button.dataset.action;
  if(action==='start')return start();
  if(action==='passport')return navigate('passport');
  if(action==='open-mission'){const id=Number(button.dataset.id);if(!isUnlocked(state,id))return toast(`Сначала завершите миссию ${id-1}.`);if(!state.startedAt)state.startedAt=new Date().toISOString();save();return navigate('mission',id,state.completed.includes(id)?0:nextTask(state,id));}
  if(action==='edit-field'){const owner=fieldOwner(button.dataset.field);return navigate('mission',owner.id,3);}
  if(action==='download')return download();
  if(action==='print'){buildPrint();return window.print();}
  if(action==='copy')return copy();
  if(action==='ask-reset')return showModal(`<span class="mission-icon peach">${icon('reset')}</span><h2>Начать новый квест?</h2><p>Название команды, ответы и текущий паспорт будут очищены в этом браузере. Перед началом новой игры сохраните паспорт.</p><div class="modal-buttons"><button class="btn primary" data-modal-action="close">Продолжить текущий</button><button class="btn secondary" data-modal-action="reset">Начать заново</button></div>`);
  const q=currentQuestion();if(!q)return;
  if(action==='hint'){state.hints[q.id]=true;save();return render();}
  if(action==='check'){const result=markAnswer(state,q,draftFor(q));if(!result.accepted)return;feedback[q.id]=result;save();render();document.querySelector('.feedback')?.scrollIntoView({block:'nearest',behavior:'smooth'});return;}
  if(action==='next-task')return navigate('mission',route.id,route.step+1);
  if(action==='move'){
    if(state.solved[q.id])return;
    const answer=draftFor(q);const idx=answer.indexOf(button.dataset.item);const target=idx+Number(button.dataset.dir);
    if(target<0||target>=answer.length)return;
    [answer[idx],answer[target]]=[answer[target],answer[idx]];delete feedback[q.id];
    render();document.querySelector(`[data-action="move"][data-item="${button.dataset.item}"]:not([disabled])`)?.focus({preventScroll:true});
  }
});
app.addEventListener('change',event=>{
  const input=event.target;const q=currentQuestion();if(!q||input.dataset.question!==q.id||state.solved[q.id])return;
  if(q.type==='single')drafts[q.id]=input.value;
  if(q.type==='multi'){const answer=draftFor(q);drafts[q.id]=input.checked?[...answer,input.value]:answer.filter(id=>id!==input.value);}
  if(q.type==='match'){draftFor(q)[input.dataset.row]=input.value;const check=document.querySelector('[data-action="check"]');if(check)check.disabled=!hasAnswer(q,draftFor(q));return;}
  delete feedback[q.id];render({focusId:input.id});
});
app.addEventListener('input',event=>{
  const input=event.target;
  if(input.id==='team-name'){state.team=input.value.slice(0,60);save();}
  if(input.dataset.field){state.notes[input.dataset.field]=input.value;save();const count=document.querySelector(`[data-counter="${input.dataset.field}"]`);if(count)count.textContent=`${input.value.length} / ${input.maxLength}`;document.querySelector(`[data-error="${input.dataset.field}"]`)?.setAttribute('hidden','');input.removeAttribute('aria-invalid');}
  if(input.id==='glossary-search'){const query=input.value.trim().toLocaleLowerCase('ru');let found=0;document.querySelectorAll('[data-term]').forEach(el=>{el.hidden=!el.dataset.term.includes(query);if(!el.hidden)found++;});document.querySelector('#no-terms').hidden=found>0;}
});
app.addEventListener('submit',event=>{
  if(event.target.id!=='mission-notes')return;event.preventDefault();const m=MISSIONS[route.id-1];let valid=true;let first=null;
  for(const f of m.fields){const input=document.getElementById(`field-${f.id}`);state.notes[f.id]=input.value;const error=document.querySelector(`[data-error="${f.id}"]`);if(input.value.trim().length<f.min){valid=false;first??=input;error.textContent=`Добавьте немного конкретики: нужно хотя бы ${f.min} символов. Сейчас ${input.value.trim().length}.`;error.hidden=false;input.setAttribute('aria-invalid','true');}}
  save();if(!valid){first.focus();return;}
  const wasComplete=state.completed.includes(m.id);if(!completeMission(state,m.id)){toast('Сначала завершите три задания миссии.');return;}
  save();if(wasComplete){navigate('passport');toast('Изменения сохранены в паспорте.');}else {render();winMission(m);}
});
window.addEventListener('hashchange',()=>render({scroll:true}));
window.addEventListener('beforeprint',buildPrint);
render();
