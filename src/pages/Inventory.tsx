import { useState, useEffect } from "react"
import { Plus, Package, AlertTriangle, Search, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { InventoryItem } from "@/lib/storage";
import { subscribeItems, addItem as addItemFs, updateItem as updateItemFs, deleteItem as deleteItemFs } from "@/lib/inventoryFirestore";
import { useToast } from "@/hooks/use-toast"
import { useSettings } from "@/hooks/useSettings"
import { formatCurrency } from "@/lib/utils"

export default function Inventory() {

  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const unsub = subscribeItems(setInventory);
    return unsub;
  }, [])
  const { toast } = useToast()
  const { settings } = useSettings()
  const { currency, language } = settings.appearance

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    currentStock: "",
    minStock: "",
    maxStock: "",
    unit: "",
    costPerUnit: "",
    supplier: "",
    supplierContact: "",
    location: "",
    expiryDate: "",
  })

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      currentStock: "",
      minStock: "",
      maxStock: "",
      unit: "",
      costPerUnit: "",
      supplier: "",
      supplierContact: "",
      location: "",
      expiryDate: "",
    })
    setEditingItem(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const itemData = {
      name: formData.name,
      category: formData.category,
      currentStock: parseInt(formData.currentStock),
      minStock: parseInt(formData.minStock),
      maxStock: parseInt(formData.maxStock),
      unit: formData.unit,
      costPerUnit: parseFloat(formData.costPerUnit),
      supplier: formData.supplier,
      supplierContact: formData.supplierContact,
      location: formData.location,
      expiryDate: formData.expiryDate || undefined,
    }

    if (editingItem) {
      await updateItemFs(editingItem.id, itemData)
      toast({
        title: "Item Updated",
        description: "Inventory item has been updated successfully.",
      })
    } else {
      await addItemFs(itemData)
      toast({
        title: "Item Added",
        description: "New inventory item has been added successfully.",
      })
    }

    resetForm()
    setIsDialogOpen(false)
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      currentStock: item.currentStock.toString(),
      minStock: item.minStock.toString(),
      maxStock: item.maxStock.toString(),
      unit: item.unit,
      costPerUnit: item.costPerUnit.toString(),
      supplier: item.supplier,
      supplierContact: item.supplierContact,
      location: item.location,
      expiryDate: item.expiryDate || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteItemFs(id)
    toast({
      title: "Item Deleted",
      description: "Inventory item has been deleted successfully.",
    })
  }

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const lowStockItems = inventory.filter(item => item.currentStock <= item.minStock)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground">Track and manage medical supplies and equipment</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-full sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit' : 'Add New'} Inventory Item</DialogTitle>
              <DialogDescription>
                {editingItem ? 'Update the inventory item details.' : 'Enter the details for the new inventory item.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Exercise Equipment">Exercise Equipment</SelectItem>
                      <SelectItem value="Medical Supplies">Medical Supplies</SelectItem>
                      <SelectItem value="Therapeutic Tools">Therapeutic Tools</SelectItem>
                      <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                      <SelectItem value="Cleaning Supplies">Cleaning Supplies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="currentStock">Current Stock</Label>
                  <Input
                    id="currentStock"
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({...formData, currentStock: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="minStock">Min Stock</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({...formData, minStock: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="maxStock">Max Stock</Label>
                  <Input
                    id="maxStock"
                    type="number"
                    value={formData.maxStock}
                    onChange={(e) => setFormData({...formData, maxStock: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    placeholder="e.g., pieces, bottles, kg"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="costPerUnit">Cost Per Unit ({currency})</Label>
                  <Input
                    id="costPerUnit"
                    type="number"
                    step="0.01"
                    value={formData.costPerUnit}
                    onChange={(e) => setFormData({...formData, costPerUnit: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="supplierContact">Supplier Contact</Label>
                  <Input
                    id="supplierContact"
                    value={formData.supplierContact}
                    onChange={(e) => setFormData({...formData, supplierContact: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Storage Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingItem ? 'Update Item' : 'Add Item'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowStockItems.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(inventory.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0), currency, language)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Package className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(inventory.map(item => item.category)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-col sm:flex-row">
            <CardTitle>Inventory Items</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredInventory.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg hover:bg-accent/50">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.category} • {item.supplier}</p>
                    <p className="text-sm text-muted-foreground">Location: {item.location}</p>
                  </div>
                </div>
                
                <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <p className="font-medium">
                      {item.currentStock} {item.unit}
                    </p>
                    <Badge 
                      variant={item.currentStock <= item.minStock ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {item.currentStock <= item.minStock ? "Low Stock" : "In Stock"}
                    </Badge>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.costPerUnit, currency, language)}</p>
                    <p className="text-sm text-muted-foreground">per {item.unit}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredInventory.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">No items found</h3>
                <p className="text-muted-foreground">Try adjusting your search criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}