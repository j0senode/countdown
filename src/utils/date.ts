import type { Countdown, GeneratedDeathDate } from '../types';

const MIN_AGE = 55;
const MAX_AGE = 105;
const MIN_USER_AGE = 13;
const MAX_ATTEMPTS = 500;

const MESSAGES = [
  'Interesting.',
  'That gives you some time.',
  'Use it wisely.',
  'Not soon. Not forever.',
  'The calendar has spoken.',
  "That's one way to plan ahead.",
  'Unconfirmed, obviously.',
  'Do not take this seriously.',
  'Still, weird to see it.',
  'Time remains undefeated.',
];

export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function getMaximumBirthDate(today = new Date()): string {
  return formatDateForInput(subtractYears(today, MIN_USER_AGE));
}

export function validateBirthDate(input: string, today = new Date()): string | null {
  if (!input) {
    return 'Enter your date of birth.';
  }

  const birthDate = new Date(`${input}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) {
    return 'Enter a valid date.';
  }

  if (birthDate > today) {
    return 'Birth date cannot be in the future.';
  }

  if (getAgeOnDate(birthDate, today) < MIN_USER_AGE) {
    return 'You must be at least 13 years old.';
  }

  return null;
}

export function generateDeathDate(birthDate: Date, today = new Date()): GeneratedDeathDate {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const ageAtDeath = randomInt(MIN_AGE, MAX_AGE);
    const deathDate = createDeathDate(birthDate, ageAtDeath);

    if (deathDate <= today) {
      continue;
    }

    return {
      deathDate,
      ageAtDeath,
      countdown: getCountdown(today, deathDate),
      message: MESSAGES[randomInt(0, MESSAGES.length - 1)],
    };
  }

  throw new Error('Unable to generate a future fictional date.');
}

export function getCountdown(from: Date, to: Date): Countdown {
  let cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const target = new Date(to.getFullYear(), to.getMonth(), to.getDate());

  let years = 0;
  while (addYears(cursor, 1) <= target) {
    cursor = addYears(cursor, 1);
    years += 1;
  }

  let months = 0;
  while (addMonths(cursor, 1) <= target) {
    cursor = addMonths(cursor, 1);
    months += 1;
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.round((target.getTime() - cursor.getTime()) / msPerDay);

  return { years, months, days };
}

function createDeathDate(birthDate: Date, ageAtDeath: number): Date {
  const date = addYears(birthDate, ageAtDeath);
  const randomMonthOffset = randomInt(0, 11);
  const shiftedMonth = addMonths(date, randomMonthOffset);
  const maxDay = daysInMonth(shiftedMonth.getFullYear(), shiftedMonth.getMonth());
  const randomDay = randomInt(1, maxDay);

  return new Date(
    shiftedMonth.getFullYear(),
    shiftedMonth.getMonth(),
    randomDay,
  );
}

function subtractYears(date: Date, years: number): Date {
  return new Date(date.getFullYear() - years, date.getMonth(), date.getDate());
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

function getAgeOnDate(birthDate: Date, date: Date): number {
  let age = date.getFullYear() - birthDate.getFullYear();
  const hasBirthdayPassed =
    date.getMonth() > birthDate.getMonth() ||
    (date.getMonth() === birthDate.getMonth() && date.getDate() >= birthDate.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
