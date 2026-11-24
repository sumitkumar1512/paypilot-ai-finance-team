import { demoData } from '../utils/seedData.js';

const recent = (days) => demoData.transactions.filter(t => Date.now() - new Date(t.createdAt).getTime() < days * 86400000);
const successfulRevenue = ts => ts.filter(t => t.status === 'SUCCESS').reduce((sum, t) => sum + t.amount, 0);
const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

export function getRevenue(days = 7) {
  const current = successfulRevenue(recent(days));
  const previous = successfulRevenue(demoData.transactions.filter(t => { const age = (Date.now() - new Date(t.createdAt)) / 86400000; return age >= days && age < days * 2; }));
  return { current, previous, change: previous ? ((current - previous) / previous) * 100 : 0, formatted: money(current) };
}
export function getTransactions(days = 30) { return recent(days); }
export function getFailedPayments(days = 7) { return recent(days).filter(t => t.status === 'FAILED'); }
export function getReceivables(invoices = demoData.invoices) {
  const outstanding = invoices.filter(invoice => invoice.status !== 'PAID').reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter(i => i.status === 'OVERDUE');
  return { outstanding, overdueAmount: overdue.reduce((s, i) => s + i.amount, 0), invoices };
}
export function getCashPosition() { return { available: 842000, inflowExpected: 284000, status: 'healthy' }; }
export function getCustomers() { return demoData.customers; }
export function getCashForecast(invoiceSource = demoData.invoices) {
  // Invoice due dates are date-only values. Normalise the clock portion so a
  // payment due today is not incorrectly treated as already in the past.
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const end = new Date(today); end.setDate(end.getDate() + 30);
  // An invoice can remain DRAFT when email delivery is unavailable. It is
  // still an issued receivable, so its due date must drive the forecast.
  const invoices = invoiceSource.filter(invoice => ['DRAFT', 'DUE', 'OVERDUE', 'SENT'].includes(invoice.status));
  const overdue = invoices.filter(invoice => invoice.status === 'OVERDUE').reduce((sum, invoice) => sum + invoice.amount, 0);
  const dueOn = value => { const due = new Date(value); due.setHours(0, 0, 0, 0); return due; };
  const scheduled = invoices.filter(invoice => dueOn(invoice.dueDate) >= today && dueOn(invoice.dueDate) <= end).reduce((sum, invoice) => sum + invoice.amount, 0);
  const sevenDay = invoices.filter(invoice => { const due = dueOn(invoice.dueDate); const limit = new Date(today); limit.setDate(limit.getDate() + 7); return due >= today && due <= limit; }).reduce((sum, invoice) => sum + invoice.amount, 0);
  const collectionRate = overdue ? 45 : 90;
  const expected = scheduled + overdue * (collectionRate / 100);
  // Use completed-payment history as a run-rate, then add the invoices that
  // are already scheduled for collection. It makes the horizon view react to
  // imported payments instead of being a set of fixed display values.
  const successfulLast90 = recent(90).filter(transaction => transaction.status === 'SUCCESS');
  const dailyRunRate = successfulLast90.reduce((sum, transaction) => sum + transaction.amount, 0) / 90;
  const available = getCashPosition().available;
  const horizons = [30, 60, 90];
  const projections = horizons.map(days => {
    const horizon = new Date(today); horizon.setDate(horizon.getDate() + days);
    const dueWithinHorizon = invoices.filter(invoice => {
      const due = dueOn(invoice.dueDate);
      return due >= today && due <= horizon;
    }).reduce((sum, invoice) => sum + invoice.amount, 0);
    const overdueRecovery = overdue * (collectionRate / 100) * Math.min(1, days / 30);
    const runRateInflow = dailyRunRate * days;
    const inflow = Math.round(runRateInflow + dueWithinHorizon + overdueRecovery);
    // Until expense integrations are connected, costs are transparently
    // modelled as a conservative percentage of historic cash-in.
    const outflow = Math.round(runRateInflow * 0.58);
    return { days, inflow, outflow, closing: available + inflow - outflow };
  });
  return { expected: Math.round(expected), sevenDay, overdue, confidence: overdue ? 'Moderate' : 'High', collectionRate, projections, upcoming: invoices.sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0,5) };
}
export function getCustomerRiskScores(invoiceSource = demoData.invoices) {
  return demoData.customers.map(customer => {
    const invoices = invoiceSource.filter(invoice => invoice.customer === customer.name);
    const transactions = demoData.transactions.filter(transaction => transaction.customer === customer.name);
    const overdue = invoices.filter(invoice => invoice.status === 'OVERDUE');
    const failed = transactions.filter(transaction => transaction.status === 'FAILED');
    const score = Math.min(100, overdue.length * 24 + failed.length * 2 + (overdue.some(invoice => (Date.now() - new Date(invoice.dueDate)) / 86400000 > 7) ? 18 : 0));
    const level = score >= 55 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW';
    return { ...customer, score, level, outstanding: invoices.reduce((sum, invoice) => sum + invoice.amount, 0), overdueCount: overdue.length, failedPayments: failed.length, reason: overdue.length ? `${overdue.length} overdue invoice${overdue.length > 1 ? 's' : ''}` : failed.length ? `${failed.length} failed payment attempts` : 'Reliable payment history' };
  }).sort((a,b) => b.score - a.score);
}
export function getPaymentHealth(days = 7) {
  const current = recent(days), historical = demoData.transactions.filter(t => { const age = (Date.now() - new Date(t.createdAt)) / 86400000; return age >= days && age < days * 2; });
  const rate = ts => ts.length ? (ts.filter(t => t.status === 'FAILED').length / ts.length) * 100 : 0;
  const currentFailure = rate(current), historicalFailure = rate(historical);
  const methodStats = ['UPI', 'CARD', 'NETBANKING'].map(method => {
    const set = current.filter(t => t.method === method); const success = set.length ? (set.filter(t => t.status === 'SUCCESS').length / set.length) * 100 : 0;
    return { method, success: Number(success.toFixed(1)), failed: set.filter(t => t.status === 'FAILED').length, total: set.length };
  });
  const failed = current.filter(t => t.status === 'FAILED');
  const byMethod = Object.entries(failed.reduce((a, t) => ({ ...a, [t.method]: (a[t.method] || 0) + 1 }), {})).sort((a,b)=>b[1]-a[1]);
  const byHour = Object.entries(failed.reduce((a, t) => { const h = new Date(t.createdAt).getHours(); const slot = h >= 14 && h < 17 ? '2:00 PM – 5:00 PM' : 'Other hours'; return { ...a, [slot]: (a[slot] || 0) + 1 }; }, {})).sort((a,b)=>b[1]-a[1]);
  return { successRate: Number((100 - currentFailure).toFixed(1)), failureRate: Number(currentFailure.toFixed(1)), historicalFailure: Number(historicalFailure.toFixed(1)), methodStats, affectedMethod: byMethod[0]?.[0] || 'UPI', peakTime: byHour[0]?.[0] || '2:00 PM – 5:00 PM', impact: failed.reduce((s,t)=>s+t.amount,0), failed };
}
export function revenueTrend(days = 7) {
  // Keep one bucket per calendar day for the monthly view, and exactly one
  // bucket per month for the longer views.
  const buckets = days <= 31 ? days : ({ 90: 3, 180: 6, 365: 12 }[days] || Math.ceil(days / 30));
  return Array.from({ length: buckets }, (_, i) => {
    const end = new Date(); end.setDate(end.getDate() - (buckets - 1 - i) * (days <= 31 ? 1 : 30));
    const start = new Date(end); start.setDate(start.getDate() - (days <= 31 ? 1 : 29));
    const total = demoData.transactions.filter(t => { const date = new Date(t.createdAt); return date >= start && date <= end && t.status === 'SUCCESS'; }).reduce((s,t)=>s+t.amount,0);
    const day = days <= 7
      ? end.toLocaleDateString('en-IN', { weekday: 'short' })
      : days <= 31
        ? end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
        : end.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    return { day, revenue: total };
  });
}
export { money };
