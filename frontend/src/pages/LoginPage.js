import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Zap, Eye, EyeOff } from 'lucide-react';

const DEMO = [
  { label:'Admin',       color:'#4f46e5', email:'admin@inveniq.com',       pass:'admin123'   },
  { label:'Manager',     color:'#10b981', email:'manager@inveniq.com',     pass:'manager123' },
  { label:'Procurement', color:'#3b82f6', email:'procurement@inveniq.com', pass:'proc123'    },
  { label:'Operator',    color:'#f59e0b', email:'operator@inveniq.com',    pass:'op123'      },
];

export default function LoginPage() {
  const [form, setForm]     = useState({ email:'', password:'' });
  const [show, setShow]     = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      nav('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:430 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:12, marginBottom:10 }}>
            <div style={{ width:46, height:46, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Zap size={26} color="#fff" />
            </div>
            <span style={{ fontSize:30, fontWeight:800, color:'#fff', letterSpacing:'-1px' }}>InvenIQ</span>
          </div>
          <p style={{ color:'#94a3b8', fontSize:14 }}>Intelligent Inventory Platform</p>
        </div>

        {/* Card */}
        <div style={{ background:'#fff', borderRadius:18, padding:30, boxShadow:'0 25px 50px rgba(0,0,0,.4)' }}>
          <h2 style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>Sign in</h2>
          <p style={{ fontSize:13, color:'#64748b', marginBottom:22 }}>Enter your credentials to continue</p>

          <form onSubmit={submit}>
            <div className="fg">
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email:e.target.value})} required />
            </div>
            <div className="fg">
              <label className="label">Password</label>
              <div style={{ position:'relative' }}>
                <input className="input" type={show?'text':'password'} placeholder="••••••••" style={{ paddingRight:38 }} value={form.password} onChange={e => setForm({...form, password:e.target.value})} required />
                <button type="button" onClick={() => setShow(!show)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}>
                  {show ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? <span className="spinner" style={{width:16,height:16}}/> : 'Sign In'}
            </button>
          </form>

          {/* Demo Logins */}
          <div style={{ marginTop:20, paddingTop:18, borderTop:'1px solid #f1f5f9' }}>
            <p style={{ fontSize:11, color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:.5, marginBottom:10 }}>Demo Accounts</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
              {DEMO.map(d => (
                <button key={d.label} onClick={() => setForm({email:d.email, password:d.pass})} className="btn btn-outline btn-sm" style={{ justifyContent:'center', borderColor:d.color+'33', color:d.color, fontWeight:600 }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
