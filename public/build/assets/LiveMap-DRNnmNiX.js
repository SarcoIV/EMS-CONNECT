const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/leaflet-src-dUkYyTMI.js","assets/app-DdSAXJpz.js","assets/app-c7qg4t2T.css"])))=>i.map(i=>d[i]);
import{r,a as Z,_,j as e}from"./app-DdSAXJpz.js";import{S as xe,H as ue}from"./sidebar-pmTikxr0.js";import{I as me}from"./IncomingCallNotification-C565Pnno.js";import he from"./ResponderMonitoring-BQn6pWAy.js";/* empty css            */import"./index-5tPYL8Y9.js";import"./input-DbFf0Mhc.js";import"./dropdown-menu-CavkNH8D.js";const fe=5e3,x={pending:"#f59e0b",dispatched:"#3b82f6",completed:"#10b981",cancelled:"#6b7280"},f={idle:"#10b981",assigned:"#f59e0b",en_route:"#3b82f6",arrived:"#8b5cf6",busy:"#ef4444",offline:"#6b7280"},D={assigned:"#f59e0b",accepted:"#3b82f6",en_route:"#3b82f6",arrived:"#8b5cf6",completed:"#10b981",cancelled:"#6b7280"},g={medical:"🏥",fire:"🔥",accident:"🚗",crime:"🚨",natural_disaster:"🌊",other:"⚠️"};function Le({user:G,incidents:k,activeCalls:J,activeDispatches:W,activeResponders:q,focusedIncidentId:z}){var H,B,F;const[b,K]=r.useState(k),[j,Q]=r.useState(J),[T,X]=r.useState(W),[Y,ee]=r.useState(q),[i,y]=r.useState(null),[ge,te]=r.useState(null),[u,P]=r.useState(null),[L,se]=r.useState("all"),[C,ae]=r.useState("all"),[M,re]=r.useState(!1),[ne,le]=r.useState(new Date),n=r.useRef(null),$=r.useRef(null),R=r.useRef([]),w=r.useRef([]),A=r.useRef([]),h=r.useRef(null),U=b.filter(t=>!(L!=="all"&&t.status!==L||C!=="all"&&t.type!==C||M&&t.status==="completed")),S=r.useCallback(async()=>{try{console.log("[LIVEMAP] 🔄 Refreshing map data...");const t=await Z.get("/admin/live-map/data");K(t.data.incidents),Q(t.data.activeCalls),X(t.data.activeDispatches||[]),ee(t.data.activeResponders||[]),le(new Date),V(t.data.incidents),oe(t.data.activeDispatches||[],t.data.activeResponders||[])}catch(t){console.error("[LIVEMAP] ❌ Failed to fetch map data:",t)}},[]);r.useEffect(()=>((async()=>{if(typeof window>"u")return;const o=(await _(async()=>{const{default:s}=await import("./leaflet-src-dUkYyTMI.js").then(d=>d.l);return{default:s}},__vite__mapDeps([0,1,2]))).default;if(delete o.Icon.Default.prototype._getIconUrl,o.Icon.Default.mergeOptions({iconRetinaUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",iconUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",shadowUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"}),$.current&&!n.current){const s=[14.5995,120.9842];if(n.current=o.map($.current).setView(s,12),o.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxZoom:19}).addTo(n.current),V(k),z){const d=k.find(p=>p.id===z);d&&(n.current.setView([d.latitude,d.longitude],16),y(d))}}})(),()=>{n.current&&(n.current.remove(),n.current=null)}),[]);const V=async t=>{if(!n.current)return;const o=(await _(async()=>{const{default:s}=await import("./leaflet-src-dUkYyTMI.js").then(d=>d.l);return{default:s}},__vite__mapDeps([0,1,2]))).default;R.current.forEach(s=>s.remove()),R.current=[],t.forEach(s=>{var c,m;if(!s.latitude||!s.longitude)return;const d=`
                <div style="
                    background-color: ${x[s.status]||"#6b7280"};
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    font-size: 16px;
                    ${s.has_active_call?"animation: pulse 1s infinite;":""}
                ">
                    ${g[s.type]||"⚠️"}
                </div>
                ${s.has_active_call?'<div style="position:absolute;top:-4px;right:-4px;width:12px;height:12px;background:#ef4444;border-radius:50%;border:2px solid white;"></div>':""}
            `,p=o.divIcon({html:d,className:"custom-marker",iconSize:[36,36],iconAnchor:[18,18]}),a=o.marker([s.latitude,s.longitude],{icon:p}).addTo(n.current),l=`
                <div style="min-width: 200px;">
                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">
                        ${g[s.type]} ${s.type.replace("_"," ").toUpperCase()}
                    </div>
                    <div style="color: #666; font-size: 12px; margin-bottom: 8px;">
                        #${s.id.toString().padStart(4,"0")}
                    </div>
                    <div style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: ${x[s.status]}20; color: ${x[s.status]};">
                        ${s.status.toUpperCase()}
                    </div>
                    ${s.has_active_call?'<span style="margin-left: 4px; color: #ef4444; font-size: 11px;">📞 Active Call</span>':""}
                    <div style="margin-top: 8px; font-size: 12px;">
                        <strong>Reporter:</strong> ${((c=s.user)==null?void 0:c.name)||"Unknown"}<br/>
                        <strong>Phone:</strong> ${((m=s.user)==null?void 0:m.phone_number)||"N/A"}<br/>
                        <strong>Location:</strong> ${s.address||"No address"}
                    </div>
                    ${s.description?`<div style="margin-top: 8px; font-size: 12px; color: #666;">${s.description}</div>`:""}
                    <div style="margin-top: 12px;">
                        <a href="/admin/incidents/${s.id}/overview" style="display: block; text-align: center; padding: 8px 12px; background: #f1f5f9; color: #334155; border-radius: 8px; text-decoration: none; font-size: 12px; font-weight: 500;">
                            View in Dashboard
                        </a>
                    </div>
                </div>
            `;a.bindPopup(l),a.on("click",()=>y(s)),R.current.push(a)})},oe=async(t,o)=>{if(!n.current)return;const s=(await _(async()=>{const{default:a}=await import("./leaflet-src-dUkYyTMI.js").then(l=>l.l);return{default:a}},__vite__mapDeps([0,1,2]))).default;w.current.forEach(a=>a.remove()),w.current=[],A.current.forEach(a=>a.remove()),A.current=[],t.forEach(a=>{if(!a.responder||!a.incident)return;const l=a.responder,c=a.incident,m=l.current_latitude??l.base_latitude,v=l.current_longitude??l.base_longitude;if(!m||!v)return;const N=`
                <div style="
                    background: linear-gradient(135deg, ${f[l.responder_status]||"#6b7280"} 0%, ${f[l.responder_status]||"#6b7280"} 100%);
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 4px solid white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 4px ${f[l.responder_status]}40;
                    font-size: 18px;
                    ${a.status==="en_route"?"animation: pulse 2s infinite;":""}
                ">
                    🚑
                </div>
                ${a.status==="en_route"?'<div style="position:absolute;top:-6px;right:-6px;width:14px;height:14px;background:#3b82f6;border-radius:50%;border:2px solid white;animation:pulse 1.5s infinite;"></div>':""}
            `,E=s.divIcon({html:N,className:"custom-marker",iconSize:[40,40],iconAnchor:[20,20]}),I=s.marker([m,v],{icon:E}).addTo(n.current),ce=`
                <div style="min-width: 220px;">
                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px;">
                        🚑 ${l.name}
                    </div>
                    <div style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; background: ${D[a.status]}30; color: ${D[a.status]}; margin-bottom: 8px;">
                        ${a.status.toUpperCase().replace("_"," ")}
                    </div>
                    <div style="margin-top: 8px; font-size: 12px;">
                        <strong>Going to:</strong> ${c.address||"Incident #"+c.id}<br/>
                        <strong>Type:</strong> ${g[c.type]} ${c.type.replace("_"," ")}<br/>
                        <strong>Distance:</strong> ${a.distance_text}<br/>
                        <strong>ETA:</strong> ${a.duration_text}<br/>
                        <strong>Phone:</strong> ${l.phone_number}
                    </div>
                    ${l.location_updated_at?`<div style="margin-top: 8px; font-size: 11px; color: #666;">
                        Location updated: ${new Date(l.location_updated_at).toLocaleTimeString()}
                    </div>`:""}
                </div>
            `;I.bindPopup(ce),I.on("click",()=>{te(a),P(a)}),w.current.push(I);const pe=s.polyline([[m,v],[c.latitude,c.longitude]],{color:D[a.status]||"#3b82f6",weight:3,opacity:.6,dashArray:a.status==="en_route"?"10, 10":"5, 5"}).addTo(n.current);A.current.push(pe)});const d=new Set(t.map(a=>a.responder_id));o.filter(a=>!d.has(a.id)).forEach(a=>{const l=a.current_latitude??a.base_latitude,c=a.current_longitude??a.base_longitude;if(!l||!c)return;const v=s.divIcon({html:`
                <div style="
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    font-size: 16px;
                ">
                    🚑
                </div>
            `,className:"custom-marker",iconSize:[32,32],iconAnchor:[16,16]}),N=s.marker([l,c],{icon:v}).addTo(n.current),E=`
                <div style="min-width: 200px;">
                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px;">
                        🚑 ${a.name}
                    </div>
                    <div style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #10b98130; color: #10b981; margin-bottom: 8px;">
                        IDLE - AVAILABLE
                    </div>
                    <div style="margin-top: 8px; font-size: 12px;">
                        <strong>Phone:</strong> ${a.phone_number}<br/>
                        <strong>Email:</strong> ${a.email}
                    </div>
                    ${a.location_updated_at?`<div style="margin-top: 8px; font-size: 11px; color: #666;">
                        Location updated: ${new Date(a.location_updated_at).toLocaleTimeString()}
                    </div>`:""}
                </div>
            `;N.bindPopup(E),w.current.push(N)})};r.useEffect(()=>{console.log("[LIVEMAP] 🚀 Starting real-time map updates");const t=setInterval(S,fe);return()=>{console.log("[LIVEMAP] 🛑 Stopping real-time updates"),clearInterval(t)}},[S]),r.useEffect(()=>{const t=async()=>{if(!n.current||!u){h.current&&n.current&&(n.current.removeLayer(h.current),h.current=null);return}const s=(await _(async()=>{const{default:d}=await import("./leaflet-src-dUkYyTMI.js").then(p=>p.l);return{default:d}},__vite__mapDeps([0,1,2]))).default;try{const p=(await Z.get(`/admin/dispatches/${u.id}/route-history`)).data.route_points;if(p.length>0){h.current&&n.current.removeLayer(h.current);const a=p.map(c=>[c.latitude,c.longitude]),l=s.polyline(a,{color:"#10b981",weight:3,opacity:.6,dashArray:"5, 10"}).addTo(n.current);h.current=l,console.log("[LIVEMAP] Breadcrumb trail drawn",{dispatch_id:u.id,point_count:p.length})}}catch(d){console.error("[LIVEMAP] Failed to fetch breadcrumb trail:",d)}};t();const o=u?setInterval(t,5e3):null;return()=>{o&&clearInterval(o)}},[u]);const O=t=>{n.current&&t.latitude&&t.longitude&&(n.current.setView([t.latitude,t.longitude],16),y(t))},ie=t=>new Date(t).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}),de=[...new Set(b.map(t=>t.type))];return e.jsxs("div",{className:"flex h-screen bg-gradient-to-br from-slate-50 to-red-50/30",children:[e.jsx(me,{}),e.jsx(xe,{user:G}),e.jsxs("div",{className:"flex flex-1 flex-col overflow-hidden",children:[e.jsx(ue,{}),e.jsxs("main",{className:"relative flex-1",children:[e.jsx("link",{rel:"stylesheet",href:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css",integrity:"sha512-Zcn6bjR/8RZbLEpLIeOwNtzREBAJnUKESxces60Mpoj+2okopSAcSUIUOseddDm0cxnGQzxIR7vJgsLZbdLE3w==",crossOrigin:""}),e.jsx("style",{children:`
                        @keyframes pulse {
                            0%, 100% { transform: scale(1); }
                            50% { transform: scale(1.1); }
                        }
                        .custom-marker {
                            background: transparent !important;
                            border: none !important;
                        }
                    `}),e.jsx("div",{ref:$,className:"h-full w-full"}),e.jsxs("div",{className:"absolute left-4 top-4 z-[1000] space-y-2",children:[e.jsxs("div",{className:"rounded-xl bg-white p-3 shadow-lg",children:[e.jsx("div",{className:"mb-2 text-xs font-semibold uppercase text-slate-500",children:"Filters"}),e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsxs("select",{value:L,onChange:t=>se(t.target.value),className:"rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-red-300 focus:outline-none",children:[e.jsx("option",{value:"all",children:"All Status"}),e.jsx("option",{value:"pending",children:"Pending"}),e.jsx("option",{value:"dispatched",children:"Dispatched"}),e.jsx("option",{value:"completed",children:"Completed"})]}),e.jsxs("select",{value:C,onChange:t=>ae(t.target.value),className:"rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-red-300 focus:outline-none",children:[e.jsx("option",{value:"all",children:"All Types"}),de.map(t=>e.jsxs("option",{value:t,children:[g[t]," ",t.replace("_"," ")]},t))]})]}),e.jsxs("label",{className:"mt-2 flex items-center gap-2 text-sm text-slate-600",children:[e.jsx("input",{type:"checkbox",checked:M,onChange:t=>re(t.target.checked),className:"rounded"}),"Show only active"]})]}),e.jsxs("div",{className:"rounded-xl bg-white p-3 shadow-lg",children:[e.jsx("div",{className:"mb-2 text-xs font-semibold uppercase text-slate-500",children:"Legend"}),e.jsxs("div",{className:"space-y-1 text-xs",children:[e.jsx("div",{className:"font-medium text-slate-700 mt-1 mb-1",children:"Incidents:"}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"h-3 w-3 rounded-full",style:{backgroundColor:x.pending}}),e.jsx("span",{children:"Pending"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"h-3 w-3 rounded-full",style:{backgroundColor:x.dispatched}}),e.jsx("span",{children:"Dispatched"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"h-3 w-3 rounded-full",style:{backgroundColor:x.completed}}),e.jsx("span",{children:"Completed"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"h-3 w-3 rounded-full bg-red-500"}),e.jsx("span",{children:"Active Call"})]}),e.jsx("div",{className:"font-medium text-slate-700 mt-2 mb-1",children:"Responders:"}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"h-3 w-3 rounded-full",style:{backgroundColor:f.idle}}),e.jsx("span",{children:"🚑 Idle"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"h-3 w-3 rounded-full",style:{backgroundColor:f.en_route}}),e.jsx("span",{children:"🚑 En Route"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"h-3 w-3 rounded-full",style:{backgroundColor:f.arrived}}),e.jsx("span",{children:"🚑 Arrived"})]})]})]})]}),e.jsxs("div",{className:"absolute right-4 top-4 z-[1000] rounded-xl bg-white p-3 shadow-lg",children:[e.jsx("div",{className:"mb-2 text-xs font-semibold uppercase text-slate-500",children:"Overview"}),e.jsxs("div",{className:"grid grid-cols-2 gap-3 text-center",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-2xl font-bold text-amber-600",children:b.filter(t=>t.status==="pending").length}),e.jsx("p",{className:"text-xs text-slate-500",children:"Pending"})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-2xl font-bold text-blue-600",children:b.filter(t=>t.status==="dispatched").length}),e.jsx("p",{className:"text-xs text-slate-500",children:"Dispatched"})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-2xl font-bold text-red-600",children:j.length}),e.jsx("p",{className:"text-xs text-slate-500",children:"Active Calls"})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-2xl font-bold text-green-600",children:Y.length}),e.jsx("p",{className:"text-xs text-slate-500",children:"On Duty"})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-2xl font-bold text-purple-600",children:T.filter(t=>t.status==="en_route").length}),e.jsx("p",{className:"text-xs text-slate-500",children:"En Route"})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-2xl font-bold text-indigo-600",children:T.filter(t=>t.status==="arrived").length}),e.jsx("p",{className:"text-xs text-slate-500",children:"Arrived"})]})]}),e.jsxs("div",{className:"mt-2 text-center text-xs text-slate-400",children:["Updated: ",ne.toLocaleTimeString()]})]}),j.length>0&&e.jsxs("div",{className:"absolute bottom-4 left-4 z-[1000] max-w-sm rounded-xl border-2 border-red-200 bg-red-50 p-3 shadow-lg",children:[e.jsxs("div",{className:"mb-2 flex items-center gap-2",children:[e.jsx("div",{className:"h-2 w-2 animate-pulse rounded-full bg-red-500"}),e.jsxs("span",{className:"text-sm font-semibold text-red-700",children:["Active Calls (",j.length,")"]})]}),e.jsx("div",{className:"max-h-40 space-y-2 overflow-y-auto",children:j.map(t=>{var o,s;return e.jsxs("div",{className:"cursor-pointer rounded-lg bg-white p-2 text-sm shadow-sm hover:bg-red-50",onClick:()=>t.incident&&O(t.incident),children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"font-medium",children:((o=t.user)==null?void 0:o.name)||"Unknown"}),e.jsx("span",{className:`text-xs ${t.is_answered?"text-green-600":"text-red-600"}`,children:t.is_answered?"✓ Answered":"📞 Calling"})]}),e.jsx("p",{className:"text-xs text-slate-500",children:((s=t.incident)==null?void 0:s.address)||"No location"})]},t.id)})})]}),e.jsxs("div",{className:"absolute bottom-4 right-4 z-[1000] w-80 rounded-xl bg-white p-3 shadow-lg",children:[e.jsxs("div",{className:"mb-2 flex items-center justify-between",children:[e.jsx("span",{className:"text-sm font-semibold text-slate-700",children:"Recent Incidents"}),e.jsx("button",{onClick:S,className:"rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600",title:"Refresh",children:e.jsx("svg",{className:"h-4 w-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"})})})]}),e.jsxs("div",{className:"max-h-48 space-y-2 overflow-y-auto",children:[U.slice(0,10).map(t=>{var o;return e.jsxs("div",{onClick:()=>O(t),className:`cursor-pointer rounded-lg border p-2 transition hover:border-red-200 hover:bg-red-50 ${(i==null?void 0:i.id)===t.id?"border-red-300 bg-red-50":"border-slate-100"}`,children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{children:g[t.type]}),e.jsxs("span",{className:"text-sm font-medium",children:["#",t.id]})]}),e.jsx("span",{className:"rounded-full px-2 py-0.5 text-xs font-medium",style:{backgroundColor:`${x[t.status]}20`,color:x[t.status]},children:t.status})]}),e.jsx("p",{className:"mt-1 truncate text-xs text-slate-500",children:t.address||"No address"}),e.jsxs("div",{className:"mt-1 flex items-center justify-between text-xs text-slate-400",children:[e.jsx("span",{children:(o=t.user)==null?void 0:o.name}),e.jsx("span",{children:ie(t.created_at)})]}),t.has_active_call&&e.jsxs("div",{className:"mt-1 flex items-center gap-1 text-xs text-red-600",children:[e.jsx("span",{className:"h-1.5 w-1.5 animate-pulse rounded-full bg-red-500"}),"Active call"]})]},t.id)}),U.length===0&&e.jsx("p",{className:"py-4 text-center text-sm text-slate-500",children:"No incidents to display"})]})]}),i&&e.jsxs("div",{className:"absolute left-1/2 top-4 z-[1000] w-80 -translate-x-1/2 rounded-xl bg-white p-4 shadow-xl",children:[e.jsxs("div",{className:"flex items-start justify-between",children:[e.jsx("div",{children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-2xl",children:g[i.type]}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-bold text-slate-800",children:i.type.replace("_"," ").toUpperCase()}),e.jsxs("p",{className:"text-xs text-slate-500",children:["Incident #",i.id]})]})]})}),e.jsx("button",{onClick:()=>y(null),className:"text-slate-400 hover:text-slate-600",children:e.jsx("svg",{className:"h-5 w-5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]}),e.jsxs("div",{className:"mt-3 space-y-2 text-sm",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"rounded-full px-2 py-0.5 text-xs font-medium",style:{backgroundColor:`${x[i.status]}20`,color:x[i.status]},children:i.status.toUpperCase()}),i.has_active_call&&e.jsxs("span",{className:"flex items-center gap-1 text-xs text-red-600",children:[e.jsx("span",{className:"h-1.5 w-1.5 animate-pulse rounded-full bg-red-500"}),"Active Call"]})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-slate-500",children:"Reporter"}),e.jsx("p",{className:"font-medium",children:((H=i.user)==null?void 0:H.name)||"Unknown"}),e.jsx("p",{className:"text-xs text-slate-500",children:((B=i.user)==null?void 0:B.phone_number)||((F=i.user)==null?void 0:F.email)})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-slate-500",children:"Location"}),e.jsx("p",{children:i.address||"No address"})]}),i.description&&e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-slate-500",children:"Description"}),e.jsx("p",{className:"text-slate-700",children:i.description})]})]}),e.jsx("div",{className:"mt-3 flex gap-2",children:e.jsx("a",{href:`/admin/incidents/${i.id}/overview`,className:"flex-1 rounded-lg bg-slate-100 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-200",children:"View in Dashboard"})})]})]}),u&&e.jsx(he,{dispatch:u,onClose:()=>P(null)})]})]})}export{Le as default};
