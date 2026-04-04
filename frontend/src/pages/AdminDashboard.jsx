import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Users,
  Box
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const API = process.env.REACT_APP_BACKEND_URL;

const CATEGORIES = ['rings', 'bracelets', 'necklaces', 'luxury_sets'];
const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export const AdminDashboard = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'rings',
    material: 'Pure Silver with 18K Gold Plating',
    image_url: '',
    stock: 10,
    is_featured: false,
    is_bestseller: false
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/admin/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, ordersRes, analyticsRes, inventoryRes] = await Promise.all([
        axios.get(`${API}/api/products`, { withCredentials: true }),
        axios.get(`${API}/api/orders`, { withCredentials: true }),
        axios.get(`${API}/api/analytics`, { withCredentials: true }),
        axios.get(`${API}/api/inventory`, { withCredentials: true })
      ]);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
      setAnalytics(analyticsRes.data);
      setInventory(inventoryRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      if (error.response?.status === 401) {
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...productForm,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock)
      };

      if (editingProduct) {
        await axios.put(`${API}/api/products/${editingProduct.id}`, data, { withCredentials: true });
        toast.success('Product updated successfully');
      } else {
        await axios.post(`${API}/api/products`, data, { withCredentials: true });
        toast.success('Product created successfully');
      }
      
      setIsProductModalOpen(false);
      setEditingProduct(null);
      resetProductForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await axios.delete(`${API}/api/products/${productId}`, { withCredentials: true });
      toast.success('Product deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      material: product.material,
      image_url: product.image_url,
      stock: product.stock,
      is_featured: product.is_featured,
      is_bestseller: product.is_bestseller
    });
    setIsProductModalOpen(true);
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/api/orders/${orderId}/status?status=${status}`, {}, { withCredentials: true });
      toast.success('Order status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleUpdateStock = async (productId, stock) => {
    try {
      await axios.put(`${API}/api/inventory/${productId}?stock=${stock}`, {}, { withCredentials: true });
      toast.success('Stock updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: 'rings',
      material: 'Pure Silver with 18K Gold Plating',
      image_url: '',
      stock: 10,
      is_featured: false,
      is_bestseller: false
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#faf8f4] flex items-center justify-center">
        <div className="text-[#c9a84c]">Loading...</div>
      </div>
    );
  }

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory', icon: Box },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div data-testid="admin-dashboard" className="min-h-screen bg-[#faf8f4] flex">
      {/* Sidebar */}
      <aside className="admin-sidebar w-64 flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-[#faf8f4]/10">
          <h1 className="font-serif text-xl tracking-[0.2em]">AURUM</h1>
          <p className="text-xs text-[#faf8f4]/60 mt-1">Admin Dashboard</p>
        </div>

        <nav className="flex-1 py-6">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              data-testid={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`admin-nav-item w-full flex items-center gap-3 text-sm ${
                activeTab === item.id ? 'active text-[#c9a84c]' : 'text-[#faf8f4]/70'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#faf8f4]/10">
          <button
            data-testid="logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 text-sm text-[#faf8f4]/70 hover:text-[#c9a84c] px-4 py-3 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Overview Tab */}
        {activeTab === 'overview' && analytics && (
          <div data-testid="overview-tab" className="space-y-8">
            <h2 className="font-serif text-2xl">Dashboard Overview</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div data-testid="stat-revenue" className="bg-white p-6 border border-[#c9a84c]/20">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="text-[#c9a84c]" size={20} />
                  <span className="text-sm text-[#4a4a4a]">Total Revenue</span>
                </div>
                <p className="font-serif text-3xl">${analytics.total_revenue?.toLocaleString() || 0}</p>
              </div>
              
              <div data-testid="stat-orders" className="bg-white p-6 border border-[#c9a84c]/20">
                <div className="flex items-center gap-3 mb-2">
                  <ShoppingCart className="text-[#c9a84c]" size={20} />
                  <span className="text-sm text-[#4a4a4a]">Total Orders</span>
                </div>
                <p className="font-serif text-3xl">{analytics.total_orders || 0}</p>
              </div>
              
              <div data-testid="stat-products" className="bg-white p-6 border border-[#c9a84c]/20">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="text-[#c9a84c]" size={20} />
                  <span className="text-sm text-[#4a4a4a]">Products</span>
                </div>
                <p className="font-serif text-3xl">{analytics.product_count || 0}</p>
              </div>
              
              <div data-testid="stat-recent" className="bg-white p-6 border border-[#c9a84c]/20">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="text-[#c9a84c]" size={20} />
                  <span className="text-sm text-[#4a4a4a]">Recent Orders (30d)</span>
                </div>
                <p className="font-serif text-3xl">{analytics.recent_orders_count || 0}</p>
              </div>
            </div>

            {/* Revenue Chart */}
            {analytics.revenue_by_day?.length > 0 && (
              <div className="bg-white p-6 border border-[#c9a84c]/20">
                <h3 className="font-serif text-lg mb-4">Revenue Trend (Last 30 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.revenue_by_day}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8d5a3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#c9a84c" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top Products */}
            {analytics.top_products?.length > 0 && (
              <div className="bg-white p-6 border border-[#c9a84c]/20">
                <h3 className="font-serif text-lg mb-4">Top Selling Products</h3>
                <div className="space-y-3">
                  {analytics.top_products.map((product, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-[#c9a84c]/10">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-[#4a4a4a]">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{product.sales_count} sold</p>
                        <p className="text-sm text-[#4a4a4a]">${product.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div data-testid="products-tab" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl">Products</h2>
              <Dialog open={isProductModalOpen} onOpenChange={(open) => {
                setIsProductModalOpen(open);
                if (!open) {
                  setEditingProduct(null);
                  resetProductForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button data-testid="add-product-btn" className="bg-[#c9a84c] hover:bg-[#1a1a1a] text-white">
                    <Plus size={16} className="mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-xl">
                      {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleProductSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-[#4a4a4a]">Name</label>
                        <Input
                          data-testid="product-name-input"
                          value={productForm.name}
                          onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm text-[#4a4a4a]">Price ($)</label>
                        <Input
                          data-testid="product-price-input"
                          type="number"
                          step="0.01"
                          value={productForm.price}
                          onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-[#4a4a4a]">Description</label>
                      <textarea
                        data-testid="product-description-input"
                        value={productForm.description}
                        onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                        className="w-full px-3 py-2 border border-[#c9a84c]/20 rounded-none min-h-[100px]"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-[#4a4a4a]">Category</label>
                        <Select 
                          value={productForm.category} 
                          onValueChange={(value) => setProductForm({...productForm, category: value})}
                        >
                          <SelectTrigger data-testid="product-category-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm text-[#4a4a4a]">Stock</label>
                        <Input
                          data-testid="product-stock-input"
                          type="number"
                          value={productForm.stock}
                          onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-[#4a4a4a]">Material</label>
                      <Input
                        data-testid="product-material-input"
                        value={productForm.material}
                        onChange={(e) => setProductForm({...productForm, material: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[#4a4a4a]">Image URL</label>
                      <Input
                        data-testid="product-image-input"
                        value={productForm.image_url}
                        onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                        placeholder="https://..."
                        required
                      />
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={productForm.is_featured}
                          onChange={(e) => setProductForm({...productForm, is_featured: e.target.checked})}
                          className="w-4 h-4 accent-[#c9a84c]"
                        />
                        <span className="text-sm">Featured</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={productForm.is_bestseller}
                          onChange={(e) => setProductForm({...productForm, is_bestseller: e.target.checked})}
                          className="w-4 h-4 accent-[#c9a84c]"
                        />
                        <span className="text-sm">Best Seller</span>
                      </label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsProductModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" data-testid="save-product-btn" className="bg-[#c9a84c] hover:bg-[#1a1a1a]">
                        {editingProduct ? 'Update' : 'Create'} Product
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Products Table */}
            <div className="bg-white border border-[#c9a84c]/20 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} data-testid={`product-row-${product.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-12 h-12 object-cover"
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-[#4a4a4a]">{product.material}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </TableCell>
                      <TableCell>${product.price.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={product.stock < 5 ? 'text-red-500' : ''}>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {product.is_featured && <Badge variant="secondary">Featured</Badge>}
                          {product.is_bestseller && <Badge>Best Seller</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            data-testid={`edit-product-${product.id}`}
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            data-testid={`delete-product-${product.id}`}
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div data-testid="orders-tab" className="space-y-6">
            <h2 className="font-serif text-2xl">Orders</h2>
            
            <div className="bg-white border border-[#c9a84c]/20 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-[#4a4a4a]">
                        No orders yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.id} data-testid={`order-row-${order.id}`}>
                        <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}...</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customer_name || 'Guest'}</p>
                            <p className="text-xs text-[#4a4a4a]">{order.customer_email || 'N/A'}</p>
                          </div>
                        </TableCell>
                        <TableCell>{order.items?.length || 0} items</TableCell>
                        <TableCell>${order.total?.toLocaleString() || 0}</TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={order.status === 'delivered' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'}
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Select 
                            value={order.status}
                            onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                          >
                            <SelectTrigger className="w-32" data-testid={`order-status-${order.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ORDER_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && inventory && (
          <div data-testid="inventory-tab" className="space-y-6">
            <h2 className="font-serif text-2xl">Inventory Management</h2>

            {/* Low Stock Alert */}
            {inventory.low_stock_count > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 flex items-center gap-3">
                <AlertCircle className="text-red-500" size={20} />
                <span className="text-red-700">
                  {inventory.low_stock_count} product(s) have low stock (below 5 units)
                </span>
              </div>
            )}

            <div className="bg-white border border-[#c9a84c]/20 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead className="text-right">Update Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.products?.map((product) => (
                    <TableRow 
                      key={product.id} 
                      data-testid={`inventory-row-${product.id}`}
                      className={product.stock < 5 ? 'bg-red-50' : ''}
                    >
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>${product.price?.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={product.stock < 5 ? 'text-red-500 font-bold' : ''}>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Input
                            type="number"
                            defaultValue={product.stock}
                            min="0"
                            className="w-20"
                            data-testid={`stock-input-${product.id}`}
                            onBlur={(e) => {
                              const newStock = parseInt(e.target.value);
                              if (newStock !== product.stock) {
                                handleUpdateStock(product.id, newStock);
                              }
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div data-testid="analytics-tab" className="space-y-8">
            <h2 className="font-serif text-2xl">Analytics</h2>

            {/* Order Status Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 border border-[#c9a84c]/20">
                <h3 className="font-serif text-lg mb-4">Orders by Status</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={Object.entries(analytics.order_status_counts || {}).map(([status, count]) => ({ status, count }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8d5a3" />
                    <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#c9a84c" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 border border-[#c9a84c]/20">
                <h3 className="font-serif text-lg mb-4">Revenue by Day</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analytics.revenue_by_day || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8d5a3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#c9a84c" strokeWidth={2} dot={{ fill: '#c9a84c' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 border border-[#c9a84c]/20 text-center">
                <p className="text-2xl font-serif">${analytics.total_revenue?.toLocaleString() || 0}</p>
                <p className="text-sm text-[#4a4a4a]">Total Revenue</p>
              </div>
              <div className="bg-white p-4 border border-[#c9a84c]/20 text-center">
                <p className="text-2xl font-serif">{analytics.total_orders || 0}</p>
                <p className="text-sm text-[#4a4a4a]">Total Orders</p>
              </div>
              <div className="bg-white p-4 border border-[#c9a84c]/20 text-center">
                <p className="text-2xl font-serif">{analytics.product_count || 0}</p>
                <p className="text-sm text-[#4a4a4a]">Products</p>
              </div>
              <div className="bg-white p-4 border border-[#c9a84c]/20 text-center">
                <p className="text-2xl font-serif">
                  ${analytics.total_orders ? (analytics.total_revenue / analytics.total_orders).toFixed(0) : 0}
                </p>
                <p className="text-sm text-[#4a4a4a]">Avg Order Value</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
