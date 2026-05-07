import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, X, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const TX_TYPES = ['Goods Receipt','Sales Issue','Adjustment Increase','Adjustment Decrease','Scrap/Write-Off','Return from Customer','Stock Transfer'];
const INBOUND  = ['Goods Receipt','Adjustment Increase','Return from Customer'];

export default function InventoryPage() {
  const [txs,      setTxs]      = useState([]);
  const [products, setProducts] = useState([]);
  const [busy,     setBusy]     = useState(true);
  const [modal,    setModal]    = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [form,     setForm]     = useState({ productId:'', transactionType:'Goods Receipt', quantity:1, reason:'', reference:'' });
  const [saving,   setSaving]   = useState(false);

  const load = () => {
    setBusy(true);
    Promise.all([
      api.get('/inventory/transactions', { params: { type: typeFilter, limit: 100 } }),
      api.get('/products'),
    ]).then(([t, p]) => { setTxs(t.data.data); setProducts(p.data.data); })
     .finally(() => setBusy(false));
  };

  useEffect(() => { load(); }, [typeFilter]);

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/inventory/transactions', form);
      toast.success('Transaction recorded!');
      setModal(false);
      setForm({ productId:'', transactionType:'Goods Receipt', quantity:1, reason:'', reference:'' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="ph">
        <div className="ph-row">
          <div><h1>Inventory Management</h1><p>Track all stock movements</p></div>
          <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={15}/> Record Transaction</button>
        </div>
      </div>

      <div className="card" style={{marginBottom:18}}>
        <div className="card-body" style={{padding:'13px 18px'}}>
          <select className="input" style={{width:240}} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {TX_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          {busy ? <div className="loader"><span className="spinner"/></div> : (
            <table>
              <thead><tr><th>Product</th><th>SKU</th><th>Type</th><th>Qty Change</th><th>Prev Stock</th><th>New Stock</th><th>Reason</th><th>Date</th></tr></thead>
              <tbody>
                {txs.length === 0
                  ? <tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'#94a3b8'}}>No transactions found</td></tr>
                  : txs.map(tx => {
                    const inb = INBOUND.includes(tx.transactionType);
                    return (
                      <tr key={tx._id}>
                        <td className="semibold">{tx.product?.name}</td>
                        <td><span className="badge b-gray">{tx.product?.skuCode}</span></td>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:5}}>
                            {inb ? <ArrowUpCircle size={13} color="#10b981"/> : <ArrowDownCircle size={13} color="#ef4444"/>}
                            <span className={`badge ${inb?'b-success':'b-high'}`} style={{fontSize:11}}>{tx.transactionType}</span>
                          </div>
                        </td>
                        <td><span className={`bold ${inb?'success':'danger'}`}>{inb?'+':'-'}{tx.quantity}</span></td>
                        <td>{tx.previousStock}</td>
                        <td className="semibold">{tx.newStock}</td>
                        <td className="sm muted">{tx.reason || '—'}</td>
                        <td className="sm muted">{new Date(tx.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <div className="overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Record Transaction</h2>
              <button onClick={() => setModal(false)} style={{background:'none',border:'none',cursor:'pointer'}}><X size={19}/></button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="fg"><label className="label">Product *</label>
                  <select className="input" value={form.productId} onChange={e => F('productId',e.target.value)} required>
                    <option value="">Select product…</option>
                    {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.skuCode}) — Stock: {p.stock?.onHand ?? 0}</option>)}
                  </select>
                </div>
                <div className="fg"><label className="label">Transaction Type *</label>
                  <select className="input" value={form.transactionType} onChange={e => F('transactionType',e.target.value)}>
                    {TX_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="fg"><label className="label">Quantity *</label>
                  <input type="number" className="input" min={1} value={form.quantity} onChange={e => F('quantity',+e.target.value)} required/>
                </div>
                <div className="fg"><label className="label">Reference No.</label>
                  <input className="input" placeholder="Invoice / PO number" value={form.reference} onChange={e => F('reference',e.target.value)}/>
                </div>
                <div className="fg"><label className="label">Reason</label>
                  <input className="input" placeholder="Reason for this movement" value={form.reason} onChange={e => F('reason',e.target.value)}/>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Recording…':'Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
