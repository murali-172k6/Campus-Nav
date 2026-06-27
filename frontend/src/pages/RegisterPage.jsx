import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../api/config';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const role = adminCode === 'ADMIN_SECRET_2026' ? 'admin' : 'student';

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',

        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();

      if (res.ok) {
        login(data);
        if (data.role === 'admin') navigate('/admin');
        else navigate('/navigation');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 w-full fixed inset-0 z-50 overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 m-4 my-8">
         <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-blue-600 dark:text-blue-500 mb-2">CampusNav</h1>
            <p className="text-gray-500 dark:text-gray-400">Create your student profile</p>
         </div>

         {error && <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-xl text-sm font-medium text-center">{error}</div>}

         <form onSubmit={handleRegister} className="space-y-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
               <input 
                 type="text" required
                 value={name} onChange={e => setName(e.target.value)}
                 className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                 placeholder="Jane Doe"
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
               <input 
                 type="email" required
                 value={email} onChange={e => setEmail(e.target.value)}
                 className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                 placeholder="student@campus.edu"
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
               <input 
                 type="password" required minLength="6"
                 value={password} onChange={e => setPassword(e.target.value)}
                 className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                 placeholder="••••••••"
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Code (Optional)</label>
               <input 
                 type="password" 
                 value={adminCode} onChange={e => setAdminCode(e.target.value)}
                 className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                 placeholder="Leave blank if student"
               />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase tracking-wider text-sm transition-colors shadow-md disabled:opacity-70 mt-6"
            >
              {loading ? 'Processing...' : 'Register Account'}
            </button>
         </form>

         <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Already registered? <Link to="/login" className="text-blue-600 hover:underline font-semibold">Sign in here</Link>
         </p>
      </div>
    </div>
  );
}
