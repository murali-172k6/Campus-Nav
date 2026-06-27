import React, { useEffect, useState, useContext } from 'react';
import { Clock, Bus, Coffee, BookOpen, GraduationCap, MessageSquare, Star, History } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../api/config';

export default function DashboardPage() {
  const { user, authFetch } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      authFetch(`${API_BASE_URL}/api/user/history`)
        .then(res => res.json())
        .then(data => {
          setHistory(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [user, authFetch]);

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/api/user/feedback`, {
        method: 'POST',
        body: JSON.stringify({ message: feedback })
      });
      if (res.ok) {
        alert('Feedback submitted!');
        setFeedback('');
      }
    } catch (err) {
      alert('Failed to submit feedback');
    }
  };


  return (
    <div className="flex flex-col gap-6 h-full w-full py-8 px-4 md:px-8 overflow-y-auto hidden-scrollbar">
      <header className="mb-2">
        <h1 className="text-3xl font-bold text-theme-main">Welcome, {user?.name || 'Student'}</h1>
        <p className="text-theme-muted mt-2">Your central command for academics and campus life.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Navigation History Card */}
        <div className="bg-theme-panel p-6 rounded-2xl shadow-sm border border-theme hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl text-blue-600 dark:text-blue-400"><History size={24} /></div>
             <h2 className="text-xl font-semibold text-theme-main">Recent Trips</h2>
          </div>
          <div className="space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-theme-muted">No recent trips found.</p>
            ) : (
              history.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm border-b border-theme pb-2 last:border-0">
                  <span className="text-theme-main truncate max-w-[150px]">{item.startNode} → {item.endNode}</span>
                  <span className="text-xs text-theme-muted">{new Date(item.date).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Favorites Card */}
        <div className="bg-theme-panel p-6 rounded-2xl shadow-sm border border-theme hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-xl text-yellow-600 dark:text-yellow-400"><Star size={24} /></div>
             <h2 className="text-xl font-semibold text-theme-main">Favorites</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {user?.favorites?.length === 0 ? (
              <p className="text-sm text-theme-muted">No favorites saved yet.</p>
            ) : (
              user?.favorites?.map((fav, idx) => (
                <span key={idx} className="px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium border border-yellow-100 dark:border-yellow-800">
                  {fav}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Attendance Card */}
        <div className="bg-theme-panel p-6 rounded-2xl shadow-sm border border-theme hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-xl text-indigo-600 dark:text-indigo-400"><BookOpen size={24} /></div>
             <h2 className="text-xl font-semibold text-theme-main">Attendance</h2>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3 dark:bg-gray-700">
            <div className="bg-indigo-500 h-3 rounded-full" style={{width: '85%'}}></div>
          </div>
          <p className="text-sm text-theme-muted">Current: 85% (Target: 75%)</p>
        </div>

        {/* Bus Tracking Card */}
        <div className="bg-theme-panel p-6 rounded-2xl shadow-sm border border-theme hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl text-green-600 dark:text-green-400"><Bus size={24} /></div>
             <h2 className="text-xl font-semibold text-theme-main">Bus Tracking</h2>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl mb-2">
             <p className="text-sm font-semibold text-green-800 dark:text-green-300">Route 14 (City Bus)</p>
             <p className="text-xs text-green-600 dark:text-green-400 mt-1">Arriving at Main Gate in 5 mins</p>
          </div>
          <button className="text-sm text-blue-500 font-medium hover:underline w-full text-center">View Full Schedule</button>
        </div>

        {/* Canteen Info */}
        <div className="bg-theme-panel p-6 rounded-2xl shadow-sm border border-theme hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-xl text-orange-600 dark:text-orange-400"><Coffee size={24} /></div>
             <h2 className="text-xl font-semibold text-theme-main">Canteen Menu</h2>
          </div>
          <div className="space-y-2 mb-4 text-sm">
             <div className="flex justify-between"><span className="text-theme-main">Veg Thali</span><span className="font-semibold text-theme-main">₹60</span></div>
             <div className="flex justify-between"><span className="text-theme-main">Chicken Biryani</span><span className="font-semibold text-theme-main">₹120</span></div>
             <div className="flex justify-between"><span className="text-theme-main">Cold Coffee</span><span className="font-semibold text-theme-main">₹40</span></div>
          </div>
          <p className="text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg text-center font-medium">Moderate Crowd Currently</p>
        </div>

        {/* Marks & Feedback */}
        <div className="lg:col-span-1 grid grid-rows-2 gap-6">
           {/* Marks Portal */}
           <div className="bg-theme-panel p-6 rounded-2xl shadow-sm border border-theme hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-3 bg-red-100 dark:bg-red-900 rounded-xl text-red-600 dark:text-red-400"><GraduationCap size={24} /></div>
                 <h2 className="text-xl font-semibold text-theme-main">Grades</h2>
              </div>
              <table className="w-full text-left">
                <tbody>
                  <tr className="border-b border-theme text-sm">
                    <td className="py-2 text-theme-muted">Data Structures</td>
                    <td className="py-2 font-bold text-green-500 text-right">A</td>
                  </tr>
                  <tr className="border-b border-theme text-sm">
                    <td className="py-2 text-theme-muted">Database Systems</td>
                    <td className="py-2 font-bold text-blue-500 text-right">B+</td>
                  </tr>
                </tbody>
              </table>
           </div>

           {/* Feedback Card */}
           <div className="bg-theme-panel p-6 rounded-2xl shadow-sm border border-theme hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-3 bg-teal-100 dark:bg-teal-900 rounded-xl text-teal-600 dark:text-teal-400"><MessageSquare size={24} /></div>
                 <h2 className="text-xl font-semibold text-theme-main">Support</h2>
              </div>
              <textarea 
                rows={2} 
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                className="w-full p-3 rounded-lg border border-theme bg-transparent text-sm text-theme-main focus:ring-2 focus:ring-teal-500 outline-none mb-3 resize-none" 
                placeholder="Suggest something..."
              ></textarea>
              <button 
                onClick={handleFeedbackSubmit}
                className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Send Feedback
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}
