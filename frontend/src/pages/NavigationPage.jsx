import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import bezierSpline from '@turf/bezier-spline';
import { lineString } from '@turf/helpers';
import Fuse from 'fuse.js';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL as BASE } from '../api/config';
import { X, MapPin } from 'lucide-react';

const API_BASE_URL = `${BASE}/api`;


// Helper: Haversine distance
function getDistance(coords1, coords2) {
  const lon1 = coords1[0];
  const lat1 = coords1[1];
  const lon2 = coords2[0];
  const lat2 = coords2[1];
  const R = 6371000;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function MapUpdater({ center, zoom = 17 }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom);
  }, [center, map]);
  return null;
}

export default function NavigationPage({ darkMode }) {
  const [graphData, setGraphData] = useState({ nodes: {}, edges: [] });
  const [routeResult, setRouteResult] = useState(null);
  const [error, setError] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [myLocation, setMyLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([17.3236, 78.5369]);

  const { authFetch, user } = useContext(AuthContext);

  // UI State: Floor Selector
  const [currentFloor, setCurrentFloor] = useState(0);

  // Settings State - Pre-fill from user preferences if available
  const [optimization, setOptimization] = useState(user?.preferences?.optimization || 'fastest');
  const [wheelchair, setWheelchair] = useState(user?.preferences?.wheelchair || false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  useEffect(() => {
    if (user?.preferences) {
      setOptimization(user.preferences.optimization);
      setWheelchair(user.preferences.wheelchair);
    }
  }, [user]);

  // Search State
  const [startQuery, setStartQuery] = useState('');
  const [endQuery, setEndQuery] = useState('');
  const [startPointId, setStartPointId] = useState('');
  const [endPointId, setEndPointId] = useState('');
  
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);

  // Setup Fuse.js for Fuzzy Search
  const nodeArray = useMemo(() => {
     return Object.entries(graphData.nodes).map(([id, data]) => ({
         id,
         ...data,
         searchMeta: `${id} ${data.building || ''} ${data.type || ''}`
     }));
  }, [graphData.nodes]);

  const fuse = useMemo(() => new Fuse(nodeArray, {
      keys: ['id', 'building', 'searchMeta'],
      threshold: 0.3
  }), [nodeArray]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/graph`)
      .then(res => res.json())
      .then(data => setGraphData(data))
      .catch(err => console.error("Could not fetch graph data:", err));
  }, []);

  const handleSearch = (query, setQuery, setSuggestions) => {
      setQuery(query);
      if (!query) {
          setSuggestions([]);
          return;
      }
      if (query.toUpperCase() === 'MY LOCATION') {
          setSuggestions([]);
          return;
      }
      const results = fuse.search(query).map(r => r.item);
      setSuggestions(results.slice(0, 5));
  };

  const selectSuggestion = (item, isStart) => {
      if (isStart) {
          setStartPointId(item.id);
          setStartQuery(item.id);
          setStartSuggestions([]);
      } else {
          setEndPointId(item.id);
          setEndQuery(item.id);
          setEndSuggestions([]);
      }
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMyLocation([latitude, longitude]);
        setStartPointId('MY_LOCATION');
        setStartQuery('📍 My Location');
        setMapCenter([latitude, longitude]);
        
        if (voiceEnabled) speakInstruction("Location fixed. Select destination to begin routing.");
      },
      (err) => {
        setError("Unable to retrieve your location. Please check browser permissions.");
        setStartPointId('');
        setStartQuery('');
      }
    );
  };

  const speakInstruction = (text) => {
    if ('speechSynthesis' in window && voiceEnabled) {
       window.speechSynthesis.cancel();
       const utterance = new SpeechSynthesisUtterance(text);
       window.speechSynthesis.speak(utterance);
    }
  };

  const handleNavigate = async (e) => {
    e.preventDefault();
    if (!startPointId || !endPointId) {
      setError("Please select valid start and destination locations.");
      return;
    }
    setError(null);
    setLoadingRoute(true);
    let resolvedStart = startPointId;

    if (startPointId === 'MY_LOCATION') {
       if (!myLocation) {
          setError("Location not found.");
          setLoadingRoute(false);
          return;
       }
       let closest = null;
       let minD = Infinity;
       Object.entries(graphData.nodes).forEach(([id, data]) => {
          // find closest ground floor node
          if (data.floor === 0) {
              let d = getDistance([myLocation[1], myLocation[0]], data.coords);
              if (d < minD) { minD = d; closest = id; }
          }
       });
       if(closest) resolvedStart = closest;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            startNode: resolvedStart, 
            endNode: endPointId,
            optimization,
            wheelchair
        })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.coords && data.coords.length > 0) {
           let userNodeForCurve = null;
           if (startPointId === 'MY_LOCATION' && myLocation) {
              userNodeForCurve = [myLocation[1], myLocation[0]]; // lng, lat
           }

           // Prepare segments by floor for rendering
           // Note: A real app might splinter this, to simplify let's just make one big spline
           // and we'll color the polyline differently based on the path floor.
           
           try {
              if (data.coords.length >= 2) {
                  const line = lineString(data.coords);
                  const curved = bezierSpline(line, { resolution: 20000, sharpness: 0.5 });
                  data.curvedCoords = curved.geometry.coordinates.map(c => [c[1], c[0]]);
              } else {
                  data.curvedCoords = data.coords.map(c => [c[1], c[0]]);
              }
              if (userNodeForCurve) {
                  data.curvedCoords.unshift([userNodeForCurve[1], userNodeForCurve[0]]);
              }
           } catch(e) { console.warn("Curve generation failed"); }
           
           const midCoords = data.coords[Math.floor(data.coords.length/2)];
           setMapCenter([midCoords[1], midCoords[0]]);
           
           // Floor Auto-Set: Change floor logic to match destination's floor
           if (graphData.nodes[endPointId] && graphData.nodes[endPointId].floor !== undefined) {
               setCurrentFloor(graphData.nodes[endPointId].floor);
           }

           if (voiceEnabled) {
               let speech = `Route found. Total distance ${data.distanceMeters} meters. `;
               if (wheelchair) speech += "Wheelchair accessible route selected. ";
               if (data.estimatedTimeMinutes) speech += `Estimated time ${data.estimatedTimeMinutes} minutes. `;
               if (data.instructions && data.instructions.length > 0) {
                   const first = data.instructions[0];
                   speech += `Head towards ${first.to} via ${first.mode === 'stairs' ? 'the stairs' : first.mode === 'elevator' ? 'the elevator' : 'the walking path'}.`;
               }
               speakInstruction(speech);
           }

           // Record History
           if (user?.token) {
               authFetch(`${BASE}/api/user/history`, {
                   method: 'POST',
                   body: JSON.stringify({ startNode: resolvedStart, endNode: endPointId, distanceMeters: data.distanceMeters })
               }).catch(e => console.error("Could not save history"));
           }
        }
        setRouteResult(data);
      } else {
        setError(data.error || "Route not found");
      }
    } catch (err) {
      setError("Routing server unreachable.");
    } finally {
      setLoadingRoute(false);
    }
  };

  const [showControls, setShowControls] = useState(true);

  const renderPath = () => {
     if (!routeResult || !routeResult.coords) return null;
     
     const positions = routeResult.curvedCoords || routeResult.coords.map(c => [c[1], c[0]]);
     return <Polyline positions={positions} color="#3b82f6" weight={5} opacity={1.0} dashArray="10 5" />;
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full p-2 relative overflow-hidden">
      
      {/* Mobile Control Toggle */}
      <button 
        onClick={() => setShowControls(!showControls)}
        className="md:hidden absolute top-4 left-4 z-[2000] p-3 bg-blue-600 text-white rounded-full shadow-lg border border-blue-500 hover:bg-blue-700 transition-all active:scale-95"
      >
        {showControls ? <X size={20} /> : <MapPin size={20} />}
      </button>

      {/* Sidebar Controls */}
      <div className={`w-full md:w-80 bg-theme-panel p-6 rounded-2xl shadow-sm border border-theme flex flex-col z-[1000] transition-all duration-300 ${showControls ? 'h-auto opacity-100' : 'h-0 opacity-0 overflow-hidden py-0 my-0 border-0'} md:h-full md:opacity-100 md:overflow-y-auto hidden-scrollbar`}>
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-theme-main">Navigation</h2>
            {voiceEnabled && <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full animate-pulse">Voice On</span>}
        </div>
        
        <form onSubmit={(e) => { handleNavigate(e); if(window.innerWidth < 768) setShowControls(false); }} className="flex flex-col gap-5 flex-1">

          {/* Start Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-theme-muted mb-2">From</label>
            <input 
              type="text"
              placeholder="Search building, room..."
              className="w-full p-3 rounded-xl border border-theme bg-theme-main text-theme-main focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
              value={startQuery}
              onChange={(e) => handleSearch(e.target.value, setStartQuery, setStartSuggestions)}
            />
            {startSuggestions.length > 0 && (
                <ul className="absolute top-full left-0 right-0 mt-1 bg-theme-panel border border-theme rounded-xl shadow-xl z-[2000] overflow-hidden">
                    <li className="p-3 text-sm text-blue-500 cursor-pointer hover:bg-theme-main" onClick={getUserLocation}>
                        📍 Use My Current Location
                    </li>
                    {startSuggestions.map(s => (
                        <li key={s.id} onClick={() => selectSuggestion(s, true)} className="p-3 cursor-pointer hover:bg-theme-main border-t border-theme border-opacity-50">
                            <p className="font-semibold text-theme-main">{s.id}</p>
                            <p className="text-xs text-theme-muted">{s.building} • Floor {s.floor}</p>
                        </li>
                    ))}
                </ul>
            )}
          </div>

          {/* End Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-theme-muted mb-2">To</label>
            <input 
              type="text"
              placeholder="Search building, room..."
              className="w-full p-3 rounded-xl border border-theme bg-theme-main text-theme-main focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
              value={endQuery}
              onChange={(e) => handleSearch(e.target.value, setEndQuery, setEndSuggestions)}
            />
            {endSuggestions.length > 0 && (
                <ul className="absolute top-full left-0 right-0 mt-1 bg-theme-panel border border-theme rounded-xl shadow-xl z-[2000] overflow-hidden">
                    {endSuggestions.map(s => (
                        <li key={s.id} onClick={() => selectSuggestion(s, false)} className="p-3 cursor-pointer hover:bg-theme-main border-t border-theme border-opacity-50">
                            <p className="font-semibold text-theme-main">{s.id}</p>
                            <p className="text-xs text-theme-muted">{s.building} • Floor {s.floor}</p>
                        </li>
                    ))}
                </ul>
            )}
          </div>

          {/* Preferences Sub-Panel */}
          <div className="bg-theme-main p-4 rounded-xl border border-theme mt-2 space-y-4">
              <h3 className="text-sm font-semibold text-theme-main uppercase tracking-wider">Route Options</h3>
              
              <div className="flex flex-col gap-2">
                 <label className="text-sm text-theme-muted flex justify-between">
                    <span>Priority</span>
                    <select 
                        value={optimization} 
                        onChange={e => setOptimization(e.target.value)}
                        className="bg-transparent text-blue-500 font-medium outline-none text-right cursor-pointer"
                    >
                        <option value="fastest">Fastest</option>
                        <option value="shortest">Shortest</option>
                        <option value="least_crowded">Least Crowded</option>
                    </select>
                 </label>
              </div>

              <div className="flex items-center justify-between">
                 <span className="text-sm text-theme-muted">Wheelchair Accessible</span>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={wheelchair} onChange={e => setWheelchair(e.target.checked)} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                 </label>
              </div>

              <div className="flex items-center justify-between">
                 <span className="text-sm text-theme-muted">Voice Navigation</span>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={voiceEnabled} onChange={e => {
                        setVoiceEnabled(e.target.checked);
                        if (e.target.checked && 'speechSynthesis' in window) {
                            window.speechSynthesis.speak(new SpeechSynthesisUtterance("Voice navigation enabled."));
                        }
                    }} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                 </label>
              </div>
          </div>

          <button 
            type="submit" 
            disabled={loadingRoute}
            className="w-full mt-auto py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingRoute ? 'Calculating...' : 'Get Directions'}
          </button>
          
          {error && <p className="text-red-500 text-sm mt-2 text-center font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}
        </form>
        
        {/* Route Details Box */}
        {routeResult && !error && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 animate-fade-in">
             <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">Trip Summary</h3>
             <div className="flex justify-between items-center text-sm mb-1">
                 <span className="text-theme-muted">Distance</span>
                 <span className="font-semibold text-theme-main">{routeResult.distanceMeters} m</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                 <span className="text-theme-muted">Estimated Time</span>
                 <span className="font-semibold text-theme-main">{routeResult.estimatedTimeMinutes} min</span>
             </div>
             <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800/50">
                 <p className="text-xs text-theme-muted mb-1 font-semibold uppercase">Step by step</p>
                 <div className="max-h-32 overflow-y-auto hidden-scrollbar flex flex-col gap-2">
                     {routeResult.instructions?.slice(0, 4).map((ins, idx) => (
                         <div key={idx} className="flex gap-2 text-xs">
                             <div className="w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center flex-shrink-0">{idx+1}</div>
                             <span className="text-theme-main">Head to <span className="font-semibold">{ins.to}</span> via {ins.mode}</span>
                         </div>
                     ))}
                 </div>
             </div>
             {user && (
                 <button 
                    onClick={() => {
                        authFetch(`${BASE}/api/user/favorites`, {
                            method: 'POST', body: JSON.stringify({ nodeId: endPointId })
                        }).then(() => alert('Saved to favorites!'));

                    }}
                    className="mt-4 w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium text-xs transition-colors shadow-sm"
                 >
                    ⭐ Save Destination to Favorites
                 </button>
             )}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="flex-1 rounded-2xl overflow-hidden shadow-sm border border-theme relative z-[0]">
        
        {/* Multi-Floor Control Overlay */}
        <div className="absolute top-4 right-4 z-[1000] bg-theme-panel rounded-xl shadow-lg border border-theme flex flex-col overflow-hidden">
            {[2, 1, 0].map(level => (
                <button 
                  key={level}
                  onClick={() => setCurrentFloor(level)}
                  className={`w-12 h-12 flex items-center justify-center font-bold text-sm transition-colors border-b last:border-0 border-theme ${currentFloor === level ? 'bg-blue-600 text-white' : 'text-theme-muted hover:bg-theme-main'}`}
                >
                    L{level}
                </button>
            ))}
        </div>

        <MapContainer center={mapCenter} zoom={18} className="w-full h-full">
          <MapUpdater center={mapCenter} />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={darkMode 
              ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png' 
              : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
          />
          
          {Object.entries(graphData.nodes).map(([name, coordsObj]) => {
            const isVisible = coordsObj.floor === currentFloor || coordsObj.floor === undefined;
            if (!isVisible) return null;

            const isStart = name === startPointId;
            const isEnd = name === endPointId;
            
            // Default icon rendering
            const iconUrl = isStart ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png' :
                            isEnd ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png' :
                            coordsObj.type === 'elevator' ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png' :
                            coordsObj.type === 'stairs' ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png' :
                            'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png';

            const customIcon = new L.Icon({
              iconUrl,
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            });
            
            return (
              <Marker key={name} position={[coordsObj.coords[1], coordsObj.coords[0]]} icon={customIcon}>
                <Popup className="font-sans">
                  <div className="font-semibold text-gray-800">{name}</div>
                  <div className="text-xs text-gray-500">{coordsObj.building} - Level {coordsObj.floor}</div>
                  <div className="text-xs text-blue-500 capitalize">{coordsObj.type}</div>
                </Popup>
              </Marker>
            );
          })}
          
          {myLocation && (
             <Marker 
               position={myLocation} 
               icon={new L.Icon({
                 iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
                 shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                 iconSize: [25, 41], iconAnchor: [12, 41]
               })}
             >
                <Popup><strong>📍 You are here</strong></Popup>
             </Marker>
          )}

          {renderPath()}
        </MapContainer>
      </div>
    </div>
  );
}
