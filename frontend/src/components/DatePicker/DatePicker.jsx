import React from 'react';
import './DatePicker.css';

function pad(n){ return String(n).padStart(2,'0'); }

function toISODate(date){
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
}

function parseISODate(str){
  if (!str) return null;
  const parts = String(str).split('-').map(Number);
  if (parts.length < 3) return null;
  const [y,m,d] = parts;
  return new Date(y, m-1, d);
}

export default function DatePicker({ value, onChange }){
  const [visible, setVisible] = React.useState(false);
  const [viewDate, setViewDate] = React.useState(() => parseISODate(value) || new Date());
  const rootRef = React.useRef(null);

  React.useEffect(() => {
    if (value) setViewDate(parseISODate(value) || new Date());
  }, [value]);

  React.useEffect(() => {
    function onDocClick(e){
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setVisible(false);
    }
    if (visible) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [visible]);

  function startOfMonth(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }
  function daysInMonth(d){ return new Date(d.getFullYear(), d.getMonth()+1, 0).getDate(); }

  const monthStart = startOfMonth(viewDate);
  const firstWeekday = monthStart.getDay(); // 0 (Sun) - 6 (Sat)
  const totalDays = daysInMonth(viewDate);

  function handleSelect(day){
    const sel = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(toISODate(sel));
    setVisible(false);
  }

  function prevMonth(){ setViewDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1)); }
  function nextMonth(){ setViewDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1)); }

  const weeks = [];
  let cells = [];
  // fill empty cells before month start
  for(let i=0;i<firstWeekday;i++) cells.push(null);
  for(let d=1; d<= totalDays; d++){
    cells.push(d);
  }
  // split into weeks
  for(let i=0;i<cells.length;i+=7) weeks.push(cells.slice(i,i+7));

  const displayLabel = value ? (() => {
    const d = parseISODate(value);
    return d ? d.toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'short' }) : 'Escolher data';
  })() : 'Escolher data';

  return (
    <div className="dp-root" ref={rootRef}>
      <button type="button" className="dp-toggle" onClick={() => setVisible(v => !v)}>
        {displayLabel}
      </button>
      {visible && (
        <div className="dp-popover" role="dialog">
          <div className="dp-header">
            <button type="button" onClick={prevMonth} className="dp-nav">‹</button>
            <div className="dp-month">{viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</div>
            <button type="button" onClick={nextMonth} className="dp-nav">›</button>
          </div>
          <div className="dp-weekdays">
            {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(w => <div key={w} className="dp-weekday">{w}</div>)}
          </div>
          <div className="dp-grid">
            {weeks.map((week,wi) => (
              <div key={wi} className="dp-week">
                {week.map((day,di) => (
                  <div key={di} className={`dp-cell ${day? 'dp-day':'dp-empty'}`}>
                    {day ? <button type="button" className="dp-day-btn" onClick={() => handleSelect(day)}>{day}</button> : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
