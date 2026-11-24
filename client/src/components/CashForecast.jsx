const money = value => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(value);
const dueText = value => { const days=Math.ceil((new Date(value)-Date.now())/86400000); return days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? 'Due today' : `Due in ${days} days`; };

export default function CashForecast({ forecast, risks, receivables }) {
  const invoices=receivables?.invoices||[];
  const fallbackOverdue=invoices.filter(invoice=>invoice.status==='OVERDUE').reduce((sum,invoice)=>sum+invoice.amount,0);
  const fallbackDue=invoices.filter(invoice=>invoice.status!=='OVERDUE').reduce((sum,invoice)=>sum+invoice.amount,0);
  const calculated=forecast||{expected:Math.round(fallbackDue+fallbackOverdue*.45),sevenDay:fallbackDue,overdue:fallbackOverdue,confidence:fallbackOverdue?'Moderate':'High',collectionRate:fallbackOverdue?45:90,upcoming:invoices};
  const fallbackRisks=[...invoices].sort((a,b)=>(a.status==='OVERDUE'?0:1)-(b.status==='OVERDUE'?0:1)).map((invoice,index)=>({id:invoice.id,name:invoice.customer,score:invoice.status==='OVERDUE'?Math.max(42,78-index*11):14,level:invoice.status==='OVERDUE'?'HIGH':'LOW',reason:invoice.status==='OVERDUE'?'Outstanding overdue invoice':'Invoice is due soon'}));
  const customerRisks=risks?.length?risks:fallbackRisks;
  return <section className="forecast scroll-section" data-section="cash-forecast">
    <div className="forecast-hero"><div><p className="eyebrow">CASH-FLOW FORECAST</p><h2>{money(calculated.expected)} <span>expected in 30 days</span></h2><p>Based on invoice due dates and historical recovery behaviour.</p></div><div className="confidence"><b>{calculated.confidence}</b><span>forecast confidence</span></div></div>
    <div className="forecast-metrics"><div><small>Expected in 7 days</small><b>{money(calculated.sevenDay)}</b></div><div><small>Overdue recovery pipeline</small><b>{money(calculated.overdue)}</b><em>{calculated.collectionRate}% likely recovery</em></div><div><small>Priority action</small><b>{calculated.overdue ? 'Recover overdue invoices' : 'Maintain payment follow-up'}</b><em>{calculated.overdue ? 'Send reminders to improve cash-in' : 'No major recovery risk detected'}</em></div></div>
    <div className="forecast-grid"><div><p className="eyebrow">UPCOMING CASH-IN</p>{calculated.upcoming.map(invoice=><div className="forecast-row" key={invoice.id}><span><b>{invoice.customer}</b><small>{dueText(invoice.dueDate)}</small></span><strong>{money(invoice.amount)}</strong><em className={invoice.status.toLowerCase()}>{invoice.status}</em></div>)}</div><div><p className="eyebrow">CUSTOMER PAYMENT RISK</p>{customerRisks.slice(0,4).map(customer=><div className="risk-row" key={customer.id}><span><b>{customer.name}</b><small>{customer.reason}</small></span><strong>{customer.score}/100</strong><em className={customer.level.toLowerCase()}>{customer.level} RISK</em></div>)}</div></div>
  </section>;
}
