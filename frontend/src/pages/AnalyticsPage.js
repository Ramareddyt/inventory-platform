import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { TrendingUp, BarChart2, Target, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export default function AnalyticsPage() {
  const [products,  setProducts]  = useState([]);
  const [selProd,   setSelProd]   = useState('');
  const [forecast,  setForecast]  = useState(null);
  const [abcData,   setAbcData]   = useState([]);
  const [reorder,   setReorder]   = useState([]);
  const [health,    setHealth]    = useState(null);
  const [busyF,     setBusyF]     = useState(false);
  const [busyA,     setBusyA]     = useState(false);
  const [busyR,     setBusyR]     = useState(false);

  useEffect(() => {
    api.get('/products').then(r => { setProducts(r.data.data); if (r.data.data[0]) setSelProd(r.data.data[0]._id); });
    // load health score on mount
    api.get('/analytics/health-score').then(r => setHealth(r.data.data)).catch(() => {});
  }, []);

  const runForecast = async () => {
    if (!selProd) return;
    setBusyF(true); setForecast(null);
    try {
      const r = await api.post(`/analytics/forecast/${selProd}`);
      setForecast(r.data.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Forecast failed'); }
    finally { setBusyF(false); }
  };

  const runABC = async () => {
    setBusyA(true);
    try { const r = await api.get('/analytics/abc-analysis'); setAbcData(r.data.data); }
    catch { toast.error('ABC analysis failed'); }
    finally { setBusyA(false); }
  };

  const runReorder = async () => {
    setBusyR(true);
    try { const r = await api.get('/analytics/reorder-suggestions'); setReorder(r.data.data); }
    catch { toast.error('Reorder analysis failed'); }
    finally { setBusyR(false); }
  };

  const RISK_COLOR = { Critical:'#ef4444', High:'#f97316', Medium:'#f59e0b', Low:'#10b981' };
  const scoreColor = s => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div>
      <div className="ph">
        <h1 style={{display:'flex',alignItems:'center',gap:10}}><BarChart2 size={21}/> Analytics & Demand Forecast</h1>
        <p>Rule-based inventory intelligence — EOQ, ABC, Reorder Suggestions</p>
      </div>

      {/* Health Score */}
      {health && (
        <div className="card" style={{marginBottom:18,padding:20}}>
          <div style={{display:'flex',alignItems:'center',gap:24,flexWrap:'wrap'}}>
            <div className="score-ring" style={{borderColor:scoreColor(health.healthScore),color:scoreColor(health.healthScore)}}>
              <div style={{fontSize:28,fontWeight:800}}>{health.healthScore}</div>
              <div style={{fontSize:11,fontWeight:600}}>Grade {health.grade}</div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>Inventory Health Score</div>
              <div style={{fontSize:13.5,color:'#475569',marginBottom:12}}>{health.message}</div>
              <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                {Object.entries(health.breakdown).map(([k,v]) => (
                  <div key={k} style={{textAlign:'center'}}>
                    <div style={{fontSize:20,fontWeight:800,color:RISK_COLOR[k]}}>{v}</div>
                    <div style={{fontSize:11,color:'#64748b',fontWeight:600}}>{k}</div>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => api.get('/analytics/health-score').then(r => setHealth(r.data.data))}><RefreshCw size={13}/> Refresh</button>
          </div>
        </div>
      )}

      {/* Demand Forecast */}
      <div className="card" style={{marginBottom:18}}>
        <div className="card-head"><h3 style={{display:'flex',alignItems:'center',gap:7}}><TrendingUp size={16} color="#4f46e5"/> Demand Forecast (Moving Average)</h3></div>
        <div className="card-body">
          <div style={{display:'flex',gap:10,marginBottom:18,flexWrap:'wrap'}}>
            <select className="input" style={{flex:1,minWidth:220}} value={selProd} onChange={e => setSelProd(e.target.value)}>
              {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.skuCode})</option>)}
            </select>
            <button className="btn btn-primary" onClick={runForecast} disabled={!selProd||busyF}>
              {busyF ? <><span className="spinner" style={{width:14,height:14}}/> Calculating…</> : 'Generate Forecast'}
            </button>
          </div>

          {forecast ? (
            <div>
              {/* Summary pills */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10,marginBottom:20}}>
                {[
                  { label:'Recommended Order',  val: `${forecast.recommendedOrderQty} units`, color:'#4f46e5' },
                  { label:'Stockout Risk',       val: forecast.stockoutRisk,                  color: RISK_COLOR[forecast.stockoutRisk] },
                  { label:'Days Until Stockout', val: `${forecast.daysUntilStockout} days`,   color: forecast.daysUntilStockout < 7 ? '#ef4444' : '#10b981' },
                ].map((s,i) => (
                  <div key={i} style={{background:'#f8fafc',borderRadius:10,padding:14,textAlign:'center',border:`2px solid ${s.color}22`}}>
                    <div style={{fontSize:20,fontWeight:800,color:s.color}}>{s.val}</div>
                    <div style={{fontSize:12,color:'#64748b',marginTop:3}}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="g2" style={{marginBottom:16}}>
                <div>
                  <div style={{fontWeight:600,fontSize:13.5,marginBottom:10}}>Weekly Demand Forecast</div>
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={forecast.weeklyForecast}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                      <XAxis dataKey="week" tick={{fontSize:11}}/>
                      <YAxis tick={{fontSize:11}}/>
                      <Tooltip/>
                      <Bar dataKey="demand" fill="#4f46e5" radius={[5,5,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={{fontWeight:600,fontSize:13.5,marginBottom:10}}>Monthly Demand Forecast</div>
                  <ResponsiveContainer width="100%" height={190}>
                    <LineChart data={forecast.monthlyForecast}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                      <XAxis dataKey="month" tick={{fontSize:11}}/>
                      <YAxis tick={{fontSize:11}}/>
                      <Tooltip/>
                      <Line type="monotone" dataKey="demand" stroke="#10b981" strokeWidth={2.5} dot={{r:5}}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Insights */}
              <div style={{display:'flex',flexDirection:'column',gap:7}}>
                {forecast.insights?.map((ins,i) => (
                  <div key={i} style={{display:'flex',gap:9,padding:'9px 13px',background:'#f0fdf4',borderRadius:8,border:'1px solid #bbf7d0',fontSize:13.5,color:'#166534'}}>
                    <CheckCircle size={15} style={{flexShrink:0,marginTop:2}}/>{ins}
                  </div>
                ))}
                {forecast.suggestedActions?.map((a,i) => (
                  <div key={i} style={{display:'flex',gap:9,padding:'9px 13px',background:'#eff6ff',borderRadius:8,border:'1px solid #bfdbfe',fontSize:13.5,color:'#1e40af'}}>
                    <Target size={15} style={{flexShrink:0,marginTop:2}}/>{a}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty" style={{padding:36}}><TrendingUp size={44}/><h3>Select a product and click Generate Forecast</h3></div>
          )}
        </div>
      </div>

      {/* Reorder Suggestions */}
      <div className="card" style={{marginBottom:18}}>
        <div className="card-head">
          <h3>Smart Reorder Suggestions (EOQ-based)</h3>
          <button className="btn btn-outline btn-sm" onClick={runReorder} disabled={busyR}>{busyR?'Loading…':'Run Analysis'}</button>
        </div>
        <div className="card-body">
          {reorder.length === 0
            ? <div className="empty" style={{padding:30}}><p>Click "Run Analysis" to see reorder suggestions</p></div>
            : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
                {reorder.map((s,i) => (
                  <div key={i} style={{border:'1px solid #e2e8f0',borderRadius:10,padding:14}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                      <span style={{fontWeight:700,fontSize:13.5}}>{s.productName}</span>
                      <span className={`badge b-${s.urgency?.toLowerCase()}`}>{s.urgency}</span>
                    </div>
                    <div style={{fontSize:12.5,color:'#64748b',marginBottom:10}}>{s.reason}</div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                      <span>Suggest: <strong>{s.suggestedQty}</strong> units</span>
                      <span style={{color:'#10b981',fontWeight:600}}>₹{s.estimatedCost?.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{fontSize:11.5,color:'#94a3b8',marginTop:5}}>Supplier: {s.supplier}</div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      {/* ABC Analysis */}
      <div className="card">
        <div className="card-head">
          <h3>ABC Inventory Classification</h3>
          <button className="btn btn-outline btn-sm" onClick={runABC} disabled={busyA}>{busyA?'Loading…':'Run ABC Analysis'}</button>
        </div>
        <div className="card-body" style={{padding:0}}>
          {abcData.length === 0
            ? <div className="empty" style={{padding:36}}><p>Click "Run ABC Analysis" to classify your inventory by stock value</p></div>
            : (
              <div className="tbl-wrap">
                <table>
                  <thead><tr><th>#</th><th>Product</th><th>SKU</th><th>Stock Value (₹)</th><th>Value %</th><th>Class</th></tr></thead>
                  <tbody>
                    {abcData.map((p,i) => (
                      <tr key={i}>
                        <td className="muted sm">{i+1}</td>
                        <td className="semibold">{p.name}</td>
                        <td><span className="badge b-gray">{p.sku}</span></td>
                        <td className="bold">₹{p.stockValue?.toLocaleString('en-IN')}</td>
                        <td>{p.valuePercent}%</td>
                        <td><span className={`badge b-${p.abcClass?.toLowerCase()}`} style={{fontSize:15,fontWeight:800,padding:'3px 12px'}}>{p.abcClass}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}
