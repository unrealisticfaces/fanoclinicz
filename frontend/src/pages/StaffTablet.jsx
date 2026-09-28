import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { 
  IconSpeakerphone, IconUser, IconCheck, IconDental, 
  IconArrowLeft, IconBellRinging, IconClock, IconServer, IconWifi 
} from '@tabler/icons-react';

// Initialize null so it doesn't automatically try to hit localhost in an APK
let socket = null;

export default function StaffTablet() {
  const navigate = useNavigate();
  
  // --- SYSTEM STATES ---
  const [serverIp, setServerIp] = useState(localStorage.getItem('fano_server_ip') || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [step, setStep] = useState(localStorage.getItem('fano_server_ip') ? 'main' : 'setup'); 
  
  // --- APP STATES ---
  const [queue, setQueue] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [dentist, setDentist] = useState('Dr. Fano');
  const [room, setRoom] = useState('Room 1');
  const [isCalling, setIsCalling] = useState(false);
  const [recallingId, setRecallingId] = useState(null);

  // Initialize Axios and Socket if Server IP is already known
  useEffect(() => {
    const storedIp = localStorage.getItem('fano_server_ip');
    if (storedIp) {
      axios.defaults.baseURL = storedIp;
      if (!socket) socket = io(storedIp);
    }
  }, []);

  // Listen to queue updates once the main screen is active
  useEffect(() => {
    if (step === 'main') {
      fetchQueue();
      if (socket) {
        socket.on('queue_updated', fetchQueue);
        return () => socket.off('queue_updated');
      }
    }
  }, [step]);

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
      await axios.get(`${formattedIp}/api/system/settings`, { timeout: 3000 });
      
      localStorage.setItem('fano_server_ip', formattedIp);
      axios.defaults.baseURL = formattedIp;
      socket = io(formattedIp);
      
      setStep('main');
    } catch (error) {
      alert("Cannot reach the server. Please check the IP on your C# Command Center and try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await axios.get('/api/queue');
      setQueue(res.data);
    } catch (err) {
      console.error("Failed to fetch queue", err);
    }
  };

  const handleCallPatient = async (e) => {
    e.preventDefault();
    if (!selectedPatient || isCalling) return;
    setIsCalling(true);

    try {
      await axios.put(`/api/queue/${selectedPatient.id}/call`, { dentist, room });
      if (socket) socket.emit('call_patient', { name: selectedPatient.patient_name, dentist, room });
      setSelectedPatient(null);
    } catch (err) {
      alert("Failed to call patient.");
    } finally {
      setIsCalling(false);
    }
  };

  const handleRecall = (patient) => {
    if (recallingId === patient.id) return; 
    setRecallingId(patient.id); 
    if (socket) socket.emit('call_patient', { name: patient.patient_name, dentist: patient.dentist, room: patient.room });
    setTimeout(() => setRecallingId(null), 4000);
  };

  const handleComplete = async (id) => {
    try {
      await axios.put(`/api/queue/${id}/complete`);
      fetchQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const waitingPatients = queue.filter(q => q.status === 'waiting');
  const activePatients = queue.filter(q => q.status === 'called');

  const cardClass = "bg-white border border-gray-200 rounded-md shadow-sm flex flex-col";
  const cardHeaderClass = "px-5 py-4 border-b border-gray-200 bg-transparent flex justify-between items-center";

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

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans overflow-hidden text-gray-800">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors">
            <IconArrowLeft size={24} />
          </button>
          <div className="w-px h-6 bg-gray-300"></div>
          <IconSpeakerphone className="text-blue-600" size={24} />
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Staff Triage Tablet</h1>
        </div>
        <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
          <IconClock size={18} className="text-blue-500" /> Live Sync
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex p-4 lg:p-6 gap-6 overflow-hidden">
        
        {/* LEFT PANEL: Waiting List */}
        <div className={`w-[35%] xl:w-[30%] overflow-hidden ${cardClass}`}>
          <div className={cardHeaderClass}>
            <h3 className="text-lg font-semibold text-gray-900">Waiting List</h3>
            <span className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded text-xs font-bold">{waitingPatients.length} Waiting</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
            {waitingPatients.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <IconUser size={48} className="mb-2 opacity-50" />
                <p className="text-base font-medium">No patients waiting.</p>
              </div>
            ) : (
              waitingPatients.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedPatient(p)}
                  className={`p-4 rounded-md border-2 cursor-pointer transition-colors ${
                    selectedPatient?.id === p.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-bold text-gray-900 text-lg mb-2 truncate">{p.patient_name}</h4>
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded text-xs font-semibold uppercase tracking-wider">{p.purpose}</span>
                    <span className="text-xs text-gray-500">{new Date(p.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Controls & Active View */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          
          {/* Routing Control Panel */}
          <div className={`shrink-0 transition-opacity duration-200 relative overflow-hidden ${cardClass} ${!selectedPatient ? 'opacity-60 pointer-events-none' : ''}`}>
            
            <div className={cardHeaderClass}>
              <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                <IconDental className="text-blue-600" size={20}/>
                Route Patient
              </h3>
              <div className="text-base font-bold text-blue-600">
                {selectedPatient ? selectedPatient.patient_name : 'No Patient Selected'}
              </div>
            </div>
            
            <form onSubmit={handleCallPatient} className="p-5 flex flex-col gap-6">
              
              <div className="flex flex-col xl:flex-row gap-6">
                {/* Dentist Selection */}
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">1. Assign Dentist</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Dr. Fano', 'Dr. Smith'].map(d => (
                      <button 
                        key={d} 
                        type="button" 
                        onClick={() => setDentist(d)} 
                        className={`h-16 text-lg font-semibold rounded-md border-2 transition-colors ${
                          dentist === d ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Room Selection */}
                <div className="flex-[1.5]">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">2. Assign Room</label>
                  <div className="grid grid-cols-4 gap-3">
                    {['Room 1', 'Room 2', 'Room 3', 'Room 4', 'Room 5', 'Room 6', 'Room 7', 'X-Ray'].map((r) => (
                      <button 
                        key={r} 
                        type="button" 
                        onClick={() => setRoom(r)} 
                        className={`h-16 text-lg font-semibold rounded-md border-2 transition-colors ${
                          room === r ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {r.replace('Room ', 'R')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Big Call Button */}
              <button 
                type="submit" 
                disabled={!selectedPatient || isCalling} 
                className="w-full h-16 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <IconSpeakerphone size={24} /> 
                {isCalling ? 'TRANSMITTING...' : 'CALL TO TV'}
              </button>
            </form>
          </div>

          {/* Active Patients Inside */}
          <div className={`flex-1 overflow-hidden ${cardClass}`}>
            <div className={cardHeaderClass}>
              <h3 className="text-lg font-semibold text-gray-900">Currently Inside Clinic</h3>
              <span className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded text-xs font-bold">{activePatients.length} Active</span>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto bg-gray-50/50 custom-scrollbar grid grid-cols-1 xl:grid-cols-2 gap-4 content-start">
              {activePatients.length === 0 ? (
                <div className="col-span-full text-center text-gray-500 py-10 font-medium">No active patients inside the clinic.</div>
              ) : (
                activePatients.map(p => (
                  <div key={p.id} className="bg-white border border-gray-200 rounded-md p-4 flex items-center justify-between gap-4 shadow-sm">
                    <div className="overflow-hidden flex-1">
                      <h4 className="font-bold text-gray-900 text-lg mb-1.5 truncate">{p.patient_name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 font-semibold rounded text-xs">{p.room}</span>
                        <span className="text-gray-300">•</span>
                        <span className="font-medium text-gray-500 text-sm truncate">{p.dentist}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => handleRecall(p)} 
                        disabled={recallingId === p.id}
                        className="w-14 h-14 flex items-center justify-center bg-white text-blue-600 hover:bg-blue-50 rounded-md border border-gray-200 transition-colors cursor-pointer disabled:opacity-50" 
                        title="Recall Patient to TV"
                      >
                        <IconBellRinging size={24} />
                      </button>
                      <button 
                        onClick={() => handleComplete(p.id)} 
                        className="w-14 h-14 flex items-center justify-center bg-white text-green-600 hover:bg-green-50 hover:border-green-200 rounded-md border border-gray-200 transition-colors cursor-pointer" 
                        title="Complete Visit"
                      >
                        <IconCheck size={28} stroke={2.5} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}