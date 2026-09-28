import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { IconDental } from '@tabler/icons-react';

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
              v.name.includes('Google UK English Female') || v.name.includes('Zira') || 
              v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.toLowerCase().includes('female')
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
      setTimeout(() => setIsFlashing(false), 5000); 
    });

    return () => socket.off('patient_called');
  }, []);

  // Helper classes for standard Tabler UI look
  const cardClass = "bg-white border border-gray-200 rounded-md shadow-sm flex flex-col";

  return (
    <div className="h-screen w-screen bg-gray-50 flex flex-col overflow-hidden text-gray-900 font-sans">
      
      {/* TOP HEADER */}
      <div className="h-20 bg-white flex items-center justify-between px-8 shadow-sm border-b border-gray-200 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-md border border-blue-100">
            <IconDental size={28} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-widest uppercase">Fano Dental</h1>
        </div>
        <div className="text-2xl font-semibold text-gray-500">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* MAIN SECTION */}
      <div className="flex-1 flex p-6 gap-6 overflow-hidden">
        
        {/* Left Side: Media Player */}
        <div className={`w-[60%] overflow-hidden ${cardClass}`}>
          <video 
            className="w-full h-full object-cover" 
            autoPlay loop muted playsInline
            src="https://www.w3schools.com/html/mov_bbb.mp4" 
          />
        </div>

        {/* Right Side: NOW SERVING & WAITING LIST */}
        <div className="w-[40%] flex flex-col gap-6 overflow-hidden">
          
          {/* Now Serving Block */}
          <div className={`shrink-0 min-h-[300px] flex flex-col items-center justify-center p-8 transition-colors duration-300 rounded-md border shadow-sm ${
            isFlashing ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <h2 className={`text-xl font-bold uppercase tracking-[0.2em] mb-6 ${isFlashing ? 'text-blue-200' : 'text-gray-400'}`}>
              Now Serving
            </h2>
            
            {currentCall ? (
              <div className="flex flex-col items-center w-full text-center">
                {/* truncate prevents long room names from breaking the box */}
                <div className="text-7xl font-black mb-4 w-full truncate">
                  {currentCall.room}
                </div>
                {/* truncate prevents long patient names from overlapping the video */}
                <div className="text-4xl font-bold mb-6 w-full truncate">
                  {currentCall.name}
                </div>
                {currentCall.dentist && (
                  <div className={`text-xl font-semibold px-6 py-2 rounded-md border ${
                    isFlashing ? 'bg-blue-700/50 border-blue-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}>
                    {currentCall.dentist}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center opacity-40 text-gray-500">
                <IconDental className="w-24 h-24 mb-4" />
                <h3 className="text-2xl font-semibold tracking-widest uppercase">Waiting for call</h3>
              </div>
            )}
          </div>

          {/* Waiting List Panel */}
          <div className={`flex-1 overflow-hidden ${cardClass}`}>
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-gray-700 uppercase tracking-wider">Next in Line</h3>
              <span className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded text-sm font-bold">
                {waitingList.length} Waiting
              </span>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col p-4 gap-3 bg-gray-50/50">
              {waitingList.slice(0, 5).map((patient, index) => (
                <div key={patient.id} className="p-4 bg-white rounded-md flex justify-between items-center border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <span className="text-2xl font-bold text-gray-300 w-8">{index + 1}</span>
                    <div className="text-2xl font-bold text-gray-800 truncate">{patient.patient_name}</div>
                  </div>
                  <div className="text-sm font-bold text-gray-600 bg-gray-100 border border-gray-200 px-4 py-2 rounded-md shrink-0 uppercase tracking-wider">
                    {patient.purpose}
                  </div>
                </div>
              ))}
              
              {waitingList.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 opacity-60">
                  <IconDental size={48} className="mb-3" />
                  <span className="text-lg font-medium tracking-wide">The waiting room is empty.</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}