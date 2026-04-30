import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'death-countdown-app';
const MIN_USER_AGE = 1;

type StoredSession = {
  gender: string;
  birthDate: string;
  deathDateIso: string;
};

type CountdownParts = {
  years: number;
  months: number;
  days: number;
  hours: number;
  seconds: number;
  isComplete: boolean;
};

function App() {
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [deathDateIso, setDeathDateIso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const maxBirthDate = useMemo(() => getMaximumBirthDate(new Date()), []);
  const deathDate = deathDateIso ? new Date(deathDateIso) : null;
  const countdown = deathDate ? getCountdownParts(now, deathDate) : null;

  useEffect(() => {
    const rawSession = localStorage.getItem(STORAGE_KEY);

    if (!rawSession) {
      return;
    }

    try {
      const parsed = JSON.parse(rawSession) as StoredSession;

      if (!parsed.gender || !parsed.birthDate || !parsed.deathDateIso) {
        return;
      }

      const storedDeathDate = new Date(parsed.deathDateIso);
      if (Number.isNaN(storedDeathDate.getTime())) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      setGender(parsed.gender);
      setBirthDate(parsed.birthDate);
      setDeathDateIso(parsed.deathDateIso);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm(gender, birthDate);
    if (validationError) {
      setError(validationError);
      return;
    }

    const generatedDeathDate = generateDeathDate(gender, birthDate);
    const session: StoredSession = {
      gender,
      birthDate,
      deathDateIso: generatedDeathDate.toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setDeathDateIso(session.deathDateIso);
    setNow(new Date());
    setError(null);
  }

  return (
    <main className="app-shell">
      <section className="card">
        <p className="eyebrow">Death Countdown Generator</p>

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Gender</span>
            <div className="custom-select" ref={dropdownRef}>
              <button
                type="button"
                className={`select-trigger${isDropdownOpen ? ' is-open' : ''}`}
                onClick={() => setIsDropdownOpen((open) => !open)}
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
              >
                <span>{getGenderLabel(gender)}</span>
                <span className="select-arrow" aria-hidden="true">
                  {isDropdownOpen ? '−' : '+'}
                </span>
              </button>

              {isDropdownOpen ? (
                <div className="select-menu" role="listbox" aria-label="Gender options">
                  {GENDER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`select-option${gender === option.value ? ' is-selected' : ''}`}
                      onClick={() => {
                        setGender(option.value);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </label>

          <label className="field">
            <span>Date of birth</span>
            <input
              type="date"
              value={birthDate}
              max={maxBirthDate}
              onChange={(event) => setBirthDate(event.target.value)}
            />
          </label>

          <div className="actions">
            <button type="submit">Generate date</button>
          </div>
        </form>

        {error ? <p className="message error-message">{error}</p> : null}

        {deathDate && countdown ? (
          <section className="result">
            <p className="result-label">Generated death date</p>
            <h2>{formatLongDate(deathDate)}</h2>

            <div className="countdown-stack">
              <CountdownItem label="Years" value={countdown.years} />
              <CountdownItem label="Months" value={countdown.months} />
              <CountdownItem label="Days" value={countdown.days} />
              <CountdownItem label="Hours" value={countdown.hours} />
              <CountdownItem label="Seconds" value={countdown.seconds} />
            </div>

            {countdown.isComplete ? (
              <p className="message complete-message">
                Countdown finished. Generate another fictional date any time.
              </p>
            ) : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}

type CountdownItemProps = {
  label: string;
  value: number;
};

function CountdownItem({ label, value }: CountdownItemProps) {
  return (
    <article className="countdown-item">
      <span className="countdown-label">{label}</span>
      <strong className="countdown-value">{String(value).padStart(2, '0')}</strong>
    </article>
  );
}

const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
];

function getGenderLabel(value: string): string {
  return GENDER_OPTIONS.find((option) => option.value === value)?.label ?? 'Select gender';
}

function validateForm(gender: string, birthDate: string): string | null {
  if (!gender) {
    return 'Please select a gender.';
  }

  if (!birthDate) {
    return 'Please enter a date of birth.';
  }

  const parsedBirthDate = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(parsedBirthDate.getTime())) {
    return 'Please enter a valid date of birth.';
  }

  if (parsedBirthDate > new Date()) {
    return 'Date of birth cannot be in the future.';
  }

  if (getAgeToday(parsedBirthDate) < MIN_USER_AGE) {
    return 'Please enter a realistic date of birth.';
  }

  return null;
}

function getMaximumBirthDate(today: Date): string {
  const latest = new Date(today);
  latest.setFullYear(latest.getFullYear() - MIN_USER_AGE);
  return formatDateForInput(latest);
}

function getAgeToday(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const birthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!birthdayPassed) {
    age -= 1;
  }

  return age;
}

function generateDeathDate(gender: string, birthDate: string): Date {
  const birth = new Date(`${birthDate}T00:00:00`);
  const ageRanges: Record<string, [number, number]> = {
    female: [68, 102],
    male: [62, 96],
    other: [64, 99],
  };

  const [minAge, maxAge] = ageRanges[gender] ?? ageRanges.other;
  const yearsToAdd = randomInt(minAge, maxAge);
  const randomMonth = randomInt(0, 11);
  const randomDay = randomInt(1, 28);
  const randomHour = randomInt(0, 23);
  const randomMinute = randomInt(0, 59);
  const randomSecond = randomInt(0, 59);

  return new Date(
    birth.getFullYear() + yearsToAdd,
    birth.getMonth() + randomMonth,
    randomDay,
    randomHour,
    randomMinute,
    randomSecond,
  );
}

function getCountdownParts(from: Date, to: Date): CountdownParts {
  if (to <= from) {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      seconds: 0,
      isComplete: true,
    };
  }

  let cursor = new Date(from);
  let years = 0;
  while (addYears(cursor, 1) <= to) {
    cursor = addYears(cursor, 1);
    years += 1;
  }

  let months = 0;
  while (addMonths(cursor, 1) <= to) {
    cursor = addMonths(cursor, 1);
    months += 1;
  }

  let days = 0;
  while (addDays(cursor, 1) <= to) {
    cursor = addDays(cursor, 1);
    days += 1;
  }

  let hours = 0;
  while (addHours(cursor, 1) <= to) {
    cursor = addHours(cursor, 1);
    hours += 1;
  }

  const remainingMs = Math.max(0, to.getTime() - cursor.getTime());
  const seconds = Math.floor(remainingMs / 1000);

  return {
    years,
    months,
    days,
    hours,
    seconds,
    isComplete: false,
  };
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export default App;
