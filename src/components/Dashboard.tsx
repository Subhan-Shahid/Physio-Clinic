import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Package,
  TrendingUp,
  Users,
  Heart
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
 
import { useRealtimeStats, useStorage } from "@/hooks/useStorage"
import { type Appointment } from "@/lib/storage"
import { useSettings } from "@/hooks/useSettings"
import { formatCurrency } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export function Dashboard() {
  const stats = useRealtimeStats()
  const appointments = useStorage<Appointment>('mindspire_appointments', [])
  const { settings } = useSettings()
  const navigate = useNavigate()
  
  // Get today's appointments
  const today = new Date().toISOString().split('T')[0]
  const todayAppointments = appointments.filter(apt => apt.date === today)
  const locale = settings.appearance.language || 'en'
  const { currency, language } = settings.appearance

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-primary rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Good morning, {settings.profile.firstName} {settings.profile.lastName}!</h1>
            <p className="text-white/80">Today is {new Date().toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. You have {stats.todayAppointments} appointments scheduled.</p>
          </div>
          <div className="bg-white/20 p-3 rounded-xl">
            <Heart className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            {currency === 'PKR' ? (
              <span className="h-4 w-4 text-success inline-flex items-center justify-center font-semibold">₨</span>
            ) : (
              <DollarSign className="h-4 w-4 text-success" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.todayRevenue, currency, language)}</div>
            <p className="text-xs text-success flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              From today's payments
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">{stats.completedAppointments} completed, {stats.upcomingAppointments} upcoming</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
            <Users className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.activePatients}</div>
            <p className="text-xs text-primary">Total: {stats.totalPatients}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            {currency === 'PKR' ? (
              <span className="h-4 w-4 text-warning inline-flex items-center justify-center font-semibold">₨</span>
            ) : (
              <CreditCard className="h-4 w-4 text-warning" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.overdueAmount, currency, language)}</div>
            <p className="text-xs text-destructive">{stats.overdueInvoices} overdue invoices</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Today's Schedule
                </CardTitle>
                <CardDescription>Your appointments for today</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayAppointments.length > 0 ? todayAppointments.slice(0, 4).map((appointment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gradient-subtle rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{appointment.patientName}</p>
                    <p className="text-sm text-muted-foreground capitalize">{appointment.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">{appointment.time}</p>
                  <Badge 
                    variant={appointment.status === 'completed' ? 'default' : 'secondary'}
                    className="text-xs capitalize"
                  >
                    {appointment.status}
                  </Badge>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">No appointments today</h3>
                <p className="text-muted-foreground">Your schedule is clear for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Alerts */}
        <div className="space-y-6">
          {/* Alerts */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Alerts & Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Overdue Payments</p>
                    <p className="text-sm text-muted-foreground">{stats.overdueInvoices} invoices are overdue totaling {formatCurrency(stats.overdueAmount, currency, language)}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Package className="h-4 w-4 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-warning">Low Inventory</p>
                    <p className="text-sm text-muted-foreground">{stats.lowStockItems} items running low - reorder needed</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to streamline your workflow</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="medical" className="h-auto p-4 flex-col" onClick={() => navigate('/patients')}>
                <Users className="h-6 w-6 mb-2" />
                <span className="text-sm">Add Patient</span>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 flex-col" onClick={() => navigate('/appointments')}>
                <Calendar className="h-6 w-6 mb-2" />
                <span className="text-sm">Schedule</span>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 flex-col" onClick={() => navigate('/billing')}>
                <CreditCard className="h-6 w-6 mb-2" />
                <span className="text-sm">Create Invoice</span>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 flex-col" onClick={() => navigate('/patients')}>
                <Activity className="h-6 w-6 mb-2" />
                <span className="text-sm">Treatment Plan</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      
    </div>
  )
}