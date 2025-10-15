import { useEffect, useState } from "react"
import { Save, User, Building, Palette, Bell, Shield, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { settingsStorage, type Settings } from "@/lib/storage"

export default function Settings() {
  const { toast } = useToast()
  const [profile, setProfile] = useState<Settings["profile"]>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialization: "",
    licenseNumber: "",
  })

  const [clinic, setClinic] = useState<Settings["clinic"]>({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    taxId: "",
  })

  const [notifications, setNotifications] = useState<Settings["notifications"]>({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    paymentReminders: true,
    lowStockAlerts: true,
    systemUpdates: false,
  })

  const [appearance, setAppearance] = useState<Settings["appearance"]>({
    theme: "light",
    fontSize: "medium",
    language: "en",
    currency: "USD",
  })

  const [schedule, setSchedule] = useState<Settings["schedule"]>({
    defaultAppointmentDuration: "60",
    workingHoursStart: "08:00",
    workingHoursEnd: "17:00",
    timeZone: "America/New_York",
  })

  // Load persisted settings
  useEffect(() => {
    const s = settingsStorage.get()
    setProfile(s.profile)
    setClinic(s.clinic)
    setNotifications(s.notifications)
    setAppearance(s.appearance)
    setSchedule(s.schedule)
  }, [])

  const handleSaveProfile = () => {
    settingsStorage.update({ profile })
    toast({
      title: "Profile Updated",
      description: "Your profile has been saved successfully.",
    })
  }

  const handleSaveClinic = () => {
    settingsStorage.update({ clinic })
    toast({
      title: "Clinic Settings Updated",
      description: "Clinic information has been saved successfully.",
    })
  }

  const handleSaveNotifications = () => {
    settingsStorage.update({ notifications })
    toast({
      title: "Notification Settings Updated",
      description: "Your notification preferences have been saved.",
    })
  }

  const handleSaveAppearance = () => {
    settingsStorage.update({ appearance })
    toast({
      title: "Appearance Settings Updated",
      description: "Your appearance preferences have been saved.",
    })
  }

  const handleSaveSchedule = () => {
    settingsStorage.update({ schedule })
    toast({
      title: "Schedule Settings Updated",
      description: "Your schedule preferences have been saved.",
    })
  }

  return (
    <div className="min-h-screen w-full flex justify-center bg-background">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage your account and application preferences</p>
          </div>

      <Tabs defaultValue="profile" className="space-y-6 w-full">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto gap-1 p-1 bg-muted rounded-lg">
            <TabsTrigger value="profile" className="text-xs sm:text-sm px-2 py-2 rounded-md">Profile</TabsTrigger>
            <TabsTrigger value="clinic" className="text-xs sm:text-sm px-2 py-2 rounded-md">Clinic</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs sm:text-sm px-2 py-2 rounded-md">Notifications</TabsTrigger>
            <TabsTrigger value="appearance" className="text-xs sm:text-sm px-2 py-2 rounded-md">Appearance</TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs sm:text-sm px-2 py-2 rounded-md">Schedule</TabsTrigger>
          </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Manage your personal information and professional details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                    className="h-10 sm:h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                    className="h-10 sm:h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    className="h-10 sm:h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    className="h-10 sm:h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="specialization" className="text-sm font-medium">Specialization</Label>
                  <Input
                    id="specialization"
                    value={profile.specialization}
                    onChange={(e) => setProfile({...profile, specialization: e.target.value})}
                    className="h-10 sm:h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber" className="text-sm font-medium">License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={profile.licenseNumber}
                    onChange={(e) => setProfile({...profile, licenseNumber: e.target.value})}
                    className="h-10 sm:h-9"
                  />
                </div>
              </div>

              <Separator />

              <Button onClick={handleSaveProfile} className="w-full mt-4">
                <Save className="h-4 w-4 mr-2" />
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clinic Settings */}
        <TabsContent value="clinic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Clinic Settings
              </CardTitle>
              <CardDescription>
                Manage your clinic information and business details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div className="space-y-2">
                <Label htmlFor="clinicName" className="text-sm font-medium">Clinic Name</Label>
                <Input
                  id="clinicName"
                  value={clinic.name}
                  onChange={(e) => setClinic({...clinic, name: e.target.value})}
                  className="h-10 sm:h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                <Input
                  id="address"
                  value={clinic.address}
                  onChange={(e) => setClinic({...clinic, address: e.target.value})}
                  className="h-10 sm:h-9"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="clinicPhone" className="text-sm font-medium">Phone</Label>
                  <Input
                    id="clinicPhone"
                    value={clinic.phone}
                    onChange={(e) => setClinic({...clinic, phone: e.target.value})}
                    className="h-10 sm:h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicEmail" className="text-sm font-medium">Email</Label>
                  <Input
                    id="clinicEmail"
                    type="email"
                    value={clinic.email}
                    onChange={(e) => setClinic({...clinic, email: e.target.value})}
                    className="h-10 sm:h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-sm font-medium">Website</Label>
                  <Input
                    id="website"
                    value={clinic.website}
                    onChange={(e) => setClinic({...clinic, website: e.target.value})}
                    className="h-10 sm:h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId" className="text-sm font-medium">Tax ID</Label>
                  <Input
                    id="taxId"
                    value={clinic.taxId}
                    onChange={(e) => setClinic({...clinic, taxId: e.target.value})}
                    className="h-10 sm:h-9"
                  />
                </div>
              </div>

              <Separator />

              <Button onClick={handleSaveClinic} className="w-full mt-4">
                <Save className="h-4 w-4 mr-2" />
                Save Clinic Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => setNotifications({...notifications, emailNotifications: checked})}
                    />
                  </div>
                </div>

                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive notifications via text message</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Switch
                      checked={notifications.smsNotifications}
                      onCheckedChange={(checked) => setNotifications({...notifications, smsNotifications: checked})}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-medium">Appointment Reminders</p>
                    <p className="text-sm text-muted-foreground">Reminders for upcoming appointments</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Switch
                      checked={notifications.appointmentReminders}
                      onCheckedChange={(checked) => setNotifications({...notifications, appointmentReminders: checked})}
                    />
                  </div>
                </div>

                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-medium">Payment Reminders</p>
                    <p className="text-sm text-muted-foreground">Reminders for overdue payments</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Switch
                      checked={notifications.paymentReminders}
                      onCheckedChange={(checked) => setNotifications({...notifications, paymentReminders: checked})}
                    />
                  </div>
                </div>

                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-medium">Low Stock Alerts</p>
                    <p className="text-sm text-muted-foreground">Alerts when inventory is low</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Switch
                      checked={notifications.lowStockAlerts}
                      onCheckedChange={(checked) => setNotifications({...notifications, lowStockAlerts: checked})}
                    />
                  </div>
                </div>

                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-medium">System Updates</p>
                    <p className="text-sm text-muted-foreground">Notifications about system updates</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Switch
                      checked={notifications.systemUpdates}
                      onCheckedChange={(checked) => setNotifications({...notifications, systemUpdates: checked})}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <Button onClick={handleSaveNotifications} className="w-full mt-4">
                <Save className="h-4 w-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance Settings
              </CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div className="space-y-2">
                <Label htmlFor="theme" className="text-sm font-medium">Theme</Label>
                <Select value={appearance.theme} onValueChange={(value) => {
                  const next = { ...appearance, theme: value as Settings["appearance"]["theme"] };
                  setAppearance(next);
                  settingsStorage.update({ appearance: next });
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fontSize" className="text-sm font-medium">Font Size</Label>
                <Select value={appearance.fontSize} onValueChange={(value) => {
                  const next = { ...appearance, fontSize: value as Settings["appearance"]["fontSize"] };
                  setAppearance(next);
                  settingsStorage.update({ appearance: next });
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-medium">Currency</Label>
                <Select value={appearance.currency} onValueChange={(value) => {
                  const next = { ...appearance, currency: value as Settings["appearance"]["currency"] };
                  setAppearance(next);
                  settingsStorage.update({ appearance: next });
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="PKR">PKR (₨)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <Button onClick={handleSaveAppearance} className="w-full mt-4">
                <Save className="h-4 w-4 mr-2" />
                Save Appearance Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Settings */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Schedule Settings
              </CardTitle>
              <CardDescription>
                Configure your working hours and appointment settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div className="space-y-2">
                <Label htmlFor="appointmentDuration" className="text-sm font-medium">Default Appointment Duration (minutes)</Label>
                <Select 
                  value={schedule.defaultAppointmentDuration} 
                  onValueChange={(value) => setSchedule({...schedule, defaultAppointmentDuration: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">120 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="workStart" className="text-sm font-medium">Working Hours Start</Label>
                  <Input
                    id="workStart"
                    type="time"
                    value={schedule.workingHoursStart}
                    onChange={(e) => setSchedule({...schedule, workingHoursStart: e.target.value})}
                    className="h-10 sm:h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workEnd" className="text-sm font-medium">Working Hours End</Label>
                  <Input
                    id="workEnd"
                    type="time"
                    value={schedule.workingHoursEnd}
                    onChange={(e) => setSchedule({...schedule, workingHoursEnd: e.target.value})}
                    className="h-10 sm:h-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeZone" className="text-sm font-medium">Time Zone</Label>
                <Select value={schedule.timeZone} onValueChange={(value) => setSchedule({...schedule, timeZone: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <Button onClick={handleSaveSchedule} className="w-full mt-4">
                <Save className="h-4 w-4 mr-2" />
                Save Schedule Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}