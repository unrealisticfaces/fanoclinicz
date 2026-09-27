import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { IconSpeakerphone, IconUser, IconCheck, IconDental, IconArrowLeft, IconBellRinging } from '@tabler/icons-react';

const socket = io();

export default function StaffTablet() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [dentist, setDentist] = useState('Dr. Fano');
  const [room, setRoom] = useState('Room 1');
  const [isCalling, setIsCalling] = useState(false);
  const [recallingId, setRecallingId] = useState(null);

  useEffect(() => {
    fetchQueue();
    socket.on('queue_updated', fetchQueue);
    return () => socket.off('queue_updated');
  }, []);

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
      
      socket.emit('call_patient', {
        name: selectedPatient.patient_name,
        dentist: dentist,
        room: room
      });

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
    
    socket.emit('call_patient', {
      name: patient.patient_name,
      dentist: patient.dentist,
      room: patient.room
    });

    setTimeout(() => {
      setRecallingId(null);
    }, 4000);
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap items-center justify-between shadow-sm gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors cursor-pointer"
            title="Back to Main System"
          >
            <IconArrowLeft size={18} />
          </button>
          <IconSpeakerphone className="text-blue-600 hidden sm:block" size={20} />
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">Staff Triage Tablet</h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row p-4 gap-5 overflow-hidden">
        
        {/* LEFT: Waiting Room Stream */}
        <div className="w-full lg:w-[40%] xl:w-[45%] bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col shrink-0 overflow-hidden lg:h-[calc(100vh-4.5rem)]">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center shrink-0">
            <h3 className="text-base font-bold text-gray-700">Waiting ({waitingPatients.length})</h3>
            {waitingPatients.length > 0 && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 custom-scrollbar">
            {waitingPatients.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <IconUser size={40} className="mb-2 opacity-20" />
                <p className="text-base font-medium">Empty.</p>
              </div>
            ) : (
              waitingPatients.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedPatient(p)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedPatient?.id === p.id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <h4 className="font-semibold text-gray-900 text-base truncate">{p.patient_name}</h4>
                  <div className="flex justify-between items-center mt-2">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold uppercase tracking-wider">{p.purpose}</span>
                    <span className="text-xs text-gray-400 font-mono">{new Date(p.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Action & Active Dashboard */}
        <div className="w-full lg:w-[60%] xl:w-[55%] flex flex-col gap-5 overflow-hidden">
          
          <div className={`bg-white border-2 rounded-lg shadow-sm p-5 shrink-0 transition-all ${selectedPatient ? 'border-blue-500' : 'border-gray-200 opacity-60 pointer-events-none'}`}>
            <div className="flex items-center gap-2 mb-4">
              <IconDental className="text-blue-600" size={20} />
              <h3 className="font-semibold text-gray-900 text-base">Route: <span className="text-blue-600">{selectedPatient ? selectedPatient.patient_name : 'Select a patient'}</span></h3>
            </div>
            
            <form onSubmit={handleCallPatient} className="flex flex-col xl:flex-row gap-4 xl:items-end">
              
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Assign Dentist</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Dr. Fano', 'Dr. Smith'].map(d => (
                    <button key={d} type="button" disabled={isCalling} onClick={() => setDentist(d)} className={`py-2.5 text-sm font-medium rounded border-2 transition-all cursor-pointer ${dentist === d ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'} disabled:opacity-50`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-[1.5]">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Assign Room</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {['Room 1', 'Room 2', 'Room 3', 'Room 4', 'Room 5', 'Room 6', 'X-Ray'].map((r) => (
                    <button key={r} type="button" disabled={isCalling} onClick={() => setRoom(r)} className={`py-2.5 text-sm font-medium rounded border-2 transition-all cursor-pointer ${room === r ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'} disabled:opacity-50`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={!selectedPatient || isCalling} className="xl:w-32 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 xl:py-0 xl:h-[46px] rounded shadow-sm transition-colors text-sm flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase">
                <IconSpeakerphone size={18} /> {isCalling ? '...' : 'Call'}
              </button>
            </form>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col flex-1 min-h-[200px] overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 shrink-0">
              <h3 className="text-sm font-bold text-gray-700">Currently Inside ({activePatients.length})</h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto bg-gray-50/50 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
              {activePatients.length === 0 ? (
                <div className="col-span-full text-center text-sm text-gray-400 py-8 font-medium">No active patients inside the clinic.</div>
              ) : (
                activePatients.map(p => (
                  <div key={p.id} className="bg-white border-2 border-gray-200 rounded-lg p-3.5 shadow-sm flex items-center justify-between gap-3">
                    <div className="overflow-hidden">
                      <h4 className="font-semibold text-gray-900 text-base mb-1 truncate">{p.patient_name}</h4>
                      <div className="flex gap-2 text-xs">
                        <span className="font-bold text-blue-600 whitespace-nowrap">{p.room}</span>
                        <span className="text-gray-400">•</span>
                        <span className="font-medium text-gray-600 truncate">{p.dentist}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => handleRecall(p)} 
                        disabled={recallingId === p.id}
                        className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded border border-blue-200 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
                        title="Recall Patient to TV"
                      >
                        <IconBellRinging size={18} />
                      </button>
                      <button onClick={() => handleComplete(p.id)} className="w-10 h-10 flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded border border-green-200 transition-colors shadow-sm cursor-pointer" title="Complete Visit">
                        <IconCheck size={20} stroke={3} />
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