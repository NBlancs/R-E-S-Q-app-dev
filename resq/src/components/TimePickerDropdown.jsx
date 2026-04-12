import { useState, useRef, useEffect } from 'react';
import '../styles/TimePickerDropdown.css';

const hours12 = Array.from({ length: 12 }, (_, i) => i + 1);
const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
const periods = ['AM', 'PM'];

const pad = (n) => String(n).padStart(2, '0');

/** Convert "HH:mm" (24h) or "hh:mm AM/PM" → { h12, min, period } */
const parse24 = (value) => {
  if (!value) return { h12: 12, min: 0, period: 'AM' };

  const raw = String(value).trim();

  const twentyFourHourMatch = raw.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (twentyFourHourMatch) {
    const h = Number(twentyFourHourMatch[1]);
    const m = Number(twentyFourHourMatch[2]);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return { h12, min: m, period };
  }

  const twelveHourMatch = raw.match(/^(\d{1,2}):([0-5]\d)\s*([AaPp][Mm])$/);
  if (twelveHourMatch) {
    const h12 = Number(twelveHourMatch[1]);
    const min = Number(twelveHourMatch[2]);
    const period = twelveHourMatch[3].toUpperCase();
    if (h12 >= 1 && h12 <= 12) {
      return { h12, min, period };
    }
  }

  return { h12: 12, min: 0, period: 'AM' };
};

/** Convert { h12, min, period } → "HH:mm" (24h) */
const to24 = (h12, min, period) => {
  let h = h12 % 12;
  if (period === 'PM') h += 12;
  return `${pad(h)}:${pad(min)}`;
};

const TimePickerDropdown = ({ value, onChange, placeholder = 'Select time' }) => {
  const parsed = parse24(value);
  const hour = parsed.h12;
  const minute = parsed.min;
  const period = parsed.period;
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (h, m, p) => {
    onChange(to24(h, m, p));
  };

  const displayValue = value ? `${hour}:${pad(minute)} ${period}` : '';

  return (
    <div className="tp-dropdown" ref={ref}>
      <input
        className="tp-dropdown__input"
        readOnly
        value={displayValue}
        placeholder={placeholder}
        onClick={() => setOpen(!open)}
      />
      {open && (
        <div className="tp-dropdown__panel">
          <div className="tp-dropdown__columns">
            {/* Hours */}
            <div className="tp-dropdown__col">
              <div className="tp-dropdown__col-label">Hr</div>
              <div className="tp-dropdown__list">
                {hours12.map((h) => (
                  <button
                    key={h}
                    type="button"
                    className={`tp-dropdown__item ${h === hour ? 'tp-dropdown__item--active' : ''}`}
                    onClick={() => select(h, minute, period)}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div className="tp-dropdown__col">
              <div className="tp-dropdown__col-label">Min</div>
              <div className="tp-dropdown__list">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`tp-dropdown__item ${m === minute ? 'tp-dropdown__item--active' : ''}`}
                    onClick={() => select(hour, m, period)}
                  >
                    {pad(m)}
                  </button>
                ))}
              </div>
            </div>

            {/* AM / PM */}
            <div className="tp-dropdown__col tp-dropdown__col--narrow">
              <div className="tp-dropdown__col-label">&nbsp;</div>
              <div className="tp-dropdown__list">
                {periods.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`tp-dropdown__item ${p === period ? 'tp-dropdown__item--active' : ''}`}
                    onClick={() => select(hour, minute, p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePickerDropdown;
