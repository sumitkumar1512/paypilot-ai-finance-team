import { useEffect, useState } from 'react';
import { api } from '../lib/api';
const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
export default function InvoiceManager({canModify}){
  const [items,setItems]=useState([]),[message,setMessage]=useState('');
  const load=()=>api.invoices().then(setItems).catch(e=>setMessage(e.message));
  useEffect(load,[]);
  const email=async id=>{try{const result=await api.emailInvoice(id);setMessage(result.message);load()}catch(e){setMessage(e.message)}};
  return <section className="panel invoice-manager"><div className="panel-heading"><div><p className="eyebrow">MANAGE INVOICES</p><h2>Stored invoices and customer delivery</h2></div><span className="status-dot">{items.length} stored</span></div>{message&&<p className="ops-message">{message}</p>}<div className="managed-invoices">{items.map(invoice=><div className="managed-invoice" key={invoice.id||invoice._id}><span><b>{invoice.invoiceNumber||invoice.id}</b><small>{invoice.customer} · {invoice.customerEmail||'No email on record'} · due {new Date(invoice.dueDate).toLocaleDateString('en-IN')}</small></span><em className={(invoice.status||'DRAFT').toLowerCase()}>{invoice.status||'DRAFT'}</em><strong>{money(invoice.amount)}</strong>{canModify&&<button className="text-button" onClick={()=>email(invoice.invoiceNumber||invoice.id)}>Email customer</button>}</div>)}</div></section>
}
