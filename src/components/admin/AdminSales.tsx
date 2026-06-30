import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Users, Eye, Phone, MapPin, Calendar, DollarSign, Activity, CheckCircle, Clock, Truck, ChevronRight, MessageSquare, Clipboard, Search, ArrowUpDown } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { format } from 'date-fns';

interface AdminSalesProps {
  orders: Order[];
  onUpdateOrderStatus: (id: string, status: OrderStatus) => void;
}

export function AdminSales({ orders, onUpdateOrderStatus }: AdminSalesProps) {
  const [salesTab, setSalesTab] = useState<'orders' | 'customers'>('orders');
  
  // Selected detailed models
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  // Search parameters
  const [orderQuery, setOrderQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [customerQuery, setCustomerQuery] = useState('');

  // 1. Order pipeline filtration
  const filteredOrders = orders.filter(o => {
    const q = orderQuery.toLowerCase();
    const matchSearch = o.customer_name?.toLowerCase().includes(q) || 
                        o.id?.toLowerCase().includes(q) || 
                        o.customer_phone?.includes(q);
    
    const matchStatus = orderStatusFilter === 'all' ? true : o.status === orderStatusFilter;
    return matchSearch && matchStatus;
  });

  // 2. Customers derivation loop (Dynamic spent mapping)
  const customersMap: Record<string, {
    name: string;
    phone: string;
    district: string;
    address: string;
    orders: Order[];
    cumulativeSpent: number;
    lastDate: string;
  }> = {};

  orders.forEach(o => {
    const ph = o.customer_phone?.trim();
    if (!ph) return;

    if (!customersMap[ph]) {
      customersMap[ph] = {
        name: o.customer_name,
        phone: ph,
        district: o.district || 'Unlisted',
        address: o.delivery_address || 'No Address',
        orders: [],
        cumulativeSpent: 0,
        lastDate: o.created_at
      };
    }

    customersMap[ph].orders.push(o);
    // Calculated spending from completed/confirmed states
    if (o.status === 'confirmed' || o.status === 'delivered') {
      customersMap[ph].cumulativeSpent += o.total;
    }
    if (new Date(o.created_at) > new Date(customersMap[ph].lastDate)) {
      customersMap[ph].lastDate = o.created_at;
    }
  });

  const customersList = Object.values(customersMap).filter(c => {
    const q = customerQuery.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.phone?.includes(q);
  });

  const activeCustomer = selectedPhone ? customersMap[selectedPhone] : null;

  // Dispatch receipt text over WhatsApp
  const handleDispatchWhatsAppReceipt = (order: Order) => {
    const trackingUrl = `${window.location.origin}/?tracking=${order.id}`;
    const itemsSummary = order.items.map(itm => `• ${itm.name} (x${itm.quantity}) - UGX ${(itm.price * itm.quantity).toLocaleString()}`).join('\n');
    const template = `
*🧾 EMMA ELECTRONICS - DIGITAL RECEIPT*
----------------------------------------
*Order ID:* ${order.id?.substring(0, 10).toUpperCase()}
*Fulfillment Status:* ${order.status?.toUpperCase()}
*Date:* ${format(new Date(order.created_at), 'PPP')}

*SHIPPED ITEMS:*
${itemsSummary}

----------------------------------------
*TOTAL AMOUNT:* UGX ${order.total.toLocaleString()}
*DELIVERY ADDRESS:* ${order.delivery_address} (${order.district || 'Lira'})

_Track your logistic shipment real-time on our hardware feed link:_
_➜ ${trackingUrl}_

_Thank you for trading with Emma Electronics!_
    `.trim();

    const url = `https://wa.me/${order.customer_phone?.replace(/[+]/g, '')}?text=${encodeURIComponent(template)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Sub menu selectors */}
      <div className="flex border-b border-zinc-150 dark:border-zinc-850 gap-4">
        <button
          onClick={() => { setSalesTab('orders'); setSelectedPhone(null); }}
          className={`pb-3 text-sm font-display font-black uppercase tracking-wider relative transition-all ${
            salesTab === 'orders' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          Active Logistics Queue
        </button>
        <button
          onClick={() => { setSalesTab('customers'); setSelectedOrder(null); }}
          className={`pb-3 text-sm font-display font-black uppercase tracking-wider relative transition-all ${
            salesTab === 'customers' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          Customer spent sheets
        </button>
      </div>

      {salesTab === 'orders' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Orders Column list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex gap-4 flex-wrap">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
                <input
                  type="text"
                  placeholder="Filter order ID or customer name..."
                  value={orderQuery}
                  onChange={e => setOrderQuery(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs"
                />
              </div>

              <select
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value)}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-850 text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                      <th className="py-4 px-6">OrderID</th>
                      <th className="py-4 px-6">Customer Details</th>
                      <th className="py-4 px-6 text-right">MSRP Total</th>
                      <th className="py-4 px-6 text-center">Logistic pipeline</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs text-zinc-700 dark:text-zinc-350 font-sans">
                    {filteredOrders.map((order, i) => (
                      <tr key={order.id || i} className="hover:bg-zinc-50/40 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-zinc-850 dark:text-zinc-200">
                          {order.id?.substring(0, 10).toUpperCase()}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-zinc-900 dark:text-white uppercase">{order.customer_name}</div>
                          <div className="text-[10px] text-zinc-400 font-mono tracking-tight">{order.customer_phone}</div>
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-zinc-850 dark:text-zinc-100">
                          UGX {order.total.toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider ${
                            order.status === 'pending'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                              : order.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={11} />
                            INSPECT
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-xs font-mono text-zinc-400 uppercase tracking-widest">
                          No logistic transactions registered
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Active Orders Inspector card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-6 rounded-3xl h-fit space-y-6">
            {selectedOrder ? (
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-blue-500">Logistics pipeline tracker</span>
                  <h3 className="text-xl font-display font-black text-zinc-850 dark:text-white uppercase italic">Inspect Order Details</h3>
                  <p className="text-[10px] font-mono text-zinc-400">{selectedOrder.id}</p>
                </div>

                {/* Items Summary list */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl space-y-3">
                  <span className="text-[8px] font-black uppercase text-zinc-400 block tracking-wider">Purchase cart basket</span>
                  {selectedOrder.items?.map((item, i) => (
                    <div key={item.id || i} className="flex justify-between items-center text-xs border-b border-dashed border-zinc-200 dark:border-zinc-800 pb-2 last:border-0 last:pb-0">
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="font-bold text-zinc-800 dark:text-zinc-200 uppercase truncate text-[11px]">{item.name}</div>
                        <div className="text-[9px] text-zinc-400">Qty: {item.quantity} Units • category: {item.category}</div>
                      </div>
                      <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100 shrink-0">
                        UGX {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 flex justify-between font-bold text-xs text-zinc-950 dark:text-white">
                    <span>Total Bill:</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">UGX {selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Shipment Addresses details */}
                <div className="space-y-3.5 text-xs text-zinc-600 dark:text-zinc-350">
                  <div className="flex gap-2">
                    <MapPin size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 block text-[11px]">SHIPMENT ADDRESS:</span>
                      <span>{selectedOrder.delivery_address} ({selectedOrder.district || 'Lira District'})</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Phone size={16} className="text-zinc-400 shrink-0" />
                    <div>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 block text-[11px]">CONTACT PHONE:</span>
                      <span>{selectedOrder.customer_phone}</span>
                    </div>
                  </div>
                </div>

                {/* Active status pipeline updater */}
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5 space-y-3">
                  <span className="text-[9px] font-black uppercase text-zinc-400 block tracking-wider">Update tracking pipeline</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onUpdateOrderStatus(selectedOrder.id, 'confirmed')}
                      disabled={selectedOrder.status === 'confirmed'}
                      className="py-2.5 bg-blue-500/10 hover:bg-blue-500/15 disabled:bg-zinc-100 disabled:dark:bg-zinc-800 disabled:text-zinc-400 disabled:cursor-not-allowed border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold uppercase rounded-xl text-[10px]"
                    >
                      Confirm Order
                    </button>
                    <button
                      onClick={() => onUpdateOrderStatus(selectedOrder.id, 'delivered')}
                      disabled={selectedOrder.status === 'delivered'}
                      className="py-2.5 bg-emerald-500/10 hover:bg-emerald-500/15 disabled:bg-zinc-100 disabled:dark:bg-zinc-800 disabled:text-zinc-400 disabled:cursor-not-allowed border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold uppercase rounded-xl text-[10px]"
                    >
                      Flag Delivered
                    </button>
                  </div>

                  <button
                    onClick={() => handleDispatchWhatsAppReceipt(selectedOrder)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase rounded-xl text-[10px] tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 mt-6"
                  >
                    <MessageSquare size={13} />
                    SEND WHATSAPP RECEIPT
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-xs font-mono text-zinc-400 uppercase space-y-2">
                <Clipboard size={32} className="mx-auto text-zinc-300" />
                <p>Select order row to load inspector suite</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main customer list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
              <input
                type="text"
                placeholder="Search customers phone or name..."
                value={customerQuery}
                onChange={e => setCustomerQuery(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl py-2 pl-9 pr-4 text-xs"
              />
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-850 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    <th className="py-4 px-6">Customer contacts</th>
                    <th className="py-4 px-6">District Location</th>
                    <th className="py-4 px-6 text-center">Fulfillments</th>
                    <th className="py-4 px-6 text-right">Gross spending</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
                  {customersList.map((cust, i) => (
                    <tr key={cust.phone || i} className="hover:bg-zinc-50/40 transition-colors">
                      <td className="py-4 px-6 font-bold uppercase text-zinc-950 dark:text-white">
                        <div>{cust.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono tracking-tight font-medium normal-case">{cust.phone}</div>
                      </td>
                      <td className="py-4 px-6 text-zinc-500 font-bold uppercase">{cust.district}</td>
                      <td className="py-4 px-6 text-center font-mono font-bold">{cust.orders.length} orders</td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-emerald-600 dark:text-emerald-450">
                        UGX {cust.cumulativeSpent.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedPhone(cust.phone)}
                          className="p-1 px-3 bg-zinc-105 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-350 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={11} />
                          INSPECT
                        </button>
                      </td>
                    </tr>
                  ))}

                  {customersList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-xs font-mono text-zinc-400 uppercase tracking-widest">
                        No customer registrations located
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Detailed inspect profile summary card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-6 rounded-3xl h-fit space-y-6">
            {activeCustomer ? (
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-blue-500">Customer Relationship management</span>
                  <h3 className="text-xl font-display font-black text-zinc-850 dark:text-white uppercase italic truncate">
                    {activeCustomer.name}
                  </h3>
                  <div className="text-[10px] font-mono text-zinc-400 mt-1">{activeCustomer.phone}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 rounded-2xl">
                    <span className="text-[7.5px] font-black uppercase text-zinc-400">Logistics completed</span>
                    <div className="text-base font-mono font-black mt-1 text-zinc-700 dark:text-white">{activeCustomer.orders.length} orders</div>
                  </div>
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                    <span className="text-[7.5px] font-black uppercase text-emerald-500">Gross Spent size</span>
                    <div className="text-xs font-mono font-black mt-1 text-emerald-600 dark:text-emerald-400">UGX {activeCustomer.cumulativeSpent.toLocaleString()}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[8.5px] font-black uppercase tracking-wider text-zinc-400 block">Historic purchases list</span>
                  <div className="space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
                    {activeCustomer.orders.map((ord, i) => (
                      <div key={ord.id || i} className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl space-y-1.5 text-xs text-zinc-700 dark:text-zinc-350">
                        <div className="flex justify-between font-mono text-[9px] text-zinc-500">
                          <span>{format(new Date(ord.created_at), 'yyyy-MM-dd')}</span>
                          <span>ID: {ord.id?.substring(0, 8)}</span>
                        </div>
                        <div className="font-bold uppercase text-zinc-900 dark:text-white">Ordered items ({ord.items?.length || 0})</div>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {ord.items?.map(it => `${it.name} (x${it.quantity})`).join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Direct Contacts link shortcuts */}
                <div className="border-t border-zinc-250 dark:border-zinc-800 pt-5 text-center">
                  <a
                    href={`https://wa.me/${activeCustomer.phone?.replace(/[+]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase rounded-xl text-[10px] tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10"
                  >
                    <MessageSquare size={13} />
                    DIRECT MESSAGE WHATSAPP
                  </a>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-xs font-mono text-zinc-400 uppercase space-y-2">
                <Users size={32} className="mx-auto text-zinc-300" />
                <p>Select customer inspect row to view complete spending sheet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
