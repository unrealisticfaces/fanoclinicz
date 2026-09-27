import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { IconArrowLeft, IconUser, IconReceipt, IconClipboardList, IconDental } from '@tabler/icons-react';

const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const CONDITIONS = [
  { code: 'HEALTHY', label: 'Healthy', color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' },
  { code: 'CARIES', label: 'Caries (Decay)', color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
  { code: 'COMPOSITE', label: 'Composite Filling', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  { code: 'CROWN', label: 'Crown / Cap', color: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100' },
  { code: 'MISSING', label: 'Missing / Extracted', color: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200' }
];

export default function PatientProfile() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [charts, setCharts] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedTooth, setSelectedTooth] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const [patientRes, chartsRes, invoicesRes] = await Promise.all([
          axios.get(`/api/patients/${id}`),
          axios.get(`/api/clinical/${id}`),
          axios.get(`/api/invoices/patient/${id}`)
        ]);
        setPatient(patientRes.data);
        setCharts(chartsRes.data);
        setInvoices(invoicesRes.data);
      } catch (error) {
        console.error("Error fetching patient profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientData();
  }, [id]);

  const applyCondition = async (condition) => {
    if (!selectedTooth) return;
    setIsSaving(true);
    
    setCharts(prev => ({ ...prev, [selectedTooth]: { code: condition.code } }));
    const user = JSON.parse(localStorage.getItem('user'));

    try {
      await axios.post('/api/clinical', {
        patient_id: id,
        dentist_id: user?.id || 1,
        tooth_number: selectedTooth,
        condition_code: condition.code
      });
    } catch (error) {
      console.error("Failed to save condition:", error);
      alert("Database error: Could not save tooth condition.");
    } finally {
      setIsSaving(false);
      setSelectedTooth(null);
    }
  };

  const renderTooth = (num) => {
    const status = charts[num];
    const isSelected = selectedTooth === num;
    const conditionMeta = CONDITIONS.find(c => c.code === status?.code) || CONDITIONS[0]; 

    return (
      <div 
        key={num} 
        onClick={() => setSelectedTooth(num)}
        className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg border cursor-pointer transition-all ${
          isSelected 
            ? 'border-fano-primary ring-2 ring-fano-primary/20 bg-blue-50' 
            : 'border-gray-200 bg-white hover:bg-gray-50'
        }`}
      >
        <span className="text-[10px] font-bold text-gray-400 mb-1">{num}</span>
        <IconDental 
          size={28} 
          className={status && status.code !== 'HEALTHY' ? 'text-fano-primary' : 'text-gray-300'} 
        />
        <div className={`mt-1 sm:mt-2 text-[9px] sm:text-[10px] font-bold px-1 py-0.5 rounded border ${conditionMeta.color} uppercase tracking-wider w-full text-center truncate`}>
          {status ? status.code.substring(0, 3) : 'HLT'}
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-8 text-gray-500">Loading patient profile...</div>;
  if (!patient) return <div className="p-8 text-red-500">Patient not found.</div>;

  const chartEntries = Object.entries(charts);

  return (
    <div className="flex flex-col gap-6 relative pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/records" className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-fano-primary transition-colors">
          <IconArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            {patient.first_name} {patient.last_name}
          </h2>
          <p className="text-sm text-gray-500 font-mono">{patient.patient_code}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Demographics & History */}
        <div className="flex flex-col gap-6 xl:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <IconUser className="text-fano-primary" size={20} />
              <h3 className="font-semibold text-gray-900">Demographics</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">DOB:</span> <span className="font-medium text-gray-900">{new Date(patient.dob).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Gender:</span> <span className="font-medium text-gray-900">{patient.gender}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Contact:</span> <span className="font-medium text-gray-900">{patient.contact_number}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Email:</span> <span className="font-medium text-gray-900">{patient.email || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Registered:</span> <span className="font-medium text-gray-900">{new Date(patient.created_at).toLocaleDateString()}</span></div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-1">
            <div className="p-4 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
              <IconClipboardList className="text-fano-primary" size={20} />
              <h3 className="font-semibold text-gray-900">Clinical Log</h3>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {chartEntries.length > 0 ? (
                <div className="space-y-3">
                  {chartEntries.map(([tooth, data]) => (
                    <div key={tooth} className="flex items-center gap-3 p-2.5 border border-gray-100 rounded-lg">
                      <div className="w-10 h-10 rounded bg-blue-50 text-fano-primary flex items-center justify-center font-bold text-lg shrink-0">
                        {tooth}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{data.code} diagnosed</p>
                        <p className="text-xs text-gray-500">Tooth #{tooth}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No clinical records found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Odontogram & Billing */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-6">
              <IconDental className="text-fano-primary" size={20} />
              <h3 className="font-semibold text-gray-900">Dental Chart (Odontogram)</h3>
            </div>
            
            <div className="text-center mb-8">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Maxillary Arch (Upper)</h4>
              <div className="grid grid-cols-8 lg:grid-cols-16 gap-1 sm:gap-2">
                {UPPER_TEETH.map(renderTooth)}
              </div>
            </div>
            
            <div className="w-full h-px bg-gray-100 my-6"></div>
            
            <div className="text-center">
              <div className="grid grid-cols-8 lg:grid-cols-16 gap-1 sm:gap-2 mb-3">
                {LOWER_TEETH.map(renderTooth)}
              </div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mandibular Arch (Lower)</h4>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
              <IconReceipt className="text-fano-primary" size={20} />
              <h3 className="font-semibold text-gray-900">Billing History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice ID</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-600">{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{inv.invoice_number}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                          inv.payment_status === 'paid' ? 'bg-green-50 text-green-700' : 
                          inv.payment_status === 'partial' ? 'bg-amber-50 text-amber-700' : 
                          'bg-red-50 text-red-700'
                        }`}>
                          {inv.payment_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 text-right">
                        ₱{parseFloat(inv.grand_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500 text-sm">No billing records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {selectedTooth && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xl fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl animate-in slide-in-from-bottom-4 z-50">
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
            <h4 className="text-base font-semibold text-gray-900">
              Diagnose Tooth <span className="text-fano-primary font-bold">#{selectedTooth}</span>
            </h4>
            <button 
              onClick={() => setSelectedTooth(null)}
              className="text-sm text-gray-500 hover:text-gray-900 underline"
            >
              Close
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map(c => (
              <button
                key={c.code}
                disabled={isSaving}
                onClick={() => applyCondition(c)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors shadow-sm ${c.color} ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}