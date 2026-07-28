import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { listDoctors, updateDoctor } from '../api/doctors.api';
import { ErrorMessage } from '../components/common';
import { UserPlus, UserCog, Stethoscope, Search, CheckCircle2, Shield, Activity, Phone, GraduationCap, DollarSign, Edit2, X, Plus } from 'lucide-react';
import AdminAddDoctorModal from '../components/admin/AdminAddDoctorModal';
import AdminEditDoctorModal from '../components/admin/AdminEditDoctorModal';

function AdminStaffManager() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDoctor, setEditDoctor] = useState(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await listDoctors({ limit: 100 });
      setDoctors(data.results || data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  if (loading && doctors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Activity className="h-10 w-10 text-brand-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading hospital staff...</p>
      </div>
    );
  };

  const handleSuspend = async (doctor) => {
    if (!window.confirm(`Are you sure you want to suspend Dr. ${doctor.first_name} ${doctor.last_name}?`)) return;
    try {
      const result = await updateDoctor(doctor.id, { is_available: false });
      setDoctors(prev => prev.map(d => d.id === doctor.id ? (result.data || result) : d));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to suspend doctor');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold font-display text-dark">Manage Doctors</h2>
          <p className="text-slate-500 mt-1 font-medium">View and manage all registered doctors in the system.</p>
        </div>
        <button 
          className="btn-premium px-5 py-2.5 flex items-center"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Doctor
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="glass-panel overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/40 text-xs uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Doctor Name</th>
                <th className="px-6 py-4 font-bold">Specialization</th>
                <th className="px-6 py-4 font-bold">Contact / Email</th>
                <th className="px-6 py-4 font-bold">Fee</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {doctors.map((doctor) => (
                <tr key={doctor.id} className="hover:bg-white/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-600 to-medical-500 text-white flex items-center justify-center font-bold mr-4 shadow-sm">
                        {doctor.first_name?.[0]}{doctor.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-dark">Dr. {doctor.first_name} {doctor.last_name}</p>
                        <p className="text-xs text-slate-500 font-medium">ID: {doctor.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-dark font-bold flex items-center">
                      <Stethoscope className="h-3 w-3 mr-1.5 text-medical-500" />
                      {doctor.specialization || 'General'}
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-1 truncate max-w-[150px]">{doctor.qualification || 'No details'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-600 font-bold truncate max-w-[180px]">{doctor.email || '—'}</p>
                    <div className="flex items-center text-xs text-brand-600 font-bold mt-1">
                      <Phone className="h-3 w-3 mr-1" />
                      {doctor.phone || 'No phone'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-dark font-bold">
                    ${doctor.consultation_fee ?? 0}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {doctor.is_available ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200 shadow-sm">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-sm">
                        Off Duty
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setEditDoctor(doctor)}
                      className="text-sm font-bold text-brand-600 hover:text-brand-800 transition-colors"
                    >
                      Edit
                    </button>
                    {doctor.is_available && (
                      <>
                        <span className="text-slate-300 mx-3">|</span>
                        <button 
                          onClick={() => handleSuspend(doctor)}
                          className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors"
                        >
                          Suspend
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {doctors.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No doctors found in the system.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <AdminAddDoctorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onDoctorAdded={(newDoc) => setDoctors(prev => [newDoc, ...prev])} 
      />
      
      <AdminEditDoctorModal
        isOpen={!!editDoctor}
        onClose={() => setEditDoctor(null)}
        doctor={editDoctor}
        onDoctorUpdated={(updatedDoc) => setDoctors(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d))}
      />
    </div>
  );
}

export default AdminStaffManager;
