'use client';
import { FormEvent, useEffect, useMemo, useState } from 'react';
type Schedule = { id:string; title:string; start:string; end:string; category:string; color:string; note?:string; done?:boolean };
const colors:Record<string,string>={집중:'#6d5dfc',공부:'#2f80ed',건강:'#21a179',생활:'#ef8b45'};
const backgrounds:Record<string,string>={집중:'#eeebff',공부:'#e5f0ff',건강:'#e4f6ef',생활:'#fff0e5'};
const hours=Array.from({length:18},(_,i)=>i+6), weekdays=['월','화','수','목','금','토','일'];
const pad=(n:number)=>String(n).padStart(2,'0');
const dateKey=(d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const mins=(time:string)=>{const[h,m]=time.split(':').map(Number);return h*60+m};
const sameDay=(a:Date,b:Date)=>dateKey(a)===dateKey(b);
const mondayOf=(date:Date)=>{const d=new Date(date),day=d.getDay()||7;d.setDate(d.getDate()-day+1);d.setHours(0,0,0,0);return d};
const addDays=(date:Date,n:number)=>{const d=new Date(date);d.setDate(d.getDate()+n);return d};
const starter:Schedule[]=[
 {id:'sample-1',title:'오늘의 계획 정리',start:'08:00',end:'09:00',category:'생활',color:colors.생활},
 {id:'sample-2',title:'알고리즘 공부',start:'10:00',end:'12:00',category:'공부',color:colors.공부},
 {id:'sample-3',title:'점심 & 산책',start:'12:30',end:'13:30',category:'건강',color:colors.건강},
 {id:'sample-4',title:'프로젝트 몰입',start:'15:00',end:'17:00',category:'집중',color:colors.집중},
];

export default function Home(){
 const[weekStart,setWeekStart]=useState(()=>mondayOf(new Date()));
 const[itemsByDate,setItemsByDate]=useState<Record<string,Schedule[]>>({});
 const[ready,setReady]=useState(false),[modalOpen,setModalOpen]=useState(false);
 const[agendaOpen,setAgendaOpen]=useState(false);
 const[editing,setEditing]=useState<Schedule|null>(null),[targetDate,setTargetDate]=useState(new Date());
 const[form,setForm]=useState({title:'',start:'09:00',end:'10:00',category:'집중',note:''});
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(weekStart,i)),[weekStart]);
 const weekItems=useMemo(()=>days.flatMap(day=>(itemsByDate[dateKey(day)]??[]).map(item=>({...item,date:day}))).sort((a,b)=>mins(a.start)-mins(b.start)),[days,itemsByDate]);
 useEffect(()=>{const saved=localStorage.getItem('haru-planner-schedules');if(saved)setItemsByDate(JSON.parse(saved));else setItemsByDate({[dateKey(new Date())]:starter});setReady(true)},[]);
 useEffect(()=>{if(ready)localStorage.setItem('haru-planner-schedules',JSON.stringify(itemsByDate))},[itemsByDate,ready]);
 function openCreate(date:Date,start='09:00'){const end=Math.min(23,Number(start.slice(0,2))+1);setTargetDate(date);setEditing(null);setForm({title:'',start,end:`${pad(end)}:00`,category:'집중',note:''});setModalOpen(true)}
 function openEdit(date:Date,item:Schedule){setTargetDate(date);setEditing(item);setForm({title:item.title,start:item.start,end:item.end,category:item.category,note:item.note??''});setModalOpen(true)}
 function save(e:FormEvent){e.preventDefault();if(!form.title.trim()||mins(form.end)<=mins(form.start))return;const key=dateKey(targetDate),next:Schedule={id:editing?.id??crypto.randomUUID(),...form,title:form.title.trim(),color:colors[form.category],done:editing?.done??false};setItemsByDate(prev=>({...prev,[key]:editing?(prev[key]??[]).map(i=>i.id===editing.id?next:i):[...(prev[key]??[]),next]}));setModalOpen(false)}
 function remove(){if(!editing)return;const key=dateKey(targetDate);setItemsByDate(prev=>({...prev,[key]:(prev[key]??[]).filter(i=>i.id!==editing.id)}));setModalOpen(false)}
 function toggle(date:Date,id:string){const key=dateKey(date);setItemsByDate(prev=>({...prev,[key]:(prev[key]??[]).map(i=>i.id===id?{...i,done:!i.done}:i)}))}
 const weekLabel=`${weekStart.getFullYear()}년 ${weekStart.getMonth()+1}월 ${weekStart.getDate()}일 — ${days[6].getMonth()+1}월 ${days[6].getDate()}일`;
 return <main className="week-app">
  <header className="week-topbar"><div className="wordmark">하루</div><div className="week-nav"><button onClick={()=>setWeekStart(addDays(weekStart,-7))} aria-label="이전 주">‹</button><button className="week-today" onClick={()=>setWeekStart(mondayOf(new Date()))}>오늘</button><button onClick={()=>setWeekStart(addDays(weekStart,7))} aria-label="다음 주">›</button></div><div className="week-label">{weekLabel}</div><button className="agenda-toggle" onClick={()=>setAgendaOpen(!agendaOpen)}>할 일 {weekItems.filter(i=>!i.done).length}</button><button className="add-button" onClick={()=>openCreate(new Date())}>＋</button></header>
  <section className="week-calendar"><div className="week-days"><div className="time-corner">GMT+9</div>{days.map((day,i)=><button key={dateKey(day)} className={sameDay(day,new Date())?'today-col':''} onClick={()=>openCreate(day)}><span>{weekdays[i]}요일</span><strong>{day.getDate()}</strong></button>)}</div><div className="week-body"><div className="week-times">{hours.map(h=><div key={h}>{h<12?`오전 ${h}시`:h===12?'오후 12시':`오후 ${h-12}시`}</div>)}</div>{days.map(day=><div className={`day-column ${sameDay(day,new Date())?'today-col':''}`} key={dateKey(day)}>{hours.map(h=><button className="week-slot" key={h} onClick={()=>openCreate(day,`${pad(h)}:00`)} aria-label={`${day.getDate()}일 ${h}시 일정 추가`}/>)}{(itemsByDate[dateKey(day)]??[]).map(item=>{const top=(mins(item.start)-360)/60*64,height=Math.max(40,(mins(item.end)-mins(item.start))/60*64-4);return <button className={`week-event ${item.done?'done':''}`} key={item.id} style={{top,height,borderColor:item.color,background:backgrounds[item.category]}} onClick={()=>openEdit(day,item)}><small>{item.start}</small><strong>{item.title}</strong>{height>54&&<span>{item.end} · {item.category}</span>}</button>})}</div>)}</div></section>
  <section className={`week-agenda ${agendaOpen?'open':''}`}><button className="agenda-bar" onClick={()=>setAgendaOpen(!agendaOpen)}><span>이번 주 할 일</span><span>{weekItems.filter(i=>i.done).length}/{weekItems.length} 완료　{agendaOpen?'⌃':'⌄'}</span></button>{agendaOpen&&<div className="agenda-grid">{weekItems.length?weekItems.map(item=><article className={item.done?'done':''} key={`${dateKey(item.date)}-${item.id}`}><button className="check" style={{borderColor:item.color,background:item.done?item.color:'transparent'}} onClick={()=>toggle(item.date,item.id)}>{item.done?'✓':''}</button><button className="agenda-copy" onClick={()=>openEdit(item.date,item)}><span>{item.date.getMonth()+1}/{item.date.getDate()} {weekdays[(item.date.getDay()+6)%7]}요일 · {item.start}</span><strong>{item.title}</strong></button></article>):<p className="week-empty">이번 주에는 아직 일정이 없어요.</p>}</div>}</section>
  {modalOpen&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setModalOpen(false)}><form className="modal" onSubmit={save}><div className="modal-head"><div><p>{targetDate.getMonth()+1}월 {targetDate.getDate()}일 · {editing?'일정 수정':'새 일정'}</p><h2>시간을 계획해볼까요?</h2></div><button type="button" onClick={()=>setModalOpen(false)}>×</button></div><label>일정 이름<input autoFocus value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="무엇을 할 예정인가요?" required/></label><div className="time-row"><label>시작<input type="time" value={form.start} onChange={e=>setForm({...form,start:e.target.value})}/></label><span>→</span><label>종료<input type="time" value={form.end} onChange={e=>setForm({...form,end:e.target.value})}/></label></div><label>분류<div className="category-row">{Object.keys(colors).map(cat=><button key={cat} type="button" className={form.category===cat?'selected':''} style={{'--cat':colors[cat]} as React.CSSProperties} onClick={()=>setForm({...form,category:cat})}>{cat}</button>)}</div></label><label>메모<textarea value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="세부 내용을 적어두세요 (선택)"/></label>{mins(form.end)<=mins(form.start)&&<p className="form-error">종료 시간은 시작 시간보다 늦어야 해요.</p>}<div className="modal-actions">{editing&&<button type="button" className="delete" onClick={remove}>삭제</button>}<button type="button" className="cancel" onClick={()=>setModalOpen(false)}>취소</button><button type="submit" className="save">{editing?'수정 완료':'일정 추가'}</button></div></form></div>}
 </main>
}
