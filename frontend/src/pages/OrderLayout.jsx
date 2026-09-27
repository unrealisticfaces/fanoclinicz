import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  IconDashboard, IconUsers, IconReceipt, IconSettings, IconLogout, 
  IconUser, IconSpeakerphone, IconX, IconCamera, IconShieldCheck
} from '@tabler/icons-react';

export default function OrderLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || { 
    id: 1, name: 'Admin', email: 'admin@fanodental.com', photoURL: '', role: 'admin'
  });
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  const [profileData, setProfileData] = useState({ 
    name: user.name || '', 
    email: user.email || '', 
    password: '', 
    photoURL: user.photoURL || ''
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user.photoURL || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage({ type: '', text: '' });
    
    try {
      let updatedPhotoUrl = profileData.photoURL;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('avatar', selectedFile);
        
        const uploadRes = await axios.post(`/api/users/${user.id}/avatar`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        updatedPhotoUrl = uploadRes.data.photoUrl;
      }

      const response = await axios.put(`/api/users/${user.id}`, {
        name: profileData.name,
        email: profileData.email,
        password: profileData.password
      });
      
      setProfileMessage({ type: 'success', text: response.data.message });
      
      const updatedUser = { 
        ...user, 
        name: profileData.name, 
        email: profileData.email,
        photoURL: updatedPhotoUrl
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setProfileData(prev => ({ ...prev, photoURL: updatedPhotoUrl, password: '' }));
      setSelectedFile(null);
      
      setTimeout(() => setIsProfileModalOpen(false), 2000);
    } catch (error) {
      console.error("Failed to update profile", error);
      setProfileMessage({ type: 'error', text: "Error updating profile." });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const menuConfig = [
    { name: 'Dashboard', path: '/dashboard', icon: <IconDashboard size={20} />, allowedRoles: ['admin', 'dentist', 'staff'] },
    { name: 'Records', path: '/records', icon: <IconUsers size={20} />, allowedRoles: ['admin', 'dentist', 'staff'] },
    { name: 'Queue Manager', path: '/queue', icon: <IconSpeakerphone size={20} />, allowedRoles: ['admin', 'dentist', 'staff'] },
    { name: 'Billing', path: '/billing', icon: <IconReceipt size={20} />, allowedRoles: ['admin', 'staff'] },
    { name: 'System Settings', path: '/settings', icon: <IconSettings size={20} />, allowedRoles: ['admin'] },
  ];

  const visibleMenu = menuConfig.filter(item => item.allowedRoles.includes(user.role));

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900 font-sans">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex fixed h-full z-10 shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-blue-600 tracking-tight">FANO DENTAL</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {visibleMenu.map((item) => (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${location.pathname.startsWith(item.path) ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
              {item.icon} {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <IconShieldCheck size={16} className={user.role === 'admin' ? 'text-red-500' : user.role === 'dentist' ? 'text-blue-500' : 'text-green-500'}/>
            Logged in as {user.role}
          </div>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 flex flex-col min-h-screen bg-gray-50">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 capitalize">{location.pathname.split('/')[1]?.replace('-', ' ') || 'Dashboard'}</h2>
          
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-md transition-colors focus:outline-none cursor-pointer">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full object-cover shadow-sm border border-gray-200" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm uppercase shadow-sm">{user.name.charAt(0)}</div>
              )}
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name}</span>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                  <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <button onClick={() => { setIsProfileOpen(false); setIsProfileModalOpen(true); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 flex items-center gap-2 transition-colors cursor-pointer">
                  <IconUser size={16} /> My Profile
                </button>
                <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors mt-1 cursor-pointer">
                  <IconLogout size={16} /> Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          <Outlet /> 
        </div>
      </main>

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-in fade-in zoom-in-95 max-h-[95vh] overflow-hidden">
            
            <div className="relative h-24 shrink-0 overflow-hidden bg-blue-50">
              {previewUrl && (
                <div 
                  className="absolute inset-0 bg-cover bg-center blur-md opacity-60 scale-110"
                  style={{ backgroundImage: `url(${previewUrl})` }}
                />
              )}
              <button onClick={() => {setIsProfileModalOpen(false); setSelectedFile(null); setPreviewUrl(user.photoURL || '');}} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 bg-white/70 hover:bg-white rounded-full p-1 transition-colors cursor-pointer z-10 shadow-sm">
                <IconX size={20} />
              </button>
            </div>

            <div className="px-6 relative flex flex-col items-center -mt-12 mb-4 shrink-0">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              <div onClick={() => fileInputRef.current.click()} className="relative cursor-pointer group" title="Click to upload photo">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-white transition-opacity group-hover:opacity-80 relative z-10" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-50 border-4 border-white text-blue-600 flex items-center justify-center text-4xl font-bold shadow-md transition-opacity group-hover:opacity-80 relative z-10">
                    {profileData.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow border border-gray-100 text-blue-600 group-hover:bg-blue-50 transition-colors z-20">
                  <IconCamera size={16} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mt-3">{profileData.name}</h3>
              <p className="text-sm text-gray-500">{profileData.email}</p>
              
              <span className="mt-2 px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded text-[10px] font-bold uppercase tracking-wider">
                {user.role}
              </span>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 border-t border-gray-100">
              {profileMessage.text && (
                <div className={`mb-5 px-4 py-3 text-sm rounded-lg border ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {profileMessage.text}
                </div>
              )}
              
              <form id="profileForm" onSubmit={handleProfileUpdate} className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Public Profile</h4>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Display Name</label>
                    <input type="text" name="name" value={profileData.name || ''} onChange={(e) => setProfileData({...profileData, name: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 shadow-sm" />
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Account Security</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Email Address</label>
                      <input type="email" name="email" value={profileData.email || ''} onChange={(e) => setProfileData({...profileData, email: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">New Password <span className="text-gray-400 font-normal">(Leave blank to keep current)</span></label>
                      <input type="password" name="password" value={profileData.password || ''} onChange={(e) => setProfileData({...profileData, password: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 shadow-sm" placeholder="••••••••" minLength="6"/>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => {setIsProfileModalOpen(false); setSelectedFile(null); setPreviewUrl(user.photoURL || '');}} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 shadow-sm cursor-pointer transition-colors">Cancel</button>
              <button type="submit" form="profileForm" disabled={isSavingProfile} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 shadow-sm disabled:opacity-50 cursor-pointer transition-colors">
                {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}