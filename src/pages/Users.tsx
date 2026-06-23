import { useEffect, useState, useMemo } from "react"
import { 
  Plus, 
  Shield, 
  UserCheck, 
  UserX, 
  Search, 
  Edit, 
  Trash2, 
  Mail, 
  User, 
  Lock, 
  CheckCircle, 
  HelpCircle,
  Eye,
  EyeOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import type { UserAccount } from "@/lib/storage"
import { 
  addUser, 
  updateUser, 
  deleteUser, 
  subscribeUsers, 
  checkUsernameExists 
} from "@/lib/usersFirestore"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null)
  const [users, setUsers] = useState<UserAccount[]>([])
  const { toast } = useToast()
  const { user: currentUser } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  // Subscribe to Firestore users collection
  useEffect(() => {
    const unsub = subscribeUsers((list) => setUsers(list))
    return () => unsub()
  }, [])

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    role: "therapist" as "admin" | "therapist" | "receptionist",
    status: "active" as "active" | "inactive",
  })

  const resetForm = () => {
    setFormData({
      username: "",
      fullName: "",
      email: "",
      password: "",
      role: "therapist",
      status: "active",
    })
    setEditingUser(null)
    setShowPassword(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanUsername = formData.username.trim().toLowerCase()
    const cleanEmail = formData.email.trim().toLowerCase()

    if (!editingUser && !formData.password) {
      toast({
        title: "Validation Error",
        description: "Password is required for new users.",
        variant: "destructive",
      })
      return
    }

    try {
      // Check if username already exists for a new user
      if (!editingUser) {
        const exists = await checkUsernameExists(cleanUsername)
        if (exists) {
          toast({
            title: "Username Taken",
            description: "This username is already in use. Please choose another.",
            variant: "destructive",
          })
          return
        }
      }

      const userData = {
        username: cleanUsername,
        fullName: formData.fullName.trim(),
        email: cleanEmail,
        role: formData.role,
        status: formData.status,
        // Only include password if provided
        ...(formData.password ? { password: formData.password } : {}),
      }

      if (editingUser) {
        await updateUser(editingUser.id, userData)
        toast({
          title: "User Updated",
          description: `User account for ${userData.fullName} has been updated successfully.`,
        })
      } else {
        await addUser(userData)
        toast({
          title: "User Added",
          description: `User account for ${userData.fullName} has been created successfully.`,
        })
      }
    } catch (err: any) {
      toast({
        title: "Operation Failed",
        description: err?.message || "Could not save user. Please try again.",
        variant: "destructive",
      })
      return
    }

    resetForm()
    setIsDialogOpen(false)
  }

  const handleEdit = (u: UserAccount) => {
    setEditingUser(u)
    setFormData({
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      password: "", // Leave blank unless changing
      role: u.role,
      status: u.status,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (u: UserAccount) => {
    if (u.id === currentUser?.uid || u.username === currentUser?.username) {
      toast({
        title: "Action Denied",
        description: "You cannot delete your own account.",
        variant: "destructive",
      })
      return
    }

    if (window.confirm(`Are you sure you want to delete user "${u.fullName}"?`)) {
      try {
        await deleteUser(u.id)
        toast({
          title: "User Deleted",
          description: "User account has been deleted successfully.",
        })
      } catch (err: any) {
        toast({
          title: "Failed",
          description: err?.message || "Could not delete user.",
          variant: "destructive",
        })
      }
    }
  }

  // Filtered list based on search term
  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])

  // Statistics calculations
  const stats = useMemo(() => {
    const total = users.length
    const admins = users.filter((u) => u.role === "admin").length
    const therapists = users.filter((u) => u.role === "therapist").length
    const receptionists = users.filter((u) => u.role === "receptionist").length
    const active = users.filter((u) => u.status === "active").length

    return { total, admins, therapists, receptionists, active }
  }, [users])

  const getRoleBadgeVariant = (role: UserAccount["role"]) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "therapist":
        return "default"
      case "receptionist":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage login accounts, passwords, and access privileges</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              <span>Add New User</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit" : "Add New"} User Account</DialogTitle>
              <DialogDescription>
                {editingUser 
                  ? "Update this user's details. Leave password blank if you do not want to change it." 
                  : "Enter details to create a new login account."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 px-1 py-2">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="pl-9 h-10"
                    placeholder="e.g. Dr. John Doe"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="h-10"
                  placeholder="e.g. john_doe"
                  disabled={!!editingUser}
                  required
                />
                {!editingUser && (
                  <p className="text-xs text-muted-foreground">Used for signing in. Cannot be changed later.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-9 h-10"
                    placeholder="john.doe@clinic.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password {editingUser && "(Optional)"}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-9 pr-9 h-10"
                    placeholder={editingUser ? "•••••••• (Leave blank to keep current)" : "Enter login password"}
                    required={!editingUser}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium">Access Role</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value: "admin" | "therapist" | "receptionist") => 
                      setFormData({ ...formData, role: value })
                    }
                  >
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
                  <Label htmlFor="status" className="text-sm font-medium">Account Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value: "active" | "inactive") => 
                      setFormData({ ...formData, status: value })
                    }
                  >
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

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button type="submit" className="flex-1 h-11">
                  {editingUser ? "Save Changes" : "Create Account"}
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
        <Card className="bg-card shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Accounts</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-success font-medium">{stats.active}</span> active sessions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.admins}</div>
            <p className="text-xs text-muted-foreground mt-1">Full system privilege</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Therapists</CardTitle>
            <UserCheck className="h-4 w-4 text-default" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.therapists}</div>
            <p className="text-xs text-muted-foreground mt-1">Clinical access privilege</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Receptionists</CardTitle>
            <UserCheck className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats.receptionists}</div>
            <p className="text-xs text-muted-foreground mt-1">Administrative privilege</p>
          </CardContent>
        </Card>
      </div>

      {/* Main List Section */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg sm:text-xl font-bold">System Login Users</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, username, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map((u) => {
                const isSelf = u.id === currentUser?.uid || u.username === currentUser?.username
                return (
                  <Card key={u.id} className="relative border hover:border-primary/50 transition-all duration-300 bg-card overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2.5 rounded-full flex-shrink-0">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground text-sm sm:text-base flex items-center gap-1.5">
                              {u.fullName}
                              {isSelf && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1 bg-primary/5">
                                  You
                                </Badge>
                              )}
                            </h3>
                            <p className="text-xs text-muted-foreground font-mono">@{u.username}</p>
                          </div>
                        </div>

                        <Badge variant={getRoleBadgeVariant(u.role)} className="capitalize text-xs">
                          {u.role}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </div>

                      <div className="flex items-center justify-between border-t pt-3 mt-2">
                        <div className="flex items-center gap-1.5">
                          {u.status === "active" ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <UserX className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={`text-xs capitalize font-medium ${u.status === 'active' ? 'text-success' : 'text-muted-foreground'}`}>
                            {u.status}
                          </span>
                        </div>

                        <div className="flex gap-1.5">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(u)}
                            className="h-8 w-8 p-0"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(u)}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            disabled={isSelf}
                            title={isSelf ? "Cannot delete yourself" : "Delete User"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-muted-foreground">No users found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
