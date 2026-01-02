const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/leaflet-src-CEOiReRD.js","assets/app-CHM_ItTx.js","assets/app-CeqjMdzY.css"])))=>i.map(i=>d[i]);
import{r as a,j as y,_}from"./app-CHM_ItTx.js";/* empty css            */const b={medical:"🏥",fire:"🔥",accident:"🚗",crime:"🚨",natural_disaster:"🌊",other:"⚠️"};function L({incident:r,selectedResponder:t}){const f=a.useRef(null),e=a.useRef(null),h=a.useRef(null),s=a.useRef(null),c=a.useRef(null),[p,m]=a.useState(!1);return a.useEffect(()=>{const u=document.createElement("link");return u.rel="stylesheet",u.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",document.head.appendChild(u),()=>{document.head.removeChild(u)}},[]),a.useEffect(()=>((async()=>{if(!(!f.current||p))try{const n=(await _(async()=>{const{default:d}=await import("./leaflet-src-CEOiReRD.js").then(g=>g.l);return{default:d}},__vite__mapDeps([0,1,2]))).default,o=n.map(f.current).setView([r.latitude,r.longitude],13);n.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"&copy; OpenStreetMap contributors",maxZoom:19}).addTo(o);const i=n.divIcon({className:"custom-div-icon",html:`
                        <div style="
                            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                            width: 48px;
                            height: 48px;
                            border-radius: 50%;
                            border: 4px solid white;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 24px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 4px rgba(239, 68, 68, 0.2);
                        ">
                            ${b[r.type]||"⚠️"}
                        </div>
                    `,iconSize:[48,48],iconAnchor:[24,24]}),l=n.marker([r.latitude,r.longitude],{icon:i}).addTo(o);l.bindPopup(`
                    <div style="font-size: 12px;">
                        <strong>📍 Incident Location</strong><br/>
                        <strong>Type:</strong> ${r.type}<br/>
                        <strong>Address:</strong> ${r.address||"N/A"}
                    </div>
                `),e.current=o,h.current=l,m(!0)}catch(n){console.error("Failed to load map:",n)}})(),()=>{e.current&&(e.current.remove(),e.current=null,m(!1))}),[r]),a.useEffect(()=>{if(!p||!e.current)return;(async()=>{const n=(await _(async()=>{const{default:o}=await import("./leaflet-src-CEOiReRD.js").then(i=>i.l);return{default:o}},__vite__mapDeps([0,1,2]))).default;if(s.current&&(e.current.removeLayer(s.current),s.current=null),c.current&&(e.current.removeLayer(c.current),c.current=null),t){const o=t.current_latitude??t.base_latitude,i=t.current_longitude??t.base_longitude;if(o&&i){const l=n.divIcon({className:"custom-div-icon",html:`
                            <div style="
                                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                                width: 42px;
                                height: 42px;
                                border-radius: 50%;
                                border: 4px solid white;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 22px;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 4px rgba(59, 130, 246, 0.2);
                            ">
                                🚑
                            </div>
                        `,iconSize:[42,42],iconAnchor:[21,21]}),d=n.marker([o,i],{icon:l}).addTo(e.current);if(d.bindPopup(`
                        <div style="font-size: 12px;">
                            <strong>🚑 ${t.name}</strong><br/>
                            <strong>Distance:</strong> ${t.distance_text}<br/>
                            <strong>ETA:</strong> ${t.duration_text}
                        </div>
                    `),s.current=d,t.route_coordinates&&t.route_coordinates.length>0){const x=n.polyline(t.route_coordinates,{color:"#3b82f6",weight:4,opacity:.7,dashArray:"10, 10"}).addTo(e.current);c.current=x,console.log("[DISPATCH MAP] Route line drawn",{responder_id:t.id,point_count:t.route_coordinates.length})}const g=n.latLngBounds([[r.latitude,r.longitude],[o,i]]);e.current.fitBounds(g,{padding:[50,50]})}}else e.current.setView([r.latitude,r.longitude],13)})()},[t,p,r]),y.jsx("div",{ref:f,className:"w-full h-full"})}export{L as default};
