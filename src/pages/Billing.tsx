import { useState, useEffect } from "react";
import { Plus, Search, Eye, Edit, Trash2, DollarSign, CreditCard, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { type Invoice, type Patient } from "@/lib/storage";
import { subscribeInvoices, addInvoice as addInvoiceFs, updateInvoice as updateInvoiceFs, deleteInvoice as deleteInvoiceFs } from "@/lib/billingFirestore";
import { subscribePatients } from "@/lib/patientsFirestore";
import { useSettings } from "@/hooks/useSettings";
import { formatCurrency } from "@/lib/utils";

export default function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const unsubInv = subscribeInvoices(setInvoices);
    const unsubPat = subscribePatients(setPatients);
    return () => {
      unsubInv();
      unsubPat();
    };
  }, []);
  const { settings } = useSettings();
  const { currency, language } = settings.appearance;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [newInvoice, setNewInvoice] = useState({
    patientId: "",
    amount: 0,
    tax: 0,
    total: 0,
    status: "pending" as const,
    dueDate: "",
    services: [{ name: "", quantity: 1, rate: 0, total: 0 }],
  });

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'secondary';
    }
  };

  // Compute totals helper to avoid stale state when submitting
  const computeTotals = (services: { quantity: number; rate: number; total: number }[]) => {
    const subtotal = services.reduce((sum, s) => sum + (s.total ?? s.quantity * s.rate), 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    return { amount: subtotal, tax, total };
  };

  const calculateInvoiceTotal = () => {
    const { amount, tax, total } = computeTotals(newInvoice.services);
    setNewInvoice(prev => ({ ...prev, amount, tax, total }));
  };

  // Auto-recalculate totals whenever services change
  useEffect(() => {
    calculateInvoiceTotal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newInvoice.services]);

  const addService = () => {
    setNewInvoice(prev => ({
      ...prev,
      services: [...prev.services, { name: "", quantity: 1, rate: 0, total: 0 }]
    }));
  };

  const updateService = (index: number, field: string, value: any) => {
    setNewInvoice(prev => {
      const services = [...prev.services];
      services[index] = { ...services[index], [field]: value };
      
      if (field === 'quantity' || field === 'rate') {
        services[index].total = services[index].quantity * services[index].rate;
      }
      
      return { ...prev, services };
    });
  };

  const removeService = (index: number) => {
    setNewInvoice(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const handleAddInvoice = async () => {
    // Basic validation
    if (!newInvoice.patientId || newInvoice.services.length === 0) {
      toast.error("Please fill in required fields");
      return;
    }
    // Validate at least one service with name and positive qty/rate
    const cleanedServices = newInvoice.services
      .map(s => ({
        name: s.name?.trim() || "",
        quantity: Number(s.quantity) || 0,
        rate: Number(s.rate) || 0,
        total: (Number(s.quantity) || 0) * (Number(s.rate) || 0),
      }))
      .filter(s => s.name && s.quantity > 0 && s.rate >= 0);
    if (cleanedServices.length === 0) {
      toast.error("Please add at least one valid service (name, qty > 0)");
      return;
    }

    const patient = patients.find((p: any) => p.id === newInvoice.patientId) as any;
    if (!patient) {
      toast.error("Invalid patient selection");
      return;
    }

    // Ensure totals are computed synchronously to avoid stale state
    const { amount, tax, total } = computeTotals(cleanedServices);
    const dueDate = newInvoice.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const invoiceData = {
      ...newInvoice,
      services: cleanedServices,
      amount,
      tax,
      total,
      dueDate,
      patientName: `${patient.firstName} ${patient.lastName}`,
    };

    await addInvoiceFs(invoiceData);
    toast.success("Invoice created successfully");
    setIsAddDialogOpen(false);
    setNewInvoice({
      patientId: "",
      amount: 0,
      tax: 0,
      total: 0,
      status: "pending",
      dueDate: "",
      services: [{ name: "", quantity: 1, rate: 0, total: 0 }],
    });
  };

  const handleEditInvoice = async () => {
    if (!selectedInvoice) return;

    await updateInvoiceFs(selectedInvoice.id, selectedInvoice);
    toast.success("Invoice updated successfully");
    setIsEditDialogOpen(false);
    setSelectedInvoice(null);
  };

  const handleStatusChange = async (invoice: Invoice, newStatus: Invoice['status']) => {
    const updates: Partial<Invoice> = { status: newStatus };
    if (newStatus === 'paid') {
      updates.paidDate = new Date().toISOString().split('T')[0];
    }
    
    await updateInvoiceFs(invoice.id, updates);
    toast.success(`Invoice marked as ${newStatus}`);
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (confirm(`Are you sure you want to delete this invoice?`)) {
      await deleteInvoiceFs(invoice.id);
      toast.success("Invoice deleted successfully");
    }
  };

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'pending').length,
    overdue: invoices.filter(i => {
      const today = new Date().toISOString().split('T')[0];
      return i.status !== 'paid' && i.dueDate < today;
    }).length,
    totalRevenue: invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.total, 0),
    pendingAmount: invoices
      .filter(i => i.status === 'pending')
      .reduce((sum, invoice) => sum + invoice.total, 0),
  };

  // This Month's Performance calculations
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const todayISO = new Date().toISOString().split('T')[0];
  const inThisMonth = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };
  const createdThisMonth = invoices.filter(i => inThisMonth(i.createdAt));
  const paidThisMonth = invoices.filter(i => i.status === 'paid' && inThisMonth(i.paidDate));
  const revenueThisMonth = paidThisMonth.reduce((sum, i) => sum + i.total, 0);
  const pendingAmountThisMonth = createdThisMonth.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.total, 0);
  const overdueCountThisMonth = createdThisMonth.filter(i => i.status !== 'paid' && i.dueDate < todayISO).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing & Invoices</h1>
          <p className="text-muted-foreground">Manage patient billing and financial records</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patient">Patient *</Label>
                  <Select value={newInvoice.patientId} onValueChange={(value) => setNewInvoice({ ...newInvoice, patientId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient: any) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Services</Label>
                <div className="space-y-2">
                  {newInvoice.services.map((service, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-end">
                      <div>
                        <Input
                          placeholder="Service name"
                          value={service.name}
                          onChange={(e) => updateService(index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={service.quantity}
                          onChange={(e) => updateService(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          placeholder="Rate"
                          value={service.rate}
                          onChange={(e) => updateService(index, 'rate', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Input
                          value={formatCurrency(service.total, currency, language)}
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeService(index)}
                          disabled={newInvoice.services.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addService}>
                    Add Service
                  </Button>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(newInvoice.amount, currency, language)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Tax (10%):</span>
                  <span>{formatCurrency(newInvoice.tax, currency, language)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(newInvoice.total, currency, language)}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddInvoice}>
                Create Invoice
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Invoice Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setSelectedInvoice(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-patient">Patient *</Label>
                  <Select value={selectedInvoice.patientId} onValueChange={(value) => setSelectedInvoice({ ...selectedInvoice, patientId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient: any) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-dueDate">Due Date</Label>
                  <Input
                    id="edit-dueDate"
                    type="date"
                    value={selectedInvoice.dueDate}
                    onChange={(e) => setSelectedInvoice({ ...selectedInvoice, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={selectedInvoice.status} onValueChange={(value) => setSelectedInvoice({ ...selectedInvoice, status: value as Invoice['status'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedInvoice.status === 'paid' && (
                  <div>
                    <Label>Paid Date</Label>
                    <Input
                      type="date"
                      value={selectedInvoice.paidDate || ''}
                      onChange={(e) => setSelectedInvoice({ ...selectedInvoice, paidDate: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Services</Label>
                <div className="space-y-2">
                  {selectedInvoice.services.map((service, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-end">
                      <div>
                        <Input
                          placeholder="Service name"
                          value={service.name}
                          onChange={(e) => {
                            const services = [...selectedInvoice.services];
                            services[index] = { ...services[index], name: e.target.value };
                            setSelectedInvoice({ ...selectedInvoice, services });
                          }}
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={service.quantity}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value) || 0;
                            const services = [...selectedInvoice.services];
                            services[index] = { ...services[index], quantity: qty, total: qty * services[index].rate };
                            setSelectedInvoice({ ...selectedInvoice, services });
                          }}
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          placeholder="Rate"
                          value={service.rate}
                          onChange={(e) => {
                            const rate = parseFloat(e.target.value) || 0;
                            const services = [...selectedInvoice.services];
                            services[index] = { ...services[index], rate, total: services[index].quantity * rate };
                            setSelectedInvoice({ ...selectedInvoice, services });
                          }}
                        />
                      </div>
                      <div>
                        <Input value={formatCurrency(service.total, currency, language)} readOnly className="bg-muted" />
                      </div>
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const services = selectedInvoice.services.filter((_, i) => i !== index);
                            setSelectedInvoice({ ...selectedInvoice, services });
                          }}
                          disabled={selectedInvoice.services.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedInvoice({ ...selectedInvoice, services: [...selectedInvoice.services, { name: '', quantity: 1, rate: 0, total: 0 }] })}
                  >
                    Add Service
                  </Button>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedInvoice.amount, currency, language)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Tax (10%):</span>
                  <span>{formatCurrency(selectedInvoice.tax, currency, language)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedInvoice.total, currency, language)}</span>
                </div>
              </div>

              {/* Auto-recalc totals for selected invoice */}
              {(() => {
                // keep totals consistent when editing
                const { amount, tax, total } = computeTotals(selectedInvoice.services);
                if (amount !== selectedInvoice.amount || tax !== selectedInvoice.tax || total !== selectedInvoice.total) {
                  // trigger a micro update without infinite loop by reading latest
                  setTimeout(() => setSelectedInvoice(prev => prev ? { ...prev, amount, tax, total } : prev), 0);
                }
                return null;
              })()}

            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!selectedInvoice) return;
              // Validate
              if (!selectedInvoice.patientId || selectedInvoice.services.length === 0) {
                toast.error('Please fill in required fields');
                return;
              }
              const patient = patients.find((p: any) => p.id === selectedInvoice.patientId) as any;
              if (!patient) {
                toast.error('Invalid patient selection');
                return;
              }
              const cleanedServices = selectedInvoice.services
                .map(s => ({
                  name: s.name?.trim() || '',
                  quantity: Number(s.quantity) || 0,
                  rate: Number(s.rate) || 0,
                  total: (Number(s.quantity) || 0) * (Number(s.rate) || 0),
                }))
                .filter(s => s.name && s.quantity > 0 && s.rate >= 0);
              if (cleanedServices.length === 0) {
                toast.error('Please add at least one valid service (name, qty > 0)');
                return;
              }
              const { amount, tax, total } = computeTotals(cleanedServices);
              const dueDate = selectedInvoice.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
              await updateInvoiceFs(selectedInvoice.id, {
                ...selectedInvoice,
                services: cleanedServices,
                amount, tax, total,
                dueDate,
                patientName: `${patient.firstName} ${patient.lastName}`,
              });
              toast.success('Invoice updated successfully');
              setIsEditDialogOpen(false);
              setSelectedInvoice(null);
            }}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue, currency, language)}</p>
              </div>
              {currency === 'PKR' ? (
                <span className="h-8 w-8 text-green-600 inline-flex items-center justify-center font-semibold">₨</span>
              ) : (
                <DollarSign className="h-8 w-8 text-green-600" />
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.pendingAmount, currency, language)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid Invoices</p>
                <p className="text-2xl font-bold">{stats.paid}</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* This Month's Performance */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">This Month's Performance</h2>
          <p className="text-sm text-muted-foreground">Key metrics for {now.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Invoices Created</p>
                  <p className="text-2xl font-bold">{createdThisMonth.length}</p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Paid Invoices</p>
                  <p className="text-2xl font-bold">{paidThisMonth.length}</p>
                </div>
                <Badge variant="default">Paid</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue This Month</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(revenueThisMonth, currency, language)}</p>
                </div>
                {currency === 'PKR' ? (
                  <span className="h-8 w-8 text-green-600 inline-flex items-center justify-center font-semibold">₨</span>
                ) : (
                  <DollarSign className="h-8 w-8 text-green-600" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Amount</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(pendingAmountThisMonth, currency, language)}</p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue (created this month)</p>
                  <p className="text-2xl font-bold text-red-600">{overdueCountThisMonth}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient name or invoice ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invoices List */}
      <div className="grid gap-4">
        {filteredInvoices
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((invoice) => (
          <Card key={invoice.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{invoice.patientName}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span><strong>Invoice ID:</strong> {invoice.id.split('_')[2]}</span>
                      <span><strong>Amount:</strong> {formatCurrency(invoice.total, currency, language)}</span>
                      <span><strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</span>
                      {invoice.paidDate && (
                        <span><strong>Paid Date:</strong> {new Date(invoice.paidDate).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <strong>Services:</strong> {invoice.services.map(s => s.name).join(', ')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(invoice.status)}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </Badge>
                  
                  {invoice.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusChange(invoice, 'paid')}
                      title="Mark as paid"
                    >
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </Button>
                  )}
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteInvoice(invoice)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Patient</Label>
                  <p className="font-medium">{selectedInvoice.patientName}</p>
                </div>
                <div>
                  <Label>Invoice ID</Label>
                  <p className="font-medium">{selectedInvoice.id.split('_')[2]}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Due Date</Label>
                  <p>{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={getStatusColor(selectedInvoice.status)}>
                    {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                  </Badge>
                </div>
              </div>

              {selectedInvoice.paidDate && (
                <div>
                  <Label>Paid Date</Label>
                  <p>{new Date(selectedInvoice.paidDate).toLocaleDateString()}</p>
                </div>
              )}

              <div>
                <Label>Services</Label>
                <div className="border rounded-lg overflow-hidden mt-2">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3">Service</th>
                        <th className="text-right p-3">Qty</th>
                        <th className="text-right p-3">Rate</th>
                        <th className="text-right p-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.services.map((service, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-3">{service.name}</td>
                          <td className="text-right p-3">{service.quantity}</td>
                          <td className="text-right p-3">{formatCurrency(service.rate, currency, language)}</td>
                          <td className="text-right p-3">{formatCurrency(service.total, currency, language)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedInvoice.amount, currency, language)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Tax:</span>
                  <span>{formatCurrency(selectedInvoice.tax, currency, language)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedInvoice.total, currency, language)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <Label>Created</Label>
                  <p>{new Date(selectedInvoice.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p>{new Date(selectedInvoice.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {filteredInvoices.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "No invoices match your search criteria" : "Get started by creating your first invoice"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}