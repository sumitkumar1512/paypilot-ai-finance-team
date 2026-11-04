import { useEffect, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from './lib/api';
import Login from './components/Login';
import AskPilot from './components/AskPilot';
import PaymentHealth from './components/PaymentHealth';
import Receivables from './components/Receivables';
import PaymentMix from './components/PaymentMix';
import Checkout from './components/Checkout';
import Operations from './components/Operations';
import InvoiceManager from './components/InvoiceManager';

const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 2 }).format(n);
const navItems = [['overview','▦','Overview'],['transactions','◴','Transactions'],['payment-health','◌','Payment health'],['receivables','◫','Receivables'],['manage-invoices','▤','Manage invoices'],['finance-operations','✉','Reminder center'],['finance-operations','◈','Finance operations'],['ai-insights','✦','AI insights']];

function Dashboard({ user, onLogout }) {
  const [data, setData] = useState(null), [answer, setAnswer] = useState(null), [asking, setAsking] = useState(false), [error, setError] = useState('');
  const [active, setActive] = useState('overview'), [expanded, setExpanded] = useState(false), [allTransactions, setAllTransactions] = useState([]), [showAlert, setShowAlert] = useState(false), [period,setPeriod]=useState(7),[search,setSearch]=useState(''),[showProfile,setShowProfile]=useState(false),[notifications,setNotifications]=useState([]),[searchError,setSearchError]=useState(''),[theme,setTheme]=useState(()=>localStorage.getItem('paypilot-theme')||'light');
  const loadDashboard = value => api.dashboard(value).then(setData).catch(e => setError(e.message));
  useEffect(() => { loadDashboard(period); }, [period]);
  useEffect(()=>{api.notifications().then(setNotifications).catch(()=>{})},[]);
  useEffect(() => { if (!data) return; const elements = document.querySelectorAll('[data-section]'); const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in-view'); setActive(entry.target.dataset.section); } }), { threshold: .18 }); elements.forEach(el => observer.observe(el)); return () => observer.disconnect(); }, [data]);
  const go = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const ask = async question => { setAsking(true); try { setAnswer(await api.ask(question)); } finally { setAsking(false); } };
  const reminder = async (value, send = false) => send ? api.sendReminder({...value,businessName:user.businessName||'Your Business'}) : api.reminder({invoiceId:value,businessName:user.businessName||'Your Business'});
  const toggleTransactions = async () => { if (!expanded && !allTransactions.length) setAllTransactions(await api.transactions()); setExpanded(value => !value); };
  const searchPayments = async () => { try { setSearchError(''); const results=await api.transactions(search);setAllTransactions(results);setExpanded(true);go('transactions'); } catch(e){setSearchError(e.message)} };
  if (error) return <div className="center-error">Could not load PayPilot: {error}</div>;
  if (!data) return <div className="loading"><div className="loader"/>Loading your financial command center…</div>;
  const periodLabel = ({7:'Last 7 days',30:'Past month',90:'Past 3 months',180:'Past 6 months',365:'Past year'})[period];
  const stats = [['Revenue',money(data.revenue),periodLabel,'overview'],['Transactions',data.transactions.toLocaleString('en-IN'),periodLabel,'transactions'],['Success rate',`${data.successRate}%`,`${periodLabel} payment flow`,'payment-health']];
  const stream = expanded ? allTransactions : data.recentTransactions;
  const role=(user.role||'OWNER').toUpperCase(),canModify=['OWNER','ACCOUNTANT'].includes(role),canRemind=canModify||role==='FINANCE_MANAGER';
  const toggleTheme=()=>setTheme(current=>{const next=current==='light'?'dark':'light';localStorage.setItem('paypilot-theme',next);return next});
  return <div className={`app-shell ${theme}`}><aside>
    <button className="brand" onClick={() => go('overview')}><div className="logo-mark">P</div><span>paypilot</span></button>
    <nav>{navItems.map(([id, icon, label]) => <button key={id} className={active === id ? 'active' : ''} onClick={() => go(id)}><i>{icon}</i><span>{label}</span></button>)}</nav>
    <div className="side-bottom"><div className="plan"><b>PRO PLAN</b><span>All systems operational</span></div><button onClick={onLogout}>↪ <span>Sign out</span></button></div>
  </aside><main className="dashboard">
    <header id="overview" data-section="overview" className="scroll-section"><div><p className="eyebrow">{user.businessName||'FINANCIAL COMMAND CENTER'}</p><h1>Good afternoon, {user.name}. <span>Here’s your business pulse.</span></h1></div><div className="header-actions"><input className="search-input" placeholder="Search payments" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchPayments()} /><button className="search-button" aria-label="Search payments" onClick={searchPayments}>⌕</button><button className="theme-toggle" aria-label="Toggle dark mode" onClick={toggleTheme}>{theme==='light'?'☾':'☀'}</button><button className="bell" aria-label="Payment alerts" onClick={() => setShowAlert(v => !v)}>●<em>{notifications.filter(n=>!n.read).length||''}</em></button><button className="user-avatar" aria-label="Open profile" onClick={()=>setShowProfile(v=>!v)}>{user.name[0]}</button></div>{searchError&&<div className="search-error">{searchError}</div>}{showAlert && <div className="notification-popover">{notifications.length?notifications.map(n=><div key={n.id||n._id}><b>{n.title}</b><span>{n.message}</span></div>):'No new alerts.'}<button onClick={()=>{setShowAlert(false);go('payment-health')}}>Review payment health →</button></div>}{showProfile&&<div className="profile-popover"><b>{user.name}</b><span>{user.businessName||'PayPilot Workspace'}</span><span>{user.email}</span><span>Role: {(user.role||'OWNER').replace('_',' ')}</span><button onClick={onLogout}>Sign out</button></div>}</header>
    <div className="stats scroll-section" data-section="overview">{stats.map(([label,value,caption,id]) => <button className="stat" key={label} onClick={() => go(id)}><p>{label}</p><h2>{value}</h2><small>{caption}</small></button>)}</div>
    <section className="chart-panel scroll-section" data-section="overview"><div className="panel-heading"><div><p className="eyebrow">REVENUE TREND</p><h2>Successful payments over time</h2></div><select className="range" value={period} onChange={e=>setPeriod(Number(e.target.value))}><option value="7">Last 7 days</option><option value="30">Past month</option><option value="90">Past 3 months</option><option value="180">Past 6 months</option><option value="365">Past year</option></select></div><ResponsiveContainer width="100%" height={260}><AreaChart data={data.trend}><defs><linearGradient id="revenue" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7266f0" stopOpacity={.35}/><stop offset="100%" stopColor="#7266f0" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="day" axisLine={false} tickLine={false} interval={period === 30 ? 2 : 0} minTickGap={0} tick={{ fontSize: 10 }}/><YAxis hide/><Tooltip formatter={v=>money(v)} cursor={{stroke:'#dcd9ff'}}/><Area type="monotone" dataKey="revenue" stroke="#6658e8" strokeWidth={3} fill="url(#revenue)"/></AreaChart></ResponsiveContainer></section>
    <div className="two-col"><div id="payment-health" data-section="payment-health" className="scroll-section"><PaymentHealth health={data.health}/></div><div id="receivables" data-section="receivables" className="scroll-section"><div id="reminder-center" data-section="reminder-center"><Receivables data={data.receivables} onReminder={reminder} canRemind={canRemind}/></div></div></div>
    <PaymentMix health={data.health}/>
    <Checkout/>
    <div id="manage-invoices" data-section="manage-invoices" className="scroll-section"><InvoiceManager canModify={canModify}/></div>
    <div id="finance-operations" data-section="finance-operations" className="scroll-section"><Operations user={user} canModify={canModify} canRemind={canRemind} refresh={()=>loadDashboard(period)}/></div>
    <div id="ai-insights" data-section="ai-insights" className="scroll-section"><AskPilot onAsk={ask} answer={answer} loading={asking}/></div>
    <section id="transactions" data-section="transactions" className="panel recent scroll-section"><div className="panel-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>{search ? `Search results · ${stream.length}` : 'Payment stream'}</h2></div><button className="text-button" onClick={toggleTransactions}>{expanded ? 'Show less' : 'View all'}</button></div>{stream.length?stream.map(t=><div className="transaction" key={t.id}><span className={`payment-icon ${t.status.toLowerCase()}`}>{t.method==='UPI'?'◉':t.method==='CARD'?'▣':'⌁'}</span><span><b>{t.customer}</b><small>{t.method} · {new Date(t.createdAt).toLocaleDateString('en-IN')}</small></span><span className={`tag ${t.status.toLowerCase()}`}>{t.status}</span><strong>{money(t.amount)}</strong></div>):<p className="empty-state">No payments match “{search}”. Try a customer, method, or status.</p>}</section>
    <footer><span>© 2026 PayPilot</span><span>Finance intelligence for modern businesses</span><span>Developed with love by Sumit Kumar</span><span>Test environment · Data privacy by design</span></footer>
  </main></div>;
}
const savedUser=()=>{try{return JSON.parse(localStorage.getItem('paypilot-user')||'null')}catch{localStorage.removeItem('paypilot-user');return null}};
export default function App(){const [user,setUser]=useState(savedUser), [loading,setLoading]=useState(false); const authenticate=async (fn,creds)=>{setLoading(true);try{const result=await fn(creds);const sessionUser={...result.user,role:creds.role||result.user.role||'OWNER'};localStorage.setItem('paypilot-user',JSON.stringify(sessionUser));setUser(sessionUser)}finally{setLoading(false)}};return user?<Dashboard user={user} onLogout={()=>{localStorage.removeItem('paypilot-user');setUser(null)}}/>:<Login onLogin={creds=>authenticate(api.login,creds)} onRegister={creds=>authenticate(api.register,creds)} loading={loading}/>;}
