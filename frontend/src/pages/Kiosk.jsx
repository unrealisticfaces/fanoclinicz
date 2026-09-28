import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  IconCheck, IconUserPlus, IconUser, IconStethoscope, 
  IconSparkles, IconCalendarEvent, IconArrowLeft, IconServer, IconWifi
} from '@tabler/icons-react';

let socket = null;

export default function Kiosk() {
  // --- SYSTEM STATES ---
  const [serverIp, setServerIp] = useState(localStorage.getItem('fano_server_ip') || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [step, setStep] = useState(localStorage.getItem('fano_server_ip') ? 'welcome' : 'setup'); 
  
  // --- KIOSK STATES ---
  const [flow, setFlow] = useState(''); // 'new' or 'existing'
  const [existingName, setExistingName] = useState('');
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', dob: '', gender: 'Male', contact_number: '', email: ''
  });
  const [purpose, setPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize Axios and Socket if Server IP is known
  useEffect(() => {
    if (localStorage.getItem('fano_server_ip')) {
      const url = localStorage.getItem('fano_server_ip');
      axios.defaults.baseURL = url;
      if (!socket) socket = io(url);
    }
  }, []);

  const handleConnectServer = async (e) => {
    e.preventDefault();
    setIsConnecting(true);
    let formattedIp = serverIp.trim();
    
    if (!formattedIp.startsWith('http')) {
      formattedIp = `http://${formattedIp}`;
    }
    if (!formattedIp.includes(':5000')) {
      formattedIp = `${formattedIp}:5000`;
    }

    try {
      // Ping the server to verify it exists
      await axios.get(`${formattedIp}/api/system/settings`, { timeout: 3000 });
      
      // If success, save it and initialize
      localStorage.setItem('fano_server_ip', formattedIp);
      axios.defaults.baseURL = formattedIp;
      socket = io(formattedIp);
      
      setStep('welcome');
    } catch (error) {
      alert("Cannot reach the server. Please check the IP on your C# Command Center and try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const resetKiosk = () => {
    setStep('welcome');
    setFlow('');
    setExistingName('');
    setPurpose('');
    setFormData({ first_name: '', last_name: '', dob: '', gender: 'Male', contact_number: '', email: '' });
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFinalSubmit = async (selectedPurpose) => {
    setPurpose(selectedPurpose);
    setIsSubmitting(true);

    try {
      let queueName = '';
      if (flow === 'new') {
        await axios.post('/api/patients', formData);
        queueName = `${formData.first_name} ${formData.last_name}`;
      } else {
        queueName = existingName;
      }

      await axios.post('/api/queue/join', { name: queueName, purpose: selectedPurpose });
      if (socket) socket.emit('new_arrival');

      setStep('success');
      setTimeout(() => {
        setIsSubmitting(false);
        resetKiosk();
      }, 4000);

    } catch (error) {
      alert("System error. Please verify the server connection.");
      setIsSubmitting(false);
    }
  };

  const purposes = [
    { label: 'Consultation', icon: <IconStethoscope size={40} /> },
    { label: 'Cleaning', icon: <IconSparkles size={40} /> },
    { label: 'Extraction', icon: <CustomSyringe size={40} /> },
    { label: 'Follow-up', icon: <IconCalendarEvent size={40} /> }
  ];

  const inputClass = "w-full text-2xl px-6 py-5 bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm font-medium text-slate-800 placeholder-slate-300";
  const labelClass = "block text-lg font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1";

  // --- UI SCREENS ---

  if (step === 'setup') {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center animate-in zoom-in-95">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <IconServer size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">Connect to Server</h1>
          <p className="text-slate-500 mb-8">Enter the "Tablet Connection URL" displayed on your C# Command Center.</p>
          
          <form onSubmit={handleConnectServer} className="space-y-6">
            <div className="relative">
              <IconWifi className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={serverIp}
                onChange={(e) => setServerIp(e.target.value)}
                placeholder="192.168.1.x"
                className="w-full text-xl px-12 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none text-center font-bold"
                required
              />
            </div>
            <button type="submit" disabled={isConnecting} className="w-full py-4 bg-blue-600 text-white text-xl font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg">
              {isConnecting ? 'Verifying...' : 'Pair Terminal'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'welcome') {
    return (
      <div 
        onClick={() => setStep('home')}
        className="h-screen w-screen bg-gradient-to-br from-blue-600 to-blue-900 flex flex-col items-center justify-center text-white cursor-pointer relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10 flex flex-col items-center animate-in slide-in-from-bottom-10 duration-700">
          <h1 className="text-7xl md:text-8xl font-black tracking-tight mb-4 text-center">FANO DENTAL</h1>
          <p className="text-2xl md:text-3xl text-blue-200 font-medium tracking-widest uppercase mb-16">Self-Service Terminal</p>
          
          <div className="px-8 py-4 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-xl font-bold tracking-widest uppercase animate-pulse group-hover:bg-white/30 transition-colors">
            Tap anywhere to begin
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="h-screen w-screen bg-blue-600 flex flex-col items-center justify-center text-white p-6 animate-in fade-in zoom-in duration-500">
        <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl animate-bounce">
          <IconCheck size={80} stroke={3} className="text-blue-600" />
        </div>
        <h1 className="text-6xl font-black mb-4 text-center tracking-tight">You're on the list!</h1>
        <p className="text-3xl text-blue-100 text-center font-medium">Please take a seat. Watch the TV for your name.</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-50 flex flex-col items-center justify-center p-6 md:p-12 font-sans overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col min-h-[600px] relative">
        
        {/* Header */}
        <div className="bg-slate-800 p-8 text-center shrink-0 relative z-10">
          <button 
            onClick={() => step === 'purpose' ? setStep(flow === 'new' ? 'register' : 'checkin') : setStep('welcome')}
            className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            <IconArrowLeft size={36} stroke={2.5} />
          </button>
          <h1 className="text-4xl font-black text-white tracking-widest uppercase">Fano Dental</h1>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
          
          {step === 'home' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
              <button 
                onClick={() => { setFlow('new'); setStep('register'); }}
                className="flex flex-col items-center text-center p-12 rounded-3xl border-2 border-slate-100 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm active:scale-95 group"
              >
                <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                  <IconUserPlus size={48} stroke={2} />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-2">New Patient</h2>
                <p className="text-slate-500 text-lg font-medium">I need to register my details.</p>
              </button>

              <button 
                onClick={() => { setFlow('existing'); setStep('checkin'); }}
                className="flex flex-col items-center text-center p-12 rounded-3xl border-2 border-slate-100 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm active:scale-95 group"
              >
                <div className="w-24 h-24 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mb-6">
                  <IconUser size={48} stroke={2} />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-2">Existing Patient</h2>
                <p className="text-slate-500 text-lg font-medium">I have visited this clinic before.</p>
              </button>
            </div>
          )}

          {step === 'register' && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-3xl mx-auto w-full">
              <h2 className="text-3xl font-black text-slate-800 mb-8 text-center">Patient Registration</h2>
              <form onSubmit={(e) => { e.preventDefault(); setStep('purpose'); }} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>First Name</label>
                    <input type="text" name="first_name" required value={formData.first_name} onChange={handleInputChange} className={inputClass} placeholder="Juan" />
                  </div>
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <input type="text" name="last_name" required value={formData.last_name} onChange={handleInputChange} className={inputClass} placeholder="Dela Cruz" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Date of Birth</label>
                    <input type="date" name="dob" required value={formData.dob} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className={`${inputClass} bg-white`}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Contact Number</label>
                    <input type="tel" name="contact_number" required value={formData.contact_number} onChange={handleInputChange} className={inputClass} placeholder="0917..." />
                  </div>
                  <div>
                    <label className={labelClass}>Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputClass} placeholder="Optional" />
                  </div>
                </div>

                <button type="submit" className="w-full py-6 rounded-2xl text-2xl font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-lg mt-4">
                  Continue to Check-in
                </button>
              </form>
            </div>
          )}

          {step === 'checkin' && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-xl mx-auto w-full text-center">
              <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-8">
                <IconUser size={48} stroke={2} />
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-8">Welcome back!</h2>
              <form onSubmit={(e) => { e.preventDefault(); setStep('purpose'); }} className="space-y-8">
                <div>
                  <label className={labelClass + " !text-center"}>Please enter your full name</label>
                  <input type="text" required value={existingName} onChange={(e) => setExistingName(e.target.value)} className={`${inputClass} text-center`} placeholder="e.g. Juan Dela Cruz" autoFocus />
                </div>
                <button type="submit" disabled={!existingName.trim()} className="w-full py-6 rounded-2xl text-2xl font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg">
                  Next Step
                </button>
              </form>
            </div>
          )}

          {step === 'purpose' && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full max-w-4xl mx-auto">
              <h2 className="text-3xl font-black text-slate-800 mb-8 text-center">What is the reason for your visit?</h2>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {purposes.map(opt => (
                  <button
                    key={opt.label}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleFinalSubmit(opt.label)}
                    className="flex flex-col items-center justify-center gap-6 py-12 px-4 rounded-3xl border-2 border-slate-100 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm active:scale-95 group disabled:opacity-50"
                  >
                    <div className="text-slate-400 group-hover:text-blue-600 transition-colors">
                      {opt.icon}
                    </div>
                    <span className="text-2xl font-bold text-slate-700 group-hover:text-blue-700">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const CustomSyringe = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M17.5 6.5l-4 -4" /><path d="M19 5l-2.5 2.5" /><path d="M10.5 15.5l-4 -4" />
    <path d="M10.5 15.5l-4.5 4.5c-.78 .78 -2.05 .78 -2.83 0c-.78 -.78 -.78 -2.05 0 -2.83l4.5 -4.5" />
    <path d="M13 13l-4 -4" />
  </svg>
);