import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useMemo, useState } from 'react';

const colors = ['#6759e8', '#48a886', '#f2a154'];

export default function PaymentMix({ health }) {
  const [selected, setSelected] = useState(null);
  const methodData = useMemo(() => health.methodStats.map((item, index) => ({ name: item.method === 'NETBANKING' ? 'Net Banking' : item.method, value: item.total, failed: item.failed, success: item.success, color: colors[index] })), [health]);
  const statusData = useMemo(() => {
    const total = methodData.reduce((sum, item) => sum + item.value, 0);
    const failed = methodData.reduce((sum, item) => sum + item.failed, 0);
    return [{ name: 'Successful', value: total - failed, color: '#48a886' }, { name: 'Failed', value: failed, color: '#f07168' }];
  }, [methodData]);
  const active = selected ? methodData.find(item => item.name === selected) : null;

  return <section className="panel payment-mix scroll-section" data-section="payment-health">
    <div className="panel-heading"><div><p className="eyebrow">PAYMENT MIX</p><h2>Method and status split</h2></div><span className="status-dot">Interactive</span></div>
    <div className="mix-grid"><div className="pie-wrap"><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={methodData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={4} onClick={entry => setSelected(entry.name === selected ? null : entry.name)}>{methodData.map((entry, index) => <Cell key={entry.name} fill={entry.color} opacity={!selected || selected === entry.name ? 1 : .28} cursor="pointer" />)}</Pie><Tooltip formatter={(value, name) => [`${value} payments`, name]} /><Legend iconType="circle" /></PieChart></ResponsiveContainer></div>
      <div className="pie-wrap"><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={4}>{statusData.map(entry => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip formatter={(value, name) => [`${value} payments`, name]} /><Legend iconType="circle" /></PieChart></ResponsiveContainer></div></div>
    <div className="mix-detail" aria-live="polite">{active ? <><b>{active.name}</b><span>{active.value} payments · {active.success}% success · {active.failed} failed</span></> : <span>Click a payment-method slice to focus its performance.</span>}</div>
  </section>;
}
