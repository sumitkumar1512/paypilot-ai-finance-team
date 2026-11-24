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
export function getReceivables() {
  const outstanding = demoData.invoices.reduce((s, i) => s + i.amount, 0);
  const overdue = demoData.invoices.filter(i => i.status === 'OVERDUE');
  return { outstanding, overdueAmount: overdue.reduce((s, i) => s + i.amount, 0), invoices: demoData.invoices };
}
export function getCashPosition() { return { available: 842000, inflowExpected: 284000, status: 'healthy' }; }
export function getCustomers() { return demoData.customers; }
export function getCashForecast() {
  const today = new Date();
  const end = new Date(today); end.setDate(end.getDate() + 30);
  const invoices = demoData.invoices.filter(invoice => ['DUE', 'OVERDUE', 'SENT'].includes(invoice.status));
  const overdue = invoices.filter(invoice => invoice.status === 'OVERDUE').reduce((sum, invoice) => sum + invoice.amount, 0);
  const scheduled = invoices.filter(invoice => new Date(invoice.dueDate) >= today && new Date(invoice.dueDate) <= end).reduce((sum, invoice) => sum + invoice.amount, 0);
  const sevenDay = invoices.filter(invoice => { const due = new Date(invoice.dueDate); const limit = new Date(today); limit.setDate(limit.getDate() + 7); return due >= today && due <= limit; }).reduce((sum, invoice) => sum + invoice.amount, 0);
  const expected = scheduled + overdue * .45;
  return { expected: Math.round(expected), sevenDay, overdue, confidence: overdue ? 'Moderate' : 'High', collectionRate: overdue ? 45 : 90, upcoming: invoices.sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0,4) };
}
export function getCustomerRiskScores() {
  return demoData.customers.map(customer => {
    const invoices = demoData.invoices.filter(invoice => invoice.customer === customer.name);
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
