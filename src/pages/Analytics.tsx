import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Activity } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useStorage, useRealtimeStats } from "@/hooks/useStorage"
import { type Patient, type Appointment, type Invoice } from "@/lib/storage"
import { useSettings } from "@/hooks/useSettings"
import { formatCurrency } from "@/lib/utils"

export default function Analytics() {
  const patients = useStorage<Patient>('mindspire_patients', [])
  const appointments = useStorage<Appointment>('mindspire_appointments', [])
  const invoices = useStorage<Invoice>('mindspire_invoices', [])
  const stats = useRealtimeStats()
  const { settings } = useSettings()
  const { currency, language } = settings.appearance

  // Calculate analytics data
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const thisMonthAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date)
    return aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear
  })

  const thisMonthRevenue = invoices
    .filter(inv => {
      if (inv.status !== 'paid' || !inv.paidDate) return false
      const paidDate = new Date(inv.paidDate)
      return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear
    })
    .reduce((sum, inv) => sum + inv.total, 0)

  const lastMonthRevenue = invoices
    .filter(inv => {
      if (inv.status !== 'paid' || !inv.paidDate) return false
      const paidDate = new Date(inv.paidDate)
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
      return paidDate.getMonth() === lastMonth && paidDate.getFullYear() === lastMonthYear
    })
    .reduce((sum, inv) => sum + inv.total, 0)

  const revenueGrowth = lastMonthRevenue > 0 
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
    : 0

  const appointmentTypes = appointments.reduce((acc, apt) => {
    acc[apt.type] = (acc[apt.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const completedAppointments = appointments.filter(apt => apt.status === 'completed').length
  const completionRate = appointments.length > 0 ? (completedAppointments / appointments.length) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Insights and performance metrics for your practice</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            {currency === 'PKR' ? (
              <span className="h-4 w-4 text-success inline-flex items-center justify-center font-semibold">₨</span>
            ) : (
              <DollarSign className="h-4 w-4 text-success" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(thisMonthRevenue, currency, language)}</div>
            <p className={`text-xs flex items-center gap-1 ${revenueGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
              {revenueGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(revenueGrowth).toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">{stats.activePatients} active patients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonthAppointments.length}</div>
            <p className="text-xs text-muted-foreground">{completionRate.toFixed(1)}% completion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
            <Activity className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.overdueAmount, currency, language)}</div>
            <p className="text-xs text-destructive">{stats.overdueInvoices} overdue invoices</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Appointment Types */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Types</CardTitle>
            <CardDescription>Distribution of appointment types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(appointmentTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <span className="capitalize">{type}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{count}</div>
                    <div className="text-sm text-muted-foreground">
                      {appointments.length > 0 ? ((count / appointments.length) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Financial performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                <div>
                  <p className="font-medium text-success">Total Revenue</p>
                  <p className="text-sm text-muted-foreground">All time paid invoices</p>
                </div>
                <p className="text-lg font-bold text-success">{formatCurrency(stats.totalRevenue, currency, language)}</p>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <div>
                  <p className="font-medium text-primary">Today's Revenue</p>
                  <p className="text-sm text-muted-foreground">Payments received today</p>
                </div>
                <p className="text-lg font-bold text-primary">{formatCurrency(stats.todayRevenue, currency, language)}</p>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                <div>
                  <p className="font-medium text-warning">Pending Invoices</p>
                  <p className="text-sm text-muted-foreground">{stats.pendingInvoices} awaiting payment</p>
                </div>
                <p className="text-lg font-bold text-warning">
                  {formatCurrency(invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.total, 0), currency, language)}
                </p>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                <div>
                  <p className="font-medium text-destructive">Overdue Amount</p>
                  <p className="text-sm text-muted-foreground">{stats.overdueInvoices} overdue invoices</p>
                </div>
                <p className="text-lg font-bold text-destructive">{formatCurrency(stats.overdueAmount, currency, language)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Status Overview</CardTitle>
          <CardDescription>Current patient distribution by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg">
              <div>
                <p className="font-medium text-success">Active Patients</p>
                <p className="text-sm text-muted-foreground">Currently receiving treatment</p>
              </div>
              <p className="text-2xl font-bold text-success">{stats.activePatients}</p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-warning/10 rounded-lg">
              <div>
                <p className="font-medium text-warning">Inactive Patients</p>
                <p className="text-sm text-muted-foreground">Not currently active</p>
              </div>
              <p className="text-2xl font-bold text-warning">
                {patients.filter(p => p.status === 'inactive').length}
              </p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
              <div>
                <p className="font-medium text-primary">Completed Treatment</p>
                <p className="text-sm text-muted-foreground">Successfully completed</p>
              </div>
              <p className="text-2xl font-bold text-primary">
                {patients.filter(p => p.status === 'completed').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}