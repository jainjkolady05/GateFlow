import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Bell, Check, CheckCircle2, ChevronDown, Clock3, DoorOpen, FilePlus2, Filter, Home, LogOut, Menu, Search, ShieldCheck, Users, X, XCircle } from "lucide-react";
import { request } from "./api";

const fmt = value => value ? new Date(value).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";
const dateInput = d => { const x = new Date(d.getTime() - d.getTimezoneOffset()*60000); return x.toISOString().slice(0,16); };
const badge = status => ({Pending:"pending",Approved:"approved",Rejected:"rejected",Outside:"outside",Returned:"returned"}[status] || "pending");

function Login({ onLogin }) {
  const [email,setEmail] = useState("student@gateflow.demo"), [password,setPassword] = useState("Student@123"), [error,setError] = useState(""), [busy,setBusy] = useState(false);
  async function submit(e) { e.preventDefault(); setBusy(true); setError(""); try { await onLogin(email,password); } catch(err) { setError(err.message); } finally { setBusy(false); } }
  return <div className="login-shell"><div className="login-card">
    <div className="brand-mark"><DoorOpen size={23}/></div><p className="eyebrow">CAMPUS OPERATIONS</p><h1>Welcome to GateFlow</h1><p className="muted">A simpler way to manage campus outpasses.</p>
    <form onSubmit={submit} className="form-stack"><label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>{error && <div className="error-box">{error}</div>}<button className="primary-btn full" disabled={busy}>{busy?"Signing in…":"Sign in"} <ArrowUpRight size={17}/></button></form>
    <div className="demo-box"><strong>Demo access</strong><div className="demo-row"><span>Student</span><button onClick={()=>{setEmail("student@gateflow.demo");setPassword("Student@123")}}>Use student</button></div><div className="demo-row"><span>Warden</span><button onClick={()=>{setEmail("warden@gateflow.demo");setPassword("Warden@123")}}>Use warden</button></div></div>
    <p className="tiny muted">GateFlow · Student mobility, made accountable.</p>
  </div></div>;
}

function App() {
  const [user,setUser] = useState(null), [items,setItems] = useState([]), [page,setPage] = useState("Dashboard");
  const [loading,setLoading] = useState(false), [toast,setToast] = useState(""), [query,setQuery] = useState(""), [filter,setFilter] = useState("All");
  const [showForm,setShowForm] = useState(false), [selected,setSelected] = useState(null), [mobileNav,setMobileNav] = useState(false);
  const isWarden = user?.role === "warden";
  useEffect(()=>{ const token=localStorage.getItem("gateflow_token"); if(token) request("/profile").then(d=>setUser(d.user)).catch(()=>localStorage.removeItem("gateflow_token")); },[]);
  useEffect(()=>{ if(user) load(); },[user]);
  async function load(){ setLoading(true); try { const d=await request("/outpasses"); setItems(d.outpasses); } catch(e){ notify(e.message); } finally{setLoading(false);} }
  function notify(msg){setToast(msg);setTimeout(()=>setToast(""),3200);}
  async function login(email,password){ const d=await request("/auth/login",{method:"POST",body:JSON.stringify({email,password})}); localStorage.setItem("gateflow_token",d.token);setUser(d.user);setPage("Dashboard"); }
  function logout(){localStorage.removeItem("gateflow_token");setUser(null);setItems([]);}
  async function createPass(form){await request("/outpasses",{method:"POST",body:JSON.stringify(form)});setShowForm(false);notify("Outpass request submitted successfully.");load();}
  async function updateStatus(item,status,rejection_reason=""){await request(`/outpasses/${item.id}/status`,{method:"PATCH",body:JSON.stringify({status,rejection_reason})});setSelected(null);notify(`Request marked ${status.toLowerCase()}.`);load();}
  const stats = useMemo(()=>[
    {label:isWarden?"Total requests":"Total applications",value:items.length,icon:FilePlus2,tone:"blue"},
    {label:"Pending",value:items.filter(x=>x.status==="Pending").length,icon:Clock3,tone:"amber"},
    {label:isWarden?"Currently outside":"Approved",value:items.filter(x=>x.status===(isWarden?"Outside":"Approved")).length,icon:DoorOpen,tone:"violet"},
    {label:"Returned",value:items.filter(x=>x.status==="Returned").length,icon:CheckCircle2,tone:"green"}
  ],[items,isWarden]);
  const visible = items.filter(x=>(filter==="All"||x.status===filter)&&`${x.student_name} ${x.destination} ${x.reason} ${x.register_number||""}`.toLowerCase().includes(query.toLowerCase()));
  const nav = isWarden?["Dashboard","All requests","Pending requests","Active outpasses"]:["Dashboard","Apply for outpass","My applications"];
  if(!user) return <Login onLogin={login}/>;
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?"open":""}`}><div className="brand"><div className="brand-mark small"><DoorOpen size={20}/></div><div><b>gateflow</b><span>Campus outpass</span></div><button className="mobile-close" onClick={()=>setMobileNav(false)}><X/></button></div>
      <div className="workspace-label">WORKSPACE</div><nav>{nav.map((n,i)=><button key={n} className={`nav-item ${page===n?"active":""}`} onClick={()=>{setPage(n);setMobileNav(false)}}>{i===0?<Home size={18}/>:n==="Apply for outpass"?<FilePlus2 size={18}/>:n==="Pending requests"?<Clock3 size={18}/>:n==="Active outpasses"?<DoorOpen size={18}/>:<Activity size={18}/>}<span>{n}</span>{n==="Pending requests"&&items.filter(x=>x.status==="Pending").length>0&&<em>{items.filter(x=>x.status==="Pending").length}</em>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="secure-card"><ShieldCheck size={18}/><b>Campus secure</b><span>Requests are tracked from application to return.</span></div><div className="profile-mini"><div className="avatar">{user.name.split(" ").map(x=>x[0]).slice(0,2).join("")}</div><div className="profile-text"><b>{user.name}</b><span>{isWarden?"Warden":"Student"} account</span></div><button title="Sign out" onClick={logout}><LogOut size={17}/></button></div></div>
    </aside>
    {mobileNav&&<div className="scrim" onClick={()=>setMobileNav(false)} />}
    <main className="main-area"><header className="topbar"><button className="mobile-menu" onClick={()=>setMobileNav(true)}><Menu/></button><div className="crumb">Workspace <span>/</span> <b>{page}</b></div><div className="top-actions"><span className="date-label">{new Date().toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}</span><button className="icon-btn" title="Notifications"><Bell size={18}/><i/></button><div className="top-avatar">{user.name[0]}</div></div></header>
      <section className="content">
        <div className="page-heading"><div><p className="eyebrow">{isWarden?"WARDEN CONSOLE":"STUDENT PORTAL"}</p><h1>{page==="Dashboard"?(isWarden?"Overview":"Your dashboard"):page}</h1><p className="muted">{isWarden?"Review requests and keep campus movement up to date.":"Manage your outpass applications in one place."}</p></div>{!isWarden&&<button className="primary-btn" onClick={()=>setShowForm(true)}><FilePlus2 size={17}/> New outpass</button>}</div>
        {page==="Apply for outpass"?<ApplicationForm onSubmit={createPass} onCancel={()=>setPage("Dashboard")}/>:<>
          {(page==="Dashboard"||isWarden)&&<div className="stats-grid">{stats.map(s=><div className="stat-card" key={s.label}><div className={`stat-icon ${s.tone}`}><s.icon size={19}/></div><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div><div className="stat-foot"><span className="dot"/> Live overview</div></div>)}</div>}
          {page==="Dashboard"&&<div className="section-row"><div><h2>{isWarden?"Requests needing attention":"Recent applications"}</h2><p className="muted">{isWarden?"The latest student outpass activity.":"A quick look at your latest requests."}</p></div><button className="text-btn" onClick={()=>setPage(isWarden?"All requests":"My applications")}>View all <ArrowUpRight size={15}/></button></div>}
          <div className="table-card"><div className="table-toolbar"><div><h2>{page==="Pending requests"?"Pending applications":page==="Active outpasses"?"Students currently outside":page==="My applications"?"My applications":"Outpass requests"}</h2><p className="muted">{visible.length} records found</p></div><div className="table-tools"><div className="search-box"><Search size={16}/><input placeholder="Search student or destination" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="select-wrap"><Filter size={15}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option>{["Pending","Approved","Outside","Returned","Rejected"].map(s=><option key={s}>{s}</option>)}</select><ChevronDown size={14}/></div></div></div>
            <div className="table-scroll"><table><thead><tr>{isWarden&&<th>STUDENT</th>}<th>DESTINATION</th><th>DEPARTURE</th><th>EXPECTED RETURN</th><th>STATUS</th><th></th></tr></thead><tbody>
              {visible.filter(x=>page==="Pending requests"?x.status==="Pending":page==="Active outpasses"?x.status==="Outside":true).slice(0,page==="Dashboard"?5:undefined).map(item=><tr key={item.id}>{isWarden&&<td><div className="student-cell"><div className="avatar pale">{item.student_name?.[0]}</div><div><b>{item.student_name}</b><span>{item.register_number||item.student_email}</span></div></div></td>}<td><b>{item.destination}</b><span className="cell-sub">{item.reason}</span></td><td>{fmt(item.departure_datetime)}</td><td>{fmt(item.expected_return_datetime)}</td><td><span className={`status ${badge(item.status)}`}><i/>{item.status}</span></td><td><button className="row-action" onClick={()=>setSelected(item)}>Review <ArrowUpRight size={14}/></button></td></tr>)}
              {!loading&&visible.filter(x=>page==="Pending requests"?x.status==="Pending":page==="Active outpasses"?x.status==="Outside":true).length===0&&<tr><td colSpan="6" className="empty">No applications found. Try changing your search or filter.</td></tr>}
            </tbody></table></div><div className="table-footer"><span>Showing {Math.min(visible.length,page==="Dashboard"?5:visible.length)} of {visible.length} records</span><button onClick={load} className="text-btn">Refresh <Activity size={14}/></button></div>
          </div>
        </>}
        <footer className="footer"><span>© 2026 GateFlow</span><span>Campus movement, made accountable.</span></footer>
      </section>
    </main>
    {showForm&&<div className="modal-backdrop"><ApplicationForm modal onSubmit={createPass} onCancel={()=>setShowForm(false)}/></div>}
    {selected&&<DetailModal item={selected} isWarden={isWarden} onClose={()=>setSelected(null)} onUpdate={updateStatus}/>}
    {toast&&<div className="toast"><CheckCircle2 size={18}/>{toast}</div>}
  </div>;
}

function ApplicationForm({onSubmit,onCancel,modal=false}){
  const [form,setForm]=useState({destination:"",reason:"",departure_datetime:dateInput(new Date(Date.now()+3600000)),expected_return_datetime:dateInput(new Date(Date.now()+86400000))});
  const [error,setError]=useState(""),[busy,setBusy]=useState(false);
  function change(e){setForm({...form,[e.target.name]:e.target.value});}
  async function submit(e){e.preventDefault();setBusy(true);setError("");try{await onSubmit(form);}catch(err){setError(err.message);}finally{setBusy(false);}}
  return <div className={`form-card ${modal?"modal-card":""}`}><div className="form-title"><div><p className="eyebrow">NEW REQUEST</p><h2>Apply for an outpass</h2><p className="muted">Share where you're going and when you expect to return.</p></div>{modal&&<button className="icon-btn" onClick={onCancel}><X/></button>}</div>
    <form onSubmit={submit} className="application-grid"><label className="span-2">Destination<input name="destination" value={form.destination} onChange={change} placeholder="e.g. Kottayam" required/></label><label className="span-2">Reason for leaving<textarea name="reason" value={form.reason} onChange={change} placeholder="Briefly explain the purpose of your visit…" rows="3" required/></label><label>Departure date & time<input type="datetime-local" name="departure_datetime" value={form.departure_datetime} onChange={change} required/></label><label>Expected return date & time<input type="datetime-local" name="expected_return_datetime" value={form.expected_return_datetime} onChange={change} required/></label>{error&&<div className="error-box span-2">{error}</div>}<div className="form-actions span-2"><button type="button" className="secondary-btn" onClick={onCancel}>Cancel</button><button className="primary-btn" disabled={busy}>{busy?"Submitting…":"Submit application"} <ArrowUpRight size={16}/></button></div></form>
  </div>;
}
function DetailModal({item,isWarden,onClose,onUpdate}){
  const [reject,setReject]=useState(false),[reason,setReason]=useState(""),[error,setError]=useState("");
  async function update(status){try{await onUpdate(item,status,reason);}catch(e){setError(e.message);}}
  return <div className="modal-backdrop"><div className="detail-modal"><div className="detail-head"><div><p className="eyebrow">OUTPASS #{String(item.id).padStart(4,"0")}</p><h2>Application details</h2></div><button className="icon-btn" onClick={onClose}><X/></button></div><div className="detail-person"><div className="avatar pale">{item.student_name?.[0]}</div><div><b>{item.student_name}</b><span>{item.register_number||item.student_email}</span></div><span className={`status ${badge(item.status)}`}><i/>{item.status}</span></div><div className="detail-grid"><div><span>DESTINATION</span><b>{item.destination}</b></div><div><span>REASON</span><b>{item.reason}</b></div><div><span>DEPARTURE</span><b>{fmt(item.departure_datetime)}</b></div><div><span>EXPECTED RETURN</span><b>{fmt(item.expected_return_datetime)}</b></div><div><span>ACTUAL RETURN</span><b>{fmt(item.actual_return_datetime)}</b></div><div><span>SUBMITTED</span><b>{fmt(item.created_at)}</b></div></div>{item.rejection_reason&&<div className="rejection-note"><b>Rejection note</b><p>{item.rejection_reason}</p></div>}{error&&<div className="error-box">{error}</div>}
    {isWarden&&<div className="detail-actions">{item.status==="Pending"&&<>{reject?<div className="reject-form"><textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason for rejection…" rows="2"/><button className="danger-btn" onClick={()=>update("Rejected")}>Confirm rejection</button><button className="secondary-btn" onClick={()=>setReject(false)}>Cancel</button></div>:<><button className="danger-outline" onClick={()=>setReject(true)}><XCircle size={16}/> Reject</button><button className="primary-btn" onClick={()=>update("Approved")}><Check size={16}/> Approve request</button></>}</>}{item.status==="Approved"&&<button className="primary-btn" onClick={()=>update("Outside")}><ArrowDownRight size={16}/> Mark as departed</button>}{item.status==="Outside"&&<button className="primary-btn" onClick={()=>update("Returned")}><CheckCircle2 size={16}/> Mark as returned</button>}</div>}
  </div></div>;
}
export default App;
