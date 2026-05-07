import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Package, DollarSign, AlertTriangle, ShoppingCart, Truck, BarChart2 } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#4f46e5','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6'];

export default function Dashboard() {
  const { user } = useAuth();
  const [kpis,  setKpis]  = useState(null);
  const [cats,  setCats]  = useState([]);
  const [trend, setTrend] = useState([]);
  const [busy,  setBusy]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/kpis'),
      api.get('/dashboard/category-stats'),
      api.get('/dashboard/transaction-trend'),
    ]).then(([k, c, t]) => {
      setKpis(k.data.data);
      setCats(c.data.data.map(d => ({ name: d._id?.split(' ')[0], value: d.count })));
      setTrend(t.data.data.map(d => ({ date: d._id, receipts: d.receipts, issues: d.issues })));
    }).finally(() => setBusy(false));
  }, []);

  if (busy) return <div className="loader"><span className="spinner" style={{width:36,height:36}}/></div>;

  const CARDS = [
    { label:'Total Products',    val: kpis?.totalProducts || 0,                                      icon:Package,     bg:'#e0e7ff', ic:'#4f46e5' },
    { label:'Stock Value',       val:`₹${(kpis?.totalStockValue||0).toLocaleString('en-IN')}`,       icon:DollarSign,  bg:'#dcfce7', ic:'#10b981' },
    { label:'Low Stock Alerts',  val: kpis?.lowStockCount || 0,                                      icon:AlertTriangle,bg:'#fef9c3', ic:'#f59e0b' },
    { label:'Out of Stock',      val: kpis?.outOfStockCount || 0,                                    icon:AlertTriangle,bg:'#fee2e2', ic:'#ef4444' },
    { label:'Pending POs',       val: kpis?.pendingOrders || 0,                                      icon:ShoppingCart, bg:'#dbeafe', ic:'#3b82f6' },
    { label:'Active Suppliers',  val: kpis?.totalSuppliers || 0,                                     icon:Truck,        bg:'#ede9fe', ic:'#8b5cf6' },
  ];

  const txBadge = (type) => {
    const inbound = ['Goods Receipt','Adjustment Increase','Return from Customer'].includes(type);
    return <span className={`badge ${inbound?'b-success':'b-high'}`} style={{fontSize:11}}>{type}</span>;
  };

  return (
    <div>
      <div className="ph">
        <div className="ph-row">
          <div>
            <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p>Here's your live inventory overview</p>
          </div>
          <Link to="/analytics" className="btn btn-primary"><BarChart2 size={15}/> View Analytics</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        {CARDS.map((c,i) => (
          <div key={i} className="kpi">
            <div className="kpi-icon" style={{background:c.bg}}><c.icon size={21} color={c.ic}/></div>
            <div><div className="kpi-val">{c.val}</div><div className="kpi-lbl">{c.label}</div></div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="g2" style={{marginBottom:18}}>
        <div className="card">
          <div className="card-head"><h3>Stock Movement — Last 7 Days</h3></div>
          <div className="card-body">
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="date" tick={{fontSize:11}}/>
                  <YAxis tick={{fontSize:11}}/>
                  <Tooltip/>
                  <Legend/>
                  <Line type="monotone" dataKey="receipts" stroke="#10b981" strokeWidth={2} dot={{r:4}} name="Receipts"/>
                  <Line type="monotone" dataKey="issues"   stroke="#ef4444" strokeWidth={2} dot={{r:4}} name="Issues"/>
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="empty" style={{padding:40}}><p>No transactions in the last 7 days</p></div>}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Products by Category</h3></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={cats} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {cats.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-head">
          <h3>Recent Transactions</h3>
          <Link to="/inventory" className="btn btn-outline btn-sm">View All</Link>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Product</th><th>SKU</th><th>Type</th><th>Qty</th><th>Date</th></tr></thead>
            <tbody>
              {kpis?.recentTx?.length > 0
                ? kpis.recentTx.map(tx => (
                  <tr key={tx._id}>
                    <td className="semibold">{tx.product?.name}</td>
                    <td><span className="badge b-gray">{tx.product?.skuCode}</span></td>
                    <td>{txBadge(tx.transactionType)}</td>
                    <td className="semibold">{tx.quantity}</td>
                    <td className="muted sm">{new Date(tx.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))
                : <tr><td colSpan={5} style={{textAlign:'center',padding:30,color:'#94a3b8'}}>No transactions yet</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
