import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  Package,
  UsersRound,
  BarChart3,
  Settings,
  Activity,
  Heart,
  Bell,
  Search
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from "@/hooks/useStorage"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { NewPatientDialog } from "@/components/NewPatientDialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { notificationStorage, type Notification } from "@/lib/storage"

// Navigation items for different roles
const adminItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Patients", url: "/patients", icon: Users },
  { title: "Appointments", url: "/appointments", icon: Calendar },
  { title: "Billing", url: "/billing", icon: CreditCard },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Staff", url: "/staff", icon: UsersRound },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
]

const therapistItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "My Patients", url: "/patients", icon: Users },
  { title: "Schedule", url: "/appointments", icon: Calendar },
  { title: "Treatment Plans", url: "/treatments", icon: Activity },
  { title: "Progress Notes", url: "/notes", icon: Heart },
]

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const [userRole] = useState<'admin' | 'therapist' | 'receptionist'>('admin') // Mock role
  const [isNewPatientDialogOpen, setIsNewPatientDialogOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  const items = userRole === 'admin' ? adminItems : therapistItems
  const isCollapsed = state === "collapsed"
  const { stats } = useDashboardStats()
  const { unreadCount } = useNotifications()

  // Function to handle navigation click - closes mobile sidebar
  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/10 text-primary border-r-2 border-primary font-medium" 
      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"

  return (
    <>
      <Sidebar
        className="border-r bg-card/50 backdrop-blur-sm sticky top-0 h-screen"
        collapsible="icon"
      >
      {/* Header */}
      <div className="p-4 border-b bg-gradient-primary">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Heart className="h-6 w-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-white font-bold text-lg">Mindspire</h1>
              <p className="text-white/80 text-xs">Physiotherapy Software</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="p-4 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients, appointments..."
              className="w-full pl-10 bg-background/50"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="medical" 
              size="sm" 
              className="w-full sm:flex-1"
              onClick={() => setIsNewPatientDialogOpen(true)}
            >
              <Users className="h-4 w-4" />
              New Patient
            </Button>
            <Button className="w-full sm:w-auto" variant="outline" size="sm" onClick={() => setIsNotificationsOpen(true)}>
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 px-1 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      )}

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-2 mb-2">
            {userRole === 'admin' ? 'ADMINISTRATION' : 'THERAPY TOOLS'}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      onClick={handleNavClick}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                        ${getNavCls({ isActive })}
                      `}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Role-specific quick stats */}
        {!isCollapsed && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-2 mb-2">
              TODAY'S SUMMARY
            </SidebarGroupLabel>
            <div className="px-2 space-y-2">
              <div className="bg-gradient-subtle p-3 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">Appointments</span>
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <p className="text-lg font-bold text-foreground">{stats.todayAppointments}</p>
                <p className="text-xs text-success">{stats.completedAppointments} completed</p>
              </div>
              
              <div className="bg-gradient-subtle p-3 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">Active Patients</span>
                  <Users className="h-4 w-4 text-secondary" />
                </div>
                <p className="text-lg font-bold text-foreground">{stats.activePatients}</p>
                <p className="text-xs text-primary">Total: {stats.totalPatients}</p>
              </div>
            </div>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
    
    <NewPatientDialog 
      open={isNewPatientDialogOpen}
      onOpenChange={setIsNewPatientDialogOpen}
    />

    {/* Notifications Dialog */}
    <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
      <DialogContent className="max-w-full sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notifications
          </DialogTitle>
        </DialogHeader>

        <NotificationsPanel onClose={() => setIsNotificationsOpen(false)} />
      </DialogContent>
    </Dialog>
    </>
  )
}

function NotificationsPanel({ onClose }: { onClose?: () => void }) {
  const { notifications } = useNotifications()

  const handleMarkAll = () => {
    notificationStorage.markAllAsRead()
  }

  const handleMarkRead = (id: string) => {
    notificationStorage.markAsRead(id)
  }

  const handleDelete = (id: string) => {
    notificationStorage.delete(id)
  }

  const timeAgo = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  const priorityBadge = (p: Notification['priority']) => (
    <Badge variant={p === 'high' ? 'destructive' : p === 'medium' ? 'secondary' : 'outline'} className="text-[10px]">
      {p}
    </Badge>
  )

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{notifications.length} notifications</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAll}>Mark all as read</Button>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
        {notifications.length === 0 && (
          <div className="text-sm text-muted-foreground py-8 text-center">No notifications</div>
        )}
        {notifications.map((n) => (
          <div key={n.id} className={`p-3 rounded-lg border ${!n.isRead ? 'bg-accent/30' : 'bg-background'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {priorityBadge(n.priority)}
                  <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                </div>
                <div className="font-medium text-sm">{n.title}</div>
                <div className="text-sm text-muted-foreground">{n.message}</div>
              </div>
              <div className="flex gap-1">
                {!n.isRead && (
                  <Button size="icon" variant="ghost" className="h-7 w-7" title="Mark as read" onClick={() => handleMarkRead(n.id)}>
                    <CheckIcon />
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="h-7 w-7" title="Delete" onClick={() => handleDelete(n.id)}>
                  <TrashIcon />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M20 6 9 17l-5-5"/></svg>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M3 6h18M8 6v14m8-14v14M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14"/><path d="M10 6V4a2 2 0 0 1 2-2 2 2 0 0 1 2 2v2"/></svg>
  )
}