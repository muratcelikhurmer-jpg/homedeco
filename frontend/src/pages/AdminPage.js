import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, DollarSign, Truck, Clock, RefreshCw, Search } from 'lucide-react';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_COLORS = {
  pending_payment: 'bg-yellow-500/20 text-yellow-500',
  paid: 'bg-blue-500/20 text-blue-500',
  in_production: 'bg-purple-500/20 text-purple-500',
  ready_for_shipping: 'bg-cyan-500/20 text-cyan-500',
  shipped: 'bg-green-500/20 text-green-500',
  delivered: 'bg-emerald-500/20 text-emerald-500'
};

const PRODUCTION_STATUS_COLORS = {
  not_started: 'bg-gray-500/20 text-gray-400',
  in_progress: 'bg-orange-500/20 text-orange-500',
  quality_check: 'bg-yellow-500/20 text-yellow-500',
  completed: 'bg-green-500/20 text-green-500'
};

export default function AdminPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [dashboardRes, ordersRes, materialsRes] = await Promise.all([
        axios.get(`${API}/admin/dashboard`),
        axios.get(`${API}/orders`),
        axios.get(`${API}/materials`)
      ]);
      setDashboard(dashboardRes.data);
      setOrders(ordersRes.data);
      setMaterials(materialsRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, updates) => {
    try {
      await axios.put(`${API}/admin/orders/${orderId}`, updates);
      toast({ title: "Success", description: "Order updated successfully" });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update order", variant: "destructive" });
    }
  };

  const updateMaterialPrice = async (materialId, newPrice) => {
    try {
      await axios.put(`${API}/admin/materials/${materialId}`, { price_per_unit: parseFloat(newPrice) });
      toast({ title: "Success", description: "Material price updated" });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update price", variant: "destructive" });
    }
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-24" data-testid="admin-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-['Playfair_Display'] text-white">Admin Dashboard</h1>
          <Button onClick={fetchData} variant="ghost" className="text-white/60 hover:text-white" data-testid="refresh-btn">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        {dashboard && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Total Orders', value: dashboard.total_orders, icon: Package },
              { label: 'Pending', value: dashboard.pending_orders, icon: Clock, color: 'text-yellow-500' },
              { label: 'Paid', value: dashboard.paid_orders, icon: DollarSign, color: 'text-blue-500' },
              { label: 'In Production', value: dashboard.in_production, icon: Package, color: 'text-purple-500' },
              { label: 'Ready to Ship', value: dashboard.ready_to_ship, icon: Truck, color: 'text-green-500' },
              { label: 'Revenue', value: `€${dashboard.total_revenue.toFixed(0)}`, icon: DollarSign, color: 'text-[#D4AF37]' }
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-[#121212] border border-white/5 p-4" data-testid={`stat-${label.toLowerCase().replace(' ', '-')}`}>
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${color || 'text-white/40'}`} />
                </div>
                <p className={`text-2xl font-semibold ${color || 'text-white'}`}>{value}</p>
                <p className="text-white/40 text-xs">{label}</p>
              </div>
            ))}
          </div>
        )}

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="bg-[#121212] border border-white/5">
            <TabsTrigger value="orders" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
              Orders
            </TabsTrigger>
            <TabsTrigger value="materials" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
              Materials & Pricing
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4 items-center">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48 bg-[#121212] border-white/10 text-white" data-testid="filter-status">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-[#121212] border-white/10">
                  <SelectItem value="all" className="text-white">All Orders</SelectItem>
                  <SelectItem value="pending_payment" className="text-white">Pending Payment</SelectItem>
                  <SelectItem value="paid" className="text-white">Paid</SelectItem>
                  <SelectItem value="in_production" className="text-white">In Production</SelectItem>
                  <SelectItem value="ready_for_shipping" className="text-white">Ready to Ship</SelectItem>
                  <SelectItem value="shipped" className="text-white">Shipped</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="bg-[#121212] border border-white/5 p-12 text-center">
                  <p className="text-white/40">No orders found</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div 
                    key={order.id}
                    className="bg-[#121212] border border-white/5 p-6"
                    data-testid={`order-${order.id}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-white font-mono text-sm">{order.id.slice(0, 8)}...</span>
                          <Badge className={STATUS_COLORS[order.status]}>{order.status.replace('_', ' ')}</Badge>
                          {order.production_status && (
                            <Badge className={PRODUCTION_STATUS_COLORS[order.production_status]}>
                              {order.production_status.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-white text-sm">{order.customer_name} • {order.customer_email}</p>
                        <p className="text-white/40 text-xs">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#D4AF37] text-xl font-semibold">€{order.total_amount.toFixed(2)}</p>
                        <p className="text-white/40 text-xs">{order.products?.length || 0} items</p>
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
                      <Select
                        value={order.status}
                        onValueChange={(v) => updateOrderStatus(order.id, { status: v })}
                      >
                        <SelectTrigger className="w-40 bg-[#0A0A0A] border-white/10 text-white text-xs">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#121212] border-white/10">
                          <SelectItem value="pending_payment" className="text-white">Pending Payment</SelectItem>
                          <SelectItem value="paid" className="text-white">Paid</SelectItem>
                          <SelectItem value="in_production" className="text-white">In Production</SelectItem>
                          <SelectItem value="ready_for_shipping" className="text-white">Ready to Ship</SelectItem>
                          <SelectItem value="shipped" className="text-white">Shipped</SelectItem>
                          <SelectItem value="delivered" className="text-white">Delivered</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={order.production_status || 'not_started'}
                        onValueChange={(v) => updateOrderStatus(order.id, { production_status: v })}
                      >
                        <SelectTrigger className="w-40 bg-[#0A0A0A] border-white/10 text-white text-xs">
                          <SelectValue placeholder="Production" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#121212] border-white/10">
                          <SelectItem value="not_started" className="text-white">Not Started</SelectItem>
                          <SelectItem value="in_progress" className="text-white">In Progress</SelectItem>
                          <SelectItem value="quality_check" className="text-white">Quality Check</SelectItem>
                          <SelectItem value="completed" className="text-white">Completed</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        placeholder="Tracking Number"
                        defaultValue={order.tracking_number || ''}
                        onBlur={(e) => e.target.value && updateOrderStatus(order.id, { tracking_number: e.target.value })}
                        className="w-48 bg-[#0A0A0A] border-white/10 text-white text-xs"
                      />
                    </div>

                    {/* Products */}
                    {order.products && order.products.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Products</p>
                        <div className="space-y-2">
                          {order.products.map((prod, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-white/60">
                                {prod.category} - {prod.material} ({prod.dimensions?.width}x{prod.dimensions?.height}x{prod.dimensions?.depth}cm)
                              </span>
                              <span className="text-white">€{prod.subtotal?.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((mat) => (
                <div key={mat.id} className="bg-[#121212] border border-white/5 p-6" data-testid={`material-${mat.id}`}>
                  <h3 className="text-white font-medium mb-2">{mat.name[language] || mat.name.en}</h3>
                  <p className="text-white/40 text-xs mb-4 capitalize">{mat.category} • per {mat.unit}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-white/40">€</span>
                    <Input
                      type="number"
                      step="0.01"
                      defaultValue={mat.price_per_unit}
                      onBlur={(e) => {
                        if (parseFloat(e.target.value) !== mat.price_per_unit) {
                          updateMaterialPrice(mat.id, e.target.value);
                        }
                      }}
                      className="bg-[#0A0A0A] border-white/10 text-white w-24"
                    />
                    <span className="text-white/40 text-sm">/ {mat.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
