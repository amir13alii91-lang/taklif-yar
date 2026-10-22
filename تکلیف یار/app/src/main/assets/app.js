(() => {
'use strict';
const DAYS = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];
const DEFAULT = [
 ['عربی','ریاضی','ورزش'],
 ['فارسی','زبان','هنر'],
 ['قرآن','ریاضی','مطالعات'],
 ['املا','علوم / مطالعات','دفاعی'],
 ['دینی','علوم','فناوری'],
 [],
 []
];
const $ = id => document.getElementById(id);
const read = (key, fallback) => { try { const x=JSON.parse(localStorage.getItem(key)); return x ?? fallback; } catch { return fallback; } };
let schedule = read('ty_schedule', DEFAULT);
let tasks = read('ty_tasks', []);
let editingId = null;
let selectedDay = (new Date().getDay()+1)%7;
function toFa(n){return String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[+d]);}
function dateKey(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
function parseDate(s){const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d,12);}
function faDate(s){if(!s)return 'بدون تاریخ';return new Intl.DateTimeFormat('fa-IR',{year:'numeric',month:'short',day:'numeric'}).format(parseDate(s));}
function dayIndex(date){return (date.getDay()+1)%7;}
function save(){localStorage.setItem('ty_schedule',JSON.stringify(schedule));localStorage.setItem('ty_tasks',JSON.stringify(tasks));renderAll();}
function nextClassDate(day, subject, afterDate=new Date()){
 const d=new Date(afterDate.getFullYear(),afterDate.getMonth(),afterDate.getDate(),12);
 for(let i=0;i<370;i++){if(dayIndex(d)===day && (schedule[day]||[]).includes(subject)) return dateKey(d);d.setDate(d.getDate()+1);}
 return '';
}
function nextOccurrence(subject, fromDate){
 const d=parseDate(fromDate);
 for(let i=1;i<=370;i++){const x=new Date(d);x.setDate(x.getDate()+i);if((schedule[dayIndex(x)]||[]).includes(subject))return dateKey(x);}
 return fromDate;
}
function showPage(name){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===name));document.querySelectorAll('.bottom-nav [data-page]').forEach(b=>b.classList.toggle('nav-active',b.dataset.page===name));if(name==='add')renderAdd();if(name==='due')renderDue();if(name==='schedule')renderSchedule();if(name==='reports')renderReports();window.scrollTo(0,0);}
document.addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b){e.preventDefault();showPage(b.dataset.page);}});
function fillDaySelect(select, chosen){select.innerHTML=DAYS.map((d,i)=>`<option value="${i}" ${i===chosen?'selected':''}>${d}</option>`).join('');}
function subjectsFor(day){return schedule[day]||[];}
function renderAdd(){
 fillDaySelect($('classDay'),selectedDay);
 const current=$('subject').value;
 const list=subjectsFor(selectedDay);
 $('subject').innerHTML=list.length?list.map(s=>`<option>${esc(s)}</option>`).join(''):'<option value="">برای این روز درسی ثبت نشده</option>';
 if(list.includes(current))$('subject').value=current;
 const subj=$('subject').value;
 const classDate=nextDateForDay(selectedDay);
 const due=classDate && subj?nextOccurrence(subj,classDate):'';
 $('duePreview').textContent=due?`موعد پیشنهادی: ${faDate(due)} (جلسهٔ بعدی این درس)`:'برای این روز درسی ثبت نشده است.';
 $('editHint').textContent=editingId?'در حال ویرایش تکلیف؛ پس از ثبت، تغییرات ذخیره می‌شود.':'';
}
function nextDateForDay(day){const d=new Date();d.setHours(12,0,0,0);let delta=(day-dayIndex(d)+7)%7;if(delta===0)delta=7;d.setDate(d.getDate()+delta);return dateKey(d);}
$('classDay').addEventListener('change',()=>{selectedDay=Number($('classDay').value);renderAdd();});
$('subject').addEventListener('change',renderAdd);
$('taskForm').addEventListener('submit',e=>{
 e.preventDefault();const text=$('taskText').value.trim(),subject=$('subject').value,day=Number($('classDay').value);
 if(!text||!subject||!subjectsFor(day).includes(subject)){alert('روز و درس معتبر انتخاب کن و شرح تکلیف را بنویس.');return;}
 const classDate=nextDateForDay(day),dueDate=nextOccurrence(subject,classDate);
 if(editingId){const t=tasks.find(t=>t.id===editingId);if(t){t.text=text;t.subject=subject;t.classDay=day;t.classDate=classDate;t.dueDate=dueDate;}editingId=null;}
 else tasks.push({id:String(Date.now())+Math.random().toString(16).slice(2),text,subject,classDay:day,classDate,dueDate,createdAt:dateKey(new Date()),done:false});
 $('taskText').value='';save();showPage('due');
});
function renderDue(){
 fillDaySelect($('viewDay'),selectedDay);
 const date=nextDateForDay(selectedDay);
 const list=tasks.filter(t=>t.dueDate===date || t.classDay===selectedDay);
 $('dayTasks').innerHTML=`<p class="hint">${DAYS[selectedDay]} · ${faDate(date)}</p>`+taskList(list);
}
$('viewDay').addEventListener('change',()=>{selectedDay=Number($('viewDay').value);renderDue();});
function taskList(list){
 if(!list.length)return '<div class="empty">برای این روز تکلیفی ثبت نشده. 🌱</div>';
 return list.map(t=>`<div class="task-item"><div class="task-head"><strong>${esc(t.subject)}</strong>${t.done?'<span class="done-label">✓ انجام‌شده</span>':''}</div><div class="task-text">${esc(t.text)}</div><div class="task-meta">موعد: ${faDate(t.dueDate)} · کلاس: ${DAYS[t.classDay]||'—'}</div><div class="task-actions"><button data-action="toggle" data-id="${t.id}">${t.done?'برگرداندن':'انجام شد ✓'}</button><button data-action="edit" data-id="${t.id}">ویرایش</button><button class="delete" data-action="delete" data-id="${t.id}">حذف</button></div></div>`).join('');
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');if(!b)return;
 const t=tasks.find(x=>x.id===b.dataset.id);if(!t)return;
 if(b.dataset.action==='toggle'){t.done=!t.done;save();}
 if(b.dataset.action==='delete'&&confirm('این تکلیف حذف شود؟')){tasks=tasks.filter(x=>x.id!==t.id);save();}
 if(b.dataset.action==='edit'){editingId=t.id;selectedDay=t.classDay;$('taskText').value=t.text;showPage('add');$('classDay').value=String(t.classDay);renderAdd();$('subject').value=t.subject;renderAdd();}
});
function renderSchedule(){
 $('scheduleGrid').innerHTML=DAYS.map((day,i)=>`<div class="day-column"><h3>${day}</h3>${Array.from({length:3},(_,p)=>`<button class="lesson" data-lesson-day="${i}" data-period="${p}"><small>زنگ ${toFa(p+1)}</small>${esc((schedule[i]||[])[p]||'—')}</button>`).join('')}</div>`).join('');
}
$('scheduleGrid').addEventListener('click',e=>{
 const b=e.target.closest('[data-lesson-day]');if(!b)return;
 const day=Number(b.dataset.lessonDay),period=Number(b.dataset.period),old=(schedule[day]||[])[period]||'';
 const answer=prompt(`درس زنگ ${period+1} در ${DAYS[day]} را بنویس. برای خالی گذاشتن، متن را پاک کن.`,old);
 if(answer===null)return;
 while(schedule[day].length<3)schedule[day].push('');
 schedule[day][period]=answer.trim();save();
});
$('resetSchedule').addEventListener('click',()=>{if(confirm('برنامه به حالت اولیه برگردد؟')){schedule=DEFAULT.map(d=>[...d]);save();}});
function renderReports(){
 const remaining=tasks.filter(t=>!t.done).length;
 $('totalCount').textContent=toFa(tasks.length);$('reportRemaining').textContent=toFa(remaining);
 $('filterSubject').innerHTML='<option value="">همهٔ درس‌ها</option>'+[...new Set(tasks.map(t=>t.subject))].map(s=>`<option>${esc(s)}</option>`).join('');
 const q=$('searchText').value.trim().toLowerCase(),sub=$('filterSubject').value,from=$('fromDate').value,to=$('toDate').value;
 const list=tasks.filter(t=>(!q||t.text.toLowerCase().includes(q))&&(!sub||t.subject===sub)&&(!from||t.dueDate>=from)&&(!to||t.dueDate<=to)).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
 $('filteredTasks').innerHTML=taskList(list);
}
['searchText','filterSubject','fromDate','toDate'].forEach(id=>$(id).addEventListener(id==='searchText'?'input':'change',renderReports));
$('exportBackup').addEventListener('click',()=>{
 const data=JSON.stringify({version:1,schedule,tasks},null,2);
 const blob=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='taklif-yar-backup.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('importBackup').addEventListener('change',async e=>{
 const file=e.target.files&&e.target.files[0];if(!file)return;
 try{const data=JSON.parse(await file.text());if(!Array.isArray(data.tasks)||!Array.isArray(data.schedule))throw Error('bad');if(!confirm('بازیابی، اطلاعات فعلی را جایگزین می‌کند. ادامه می‌دهی؟'))return;schedule=data.schedule;tasks=data.tasks;save();alert('پشتیبان بازیابی شد.');}
 catch{alert('فایل پشتیبان معتبر نیست.');}finally{e.target.value='';}
});
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function renderAll(){
 const remaining=tasks.filter(t=>!t.done).length,completed=tasks.length-remaining;
 $('remainingCount').textContent=toFa(remaining);$('completedCount').textContent=toFa(completed);
 if($('due').classList.contains('active'))renderDue();
 if($('schedule').classList.contains('active'))renderSchedule();
 if($('reports').classList.contains('active'))renderReports();
}
renderAll();renderAdd();
})();