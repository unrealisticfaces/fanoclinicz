import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { IconSpeakerphone, IconScreenShare, IconUser, IconDeviceTablet, IconCheck, IconBellRinging } from '@tabler/icons-react';

const socket = io();

export default function QueueManager() {
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
    <div className="max-w-[1400px] mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-xl border border-gray-200 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <IconSpeakerphone className="text-blue-600" size={24} />
            Receptionist Triage (Fallback)
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Control the queue if the clinical staff is unavailable.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => window.open('/kiosk', '_blank')} className="bg-gray-100 border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-gray-200 transition-colors shadow-sm">
            <IconDeviceTablet size={16} /> Kiosk
          </button>
          <button onClick={() => window.open('/staff', '_blank')} className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-blue-100 transition-colors shadow-sm">
            <IconDeviceTablet size={16} /> Staff Tablet
          </button>
          <button onClick={() => { socket.emit('remote_launch_tv'); alert("Launch signal sent to the Waiting Room TV."); }} className="bg-gray-900 border border-gray-800 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-black transition-colors shadow-sm cursor-pointer">
            <IconScreenShare size={16} /> Remote Launch TV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: Unassigned / Waiting */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-700">Needs Assignment ({waitingPatients.length})</h3>
            {waitingPatients.length > 0 && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>}
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-gray-50/50">
            {waitingPatients.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <IconUser size={48} className="mb-2 opacity-20" />
                <p>Waiting room is clear.</p>
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
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{p.patient_name}</h4>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-semibold border border-gray-200">{p.purpose}</span>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">{new Date(p.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Assignment Panel & Active Rooms */}
        <div className="flex flex-col gap-6">
          
          <div className={`bg-white border-2 rounded-xl shadow-sm p-6 transition-all ${selectedPatient ? 'border-blue-500 shadow-blue-100' : 'border-gray-200 opacity-50 pointer-events-none'}`}>
            <h3 className="font-bold text-gray-900 mb-4">Route Patient</h3>
            <form onSubmit={handleCallPatient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Dentist</label>
                <select value={dentist} onChange={(e) => setDentist(e.target.value)} disabled={isCalling} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-50">
                  <option value="Dr. Fano">Dr. Fano</option>
                  <option value="Dr. Smith">Dr. Smith</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Room</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {['Room 1', 'Room 2', 'Room 3', 'Room 4', 'Room 5', 'Room 6', 'X-Ray'].map((r) => (
                    <button key={r} type="button" disabled={isCalling} onClick={() => setRoom(r)} className={`py-2 text-sm font-medium rounded border ${room === r ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'} disabled:opacity-50`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={!selectedPatient || isCalling} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed">
                <IconSpeakerphone size={20} /> {isCalling ? 'Transmitting...' : 'Call Patient'}
              </button>
            </form>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-bold text-gray-700">Currently in Clinic ({activePatients.length})</h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {activePatients.length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-6">No active visits.</div>
              ) : (
                activePatients.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 border border-gray-100 bg-white rounded-lg shadow-sm">
                    <div className="overflow-hidden pr-2">
                      <h4 className="font-bold text-gray-900 truncate">{p.patient_name}</h4>
                      <p className="text-xs text-blue-600 font-semibold">{p.room} • {p.dentist}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => handleRecall(p)} 
                        disabled={recallingId === p.id}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md border border-transparent hover:border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                        title="Recall Patient to TV"
                      >
                        <IconBellRinging size={20} />
                      </button>
                      <button onClick={() => handleComplete(p.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-md border border-transparent hover:border-green-200 transition-colors" title="Mark as Complete">
                        <IconCheck size={20} />
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