// Accounting closes each day at midnight (Oman time, UTC+4), so reservations
// can only be registered for today or later — never for a past day.
const BUSINESS_TZ = 'Asia/Muscat';

/** Today's date (YYYY-MM-DD) in the business timezone. */
export function businessToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export const PAST_RESERVATION_MESSAGE =
  'ثبت رزرو برای روزهای گذشته ممکن نیست؛ بعد از ساعت ۱۲ شب، روز قبل بسته می‌شود. تاریخ تحویل باید امروز یا بعد از آن باشد.';
