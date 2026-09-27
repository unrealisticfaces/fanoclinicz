import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  IconSearch, IconPlus, IconReceipt, IconPrinter, IconX, IconFileInvoice, 
  IconChartLine, IconReportMoney, IconChevronDown, IconChevronUp, 
  IconDownload, IconFilter
} from '@tabler/icons-react';

const tablerPrintStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  @page { size: 5.5in 8.5in; margin: 0.3in; }
  body { font-family: 'Inter', sans-serif; color: #000; margin: 0; padding: 10px; font-size: 11px; background: #fff; line-height: 1.4; }
  .container { max-width: 100%; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .brand { font-size: 16px; font-weight: 700; color: #000; display: flex; align-items: center; gap: 6px;}
  .brand svg { width: 18px; height: 18px; color: #000; }
  .invoice-details { text-align: right; color: #000; }
  .invoice-details h2 { margin: 0 0 2px 0; color: #000; font-size: 16px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  .addresses { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid #000; padding-bottom: 15px; }
  .address-block { width: 48%; }
  .text-muted { color: #000; font-size: 9px; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;}
  .address-content { font-size: 11px; color: #000; }
  .top-summary-clean { margin-bottom: 20px; text-align: right; float: right; min-width: 150px; }
  .top-summary-label { font-size: 9px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px; color: #000; }
  .top-summary-value { font-size: 18px; font-weight: 700; color: #000; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { text-align: left; padding: 8px 6px; border-bottom: 1.5px solid #000; color: #000; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
  td { padding: 8px 6px; border-bottom: 1px solid #ccc; color: #000; font-size: 10px; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .font-bold { font-weight: 700; }
  .summary-box { width: 200px; float: right; margin-bottom: 20px; }
  .summary-row { display: flex; justify-content: space-between; padding: 4px 0; }
  .summary-row.total { font-size: 14px; font-weight: 700; border-top: 1.5px solid #000; padding-top: 8px; margin-top: 2px; color: #000; }
  .clearfix::after { content: ""; clear: both; display: table; }
  .footer { text-align: center; color: #000; font-size: 9px; border-top: 1px solid #000; padding-top: 15px; clear: both; }
  .badge { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #000; }
`;

export default function Billing() {
  const [activeTab, setActiveTab] = useState('sales');
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [showSOAPreview, setShowSOAPreview] = useState(false);
  const [soaPrintData, setSoaPrintData] = useState(null);
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ patient_id: '', grand_total: '', payment_status: 'unpaid', payment_method: 'cash', amount_paid: '' });
  const [patientSearch, setPatientSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [exportFilter, setExportFilter] = useState('today');
  const [specificDate, setSpecificDate] = useState('');
  const [specificMonth, setSpecificMonth] = useState('');

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.action-dropdown-container')) setOpenDropdownId(null);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, patRes] = await Promise.all([
        axios.get('/api/invoices'),
        axios.get('/api/patients')
      ]);
      setInvoices(invRes.data);
      setPatients(patRes.data);
    } catch (error) {
      console.error("Error fetching billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id) return alert("Please select a valid patient.");
    setIsSubmitting(true);
    try {
      await axios.post('/api/invoices', formData);
      setIsModalOpen(false);
      setFormData({ patient_id: '', grand_total: '', payment_status: 'unpaid', payment_method: 'cash', amount_paid: '' });
      setPatientSearch(''); 
      fetchData(); 
    } catch (error) {
      alert("Failed to save invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value || 0);

  const filteredInvoices = invoices.filter(inv => {
    const searchLower = invoiceSearch.toLowerCase();
    const matchesSearch = `${inv.first_name} ${inv.last_name}`.toLowerCase().includes(searchLower) || inv.invoice_number.toLowerCase().includes(searchLower);
    if (!matchesSearch) return false;
    if (paymentStatusFilter !== 'All' && inv.payment_status !== paymentStatusFilter.toLowerCase()) return false;
    return true;
  });

  const getFilteredExportData = () => {
    const getLocalYYYYMMDD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const now = new Date();
    const today = getLocalYYYYMMDD(now);
    const yesterdayDate = new Date(now); yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = getLocalYYYYMMDD(yesterdayDate);
    const curr = new Date(now);
    const startOfWeek = getLocalYYYYMMDD(new Date(curr.setDate(curr.getDate() - curr.getDay())));
    const thisMonth = today.substring(0, 7);

    return invoices.filter(inv => {
      const invDate = getLocalYYYYMMDD(new Date(inv.created_at));
      const invMonth = invDate.substring(0, 7);
      switch (exportFilter) {
        case 'today': return invDate === today;
        case 'yesterday': return invDate === yesterday;
        case 'this_week': return invDate >= startOfWeek && invDate <= today;
        case 'this_month': return invMonth === thisMonth;
        case 'specific_date': return specificDate ? invDate === specificDate : true;
        case 'specific_month': return specificMonth ? invMonth === specificMonth : true;
        default: return true;
      }
    });
  };

  const exportData = getFilteredExportData();
  const exportTotals = exportData.reduce((acc, inv) => {
    const total = parseFloat(inv.grand_total) || 0;
    const paid = inv.payment_status === 'paid' ? total : (parseFloat(inv.amount_paid) || 0);
    acc.billed += total; acc.paid += paid; acc.balance += Math.max(0, total - paid);
    return acc;
  }, { billed: 0, paid: 0, balance: 0 });

  const executePrint = (htmlContent) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(htmlContent);
    iframe.contentWindow.document.close();
    iframe.onload = () => {
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  };

  const generateHeaderAndAddresses = (title, refNo, patientData) => `
    <div class="header">
      <div class="brand">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4c-3.866 0-7 3.134-7 7v4c0 3.866 3.134 7 7 7s7-3.134 7-7v-4c0-3.866-3.134-7-7-7z"/><path d="M12 22v-6"/><path d="M9 16c-1.657 0-3-1.343-3-3"/><path d="M15 16c1.657 0 3-1.343 3-3"/></svg>
        FANO DENTAL
      </div>
      <div class="invoice-details">
        <h2>${title}</h2>
        <div><strong>${refNo}</strong></div>
        <div>Date: ${new Date().toLocaleDateString()}</div>
      </div>
    </div>
    <div class="addresses">
      <div class="address-block">
        <div class="text-muted">${patientData ? 'Client / Billed To' : 'Filter Applied'}</div>
        <div class="address-content">
          ${patientData ? `<strong>${patientData.name}</strong><br>Contact: ${patientData.contact}<br>` : `<strong>${exportFilter.replace('_', ' ').toUpperCase()}</strong><br>Generated By: Administrator<br>`}
        </div>
      </div>
      <div class="address-block text-right">
        <div class="text-muted">Organization</div>
        <div class="address-content">
          <strong>Fano Dental Clinic</strong><br>123 Main Street, Cebu City<br>Philippines 6000<br>hello@fanodental.com
        </div>
      </div>
    </div>
  `;

  const printSingleInvoice = (inv) => {
    const total = parseFloat(inv.grand_total);
    const paid = inv.payment_status === 'paid' ? total : (parseFloat(inv.amount_paid) || 0);
    const balance = Math.max(0, total - paid);

    const htmlContent = `
      <!DOCTYPE html><html><head><title>Invoice ${inv.invoice_number}</title><style>${tablerPrintStyle}</style></head><body>
        <div class="container">
          ${generateHeaderAndAddresses('INVOICE', inv.invoice_number, { name: `${inv.first_name} ${inv.last_name}`, contact: inv.contact_number })}
          <div class="top-summary-clean">
            <div class="top-summary-label">Amount Due</div>
            <div class="top-summary-value">₱ ${balance.toFixed(2)}</div>
          </div>
          <div class="clearfix"></div>
          <table>
            <thead><tr><th>Description</th><th class="text-center">Method</th><th class="text-center">Status</th><th class="text-right">Amount</th></tr></thead>
            <tbody>
              <tr>
                <td><div class="font-bold">Dental Services</div><div class="text-muted" style="text-transform:none; margin-top:2px;">Clinical treatments and consultations</div></td>
                <td class="text-center" style="text-transform: capitalize;">${inv.payment_method}</td>
                <td class="text-center"><span class="badge">${inv.payment_status}</span></td>
                <td class="text-right font-bold">₱ ${total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div class="clearfix">
            <div class="summary-box">
              <div class="summary-row"><span class="text-muted">Subtotal</span><span>₱ ${total.toFixed(2)}</span></div>
              <div class="summary-row"><span class="text-muted">Amount Paid</span><span>₱ ${paid.toFixed(2)}</span></div>
            </div>
          </div>
          <div class="footer">Thank you for trusting Fano Dental Clinic.</div>
        </div>
      </body></html>
    `;
    executePrint(htmlContent);
  };

  const printSOA = () => {
    const rowsHtml = soaPrintData.records.map(inv => {
      const total = parseFloat(inv.grand_total);
      const paid = inv.payment_status === 'paid' ? total : (parseFloat(inv.amount_paid) || 0);
      return `<tr><td>${new Date(inv.created_at).toLocaleDateString()}</td><td class="font-bold">${inv.invoice_number}</td><td class="text-center"><span class="badge">${inv.payment_status}</span></td><td class="text-right">₱ ${total.toFixed(2)}</td><td class="text-right">₱ ${paid.toFixed(2)}</td><td class="text-right font-bold">₱ ${(total - paid).toFixed(2)}</td></tr>`;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html><html><head><title>SOA - ${soaPrintData.patient.fullName}</title><style>${tablerPrintStyle}</style></head><body>
        <div class="container">
          ${generateHeaderAndAddresses('STATEMENT OF ACCOUNT', 'SOA-' + Date.now().toString().slice(-6), { name: soaPrintData.patient.fullName, contact: soaPrintData.patient.contact_number })}
          <div class="top-summary-clean">
            <div class="top-summary-label">Grand Total Due</div>
            <div class="top-summary-value">₱ ${soaPrintData.patient.balance.toFixed(2)}</div>
          </div>
          <div class="clearfix"></div>
          <table>
            <thead><tr><th>Date</th><th>Invoice No.</th><th class="text-center">Status</th><th class="text-right">Billed</th><th class="text-right">Paid</th><th class="text-right">Balance</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div class="footer">Thank you for trusting Fano Dental Clinic.</div>
        </div>
      </body></html>
    `;
    setShowSOAPreview(false);
    executePrint(htmlContent);
  };

  const printInvoicesPDF = () => {
    if (exportData.length === 0) return alert("No records found to print.");
    const rowsHtml = exportData.map(inv => {
      const total = parseFloat(inv.grand_total);
      const paid = inv.payment_status === 'paid' ? total : (parseFloat(inv.amount_paid) || 0);
      return `<tr><td>${new Date(inv.created_at).toLocaleDateString()}</td><td class="font-bold">${inv.invoice_number}</td><td>${inv.first_name} ${inv.last_name}</td><td class="text-center"><span class="badge">${inv.payment_status}</span></td><td class="text-right">₱ ${total.toFixed(2)}</td><td class="text-right">₱ ${paid.toFixed(2)}</td></tr>`;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html><html><head><title>Sales Audit</title><style>${tablerPrintStyle}</style></head><body>
        <div class="container" style="max-width: 900px;">
          ${generateHeaderAndAddresses('SALES AUDIT', 'REP-' + Date.now().toString().slice(-6), null)}
          <div class="top-summary-clean">
            <div class="top-summary-label">Total Collected</div>
            <div class="top-summary-value">₱ ${exportTotals.paid.toFixed(2)}</div>
          </div>
          <div class="clearfix"></div>
          <table>
            <thead><tr><th>Date</th><th>Invoice No.</th><th>Patient Name</th><th class="text-center">Status</th><th class="text-right">Billed</th><th class="text-right">Collected</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div class="footer">Generated securely via Fano Dental Clinic System</div>
        </div>
      </body></html>
    `;
    executePrint(htmlContent);
  };

  const exportInvoicesCSV = () => {
    if (exportData.length === 0) return alert("No records found for this date range.");
    const headers = ['Date', 'Invoice No.', 'Patient Name', 'Total Billed (PHP)', 'Amount Paid (PHP)', 'Balance (PHP)', 'Status', 'Method'];
    const csvRows = [headers.join(',')];
    
    exportData.forEach(inv => {
      const total = parseFloat(inv.grand_total);
      const paid = inv.payment_status === 'paid' ? total : (parseFloat(inv.amount_paid) || 0);
      const row = [
        new Date(inv.created_at).toLocaleDateString(), inv.invoice_number, `${inv.first_name} ${inv.last_name}`,
        total, paid, Math.max(0, total - paid), inv.payment_status.toUpperCase(), inv.payment_method.toUpperCase()
      ].map(val => `"${String(val).replace(/"/g, '""')}"`);
      csvRows.push(row.join(','));
    });

    csvRows.push(`,,,TOTALS:,${exportTotals.billed},${exportTotals.paid},${exportTotals.balance},`);
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${exportFilter}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const monthlyData = {};
  invoices.forEach(inv => {
    const dateObj = new Date(inv.created_at);
    const m = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyData[m]) monthlyData[m] = { monthCode: m, monthName: dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), billed: 0, paid: 0, balance: 0, records: [] };
    const total = parseFloat(inv.grand_total) || 0;
    const pay = inv.payment_status === 'paid' ? total : (parseFloat(inv.amount_paid) || 0);
    const bal = Math.max(0, total - pay);
    monthlyData[m].billed += total;
    monthlyData[m].paid += pay;
    monthlyData[m].balance += bal;
    monthlyData[m].records.push({ ...inv, pendingBalance: bal });
  });
  const sortedMonths = Object.values(monthlyData).sort((a, b) => b.monthCode.localeCompare(a.monthCode));

  const patientStats = patients.map(p => {
    const pInvoices = invoices.filter(i => i.patient_id === p.id);
    const billed = pInvoices.reduce((sum, i) => sum + parseFloat(i.grand_total), 0);
    const paid = pInvoices.reduce((sum, i) => sum + (i.payment_status === 'paid' ? parseFloat(i.grand_total) : parseFloat(i.amount_paid || 0)), 0);
    return { ...p, fullName: `${p.first_name} ${p.last_name}`, totalInvoices: pInvoices.length, billed, paid, balance: Math.max(0, billed - paid), invoices: pInvoices };
  }).filter(p => p.totalInvoices > 0);

  const filteredPatients = patientStats.filter(p => p.fullName.toLowerCase().includes(customerSearch.toLowerCase()));

  const handleOpenSOA = (patient) => {
    if (patient.invoices.length === 0) return alert("This patient has no records to print.");
    setSoaPrintData({ patient, records: patient.invoices });
    setShowSOAPreview(true);
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
            <IconReceipt size={28} className="text-blue-600" />
            Billing & Cashier
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage invoices, monthly tracking, and financial reports.</p>
        </div>
        
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm cursor-pointer">
          <IconPlus size={16} /> Create Invoice
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md shadow-sm p-1.5 flex gap-1 overflow-x-auto w-full">
        <button onClick={() => setActiveTab('sales')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${activeTab === 'sales' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
          <IconFileInvoice size={16}/> Sales Records
        </button>
        <button onClick={() => setActiveTab('monthly')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${activeTab === 'monthly' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
          <IconChartLine size={16}/> Monthly Tracker
        </button>
        <button onClick={() => setActiveTab('soa')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${activeTab === 'soa' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
          <IconReportMoney size={16}/> Statement of Account
        </button>
        <button onClick={() => setActiveTab('export')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${activeTab === 'export' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
          <IconDownload size={16}/> Export Reports
        </button>
      </div>

      {activeTab === 'sales' && (
        <div className="animate-in fade-in space-y-4">
          <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-visible flex flex-col">
            <div className="p-5 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between">
              <h3 className="text-base font-semibold text-gray-900 leading-8">Sales Records</h3>
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full lg:w-auto">
                <select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)} className="w-full md:w-36 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-blue-500 cursor-pointer text-gray-700">
                  <option value="All">All Statuses</option>
                  <option value="paid">Fully Paid</option>
                  <option value="partial">Partial</option>
                  <option value="unpaid">Unpaid</option>
                </select>
                <div className="relative w-full sm:w-64">
                  <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search invoice or patient..." value={invoiceSearch} onChange={(e) => setInvoiceSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 shadow-sm placeholder-gray-400" />
                </div>
              </div>
            </div>
            <div className="overflow-visible w-full min-h-[300px]">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[700px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice ID</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Paid</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {loading ? (
                    <tr><td colSpan="7" className="text-center py-8 text-sm text-gray-400">Loading records...</td></tr>
                  ) : filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium text-sm">{inv.invoice_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{inv.first_name} {inv.last_name}</td>
                      <td className="px-6 py-4 font-bold text-gray-900 text-sm text-right">{formatCurrency(inv.grand_total)}</td>
                      <td className="px-6 py-4 font-medium text-green-600 text-sm text-right">{formatCurrency(inv.payment_status === 'paid' ? inv.grand_total : inv.amount_paid)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                          inv.payment_status === 'paid' ? 'bg-green-100 text-green-700' : inv.payment_status === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {inv.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        
                        <div className="relative inline-block action-dropdown-container">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === inv.id ? null : inv.id);
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm font-medium transition-colors cursor-pointer shadow-sm focus:outline-none ${
                              openDropdownId === inv.id
                                ? 'border-blue-600 text-blue-600 bg-white ring-1 ring-blue-600'
                                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                            }`}
                          >
                            Actions 
                            <IconChevronDown size={16} stroke={2.5} className={openDropdownId === inv.id ? 'rotate-180 transition-transform' : 'transition-transform'}/>
                          </button>

                          {openDropdownId === inv.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-30 animate-in fade-in zoom-in-95 text-left py-2">
                              <button 
                                onClick={() => { printSingleInvoice(inv); setOpenDropdownId(null); }}
                                className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                              >
                                Print Invoice
                              </button>
                            </div>
                          )}
                        </div>

                      </td>
                    </tr>
                  ))}
                  {!loading && filteredInvoices.length === 0 && (
                    <tr><td colSpan="7" className="text-center py-10 text-sm text-gray-400">No invoices match your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="animate-in fade-in space-y-4">
          <div className="bg-white border border-gray-200 rounded-md shadow-sm p-6 flex flex-col">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-100 pb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <IconFilter size={20} className="text-gray-400" />
                  Financial Reports
                </h3>
                <p className="text-sm text-gray-500 mt-1">Select a date range to generate and export sales audit records.</p>
              </div>
              
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button onClick={exportInvoicesCSV} className="w-full md:w-auto bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer">
                  <IconDownload size={16} /> Export CSV
                </button>
                <button onClick={printInvoicesPDF} className="w-full md:w-auto bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer">
                  <IconPrinter size={16} /> Print Report
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-6">
              {['today', 'yesterday', 'this_week', 'this_month', 'specific_date', 'specific_month'].map(opt => (
                <label key={opt} className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors border ${
                  exportFilter === opt ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>
                  <input type="radio" name="exportFilter" value={opt} checked={exportFilter === opt} onChange={(e) => setExportFilter(e.target.value)} className="hidden" />
                  {opt.replace('_', ' ')}
                </label>
              ))}
            </div>

            {(exportFilter === 'specific_date' || exportFilter === 'specific_month') && (
              <div className="flex items-center gap-3 mb-6 animate-in slide-in-from-top-2">
                {exportFilter === 'specific_date' ? (
                  <div className="w-48">
                    <input type="date" value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} className={inputClass} />
                  </div>
                ) : (
                  <div className="w-48">
                    <input type="month" value={specificMonth} onChange={(e) => setSpecificMonth(e.target.value)} className={inputClass} />
                  </div>
                )}
                <span className="text-sm text-gray-500">Pick the exact {exportFilter.split('_')[1]} for the report.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 border border-gray-100 p-4 rounded-md shadow-sm">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Billed</div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(exportTotals.billed)}</div>
              </div>
              <div className="bg-green-50 border border-green-100 p-4 rounded-md shadow-sm">
                <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Total Collected</div>
                <div className="text-xl font-bold text-green-700">{formatCurrency(exportTotals.paid)}</div>
              </div>
              <div className="bg-red-50 border border-red-100 p-4 rounded-md shadow-sm">
                <div className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Total Outstanding</div>
                <div className="text-xl font-bold text-red-700">{formatCurrency(exportTotals.balance)}</div>
              </div>
            </div>
            
            <div className="mt-6 text-sm text-gray-400 text-center">
              Generating report for <strong className="text-gray-600">{exportData.length}</strong> matching records.
            </div>

          </div>
        </div>
      )}

      {activeTab === 'monthly' && (
        <div className="animate-in fade-in space-y-4">
          <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-base font-semibold text-gray-900">Monthly Clearance Tracker</h3>
            </div>
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Billing Month</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total Billed</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Collected</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Remaining Bal.</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedMonths.map(m => (
                    <React.Fragment key={m.monthCode}>
                      <tr className={`hover:bg-gray-50 transition-colors ${expandedMonth === m.monthCode ? 'bg-blue-50/30' : ''}`}>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{m.monthName}</td>
                        <td className="px-6 py-4 text-sm text-right text-gray-600">{formatCurrency(m.billed)}</td>
                        <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">{formatCurrency(m.paid)}</td>
                        <td className="px-6 py-4 text-sm text-right text-red-600 font-bold">{formatCurrency(m.balance)}</td>
                        <td className="px-6 py-4 text-center">
                          {m.balance <= 0 ? (
                            <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">Cleared</span>
                          ) : (
                            <span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setExpandedMonth(expandedMonth === m.monthCode ? null : m.monthCode)}
                            disabled={m.balance <= 0}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:text-gray-400 transition-colors cursor-pointer flex items-center justify-end gap-1 ml-auto"
                          >
                            {expandedMonth === m.monthCode ? 'Close View' : 'View Pending'}
                            {expandedMonth === m.monthCode ? <IconChevronUp size={16}/> : <IconChevronDown size={16}/>}
                          </button>
                        </td>
                      </tr>
                      {expandedMonth === m.monthCode && m.records.filter(r => r.pendingBalance > 0).length > 0 && (
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <td colSpan="6" className="p-0">
                            <div className="px-8 py-5 bg-white/50 border-l-4 border-blue-500 shadow-inner">
                              <h4 className="text-xs font-bold uppercase text-gray-500 mb-3">Pending Invoices - {m.monthName}</h4>
                              <table className="w-full text-left text-sm">
                                <thead>
                                  <tr className="border-b border-gray-200 text-gray-500">
                                    <th className="py-2.5 font-medium">Invoice ID</th>
                                    <th className="py-2.5 font-medium">Date</th>
                                    <th className="py-2.5 font-medium">Patient</th>
                                    <th className="py-2.5 font-medium text-right">Outstanding Bal.</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {m.records.filter(r => r.pendingBalance > 0).map(r => (
                                    <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-100">
                                      <td className="py-3 font-mono text-gray-500">{r.invoice_number}</td>
                                      <td className="py-3 text-gray-600">{new Date(r.created_at).toLocaleDateString()}</td>
                                      <td className="py-3 font-medium text-gray-900">{r.first_name} {r.last_name}</td>
                                      <td className="py-3 font-bold text-red-600 text-right">{formatCurrency(r.pendingBalance)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'soa' && (
        <div className="animate-in fade-in space-y-4">
          <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-visible flex flex-col">
            <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
              <h3 className="text-base font-semibold text-gray-900">Patient Statements</h3>
              <div className="relative w-full sm:w-64">
                <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search patient name..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-blue-500 placeholder-gray-400"
                />
              </div>
            </div>
            <div className="overflow-visible min-h-[300px]">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Name</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Invoices</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total Billed</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Balance Due</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPatients.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{p.fullName}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 text-center">{p.totalInvoices}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-right">{formatCurrency(p.billed)}</td>
                      <td className="px-6 py-4 text-sm text-red-600 font-bold text-right">{formatCurrency(p.balance)}</td>
                      <td className="px-6 py-4 text-right relative">
                        
                        <div className="relative inline-block action-dropdown-container">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === `soa_${p.id}` ? null : `soa_${p.id}`);
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm font-medium transition-colors cursor-pointer shadow-sm focus:outline-none ${
                              openDropdownId === `soa_${p.id}`
                                ? 'border-blue-600 text-blue-600 bg-white ring-1 ring-blue-600'
                                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                            }`}
                          >
                            Actions 
                            <IconChevronDown size={16} stroke={2.5} className={openDropdownId === `soa_${p.id}` ? 'rotate-180 transition-transform' : 'transition-transform'}/>
                          </button>

                          {openDropdownId === `soa_${p.id}` && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-30 animate-in fade-in zoom-in-95 text-left py-2">
                              <button 
                                onClick={() => { handleOpenSOA(p); setOpenDropdownId(null); }}
                                className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                              >
                                Print SOA
                              </button>
                            </div>
                          )}
                        </div>

                      </td>
                    </tr>
                  ))}
                  {filteredPatients.length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400 text-sm">No patients found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col animate-in fade-in">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 rounded-t-lg">
              <h3 className="text-base font-semibold text-gray-900">Create Invoice</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                <IconX size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="relative">
                <label className={labelClass}>Search Patient</label>
                <input 
                  type="text"
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setShowDropdown(true);
                    setFormData({...formData, patient_id: ''}); 
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className={inputClass}
                  placeholder="Type patient name or ID..."
                  required
                />
                
                {showDropdown && patientSearch && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {patients.filter(p => 
                      `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearch.toLowerCase()) ||
                      p.patient_code.toLowerCase().includes(patientSearch.toLowerCase())
                    ).map(p => (
                      <li 
                        key={p.id}
                        onClick={() => {
                          setFormData({...formData, patient_id: p.id});
                          setPatientSearch(`${p.first_name} ${p.last_name}`);
                          setShowDropdown(false);
                        }}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm text-gray-800 border-b border-gray-50 last:border-0"
                      >
                        <span className="font-semibold text-base">{p.first_name} {p.last_name}</span> 
                        <span className="text-gray-400 text-xs ml-2">({p.patient_code})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className={labelClass}>Total Amount (₱)</label>
                <input type="number" step="0.01" name="grand_total" required value={formData.grand_total} onChange={handleInputChange} className={inputClass} placeholder="0.00" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Status</label>
                  <select name="payment_status" value={formData.payment_status} onChange={handleInputChange} className={`${inputClass} cursor-pointer`}>
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Fully Paid</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Method</label>
                  <select name="payment_method" value={formData.payment_method} onChange={handleInputChange} className={`${inputClass} cursor-pointer`}>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="gcash">GCash</option>
                  </select>
                </div>
              </div>

              {formData.payment_status === 'partial' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className={labelClass}>Amount Paid (₱)</label>
                  <input type="number" step="0.01" name="amount_paid" required value={formData.amount_paid} onChange={handleInputChange} className={inputClass} placeholder="0.00" />
                </div>
              )}

              <div className="pt-4 flex gap-3 mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 cursor-pointer transition-colors shadow-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting || !formData.patient_id} className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors shadow-sm">
                  {isSubmitting ? 'Saving...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSOAPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 p-6 text-center">
            <IconPrinter size={48} className="text-gray-900 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Print Ready</h3>
            <p className="text-sm text-gray-500 mb-6">Clicking print will render a monochrome Statement of Account for {soaPrintData.patient.fullName}.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowSOAPreview(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer shadow-sm">Cancel</button>
              <button onClick={printSOA} className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-black shadow-sm flex items-center gap-2 cursor-pointer"><IconPrinter size={16}/> Print SOA</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}