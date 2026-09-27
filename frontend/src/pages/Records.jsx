import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Scanner } from '@yudiel/react-qr-scanner';
import Webcam from 'react-webcam';
import { 
  IconSearch, IconPlus, IconX, IconUsers, IconUserPlus, 
  IconAddressBook, IconChevronDown, IconQrcode, IconCamera, IconScan 
} from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Records() {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', dob: '', gender: 'Male', contact_number: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [scannerType, setScannerType] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const webcamRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.action-dropdown-container')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/patients');
      setPatients(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openNewModal = () => {
    setIsEditMode(false);
    setScannerType(null);
    setFormData({ first_name: '', last_name: '', dob: '', gender: 'Male', contact_number: '', email: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (patient) => {
    setIsEditMode(true);
    setScannerType(null);
    setEditId(patient.id);
    const formattedDob = new Date(patient.dob).toISOString().split('T')[0];
    setFormData({
      first_name: patient.first_name,
      last_name: patient.last_name,
      dob: formattedDob,
      gender: patient.gender,
      contact_number: patient.contact_number,
      email: patient.email || ''
    });
    setIsModalOpen(true);
  };

  const handleQRScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const rawText = detectedCodes[0].rawValue;
      try {
        const parsedData = JSON.parse(rawText);
        setFormData({
          ...formData,
          first_name: parsedData.first_name || formData.first_name,
          last_name: parsedData.last_name || formData.last_name,
          dob: parsedData.dob || formData.dob,
          gender: parsedData.gender || formData.gender,
          contact_number: parsedData.contact_number || formData.contact_number,
          email: parsedData.email || formData.email
        });
        setScannerType(null);
      } catch (err) {
        alert("Invalid QR Code format. Please ensure it contains valid patient JSON data.");
        setScannerType(null);
      }
    }
  };

  const captureAndProcessForm = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setIsProcessingImage(true);
    try {
      const response = await axios.post('/api/patients/scan-handwriting', {
        imageBase64: imageSrc
      });

      setFormData({
        ...formData,
        first_name: response.data.first_name || formData.first_name,
        last_name: response.data.last_name || formData.last_name,
        dob: response.data.dob || formData.dob,
        gender: response.data.gender || formData.gender,
        contact_number: response.data.contact_number || formData.contact_number,
        email: response.data.email || formData.email
      });
      
      setScannerType(null);
    } catch (error) {
      alert("Could not read the handwriting clearly. Please try again or enter manually.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await axios.put(`/api/patients/${editId}`, formData);
      } else {
        await axios.post('/api/patients', formData);
      }
      setIsModalOpen(false);
      fetchPatients(); 
    } catch (error) {
      alert("Failed to save patient.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.patient_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const thisMonth = new Date().getMonth();
  const newPatientsThisMonth = patients.filter(p => new Date(p.created_at).getMonth() === thisMonth).length;
  const todayStr = new Date().toDateString();
  const registeredToday = patients.filter(p => new Date(p.created_at).toDateString() === todayStr).length;

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Patient Records</h2>
          <p className="text-sm text-gray-500 mt-1">Manage demographics and view full clinical histories.</p>
        </div>
        <button 
          onClick={openNewModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
        >
          <IconPlus size={16} /> Register Patient
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-2">
        <div className="bg-white border border-gray-200 p-4 rounded-md shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><IconUsers size={24}/></div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Total Patients</div>
            <div className="text-xl font-bold text-gray-900">{patients.length}</div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded-md shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-green-50 text-green-600 flex items-center justify-center shrink-0"><IconUserPlus size={24}/></div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">New This Month</div>
            <div className="text-xl font-bold text-gray-900">{newPatientsThisMonth}</div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded-md shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center shrink-0"><IconAddressBook size={24}/></div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Registered Today</div>
            <div className="text-xl font-bold text-gray-900">{registeredToday}</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md shadow-sm flex flex-col overflow-visible">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Patient Directory</h3>
          <div className="relative w-full max-w-xs">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-visible w-full min-h-[300px]">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date of Birth</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400 text-sm">Loading records...</td></tr>
              ) : filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">{patient.patient_code}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-sm border border-blue-100">
                        {patient.first_name[0]}{patient.last_name[0]}
                      </div>
                      <span className="font-medium text-gray-900 text-sm">{patient.first_name} {patient.last_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{patient.contact_number}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(patient.dob).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right relative">
                    
                    <div className="relative inline-block action-dropdown-container">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === patient.id ? null : patient.id);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm font-medium transition-colors cursor-pointer shadow-sm focus:outline-none ${
                          openDropdownId === patient.id
                            ? 'border-blue-600 text-blue-600 bg-white ring-1 ring-blue-600'
                            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                        }`}
                      >
                        Actions 
                        <IconChevronDown size={16} stroke={2.5} className={openDropdownId === patient.id ? 'rotate-180 transition-transform' : 'transition-transform'}/>
                      </button>

                      {openDropdownId === patient.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-30 animate-in fade-in zoom-in-95 text-left py-2">
                          <button 
                            onClick={() => { navigate(`/records/${patient.id}`); setOpenDropdownId(null); }}
                            className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            View Full Profile
                          </button>
                          <div className="h-px bg-gray-200 w-full my-2"></div>
                          <button 
                            onClick={() => { openEditModal(patient); setOpenDropdownId(null); }}
                            className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            Edit Information
                          </button>
                        </div>
                      )}
                    </div>

                  </td>
                </tr>
              ))}
              {!loading && filteredPatients.length === 0 && (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400 text-sm">No patients found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col animate-in fade-in">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 rounded-t-lg">
              <h3 className="text-base font-semibold text-gray-900">{isEditMode ? 'Edit Patient Details' : 'Register New Patient'}</h3>
              <div className="flex items-center gap-2">
                {!isEditMode && (
                  <>
                    <button 
                      onClick={() => setScannerType(scannerType === 'qr' ? null : 'qr')} 
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer ${scannerType === 'qr' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                      title="Scan QR Code"
                    >
                      <IconQrcode size={16} /> QR
                    </button>
                    <button 
                      onClick={() => setScannerType(scannerType === 'handwriting' ? null : 'handwriting')} 
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer ${scannerType === 'handwriting' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}
                      title="Scan Handwritten Paper Form"
                    >
                      <IconCamera size={16} /> Form
                    </button>
                  </>
                )}
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <button onClick={() => { setIsModalOpen(false); setScannerType(null); }} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                  <IconX size={18} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              
              {/* QR SCANNER VIEW */}
              {scannerType === 'qr' && (
                <div className="mb-6 p-4 bg-gray-900 rounded-xl flex flex-col items-center animate-in zoom-in-95">
                  <div className="w-full max-w-sm rounded-lg overflow-hidden shadow-inner bg-black">
                    <Scanner 
                      onScan={handleQRScan}
                      onError={(err) => console.log(err)}
                      components={{ audio: false, finder: true }}
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-300 mt-4 flex items-center gap-2">
                    <IconQrcode size={18} /> Hold QR code up to the camera
                  </p>
                </div>
              )}

              {/* HANDWRITING SCANNER VIEW */}
              {scannerType === 'handwriting' && (
                <div className="mb-6 p-4 bg-gray-900 rounded-xl flex flex-col items-center animate-in zoom-in-95">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "environment" }}
                    className="w-full max-w-sm rounded-lg shadow-inner mb-4"
                  />
                  <button 
                    type="button"
                    onClick={captureAndProcessForm}
                    disabled={isProcessingImage}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <IconScan size={20} />
                    {isProcessingImage ? 'Reading Form...' : 'Capture & Auto-Fill'}
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>First Name</label>
                    <input type="text" name="first_name" required value={formData.first_name} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <input type="text" name="last_name" required value={formData.last_name} onChange={handleInputChange} className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Date of Birth</label>
                    <input type="date" name="dob" required value={formData.dob} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className={inputClass}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Contact Number</label>
                    <input type="text" name="contact_number" required value={formData.contact_number} onChange={handleInputChange} className={inputClass} placeholder="0917..." />
                  </div>
                  <div>
                    <label className={labelClass}>Email (Optional)</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputClass} placeholder="email@domain.com" />
                  </div>
                </div>

                <div className="pt-4 flex gap-3 mt-2 border-t border-gray-100">
                  <button type="button" onClick={() => { setIsModalOpen(false); setScannerType(null); }} className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 shadow-sm cursor-pointer transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 shadow-sm disabled:opacity-50 cursor-pointer transition-colors">
                    {isSubmitting ? 'Saving...' : 'Save Patient'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}