import { useState } from 'react';

const formatMoney = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function Receivables({ data, onReminder, canRemind }) {
  const [open, setOpen] = useState(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const days = d => Math.max(1, Math.floor((Date.now() - new Date(d)) / 86400000));

  const prepareReminder = async invoice => {
    try {
      setError('');
      setSent(false);
      setOpen(await onReminder(invoice.id));
    } catch (err) { setError(err.message); }
  };

  const sendReminder = async () => {
    try {
      await onReminder({ message: open.message, invoiceId: open.invoice.id }, true);
      setSent(true);
    } catch (err) { setError(err.message); }
  };

  return <section className="panel receivables">
    <div className="panel-heading"><div><p className="eyebrow">RECEIVABLES</p><h2>{formatMoney(data.outstanding)} <span>outstanding</span></h2></div><span className="overdue">{formatMoney(data.overdueAmount)} overdue</span></div>
    <div className="invoice-list">{data.invoices.map(invoice => <button key={invoice.id} className="invoice" disabled={!canRemind} onClick={() => prepareReminder(invoice)}><span className="avatar">{invoice.customer.slice(0, 1)}</span><span className="invoice-name"><b>{invoice.customer}</b><small>{invoice.id} · {invoice.status === 'OVERDUE' ? `${days(invoice.dueDate)} days overdue` : 'Due soon'}</small></span><strong>{formatMoney(invoice.amount)}</strong><span>›</span></button>)}</div>
    {!canRemind && <p className="permission-note">Your role is read-only. Only the Owner, Accountant, or Finance Manager can send reminders.</p>}
    {error && <p className="ops-message">{error}</p>}
    {open && <div className="reminder"><button className="close" onClick={() => setOpen(null)}>×</button><p className="eyebrow">AI-GENERATED REMINDER</p><p>{open.message}</p><button className="primary" onClick={sendReminder}>{sent ? '✓ Reminder queued' : 'Send reminder'}</button></div>}
  </section>;
}
