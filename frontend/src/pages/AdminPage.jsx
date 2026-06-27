import React, { useEffect, useState, useContext } from 'react';
import { Activity, Map, Users, AlertTriangle, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../api/config';

export default function AdminPage() {
  const [stats, setStats] = useState({ totalSearches: 0, mostVisited: [], wheelchairRequests: 0, activeUsers: 0 });
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { authFetch } = useContext(AuthContext);

  useEffect(() => {
     authFetch(`${API_BASE_URL}/api/user/admin/system`)

        .then(res => res.json())
        .then(data => {
            if (data.stats) {
               setStats(data.stats);
               setFeedbacks(data.feedbacks || []);
            }
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setLoading(false);
        });
  }, [authFetch]);

  return (
    <div className="flex flex-col gap-6 h-full w-full py-8 px-4 md:px-8 overflow-y-auto hidden-scrollbar">
      <header className="mb-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-theme-main">Admin Analytics</h1>
           <p className="text-theme-muted mt-2 text-sm">Monitor campus navigation health and user behavior.</p>
        </div>
        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center gap-2 px-4 shadow-sm w-fit">
           <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
           <span className="text-blue-700 dark:text-blue-300 font-medium">System Online</span>
        </div>
      </header>

      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <MetricCard title="Total Navigations" value={stats.totalSearches} icon={<Map />} color="blue" trend="+12% this week" />
         <MetricCard title="Active Users" value={stats.activeUsers} icon={<Users />} color="green" trend="Live now" />
         <MetricCard title="Accessibility Routes" value={stats.wheelchairRequests} icon={<AlertCircle />} color="purple" trend="+3% from last month" />
         <MetricCard title="Reported Issues" value="14" icon={<AlertTriangle />} color="orange" trend="2 unresolved" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
         {/* Most Visited Locations */}
         <div className="bg-theme-panel p-6 border border-theme rounded-2xl shadow-sm lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-theme-main">Most Visited Locations</h2>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b border-theme text-sm text-theme-muted">
                        <th className="pb-3 px-4 font-medium">Location Name</th>
                        <th className="pb-3 px-4 font-medium">Traffic Type</th>
                        <th className="pb-3 px-4 font-medium text-right">Searches</th>
                     </tr>
                  </thead>
                  <tbody>
                     {stats.mostVisited.map((loc, idx) => (
                        <tr key={idx} className="border-b border-theme last:border-0 hover:bg-theme-main transition-colors">
                           <td className="py-4 px-4 font-medium text-theme-main">{loc}</td>
                           <td className="py-4 px-4 text-theme-muted text-sm">Main Campus Area</td>
                           <td className="py-4 px-4 font-bold text-right text-theme-main">{900 - (idx * 150)}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Latest Feedback */}
         <div className="bg-theme-panel p-6 border border-theme rounded-2xl shadow-sm flex flex-col items-start justify-start max-h-[400px] overflow-y-auto hidden-scrollbar">
            <h2 className="text-xl font-semibold mb-4 text-theme-main">Recent Feedback</h2>
            <ul className="space-y-4 w-full">
               {feedbacks.length === 0 ? <p className="text-theme-muted text-sm">No feedback yet.</p> : feedbacks.map((fb, idx) => (
                   <li key={idx} className="flex gap-3 text-sm border-b border-theme pb-3 last:border-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">👤</div>
                      <div>
                          <p className="font-medium text-theme-main">"{fb.message}"</p>
                          <p className="text-xs text-theme-muted mt-1">{new Date(fb.date).toLocaleString()} - {fb.user?.name}</p>
                      </div>
                   </li>
               ))}
            </ul>
         </div>

         {/* Advanced Controls Placeholder */}
         <div className="bg-theme-panel p-6 border border-theme rounded-2xl shadow-sm lg:col-span-3">
             <h2 className="text-xl font-semibold mb-4 text-theme-main">Advanced Edge Controls</h2>
             <p className="text-theme-muted text-sm mb-4">Simulate blocked edges (like broken elevators) to force A* auto-rerouting in real time.</p>
             <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-900 flex justify-between items-center">
                 <div>
                     <p className="font-semibold text-orange-800 dark:text-orange-400">TKR Main Elevator L1 ↔ TKR Main Room 101</p>
                     <p className="text-xs text-orange-600 mt-1">Status: Active</p>
                 </div>
                 <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg text-sm shadow-sm transition-colors">
                     Block Edge
                 </button>
             </div>
         </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color, trend }) {
   const colorClasses = {
      blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
   };

   return (
       <div className="bg-theme-panel p-6 border border-theme rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col pt-5">
           <div className="flex justify-between items-start mb-4">
               <div>
                   <p className="text-sm font-medium text-theme-muted">{title}</p>
                   <h3 className="text-3xl font-bold text-theme-main mt-1">{value}</h3>
               </div>
               <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                   {icon}
               </div>
           </div>
           <p className="text-xs text-theme-muted mt-auto font-medium">{trend}</p>
       </div>
   );
}
