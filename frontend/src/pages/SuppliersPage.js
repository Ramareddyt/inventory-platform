import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, X, Truck, Edit2, Mail, Phone } from 'lucide-react';

const EMPTY = { name:'', contactPerson:'', email:'', phone:'', address:'', averageLeadTime:7, onTimeDeliveryRate:100 };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [busy,  setBusy]  = useState(true);
  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => { setBusy(true); api.get('/suppliers').then(r => setSuppliers(r.data.data)).finally(() => setBusy(false)); };
  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = (s) => { setForm(s); setEditId(s._id); setModal(true); };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      editId ? await api.put(`/suppliers/${editId}`, form) : await api.post('/suppliers', form);
      toast.success(editId ? 'Supplier updated!' : 'Supplier added!');
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const F = (k,v) => setForm(f => ({...f, [k]:v}));
  const perfColor = r => r >= 95 ? '#10b981' : r >= 80 ? '#f59e0b' : '#ef4444';

  return (
    <div>
      <div className="ph">
        <div className="ph-row">
          <div><h1>Supplier Management</h1><p>{suppliers.length} active suppliers</p></div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/> Add Supplier</button>
        </div>
      </div>

      {busy ? <div className="loader"><span className="spinner"/></div> : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px,1fr))', gap:14}}>
          {suppliers.length === 0
            ? <div className="empty" style={{gridColumn:'1/-1'}}><Truck size={46}/><h3>No suppliers yet</h3></div>
            : suppliers.map(s => (
              <div key={s._id} className="card" style={{padding:18}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:12}}>
                  <div>
                    <div style={{fontWeight:700, fontSize:14.5, color:'#0f172a'}}>{s.name}</div>
                    <div style={{fontSize:12.5, color:'#64748b', marginTop:2}}>{s.contactPerson}</div>
                  </div>
                  <div style={{display:'flex', gap:6}}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(s)}><Edit2 size={12}/></button>
                    <button className="btn btn-sm" style={{background:'#fee2e2',color:'#b91c1c'}} onClick={async () => { if(window.confirm('Deactivate?')){ await api.delete(`/suppliers/${s._id}`); toast.success('Deactivated'); load(); } }}>✕</button>
                  </div>
                </div>
                {s.email && <div style={{display:'flex', gap:7, fontSize:13, color:'#475569', marginBottom:5}}><Mail size={12}/>{s.email}</div>}
                {s.phone && <div style={{display:'flex', gap:7, fontSize:13, color:'#475569'}}><Phone size={12}/>{s.phone}</div>}
                <div style={{display:'flex', gap:18, marginTop:14, paddingTop:14, borderTop:'1px solid #f1f5f9'}}>
                  <div><div style={{fontSize:11, color:'#94a3b8', fontWeight:600, textTransform:'uppercase'}}>Lead Time</div><div style={{fontWeight:700, color:'#0f172a'}}>{s.averageLeadTime}d</div></div>
                  <div><div style={{fontSize:11, color:'#94a3b8', fontWeight:600, textTransform:'uppercase'}}>On-Time</div><div style={{fontWeight:700, color:perfColor(s.onTimeDeliveryRate)}}>{s.onTimeDeliveryRate}%</div></div>
                  <div><div style={{fontSize:11, color:'#94a3b8', fontWeight:600, textTransform:'uppercase'}}>Orders</div><div style={{fontWeight:700, color:'#0f172a'}}>{s.totalOrders}</div></div>
                </div>
              </div>
            ))}
        </div>
      )}

      {modal && (
        <div className="overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{editId ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button onClick={() => setModal(false)} style={{background:'none',border:'none',cursor:'pointer'}}><X size={19}/></button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="fg"><label className="label">Company Name *</label><input className="input" value={form.name} onChange={e => F('name',e.target.value)} required/></div>
                <div className="fg"><label className="label">Contact Person</label><input className="input" value={form.contactPerson} onChange={e => F('contactPerson',e.target.value)}/></div>
                <div className="g2">
                  <div className="fg"><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => F('email',e.target.value)}/></div>
                  <div className="fg"><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => F('phone',e.target.value)}/></div>
                </div>
                <div className="fg"><label className="label">Address</label><input className="input" value={form.address} onChange={e => F('address',e.target.value)}/></div>
                <div className="g2">
                  <div className="fg"><label className="label">Avg Lead Time (days)</label><input type="number" className="input" value={form.averageLeadTime} onChange={e => F('averageLeadTime',+e.target.value)}/></div>
                  <div className="fg"><label className="label">On-Time Rate (%)</label><input type="number" className="input" min={0} max={100} value={form.onTimeDeliveryRate} onChange={e => F('onTimeDeliveryRate',+e.target.value)}/></div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving…':editId?'Update':'Add Supplier'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
