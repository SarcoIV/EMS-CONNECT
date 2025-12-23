const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/leaflet-src-DCsaQQ4j.js","assets/app-DKN1q2l2.js","assets/app-Bw0oe4zI.css"])))=>i.map(i=>d[i]);
import{r as a,j as _,_ as g}from"./app-DKN1q2l2.js";/* empty css            */const h={medical:"🏥",fire:"🔥",accident:"🚗",crime:"🚨",natural_disaster:"🌊",other:"⚠️"};function v({incident:t,selectedResponder:r}){const l=a.useRef(null),n=a.useRef(null),x=a.useRef(null),u=a.useRef(null),[p,m]=a.useState(!1);return a.useEffect(()=>{const i=document.createElement("link");return i.rel="stylesheet",i.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",document.head.appendChild(i),()=>{document.head.removeChild(i)}},[]),a.useEffect(()=>((async()=>{if(!(!l.current||p))try{const e=(await g(async()=>{const{default:d}=await import("./leaflet-src-DCsaQQ4j.js").then(f=>f.l);return{default:d}},__vite__mapDeps([0,1,2]))).default,o=e.map(l.current).setView([t.latitude,t.longitude],13);e.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"&copy; OpenStreetMap contributors",maxZoom:19}).addTo(o);const s=e.divIcon({className:"custom-div-icon",html:`
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
                            ${h[t.type]||"⚠️"}
                        </div>
                    `,iconSize:[48,48],iconAnchor:[24,24]}),c=e.marker([t.latitude,t.longitude],{icon:s}).addTo(o);c.bindPopup(`
                    <div style="font-size: 12px;">
                        <strong>📍 Incident Location</strong><br/>
                        <strong>Type:</strong> ${t.type}<br/>
                        <strong>Address:</strong> ${t.address||"N/A"}
                    </div>
                `),n.current=o,x.current=c,m(!0)}catch(e){console.error("Failed to load map:",e)}})(),()=>{n.current&&(n.current.remove(),n.current=null,m(!1))}),[t]),a.useEffect(()=>{if(!p||!n.current)return;(async()=>{const e=(await g(async()=>{const{default:o}=await import("./leaflet-src-DCsaQQ4j.js").then(s=>s.l);return{default:o}},__vite__mapDeps([0,1,2]))).default;if(u.current&&(n.current.removeLayer(u.current),u.current=null),r){const o=r.current_latitude??r.base_latitude,s=r.current_longitude??r.base_longitude;if(o&&s){const c=e.divIcon({className:"custom-div-icon",html:`
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
                        `,iconSize:[42,42],iconAnchor:[21,21]}),d=e.marker([o,s],{icon:c}).addTo(n.current);d.bindPopup(`
                        <div style="font-size: 12px;">
                            <strong>🚑 ${r.name}</strong><br/>
                            <strong>Distance:</strong> ${r.distance_text}<br/>
                            <strong>ETA:</strong> ${r.duration_text}
                        </div>
                    `),u.current=d;const f=e.latLngBounds([[t.latitude,t.longitude],[o,s]]);n.current.fitBounds(f,{padding:[50,50]})}}else n.current.setView([t.latitude,t.longitude],13)})()},[r,p,t]),_.jsx("div",{ref:l,className:"w-full h-full"})}export{v as default};
