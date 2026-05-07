import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, Package, X } from 'lucide-react';

const CATS = ['Raw Materials','Finished Goods','Spare Parts & MRO','Perishable Goods','Retail Products','Warehouse Supplies'];
const EMPTY = { skuCode:'', name:'', description:'', category:'Raw Materials', unit:'pcs', reorderPoint:10, safetyStock:5, economicOrderQty:50, costPrice:0, sellingPrice:0, leadTimeDays:7, initialStock:0 };

function RiskBadge({ stock, product }) {
  if (!stock || stock.onHand === undefined) return <span className="badge b-gray">No Stock</span>;
  if (stock.onHand <= 0)                   return <span className="badge b-critical">Out of Stock</span>;
  if (stock.onHand <= product.safetyStock) return <span className="badge b-high">Critical Low</span>;
  if (stock.onHand <= product.reorderPoint)return <span className="badge b-medium">Reorder Now</span>;
  return <span className="badge b-low">Healthy</span>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [busy,  setBusy]  = useState(true);
  const [search, setSearch] = useState('');
  const [cat,   setCat]   = useState('');
  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setBusy(true);
    Promise.all([
      api.get('/products', { params: { search, category: cat } }),
      api.get('/suppliers'),
    ]).then(([p, s]) => { setProducts(p.data.data); setSuppliers(s.data.data); })
     .finally(() => setBusy(false));
  };

  useEffect(() => { load(); }, [search, cat]);

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = (p) => { setForm({ ...p, supplier: p.supplier?._id || '' }); setEditId(p._id); setModal(true); };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      editId
        ? await api.put(`/products/${editId}`, form)
        : await api.post('/products', form);
      toast.success(editId ? 'Product updated!' : 'Product created!');
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const deactivate = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    await api.delete(`/products/${id}`);
    toast.success('Product deactivated'); load();
  };

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="ph">
        <div className="ph-row">
          <div><h1>Products & SKUs</h1><p>{products.length} products</p></div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/> Add Product</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{marginBottom:18}}>
        <div className="card-body" style={{padding:'13px 18px'}}>
          <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
            <div className="search-wrap" style={{flex:1, minWidth:200}}>
              <Search size={15}/>
              <input className="input" placeholder="Search name or SKU..." value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <select className="input" style={{width:200}} value={cat} onChange={e => setCat(e.target.value)}>
              <option value="">All Categories</option>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          {busy ? <div className="loader"><span className="spinner"/></div> : (
            <table>
              <thead><tr><th>SKU</th><th>Name</th><th>Category</th><th>On Hand</th><th>ROP</th><th>Cost (₹)</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {products.length === 0
                  ? <tr><td colSpan={8}><div className="empty"><Package size={40}/><h3>No products found</h3></div></td></tr>
                  : products.map(p => (
                    <tr key={p._id}>
                      <td><span className="badge b-gray">{p.skuCode}</span></td>
                      <td><div className="semibold">{p.name}</div><div className="sm muted">{p.unit}</div></td>
                      <td><span className="badge b-info" style={{fontSize:11}}>{p.category}</span></td>
                      <td className="bold">{p.stock?.onHand ?? 0}</td>
                      <td>{p.reorderPoint}</td>
                      <td>₹{p.costPrice?.toLocaleString('en-IN')}</td>
                      <td><RiskBadge stock={p.stock} product={p}/></td>
                      <td>
                        <div style={{display:'flex', gap:6}}>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}><Edit2 size={12}/></button>
                          <button className="btn btn-sm" style={{background:'#fee2e2', color:'#b91c1c'}} onClick={() => deactivate(p._id)}><Trash2 size={12}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{editId ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setModal(false)} style={{background:'none',border:'none',cursor:'pointer'}}><X size={19}/></button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="g2">
                  <div className="fg"><label className="label">SKU Code *</label><input className="input" value={form.skuCode} onChange={e => F('skuCode',e.target.value)} required/></div>
                  <div className="fg"><label className="label">Product Name *</label><input className="input" value={form.name} onChange={e => F('name',e.target.value)} required/></div>
                </div>
                <div className="fg"><label className="label">Category *</label>
                  <select className="input" value={form.category} onChange={e => F('category',e.target.value)}>
                    {CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="fg"><label className="label">Supplier</label>
                  <select className="input" value={form.supplier || ''} onChange={e => F('supplier',e.target.value)}>
                    <option value="">None</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="g2">
                  <div className="fg"><label className="label">Unit</label><input className="input" value={form.unit} onChange={e => F('unit',e.target.value)}/></div>
                  <div className="fg"><label className="label">Lead Time (days)</label><input type="number" className="input" value={form.leadTimeDays} onChange={e => F('leadTimeDays',+e.target.value)}/></div>
                </div>
                <div className="g3">
                  <div className="fg"><label className="label">Reorder Point</label><input type="number" className="input" value={form.reorderPoint} onChange={e => F('reorderPoint',+e.target.value)}/></div>
                  <div className="fg"><label className="label">Safety Stock</label><input type="number" className="input" value={form.safetyStock} onChange={e => F('safetyStock',+e.target.value)}/></div>
                  <div className="fg"><label className="label">EOQ</label><input type="number" className="input" value={form.economicOrderQty} onChange={e => F('economicOrderQty',+e.target.value)}/></div>
                </div>
                <div className="g2">
                  <div className="fg"><label className="label">Cost Price (₹) *</label><input type="number" className="input" value={form.costPrice} onChange={e => F('costPrice',+e.target.value)} required/></div>
                  <div className="fg"><label className="label">Selling Price (₹)</label><input type="number" className="input" value={form.sellingPrice} onChange={e => F('sellingPrice',+e.target.value)}/></div>
                </div>
                {!editId && <div className="fg"><label className="label">Initial Stock</label><input type="number" className="input" value={form.initialStock} onChange={e => F('initialStock',+e.target.value)}/></div>}
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
