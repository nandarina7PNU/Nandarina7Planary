'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Schedule = { id: string; title: string; start: string; end: string; category: string; color: string; note?: string; done?: boolean };
const colors: Record<string, string> = { 집중: '#6d5dfc', 공부: '#2f80ed', 건강: '#21a179', 생활: '#ef8b45' };
const categoryBg: Record<string, string> = { 집중: '#eeebff', 공부: '#e5f0ff', 건강: '#e4f6ef', 생활: '#fff0e5' };
const hours = Array.from({ length: 18 }, (_, i) => i + 6);
const pad = (n: number) => String(n).padStart(2, '0');
const dateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const minutes = (time: string) => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };
const formatDate = (date: Date) => new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }).format(date);
const starter: Schedule[] = [
  { id: 'sample-1', title: '오늘의 계획 정리', start: '08:00', end: '08:40', category: '생활', color: colors.생활, note: '우선순위 3가지 정하기' },
  { id: 'sample-2', title: '알고리즘 집중 공부', start: '10:00', end: '12:00', category: '공부', color: colors.공부, note: '동적 계획법 문제 3개' },
  { id: 'sample-3', title: '점심 & 산책', start: '12:30', end: '13:30', category: '건강', color: colors.건강 },
  { id: 'sample-4', title: '프로젝트 몰입 시간', start: '15:00', end: '17:30', category: '집중', color: colors.집중, note: '발표 자료 초안 완성' },
];

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [itemsByDate, setItemsByDate] = useState<Record<string, Schedule[]>>({});
  const [ready, setReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [form, setForm] = useState({ title: '', start: '09:00', end: '10:00', category: '집중', note: '' });
  const key = dateKey(selectedDate);
  const items = useMemo(() => [...(itemsByDate[key] ?? [])].sort((a, b) => minutes(a.start) - minutes(b.start)), [itemsByDate, key]);
  const completed = items.filter(i => i.done).length;
  const plannedMinutes = items.reduce((sum, item) => sum + minutes(item.end) - minutes(item.start), 0);

  useEffect(() => {
    const saved = localStorage.getItem('haru-planner-schedules');
    if (saved) setItemsByDate(JSON.parse(saved)); else setItemsByDate({ [dateKey(new Date())]: starter });
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem('haru-planner-schedules', JSON.stringify(itemsByDate)); }, [itemsByDate, ready]);

  function moveDate(days: number) { const d = new Date(selectedDate); d.setDate(d.getDate() + days); setSelectedDate(d); }
  function openCreate(start = '09:00') {
    const endHour = Math.min(23, Number(start.slice(0, 2)) + 1);
    setEditing(null); setForm({ title: '', start, end: `${pad(endHour)}:00`, category: '집중', note: '' }); setModalOpen(true);
  }
  function openEdit(item: Schedule) { setEditing(item); setForm({ title: item.title, start: item.start, end: item.end, category: item.category, note: item.note ?? '' }); setModalOpen(true); }
  function saveItem(e: FormEvent) {
    e.preventDefault(); if (!form.title.trim() || minutes(form.end) <= minutes(form.start)) return;
    const next: Schedule = { id: editing?.id ?? crypto.randomUUID(), ...form, title: form.title.trim(), color: colors[form.category], done: editing?.done ?? false };
    setItemsByDate(prev => ({ ...prev, [key]: editing ? (prev[key] ?? []).map(i => i.id === editing.id ? next : i) : [...(prev[key] ?? []), next] })); setModalOpen(false);
  }
  function removeItem() { if (!editing) return; setItemsByDate(prev => ({ ...prev, [key]: (prev[key] ?? []).filter(i => i.id !== editing.id) })); setModalOpen(false); }
  function toggleDone(id: string) { setItemsByDate(prev => ({ ...prev, [key]: (prev[key] ?? []).map(i => i.id === id ? { ...i, done: !i.done } : i) })); }

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">H</span><span>하루</span></div><nav><button className="nav-active">나의 하루</button><button>주간 보기</button><button>루틴</button></nav><button className="add-button" onClick={() => openCreate()}>＋ 일정 추가</button></header>
    <section className="page-head"><div><p className="eyebrow">DAILY PLANNER</p><h1>{formatDate(selectedDate)}</h1><p className="date-sub">오늘을 차분하게 설계하고, 하나씩 완료해보세요.</p></div><div className="date-controls"><button onClick={() => moveDate(-1)} aria-label="이전 날">←</button><button className="today" onClick={() => setSelectedDate(new Date())}>오늘</button><button onClick={() => moveDate(1)} aria-label="다음 날">→</button></div></section>
    <div className="layout">
      <section className="timeline-card"><div className="timeline-head"><span>시간</span><span>일정</span><span className="plan-count">{items.length}개의 계획</span></div><div className="timeline"><div className="hour-labels">{hours.map(h => <div key={h}>{h < 12 ? `오전 ${h}` : h === 12 ? '오후 12' : `오후 ${h - 12}`}</div>)}</div><div className="grid-area">{hours.map(h => <button key={h} className="hour-line" onClick={() => openCreate(`${pad(h)}:00`)} aria-label={`${h}시 일정 추가`} />)}{items.map(item => { const top = (minutes(item.start) - 360) / 60 * 72; const height = Math.max(46, (minutes(item.end) - minutes(item.start)) / 60 * 72 - 6); return <button key={item.id} className={`event ${item.done ? 'done' : ''}`} style={{ top, height, borderColor: item.color, background: categoryBg[item.category] }} onClick={() => openEdit(item)}><span className="event-time">{item.start} — {item.end}</span><strong>{item.title}</strong>{item.note && <small>{item.note}</small>}</button>; })}{items.length === 0 && <div className="empty"><span>☀</span><strong>아직 계획이 없어요</strong><p>시간대를 눌러 첫 일정을 추가해보세요.</p></div>}</div></div></section>
      <aside><section className="summary-card"><div className="summary-top"><div><p>오늘의 흐름</p><strong>{completed} / {items.length}</strong><span>완료한 일정</span></div><div className="progress-ring" style={{ '--progress': `${items.length ? completed / items.length * 360 : 0}deg` } as React.CSSProperties}><span>{items.length ? Math.round(completed / items.length * 100) : 0}%</span></div></div><div className="summary-meta"><span>계획 시간 <b>{Math.floor(plannedMinutes / 60)}시간 {plannedMinutes % 60 ? `${plannedMinutes % 60}분` : ''}</b></span><span>남은 일정 <b>{items.length - completed}개</b></span></div></section><section className="agenda-card"><div className="aside-title"><h2>일정 목록</h2><button onClick={() => openCreate()}>＋</button></div>{items.length ? items.map(item => <div className={`agenda-item ${item.done ? 'done' : ''}`} key={item.id}><button className="check" style={{ borderColor: item.color, background: item.done ? item.color : 'transparent' }} onClick={() => toggleDone(item.id)}>{item.done ? '✓' : ''}</button><button className="agenda-copy" onClick={() => openEdit(item)}><strong>{item.title}</strong><span>{item.start} – {item.end} · {item.category}</span></button></div>) : <p className="agenda-empty">오늘의 시간을 천천히 채워보세요.</p>}</section><blockquote>“완벽한 하루보다,<br/>나에게 맞는 하루를.”</blockquote></aside>
    </div>
    {modalOpen && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setModalOpen(false)}><form className="modal" onSubmit={saveItem}><div className="modal-head"><div><p>{editing ? '일정 수정' : '새로운 일정'}</p><h2>시간을 계획해볼까요?</h2></div><button type="button" onClick={() => setModalOpen(false)}>×</button></div><label>일정 이름<input autoFocus value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="무엇을 할 예정인가요?" required /></label><div className="time-row"><label>시작<input type="time" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} /></label><span>→</span><label>종료<input type="time" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} /></label></div><label>분류<div className="category-row">{Object.keys(colors).map(cat => <button key={cat} type="button" className={form.category === cat ? 'selected' : ''} style={{ '--cat': colors[cat] } as React.CSSProperties} onClick={() => setForm({ ...form, category: cat })}>{cat}</button>)}</div></label><label>메모<textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="세부 내용을 적어두세요 (선택)" /></label>{minutes(form.end) <= minutes(form.start) && <p className="form-error">종료 시간은 시작 시간보다 늦어야 해요.</p>}<div className="modal-actions">{editing && <button type="button" className="delete" onClick={removeItem}>삭제</button>}<button type="button" className="cancel" onClick={() => setModalOpen(false)}>취소</button><button type="submit" className="save">{editing ? '수정 완료' : '일정 추가'}</button></div></form></div>}
  </main>;
}
