const now = new Date();
const at = (daysAgo, hour = 11) => { const d = new Date(now); d.setDate(d.getDate() - daysAgo); d.setHours(hour, 0, 0, 0); return d; };

const customers = [
  { id: 'cus_abc', name: 'ABC Pvt Ltd', email: 'finance@abc.in' },
  { id: 'cus_xyz', name: 'XYZ Store', email: 'owner@xyzstore.in' },
  { id: 'cus_tech', name: 'TechCorp', email: 'accounts@techcorp.in' },
  { id: 'cus_nova', name: 'Nova Retail', email: 'billing@novaretail.in' }
];

const invoices = [
  { id: 'INV-1023', customerId: 'cus_abc', customer: 'ABC Pvt Ltd', amount: 48000, dueDate: at(6), status: 'OVERDUE' },
  { id: 'INV-1024', customerId: 'cus_xyz', customer: 'XYZ Store', amount: 32000, dueDate: at(4), status: 'OVERDUE' },
  { id: 'INV-1025', customerId: 'cus_tech', customer: 'TechCorp', amount: 71000, dueDate: at(11), status: 'OVERDUE' },
  { id: 'INV-1026', customerId: 'cus_nova', customer: 'Nova Retail', amount: 133000, dueDate: at(1), status: 'DUE' }
];

const amounts = [799, 1299, 2499, 499, 8999, 1599, 3499, 999, 4999, 1899];
const methods = ['UPI', 'CARD', 'NETBANKING'];
const banks = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank'];
const transactions = Array.from({ length: 720 }, (_, i) => {
  const recent = i < 45;
  const daysAgo = recent ? i % 7 : 8 + (i % 357);
  const method = recent && i % 4 === 0 ? 'UPI' : methods[i % methods.length];
  const failure = recent ? (method === 'UPI' && i % 4 === 0) : i % 22 === 0;
  const refunded = !failure && i % 39 === 0;
  const hour = recent && method === 'UPI' && failure ? 14 + (i % 3) : 9 + (i % 10);
  return {
    id: `pay_demo_${String(i + 1).padStart(4, '0')}`,
    amount: amounts[i % amounts.length] * (i % 5 + 1), currency: 'INR', method,
    bank: banks[i % banks.length], status: failure ? 'FAILED' : refunded ? 'REFUNDED' : 'SUCCESS',
    customer: customers[i % customers.length].name, orderId: `order_demo_${i + 1}`,
    failureReason: failure ? (method === 'UPI' ? 'Bank timeout' : 'Authentication declined') : null,
    createdAt: at(daysAgo, hour).toISOString()
  };
});

export const demoData = { customers, invoices, transactions, actions: [], aiLogs: [] };
