import Recurring from '../models/Recurring.js';
import { generateDueRecurring } from '../routes/recurring.js';

const runScheduler = async () => {
  const now = new Date();
  const users = await Recurring.distinct('user', {
    active: true,
    nextDueDate: { $lte: now },
  });

  let totals = 0;
  for (const userId of users) {
    const result = await generateDueRecurring(userId);
    totals += result.generated;
  }

  if (totals > 0) {
    console.log(`[scheduler] generated ${totals} recurring expense(s) for ${users.length} user(s)`);
  }
  return totals;
};

let timer = null;
let intervalMs = 60 * 60 * 1000;

export const startRecurringScheduler = (ms = intervalMs) => {
  if (timer) return;
  intervalMs = ms;

  const tick = () => {
    runScheduler().catch((err) => {
      console.error('[scheduler] error:', err.message);
    });
  };

  tick();
  timer = setInterval(tick, intervalMs);
  timer.unref?.();
  console.log(
    `[scheduler] running every ${intervalMs / 60000} min (first run now)`
  );
};

export const stopRecurringScheduler = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};