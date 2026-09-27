import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { IconUserPlus, IconFileInvoice, IconSpeakerphone, IconSettings } from '@tabler/icons-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [monthlyBalances, setMonthlyBalances] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]); 
  
  const [balancePage, setBalancePage] = useState(1);
  const [recentPage, setRecentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    const settings = JSON.parse(localStorage.getItem('clinicSettings')) || {};
    if (settings.autoBackup) {
      axios.post('/api/system/daily-backup')
        .then(res => console.log(res.data.message))
        .catch(err => console.error("Auto-backup failed:", err));
    }
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [metricsRes, balancesRes, invoicesRes] = await Promise.all([
        axios.get('/api/dashboard/metrics'),
        axios.get('/api/dashboard/monthly-balances'),
        axios.get('/api/invoices') 
      ]);
      setStats(metricsRes.data);
      setMonthlyBalances(balancesRes.data);
      setRecentInvoices(invoicesRes.data); 
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value || 0);

  const gross = stats?.allTimeGross || 0;
  const collected = stats?.allTimeCollected || 0;
  const outstanding = Math.max(0, gross - collected);
  const activePatients = stats?.activePatients || 0;

  const TABLER_BLUE_SHADES = ['#206bc4', '#4299e1', '#74c0fc', '#a5d8ff', '#e9ecef'];

  const pieData = [
    { name: 'Collected', value: collected, color: TABLER_BLUE_SHADES[0] },    
    { name: 'Outstanding', value: outstanding, color: TABLER_BLUE_SHADES[1] }, 
  ].filter(d => d.value > 0);

  const methodData = [
    { name: 'Cash', value: collected * 0.6, color: TABLER_BLUE_SHADES[0] },
    { name: 'Card', value: collected * 0.3, color: TABLER_BLUE_SHADES[1] },
    { name: 'GCash', value: collected * 0.1, color: TABLER_BLUE_SHADES[2] },
  ].filter(d => d.value > 0);

  const dailyStats = stats?.dailyRevenue || {};
  const chartData = Object.keys(dailyStats)
    .sort((a, b) => new Date(a) - new Date(b))
    .slice(-14)
    .map(date => {
      const d = new Date(date);
      return {
        name: d.toLocaleString('en-GB', { day: 'numeric', month: 'short' }),
        gross: dailyStats[date].gross || 0,
        collected: dailyStats[date].collected || 0
      };
    });

  const TablerTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 px-3.5 py-3 rounded-lg shadow-xl text-sm min-w-[180px] pointer-events-none relative z-[100]">
          <p className="text-white font-semibold mb-2.5 pb-2 border-b border-gray-700">{label}</p>
          {payload.map((p, idx) => (
            <div key={idx} className="flex justify-between items-center gap-4 mb-1.5 last:mb-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.stroke || p.color }}></span>
                <span className="text-gray-300">{p.name}:</span>
              </div>
              <span className="font-bold text-white">{formatCurrency(p.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const fill = payload[0].payload?.color || payload[0].fill;
      const name = payload[0].payload?.name || payload[0].name;
      const value = payload[0].value;
      
      return (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl text-sm min-w-[150px] pointer-events-none relative z-[100]">
           <div className="flex items-center gap-2 mb-2">
             <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fill }}></span>
             <span className="text-gray-300 font-medium">{name}</span>
           </div>
           <span className="font-bold text-white block text-lg">{formatCurrency(value)}</span>
        </div>
      );
    }
    return null;
  };

  const StatCard = ({ title, value, icon, colorClass }) => (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm p-3 sm:p-4 flex flex-col transition-colors duration-200">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-gray-500 uppercase whitespace-nowrap overflow-hidden text-ellipsis mr-1 sm:mr-2">{title}</span>
        <div className={`p-1.5 rounded-md shrink-0 ${colorClass}`}>
          {icon}
        </div>
      </div>
      <div className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight flex items-center min-h-[28px] truncate">
        {isLoading ? <div className="h-6 w-16 sm:w-20 bg-gray-100 rounded animate-pulse"></div> : value}
      </div>
    </div>
  );

  const JobTable = ({ title, data, page, setPage, accentClass, columns, renderRow }) => {
    const itemsPerPage = 5;
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const currentData = data.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
      <div className={`bg-white border border-gray-200 rounded-md shadow-sm flex flex-col overflow-hidden border-t-[3px] w-full ${accentClass}`}>
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-500">{data.length} Records</span>
        </div>
        <div className="overflow-x-auto w-full flex-1 min-h-[250px] custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[400px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {columns.map((col, i) => (
                  <th key={i} className={`px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-3.5 bg-gray-100 rounded w-12"></div></td>
                    <td className="px-4 py-3"><div className="h-3.5 bg-gray-100 rounded w-20"></div></td>
                    <td className="px-4 py-3"><div className="h-3.5 bg-gray-100 rounded w-16"></div></td>
                  </tr>
                ))
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400 text-xs">No records found.</td>
                </tr>
              ) : (
                currentData.map(renderRow)
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && data.length > 0 && (
          <div className="px-4 py-2.5 border-t border-gray-200 flex items-center justify-between bg-white mt-auto">
             <span className="text-[10px] font-medium text-gray-500">
               {((page - 1) * itemsPerPage) + 1}-{Math.min(page * itemsPerPage, data.length)} of {data.length}
             </span>
             <div className="flex items-center gap-1">
               <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 hover:text-gray-900 disabled:opacity-50 text-gray-500 transition-colors cursor-pointer">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
               </button>
               <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="p-1 hover:text-gray-900 disabled:opacity-50 text-gray-500 transition-colors cursor-pointer">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
               </button>
             </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Dashboard Overview</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard title="Gross Revenue" value={formatCurrency(gross)} colorClass="bg-blue-50 text-blue-600" icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" /><path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" /><path d="M14 11h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3h-2.5" /><path d="M12 17v1m0 -8v1" /></svg>} />
        <StatCard title="Collected" value={formatCurrency(collected)} colorClass="bg-green-50 text-green-600" icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 9m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z" /><path d="M14 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M17 9v-2a2 2 0 0 0 -2 -2h-10a2 2 0 0 0 -2 2v6a2 2 0 0 0 2 2h2" /></svg>} />
        <StatCard title="Outstanding" value={formatCurrency(outstanding)} colorClass="bg-amber-50 text-amber-600" icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17 8v-3a1 1 0 0 0 -1 -1h-10a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1 -1 1h-12a2 2 0 0 1 -2 -2v-12" /><path d="M20 12v4h-4a2 2 0 0 1 0 -4h4" /></svg>} />
        <StatCard title="Active Patients" value={activePatients} colorClass="bg-cyan-50 text-cyan-600" icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 7m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" /><path d="M8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2" /><path d="M12 12l0 .01" /><path d="M3 13a20 20 0 0 0 18 0" /></svg>} />
        <StatCard title="Pending Charts" value={0} colorClass="bg-purple-50 text-purple-600" icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 15l2 2l4 -4" /></svg>} />
        <StatCard title="Today's Visits" value={0} colorClass="bg-teal-50 text-teal-600" icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M11.795 21h-6.795a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v4" /><path d="M18 14v4h4" /><path d="M18 18m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M15 3v4" /><path d="M7 3v4" /><path d="M3 11h16" /></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-md shadow-sm flex flex-col overflow-x-auto w-full">
          <div className="px-4 sm:px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Daily Revenue Overview</h3>
          </div>
          <div className="p-2 sm:p-5 h-[280px] sm:h-[340px] min-w-[400px]">
            {isLoading ? (
              <div className="w-full h-full animate-pulse bg-gray-50 rounded border border-gray-100"></div>
            ) : chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">No revenue data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} dy={10} minTickGap={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(value) => `₱${(value/1000)}k`} dx={0} />
                  <Tooltip content={<TablerTooltip />} cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Area type="monotone" name="Gross" dataKey="gross" stroke="#206bc4" strokeWidth={2} fillOpacity={0.16} fill="#206bc4" activeDot={{ r: 5, fill: "#206bc4", stroke: "#fff", strokeWidth: 2 }} />
                  <Area type="monotone" name="Collected" dataKey="collected" stroke="#74c0fc" strokeWidth={2} fillOpacity={0.16} fill="#74c0fc" activeDot={{ r: 5, fill: "#74c0fc", stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-md shadow-sm flex flex-col overflow-visible">
          <div className="px-4 sm:px-5 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Revenue Distribution</h3>
          </div>
          <div className="p-4 sm:p-5 flex-1 flex flex-col">
            <div className="relative h-[200px] sm:h-[220px] w-full flex items-center justify-center mt-2 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<PieTooltip />} cursor={{ fill: 'transparent' }} />
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-auto flex flex-wrap justify-center gap-x-3 gap-y-2 pb-1">
              {pieData.map((entry, index) => (
                 <div key={index} className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                   <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                   <span className="text-gray-500">{entry.name}</span>
                 </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-md shadow-sm flex flex-col overflow-visible">
          <div className="px-4 sm:px-5 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Payment Methods</h3>
          </div>
          <div className="p-4 sm:p-5 flex-1 flex flex-col">
            <div className="relative h-[200px] sm:h-[220px] w-full flex items-center justify-center mt-2 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<PieTooltip />} cursor={{ fill: 'transparent' }} />
                  <Pie data={methodData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                    {methodData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-auto flex flex-wrap justify-center gap-x-3 gap-y-2 pb-1">
              {methodData.map((entry, index) => (
                 <div key={index} className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                   <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                   <span className="text-gray-500">{entry.name}</span>
                 </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
         <JobTable 
           title="Pending Balances" 
           data={monthlyBalances} 
           page={balancePage} 
           setPage={setBalancePage} 
           accentClass="border-t-red-500" 
           columns={[
             { label: 'Date' }, { label: 'Patient' }, { label: 'Balance', align: 'right' }
           ]}
           renderRow={(inv) => (
            <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-xs text-gray-900 font-medium whitespace-nowrap">{new Date(inv.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap truncate max-w-[120px]">{inv.first_name} {inv.last_name}</td>
              <td className="px-4 py-3 text-xs font-bold text-red-600 whitespace-nowrap text-right">{formatCurrency(inv.grand_total)}</td>
            </tr>
           )}
         />
         
         <JobTable 
           title="Recent Invoices" 
           data={recentInvoices} 
           page={recentPage} 
           setPage={setRecentPage} 
           accentClass="border-t-amber-500"
           columns={[
             { label: 'Inv No.' }, { label: 'Patient' }, { label: 'Status', align: 'center' }, { label: 'Total', align: 'right' }
           ]}
           renderRow={(inv) => (
             <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
               <td className="px-4 py-3 text-xs font-mono text-gray-500">{inv.invoice_number}</td>
               <td className="px-4 py-3 text-xs text-gray-900 font-medium whitespace-nowrap truncate max-w-[120px]">{inv.first_name} {inv.last_name}</td>
               <td className="px-4 py-3 text-center">
                 <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    inv.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 
                    inv.payment_status === 'partial' ? 'bg-amber-100 text-amber-700' : 
                    'bg-red-100 text-red-700'
                  }`}>
                    {inv.payment_status}
                  </span>
               </td>
               <td className="px-4 py-3 text-xs font-bold text-gray-900 whitespace-nowrap text-right">{formatCurrency(inv.grand_total)}</td>
             </tr>
           )}
         />

         <div className="bg-white border border-gray-200 rounded-md shadow-sm flex flex-col border-t-[3px] border-t-blue-500 w-full h-[303px]">
           <div className="px-4 py-3 border-b border-gray-200 bg-white">
             <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
           </div>
           
           <div className="p-4 flex-1 grid grid-cols-2 gap-3 content-center bg-white">
              <Link to="/records" className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 hover:border-blue-200 text-blue-700 transition-all cursor-pointer">
                <IconUserPlus size={24} />
                <span className="text-[11px] font-semibold text-center uppercase tracking-wider">New Patient</span>
              </Link>
              
              <Link to="/billing" className="flex flex-col items-center justify-center gap-2 p-4 bg-amber-50 border border-amber-100 rounded-lg hover:bg-amber-100 hover:border-amber-200 text-amber-700 transition-all cursor-pointer">
                <IconFileInvoice size={24} />
                <span className="text-[11px] font-semibold text-center uppercase tracking-wider">New Invoice</span>
              </Link>

              <Link to="/queue" className="flex flex-col items-center justify-center gap-2 p-4 bg-purple-50 border border-purple-100 rounded-lg hover:bg-purple-100 hover:border-purple-200 text-purple-700 transition-all cursor-pointer">
                <IconSpeakerphone size={24} />
                <span className="text-[11px] font-semibold text-center uppercase tracking-wider">Queue TV</span>
              </Link>

              <Link to="/settings" className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 text-gray-700 transition-all cursor-pointer">
                <IconSettings size={24} />
                <span className="text-[11px] font-semibold text-center uppercase tracking-wider">Settings</span>
              </Link>
           </div>
         </div>

      </div>
    </div>
  );
}