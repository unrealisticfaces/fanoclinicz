import React, { useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { IconCheck, IconUser, IconStethoscope } from '@tabler/icons-react';

const socket = io(); // Connects relative to current IP

export default function Kiosk() {
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !purpose) return;

    try {
      await axios.post('/api/queue/join', { name, purpose });
      
      socket.emit('new_arrival');

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setName('');
        setPurpose('');
      }, 3500);

    } catch (error) {
      alert("System error. Please approach the front desk.");
    }
  };

  if (isSuccess) {
    return (
      <div className="h-screen w-screen bg-blue-600 flex flex-col items-center justify-center text-white p-6 animate-in fade-in duration-300">
        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 animate-bounce">
          <IconCheck size={64} className="text-blue-600" />
        </div>
        <h1 className="text-5xl font-bold mb-4 text-center">You are on the list!</h1>
        <p className="text-2xl text-blue-100 text-center">Please take a seat. Your name will be called on the TV shortly.</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="bg-gray-900 p-8 text-center border-b-4 border-blue-600">
          <h1 className="text-4xl font-bold text-white tracking-widest">FANO DENTAL CLINIC</h1>
          <p className="text-blue-400 mt-2 text-lg">Welcome! Please fill in below.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div>
            <label className="text-lg font-bold text-gray-700 flex items-center gap-2 mb-3">
              <IconUser className="text-blue-600" /> First Name
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-2xl px-6 py-5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
              placeholder="e.g. Juan Dela Cruz"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-lg font-bold text-gray-700 flex items-center gap-2 mb-3">
              <IconStethoscope className="text-blue-600" /> Purpose of Visit
            </label>
            <div className="grid grid-cols-2 gap-4">
              {['Consultation', 'Cleaning', 'Extraction', 'Follow-up'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPurpose(opt)}
                  className={`py-5 rounded-xl text-xl font-semibold border-2 transition-all ${
                    purpose === opt 
                      ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-md' 
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={!name || !purpose}
            className="w-full py-5 rounded-xl text-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg"
          >
            Submit 
          </button>
        </form>
      </div>
    </div>
  );
}