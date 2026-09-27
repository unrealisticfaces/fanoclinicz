import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io();

export default function QueueTV() {
  const [currentCall, setCurrentCall] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [waitingList, setWaitingList] = useState([]);

  useEffect(() => {
    window.speechSynthesis.getVoices();
    fetchWaitingList();

    socket.on('queue_updated', fetchWaitingList);
    return () => socket.off('queue_updated');
  }, []);

  const fetchWaitingList = async () => {
    try {
      const res = await axios.get('/api/queue');
      setWaitingList(res.data.filter(q => q.status === 'waiting'));
    } catch (err) {
      console.error("Failed to fetch waiting list", err);
    }
  };

  useEffect(() => {
    socket.on('patient_called', (data) => {
      try {
        const doorbell = new Audio('https://www.myinstants.com/media/sounds/doorbell.mp3');
        doorbell.play().then(() => {
          setTimeout(() => {
            const announcement = new SpeechSynthesisUtterance(`${data.name}, please proceed to ${data.room}.`);
            
            const availableVoices = window.speechSynthesis.getVoices();
            const femaleVoice = availableVoices.find(v => 
              v.name.includes('Google UK English Female') || 
              v.name.includes('Zira') || 
              v.name.includes('Samantha') || 
              v.name.includes('Victoria') || 
              v.name.toLowerCase().includes('female')
            );
            
            if (femaleVoice) announcement.voice = femaleVoice;
            announcement.rate = 0.85; 
            announcement.pitch = 1.1; 
            window.speechSynthesis.speak(announcement);
          }, 2000); 
        }).catch(e => console.log("Audio blocked by browser."));
      } catch(err) {}

      setCurrentCall(data);
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 4000); 
    });

    return () => socket.off('patient_called');
  }, []);

  return (
    <div className="h-screen w-screen bg-gray-100 flex flex-col overflow-hidden text-gray-900 font-sans">
      
      {/* TOP HEADER */}
      <div className="h-20 bg-white flex items-center justify-between px-8 shadow-sm border-b border-gray-200 z-20 shrink-0">
        <h1 className="text-3xl font-black text-blue-600 tracking-widest uppercase">Fano Dental</h1>
        <div className="text-2xl font-bold text-gray-500">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* MAIN SECTION */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: MP4 Media Player */}
        <div className="w-[65%] p-6 flex flex-col bg-gray-100">
          <div className="flex-1 bg-black rounded-3xl overflow-hidden shadow-xl relative border-4 border-white">
            <video 
              className="w-full h-full object-cover" 
              autoPlay 
              loop 
              muted 
              playsInline
              src="https://www.w3schools.com/html/mov_bbb.mp4" 
            />
          </div>
        </div>

        {/* Right Side: NOW SERVING & WAITING LIST */}
        <div className="w-[35%] bg-white border-l border-gray-200 flex flex-col z-10 shadow-2xl">
          
          <div className={`flex-[1.5] flex flex-col items-center justify-center p-8 transition-colors duration-500 ${isFlashing ? 'bg-blue-600 text-white' : 'bg-white text-gray-900'}`}>
            <div className="text-center w-full animate-in zoom-in duration-300">
              <h2 className={`text-xl sm:text-3xl font-bold mb-4 uppercase tracking-[0.2em] ${isFlashing ? 'text-blue-200' : 'text-gray-400'}`}>
                Now Serving
              </h2>
              
              {currentCall ? (
                <>
                  <div className={`text-5xl sm:text-7xl font-black mb-4 tracking-tighter drop-shadow-sm ${isFlashing ? 'text-white' : 'text-blue-600'}`}>
                    {currentCall.room}
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold max-w-full truncate mx-auto mb-5 leading-tight">
                    {currentCall.name}
                  </div>
                  {currentCall.dentist && (
                    <div className={`text-lg sm:text-xl font-bold inline-block px-5 py-2 rounded-full border shadow-sm ${isFlashing ? 'bg-blue-700 border-blue-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                      Assigned: {currentCall.dentist}
                    </div>
                  )}
                </>
              ) : (
                <div className="opacity-40 mt-6">
                  <IconDental className="w-24 h-24 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold tracking-widest uppercase">Waiting for call</h3>
                </div>
              )}
            </div>
          </div>

          {/* Waiting List Panel */}
          <div className="flex-1 bg-gray-50 border-t border-gray-200 flex flex-col">
            <div className="px-6 py-4 bg-gray-100 border-b border-gray-200 shadow-sm z-10">
              <h3 className="text-lg font-bold text-gray-600 uppercase tracking-widest">Next in Line</h3>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col divide-y divide-gray-200">
              {waitingList.slice(0, 5).map((patient) => (
                <div key={patient.id} className="px-6 py-4 bg-white flex justify-between items-center animate-in slide-in-from-right">
                  <div className="overflow-hidden pr-4">
                    <div className="text-xl font-bold text-gray-900 truncate">{patient.patient_name}</div>
                  </div>
                  <div className="text-xs font-black text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg shrink-0 uppercase tracking-wider">
                    {patient.purpose}
                  </div>
                </div>
              ))}
              {waitingList.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm font-medium">
                  The waiting room is currently empty.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const IconDental = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 4c-3.866 0-7 3.134-7 7v4c0 3.866 3.134 7 7 7s7-3.134 7-7v-4c0-3.866-3.134-7-7-7z" /><path d="M12 22v-6" /><path d="M9 16c-1.657 0-3-1.343-3-3" /><path d="M15 16c1.657 0 3-1.343 3-3" />
  </svg>
);