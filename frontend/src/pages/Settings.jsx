import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  IconBuildingHospital, IconWorld, IconBell, IconShieldLock, 
  IconCheck, IconUsers, IconPlus, IconX, IconDatabaseExport, 
  IconChevronDown, IconAlertTriangle, IconTerminal2
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('clinic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};
  const isAdmin = currentUser.role === 'admin';

  const [formData, setFormData] = useState({
    clinicName: '', address: '', phone: '', email: '', taxId: '',
    currency: 'PHP', timezone: 'Asia/Manila', 
    audioAlerts: true, browserPush: false, autoClearQueue: true, autoBackup: false
  });

  const [usersList, setUsersList] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUserSubmitting, setIsUserSubmitting] = useState(false);
  const [userFormData, setUserFormData] = useState({ id: null, name: '', email: '', password: '', role: 'staff' });

  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [wipePassword, setWipePassword] = useState('');
  const [isWiping, setIsWiping] = useState(false);
  const [systemLogs, setSystemLogs] = useState([]);
  const [backupFiles, setBackupFiles] = useState([]);
  const [isForcingBackup, setIsForcingBackup] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.action-dropdown-container')) setOpenDropdownId(null);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    axios.get('/api/system/settings')
      .then(res => {
        setFormData(res.data);
        setIsSettingsLoading(false);
      })
      .catch(err => console.error("Error loading settings:", err));
  }, []);

  useEffect(() => {
    if (activeTab === 'users' && isAdmin) fetchUsersList();
    if (activeTab === 'logs' && isAdmin) fetchSystemLogs();
  }, [activeTab]);

  const fetchUsersList = async () => {
    try {
      const res = await axios.get('/api/users');
      setUsersList(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchSystemLogs = async () => {
    try {
      const res = await axios.get('/api/system/logs');
      setSystemLogs(res.data.logs);
      setBackupFiles(res.data.backups);
    } catch (error) {
      console.error("Error fetching system logs:", error);
    }
  };

  const handleManualBackup = async () => {
    setIsForcingBackup(true);
    try {
      await axios.post('/api/system/daily-backup', { manual: true });
      if (activeTab === 'logs') fetchSystemLogs();
      alert("Manual backup completed successfully!");
    } catch (error) {
      alert("Backup failed. Check System Logs for details.");
      if (activeTab === 'logs') fetchSystemLogs();
    } finally {
      setIsForcingBackup(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSettingsSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    try {
      await axios.put('/api/system/settings', formData);
      setMessage('System configuration saved globally.');
    } catch (error) {
      alert('Failed to save settings to the database.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleUserInputChange = (e) => setUserFormData({ ...userFormData, [e.target.name]: e.target.value });

  const openNewUserModal = () => {
    setIsEditMode(false);
    setUserFormData({ id: null, name: '', email: '', password: '', role: 'staff' });
    setIsUserModalOpen(true);
    setOpenDropdownId(null);
  };

  const openEditUserModal = (u) => {
    setIsEditMode(true);
    setUserFormData({ id: u.id, name: u.name, email: u.email, password: '', role: u.role });
    setIsUserModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setIsUserSubmitting(true);
    try {
      if (isEditMode) await axios.put(`/api/users/${userFormData.id}`, userFormData);
      else await axios.post('/api/users', userFormData);
      setIsUserModalOpen(false);
      fetchUsersList();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to save user account.");
    } finally {
      setIsUserSubmitting(false);
    }
  };

  const handleDeleteUser = async (id, role) => {
    setOpenDropdownId(null);
    if (role === 'admin') return alert("Cannot delete admin accounts from this interface.");
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await axios.delete(`/api/users/${id}`);
        fetchUsersList();
      } catch (error) {
        alert("Failed to delete user.");
      }
    }
  };

  const handleWipeDatabase = async (e) => {
    e.preventDefault();
    setIsWiping(true);
    try {
      await axios.post('/api/system/wipe', { adminId: currentUser.id, password: wipePassword });
      alert("System wiped successfully. You will now be logged out.");
      localStorage.clear();
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.error || "Invalid password or failed to wipe system.");
      setIsWiping(false);
      setWipePassword('');
      if (activeTab === 'logs') fetchSystemLogs(); 
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  const NavItem = ({ id, icon, label, hidden }) => {
    if (hidden) return null;
    return (
      <button
        onClick={() => { setActiveTab(id); setMessage(''); }}
        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
          activeTab === id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <span className={activeTab === id ? 'text-blue-600' : 'text-gray-400'}>{icon}</span>
        {label}
      </button>
    );
  };

  if (isSettingsLoading) {
    return <div className="p-8 text-center text-gray-500">Loading system settings...</div>;
  }

  return (
    <div className="max-w-[1100px] mx-auto space-y-6 pb-12">
      
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">System Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage global configuration, users, and clinic identity.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Configuration</h3>
          <NavItem id="clinic" icon={<IconBuildingHospital size={18} />} label="Clinic Details" />
          <NavItem id="localization" icon={<IconWorld size={18} />} label="Localization" />
          
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2">Global System</h3>
          <NavItem id="notifications" icon={<IconBell size={18} />} label="Alerts & Sounds" />
          <NavItem id="users" icon={<IconUsers size={18} />} label="User Roles & Access" hidden={!isAdmin} />
          <NavItem id="advanced" icon={<IconShieldLock size={18} />} label="Advanced Setup" hidden={!isAdmin} />
          <NavItem id="logs" icon={<IconTerminal2 size={18} />} label="System Logs" hidden={!isAdmin} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col min-h-[500px]">
          
          {/* GROUP 1: STANDARD FORMS */}
          {activeTab === 'clinic' || activeTab === 'localization' || activeTab === 'notifications' ? (
            <form onSubmit={handleSettingsSave} className="flex flex-col h-full">
              <div className="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center h-[72px]">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {activeTab === 'clinic' && 'Clinic Information'}
                    {activeTab === 'localization' && 'Regional Settings'}
                    {activeTab === 'notifications' && 'System Alerts & Sounds'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {activeTab === 'clinic' && 'Update your business identity and contact information.'}
                    {activeTab === 'localization' && 'Set your timezone and currency formats.'}
                    {activeTab === 'notifications' && 'Manage browser push notifications and queue audio chimes.'}
                  </p>
                </div>
                {message && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full animate-in fade-in zoom-in">
                    <IconCheck size={16} /> {message}
                  </span>
                )}
              </div>

              <div className="p-6 space-y-6 flex-1">
                {activeTab === 'clinic' && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Registered Clinic Name</label>
                        <input type="text" name="clinicName" required value={formData.clinicName} onChange={handleInputChange} className={inputClass} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Complete Address</label>
                        <input type="text" name="address" required value={formData.address} onChange={handleInputChange} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Contact Number</label>
                        <input type="text" name="phone" required value={formData.phone} onChange={handleInputChange} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Support Email</label>
                        <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>TIN / Tax ID Number</label>
                        <input type="text" name="taxId" value={formData.taxId} onChange={handleInputChange} className={inputClass} placeholder="000-000-000-000" />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'localization' && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>System Currency</label>
                        <select name="currency" disabled value={formData.currency} className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-500 cursor-not-allowed">
                          <option value="PHP">₱ Philippine Peso (PHP)</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Timezone</label>
                        <select name="timezone" disabled value={formData.timezone} className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-500 cursor-not-allowed">
                          <option value="Asia/Manila">(GMT+08:00) Asia/Manila</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md bg-white shadow-sm">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Queue TV Audio Chimes</h4>
                        <p className="text-sm text-gray-500 mt-0.5">Play a notification sound when a patient is called to a room.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="audioAlerts" checked={formData.audioAlerts} onChange={handleInputChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:transition-all peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md bg-white shadow-sm">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Browser Push Notifications</h4>
                        <p className="text-sm text-gray-500 mt-0.5">Allow this browser to show desktop alerts for background events.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="browserPush" checked={formData.browserPush} onChange={handleInputChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:transition-all peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5"></div>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-sm">
                  {isSubmitting ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>

          ) : activeTab === 'advanced' ? (

            // --- ADVANCED TAB (Controls & Maintenance) ---
            <form onSubmit={handleSettingsSave} className="flex flex-col h-full animate-in fade-in">
              <div className="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center h-[72px]">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Advanced System Setup</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Manage automation, manual overrides, and system wipe.</p>
                </div>
                {message && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full animate-in fade-in zoom-in">
                    <IconCheck size={16} /> {message}
                  </span>
                )}
              </div>

              <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-gray-50/30">
                
                {/* Automation Toggles */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md shadow-sm bg-white">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Automated Morning Backup</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Create a silent background backup when the system first starts.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                      <input type="checkbox" name="autoBackup" checked={formData.autoBackup} onChange={handleInputChange} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:transition-all peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md shadow-sm bg-white">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Auto-Clear Queue at Midnight</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Automatically clear all active queue numbers every night at 12:00 AM.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                      <input type="checkbox" name="autoClearQueue" checked={formData.autoClearQueue} onChange={handleInputChange} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:transition-all peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5"></div>
                    </label>
                  </div>
                </div>

                {/* Manual Backup Trigger */}
                <div className="p-5 border border-gray-200 rounded-md shadow-sm bg-white flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex-1 w-full">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Local Database Backup</h4>
                    <p className="text-xs text-gray-500">Instantly generate a full SQL snapshot of your database and save it locally to the server's backup folder.</p>
                  </div>
                  <button type="button" onClick={handleManualBackup} disabled={isForcingBackup} className="w-full sm:w-auto shrink-0 bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                    <IconDatabaseExport size={16} /> {isForcingBackup ? 'Generating...' : 'Force Backup Now'}
                  </button>
                </div>

                {/* Danger Zone */}
                <div className="p-5 bg-red-50 border border-red-100 rounded-md shadow-sm flex flex-col items-start gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-red-800">Danger Zone</h4>
                    <p className="text-sm text-red-600 mt-0.5">Resetting system data removes all patients, charts, and invoices permanently.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsWipeModalOpen(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <IconAlertTriangle size={16} /> Factory Reset System
                  </button>
                </div>

              </div>

              <div className="mt-auto px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-sm">
                  {isSubmitting ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>

          ) : activeTab === 'logs' ? (
            
            // --- SYSTEM LOGS TAB (Purely Monitoring) ---
            <div className="flex flex-col h-full animate-in fade-in">
              <div className="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center h-[72px]">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">System Logs & Snapshots</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Monitor system events and view available backup files.</p>
                </div>
              </div>

              <div className="p-6 space-y-6 flex-1 overflow-y-auto bg-gray-50/30">
                
                {/* Top: List of files */}
                <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h4 className="text-sm font-semibold text-gray-900">Available Local Backups</h4>
                  </div>
                  <div className="p-4">
                    {backupFiles.length === 0 ? (
                      <p className="text-sm text-gray-500">No `.sql` backups found yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {backupFiles.map((f, i) => (
                          <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-md bg-gray-50">
                            <span className="font-mono text-xs text-gray-700 truncate mr-2" title={f.name}>{f.name}</span>
                            <span className="text-[10px] font-bold text-gray-400 shrink-0">{f.size}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom: Full Width Live Terminal */}
                <div className="bg-gray-900 rounded-md shadow-sm border border-gray-800 flex flex-col h-[400px] overflow-hidden">
                  <div className="bg-gray-950 px-5 py-3 flex items-center justify-between border-b border-gray-800">
                    <div className="flex items-center gap-2">
                      <IconTerminal2 size={18} className="text-gray-400"/>
                      <span className="text-sm font-mono text-gray-400 uppercase tracking-wider">System Event Logs</span>
                    </div>
                    <span className="text-xs font-mono text-gray-600">{systemLogs.length} events recorded</span>
                  </div>
                  
                  <div className="p-5 overflow-y-auto custom-scrollbar flex-1 font-mono text-sm space-y-3">
                    {systemLogs.length === 0 ? (
                      <div className="text-gray-600">Waiting for system events...</div>
                    ) : (
                      systemLogs.map(log => (
                        <div key={log.id} className="border-b border-gray-800/50 pb-3 last:border-0 last:pb-0">
                          <div className="flex items-start gap-3 mb-1">
                            <span className="text-gray-500 shrink-0">[{new Date(log.timestamp).toLocaleString()}]</span>
                            <span className="text-blue-400 font-bold shrink-0">[{log.action}]</span>
                            <span className={log.status === 'SUCCESS' ? 'text-green-400' : log.status === 'WARNING' ? 'text-yellow-400' : 'text-red-400'}>
                              {log.status}
                            </span>
                          </div>
                          <div className="text-gray-300 ml-[215px] break-words opacity-90">{log.details}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>

          ) : (
            
            // --- USER MANAGEMENT TAB ---
            <div className="flex flex-col h-full animate-in fade-in pb-16">

              <div className="px-6 py-5 border-b border-gray-200 bg-white flex justify-between items-center h-[72px]">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">User Roles & Access</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Manage dentists, receptionists, and system access.</p>
                </div>
                <button 
                  onClick={openNewUserModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <IconPlus size={16}/> Add User
                </button>
              </div>
              
              <div className="overflow-visible">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {usersList.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {u.photo_url ? (
                              <img src={u.photo_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                {u.name.charAt(0)}
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-900">{u.name} {u.id === currentUser.id ? '(You)' : ''}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                            u.role === 'admin' ? 'bg-red-50 text-red-700' :
                            u.role === 'dentist' ? 'bg-blue-50 text-blue-700' :
                            'bg-green-50 text-green-700'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative inline-block action-dropdown-container">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(openDropdownId === u.id ? null : u.id);
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm font-medium transition-colors cursor-pointer shadow-sm focus:outline-none ${
                                openDropdownId === u.id
                                  ? 'border-blue-600 text-blue-600 bg-white ring-1 ring-blue-600'
                                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                              }`}
                            >
                              Actions 
                              <IconChevronDown size={16} stroke={2.5} className={openDropdownId === u.id ? 'rotate-180 transition-transform' : 'transition-transform'}/>
                            </button>

                            {openDropdownId === u.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-30 animate-in fade-in zoom-in-95 text-left py-2">
                                <button 
                                  onClick={() => { openEditUserModal(u); setOpenDropdownId(null); }}
                                  className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                                >
                                  Update Information
                                </button>
                                <div className="h-px bg-gray-200 w-full my-2"></div>
                                <button 
                                  onClick={() => { handleDeleteUser(u.id, u.role); setOpenDropdownId(null); }}
                                  disabled={u.role === 'admin'}
                                  className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Delete User
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FACTORY RESET CONFIRMATION MODAL */}
      {isWipeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col animate-in fade-in">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-red-50 rounded-t-lg">
              <h3 className="text-base font-semibold text-red-800 flex items-center gap-2">
                <IconAlertTriangle size={20} />
                Confirm System Reset
              </h3>
              <button onClick={() => { setIsWipeModalOpen(false); setWipePassword(''); }} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                <IconX size={18} />
              </button>
            </div>
            
            <form onSubmit={handleWipeDatabase} className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                This action will <strong className="text-red-600">permanently delete</strong> all patients, invoices, and clinical records. 
                To proceed, please authorize this action with your administrator password.
              </p>
              
              <div className="mt-4">
                <label className={labelClass}>Administrator Password</label>
                <input 
                  type="password" 
                  required 
                  value={wipePassword} 
                  onChange={(e) => setWipePassword(e.target.value)} 
                  className={inputClass} 
                  placeholder="••••••••" 
                  autoFocus
                />
              </div>

              <div className="pt-4 flex gap-3 mt-2">
                <button type="button" onClick={() => { setIsWipeModalOpen(false); setWipePassword(''); }} className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 shadow-sm cursor-pointer transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isWiping || !wipePassword} className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 cursor-pointer transition-colors shadow-sm">
                  {isWiping ? 'Wiping...' : 'Confirm Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col animate-in fade-in">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 rounded-t-lg">
              <h3 className="text-base font-semibold text-gray-900">{isEditMode ? 'Edit User Account' : 'Create New Account'}</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                <IconX size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input type="text" name="name" required value={userFormData.name} onChange={handleUserInputChange} className={inputClass} placeholder="e.g. Dr. Jane Smith" />
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                <input type="email" name="email" required value={userFormData.email} onChange={handleUserInputChange} className={inputClass} placeholder="jane@fanodental.com" />
              </div>
              <div>
                <label className={labelClass}>{isEditMode ? 'New Password' : 'Temporary Password'}</label>
                <input type="password" name="password" required={!isEditMode} minLength="6" value={userFormData.password} onChange={handleUserInputChange} className={inputClass} placeholder="••••••••" />
                <p className="text-[11px] text-gray-500 mt-1.5">
                  {isEditMode ? 'Leave blank to keep current password.' : 'User can change this in their profile later.'}
                </p>
              </div>
              <div>
                <label className={labelClass}>System Role & Access Level</label>
                <select name="role" value={userFormData.role} onChange={handleUserInputChange} disabled={isEditMode && userFormData.role === 'admin'} className={`${inputClass} cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed`}>
                  <option value="staff">Front Desk Staff (No Settings Access)</option>
                  <option value="dentist">Dentist (Clinical Only, No Billing)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
                {isEditMode && userFormData.role === 'admin' && (
                   <p className="text-[11px] text-amber-600 mt-1.5">Admin roles cannot be downgraded.</p>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 cursor-pointer transition-colors shadow-sm">Cancel</button>
                <button type="submit" disabled={isUserSubmitting} className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors shadow-sm">
                  {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}