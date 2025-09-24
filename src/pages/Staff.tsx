import { useEffect, useState } from "react"

import { Plus, Users, UserCheck, UserX, Search, Edit, Trash2, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Staff } from "@/lib/storage"
import { addStaff, updateStaff, deleteStaff, subscribeStaff } from "@/lib/staffFirestore"

import { useToast } from "@/hooks/use-toast"

export default function Staff() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [staff, setStaff] = useState<Staff[]>([])
  const { toast } = useToast()

  // Subscribe to Firestore staff collection
  useEffect(() => {
    const unsub = subscribeStaff((list) => setStaff(list))
    return () => unsub()
  }, [])

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    specialization: "",
    licenseNumber: "",
    hireDate: "",
    status: "active" as "active" | "inactive",
  })

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "",
      specialization: "",
      licenseNumber: "",
      hireDate: "",
      status: "active",
    })
    setEditingStaff(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const staffData = {
      ...formData,
      role: formData.role as 'admin' | 'therapist' | 'receptionist',
      schedule: [
        { day: "Monday", startTime: "08:00", endTime: "17:00", isAvailable: true },
        { day: "Tuesday", startTime: "08:00", endTime: "17:00", isAvailable: true },
        { day: "Wednesday", startTime: "08:00", endTime: "17:00", isAvailable: true },
        { day: "Thursday", startTime: "08:00", endTime: "17:00", isAvailable: true },
        { day: "Friday", startTime: "08:00", endTime: "17:00", isAvailable: true },
      ],
    }

    try {
      if (editingStaff) {
        await updateStaff(editingStaff.id, staffData)
        toast({
          title: "Staff Updated",
          description: "Staff member has been updated successfully.",
        })
      } else {
        await addStaff(staffData)
        toast({
          title: "Staff Added",
          description: "New staff member has been added successfully.",
        })
      }
    } catch (err: any) {
      toast({
        title: "Failed",
        description: err?.message || "Could not save staff. Please try again.",
        variant: "destructive",
      })
      return
    }

    resetForm()
    setIsDialogOpen(false)
  }

  const handleEdit = (member: Staff) => {
    setEditingStaff(member)
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      role: member.role,
      specialization: member.specialization || "",
      licenseNumber: member.licenseNumber || "",
      hireDate: member.hireDate,
      status: member.status,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteStaff(id)
      toast({
        title: "Staff Deleted",
        description: "Staff member has been deleted successfully.",
      })
    } catch (err: any) {
      toast({
        title: "Failed",
        description: err?.message || "Could not delete staff. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredStaff = staff.filter(member =>
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeStaff = staff.filter(member => member.status === 'active')
  const therapists = staff.filter(member => member.role === 'therapist' && member.status === 'active')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground">Manage your team members and their roles</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Staff Member</span>
              <span className="sm:hidden">Add Staff</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStaff ? 'Edit' : 'Add New'} Staff Member</DialogTitle>
              <DialogDescription>
                {editingStaff ? 'Update the staff member details.' : 'Enter the details for the new staff member.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 px-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="h-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="h-10"
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="h-10"
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="therapist">Therapist</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                  <Select value={formData.status} onValueChange={(value: "active" | "inactive") => setFormData({...formData, status: value})}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialization" className="text-sm font-medium">Specialization (Optional)</Label>
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                    className="h-10"
                    placeholder="e.g., Orthopedic Physiotherapy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber" className="text-sm font-medium">License Number (Optional)</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                    className="h-10"
                    placeholder="e.g., PT-12345"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hireDate" className="text-sm font-medium">Hire Date</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                  className="h-10"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <Button type="submit" className="flex-1 h-11">
                  {editingStaff ? 'Update Staff Member' : 'Add Staff Member'}
                </Button>
                <Button type="button" variant="outline" className="h-11" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{staff.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Staff</CardTitle>
            <UserCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-success">{activeStaff.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Therapists</CardTitle>
            <UserCheck className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{therapists.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Inactive Staff</CardTitle>
            <UserX className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-warning">{staff.length - activeStaff.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Staff List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
            <CardTitle className="text-lg sm:text-xl">Staff Members</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStaff.map((member) => (
              <div key={member.id} className="flex flex-col gap-4 p-4 border rounded-lg hover:bg-accent/50">
                {/* Top Section: Avatar, Name, Role */}
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{member.firstName} {member.lastName}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                    {member.specialization && (
                      <p className="text-xs text-muted-foreground truncate">{member.specialization}</p>
                    )}
                  </div>
                  <Badge 
                    variant={member.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs flex-shrink-0"
                  >
                    {member.status}
                  </Badge>
                </div>
                
                {/* Bottom Section: Contact Info and Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-sm text-muted-foreground space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{member.phone}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 justify-end sm:justify-start flex-shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(member)}
                      className="flex-1 sm:flex-initial"
                    >
                      <Edit className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(member.id)}
                      className="flex-1 sm:flex-initial"
                    >
                      <Trash2 className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredStaff.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">No staff members found</h3>
                <p className="text-muted-foreground">Try adjusting your search criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}