export type Countdown = {
  years: number;
  months: number;
  days: number;
};

export type GeneratedDeathDate = {
  deathDate: Date;
  ageAtDeath: number;
  countdown: Countdown;
  message: string;
};
