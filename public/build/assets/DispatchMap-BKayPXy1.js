const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/leaflet-src-CuDfPR9j.js","assets/app-Deq20CRf.js","assets/app-C4tPhApJ.css"])))=>i.map(i=>d[i]);
import{r as i,j as n,_ as x}from"./app-Deq20CRf.js";/* empty css            */const g={medical:"🏥",fire:"🔥",accident:"🚗",crime:"🚨",natural_disaster:"🌊",other:"⚠️"};function y({incident:e,selectedResponder:t}){const u=i.useRef(null),s=i.useRef(null),h=i.useRef(null),l=i.useRef(null),[f,m]=i.useState(!1);return i.useEffect(()=>((async()=>{if(!(!u.current||f))try{const r=(await x(async()=>{const{default:c}=await import("./leaflet-src-CuDfPR9j.js").then(p=>p.l);return{default:c}},__vite__mapDeps([0,1,2]))).default,a=r.map(u.current).setView([e.latitude,e.longitude],13);r.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"&copy; OpenStreetMap contributors",maxZoom:19}).addTo(a);const o=r.divIcon({className:"custom-div-icon",html:`
                        <div style="
                            background-color: #ef4444;
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            border: 3px solid white;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 20px;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        ">
                            ${g[e.type]||"⚠️"}
                        </div>
                    `,iconSize:[40,40],iconAnchor:[20,20]}),d=r.marker([e.latitude,e.longitude],{icon:o}).addTo(a);d.bindPopup(`
                    <div style="font-size: 12px;">
                        <strong>📍 Incident Location</strong><br/>
                        <strong>Type:</strong> ${e.type}<br/>
                        <strong>Address:</strong> ${e.address||"N/A"}
                    </div>
                `),s.current=a,h.current=d,m(!0)}catch(r){console.error("Failed to load map:",r)}})(),()=>{s.current&&(s.current.remove(),s.current=null,m(!1))}),[e]),i.useEffect(()=>{if(!f||!s.current)return;(async()=>{const r=(await x(async()=>{const{default:a}=await import("./leaflet-src-CuDfPR9j.js").then(o=>o.l);return{default:a}},__vite__mapDeps([0,1,2]))).default;if(l.current&&(s.current.removeLayer(l.current),l.current=null),t){const a=t.current_latitude??t.base_latitude,o=t.current_longitude??t.base_longitude;if(a&&o){const d=r.divIcon({className:"custom-div-icon",html:`
                            <div style="
                                background-color: #3b82f6;
                                width: 36px;
                                height: 36px;
                                border-radius: 50%;
                                border: 3px solid white;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 18px;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                            ">
                                🚑
                            </div>
                        `,iconSize:[36,36],iconAnchor:[18,18]}),c=r.marker([a,o],{icon:d}).addTo(s.current);c.bindPopup(`
                        <div style="font-size: 12px;">
                            <strong>🚑 ${t.name}</strong><br/>
                            <strong>Distance:</strong> ${t.distance_text}<br/>
                            <strong>ETA:</strong> ${t.duration_text}
                        </div>
                    `),l.current=c;const p=r.latLngBounds([[e.latitude,e.longitude],[a,o]]);s.current.fitBounds(p,{padding:[50,50]})}}else s.current.setView([e.latitude,e.longitude],13)})()},[t,f,e]),n.jsxs("div",{className:"relative w-full h-full rounded-lg overflow-hidden shadow-lg border border-gray-200",children:[n.jsx("div",{ref:u,className:"w-full h-full"}),n.jsxs("div",{className:"absolute top-4 left-4 bg-white rounded-lg shadow-md p-3 text-xs z-[1000]",children:[n.jsx("div",{className:"font-semibold text-gray-700 mb-2",children:"Map Legend"}),n.jsxs("div",{className:"flex items-center gap-2 mb-1",children:[n.jsx("div",{className:"w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-sm",children:g[e.type]}),n.jsx("span",{className:"text-gray-600",children:"Incident Location"})]}),t&&n.jsxs("div",{className:"flex items-center gap-2",children:[n.jsx("div",{className:"w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-sm",children:"🚑"}),n.jsx("span",{className:"text-gray-600",children:"Selected Responder"})]})]})]})}export{y as default};
