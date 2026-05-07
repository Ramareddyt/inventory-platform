import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, X, ShoppingCart } from 'lucide-react';

const S_COLOR = { Draft:'b-gray', Sent:'b-info', Acknowledged:'b-medium', 'Partially Received':'b-warning', Completed:'b-success', Cancelled:'b-high' };

export default function PurchaseOrdersPage() {
  const [orders,    setOrders]    = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products,  setProducts]  = useState([]);
  const [busy,  setBusy]  = useState(true);
  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({ supplier:'', items:[{ product:'', orderedQuantity:1, unitPrice:0 }], expectedDeliveryDate:'', notes:'' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setBusy(true);
    Promise.all([api.get('/purchase-orders'), api.get('/suppliers'), api.get('/products')])
      .then(([po, sup, prod]) => { setOrders(po.data.data); setSuppliers(sup.data.data); setProducts(prod.data.data); })
      .finally(() => setBusy(false));
  };
  useEffect(() => { load(); }, []);

  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, { product:'', orderedQuantity:1, unitPrice:0 }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_,idx) => idx!==i) }));
  const updItem    = (i, k, v) => setForm(f => { const it=[...f.items]; it[i]={...it[i],[k]: k==='product'?v:+v}; return {...f,items:it}; });

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/purchase-orders', form);
      toast.success('Purchase order created!');
      setModal(false);
      setForm({ supplier:'', items:[{ product:'', orderedQuantity:1, unitPrice:0 }], expectedDeliveryDate:'', notes:'' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/purchase-orders/${id}/status`, { status });
    toast.success(`Status → ${status}`); load();
  };

  return (
    <div>
      <div className="ph">
        <div className="ph-row">
          <div><h1>Purchase Orders</h1><p>{orders.length} orders</p></div>
          <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={15}/> New PO</button>
        </div>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          {busy ? <div className="loader"><span className="spinner"/></div> : (
            <table>
              <thead><tr><th>PO Number</th><th>Supplier</th><th>Items</th><th>Total (₹)</th><th>Status</th><th>Expected</th><th>Actions</th></tr></thead>
              <tbody>
                {orders.length === 0
                  ? <tr><td colSpan={7}><div className="empty"><ShoppingCart size={40}/><h3>No purchase orders</h3></div></td></tr>
                  : orders.map(o => (
                    <tr key={o._id}>
                      <td><span className="badge b-gray">{o.poNumber}</span></td>
                      <td className="semibold">{o.supplier?.name}</td>
                      <td>{o.items?.length} item(s)</td>
                      <td className="bold">₹{o.totalAmount?.toLocaleString('en-IN')}</td>
                      <td><span className={`badge ${S_COLOR[o.status]||'b-gray'}`}>{o.status}</span></td>
                      <td className="sm muted">{o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toLocaleDateString('en-IN') : '—'}</td>
                      <td>
                        {o.status === 'Draft' && (
                          <select className="input" style={{width:130,padding:'5px 8px',fontSize:12}} onChange={e => e.target.value && updateStatus(o._id,e.target.value)} defaultValue="">
                            <option value="">Update…</option>
                            {['Sent','Cancelled'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        )}
                        {o.status === 'Sent' && (
                          <button className="btn btn-success btn-sm" onClick={() => updateStatus(o._id,'Acknowledged')}>Acknowledge</button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <div className="overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{maxWidth:620}} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Create Purchase Order</h2>
              <button onClick={() => setModal(false)} style={{background:'none',border:'none',cursor:'pointer'}}><X size={19}/></button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="fg"><label className="label">Supplier *</label>
                  <select className="input" value={form.supplier} onChange={e => setForm(f=>({...f,supplier:e.target.value}))} required>
                    <option value="">Select supplier…</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="fg"><label className="label">Expected Delivery Date</label>
                  <input type="date" className="input" value={form.expectedDeliveryDate} onChange={e => setForm(f=>({...f,expectedDeliveryDate:e.target.value}))}/>
                </div>
                <div style={{marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <label className="label" style={{margin:0}}>Order Items *</label>
                    <button type="button" className="btn btn-outline btn-sm" onClick={addItem}><Plus size={12}/> Item</button>
                  </div>
                  {form.items.map((item,i) => (
                    <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr auto',gap:7,marginBottom:7}}>
                      <select className="input" value={item.product} onChange={e => updItem(i,'product',e.target.value)} required>
                        <option value="">Product…</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.skuCode})</option>)}
                      </select>
                      <input type="number" className="input" placeholder="Qty" min={1} value={item.orderedQuantity} onChange={e => updItem(i,'orderedQuantity',e.target.value)} required/>
                      <input type="number" className="input" placeholder="Unit ₹" min={0} value={item.unitPrice} onChange={e => updItem(i,'unitPrice',e.target.value)} required/>
                      {form.items.length > 1 && <button type="button" className="btn btn-sm" style={{background:'#fee2e2',color:'#b91c1c'}} onClick={() => removeItem(i)}>✕</button>}
                    </div>
                  ))}
                </div>
                <div className="fg"><label className="label">Notes</label><input className="input" value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))}/></div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Creating…':'Create PO'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
