import { useState, useEffect, useMemo } from "react";
import { Plus, Calendar, Clock, Search, Eye, Edit, Trash2, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { type Appointment, type Patient, type Staff } from "@/lib/storage";
import { subscribeAppointments, addAppointment as addAppointmentFs, updateAppointment as updateAppointmentFs, deleteAppointment as deleteAppointmentFs } from "@/lib/appointmentsFirestore";
import { subscribePatients } from "@/lib/patientsFirestore";
import { subscribeStaff } from "@/lib/staffFirestore";

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  useEffect(() => {
    const unsubA = subscribeAppointments(setAppointments);
    const unsubP = subscribePatients(setPatients);
    const unsubS = subscribeStaff(setStaff);
    return () => {
      unsubA();
      unsubP();
      unsubS();
    };
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [newAppointment, setNewAppointment] = useState({
    patientId: "",
    therapistId: "",
    date: new Date().toISOString().split('T')[0],
    time: "",
    duration: 60,
    type: "therapy" as const,
    status: "scheduled" as const,
    notes: "",
  });

  const therapists = useMemo(() => {
    const filtered = staff.filter((s) => s.role === 'therapist' && s.status === 'active');
    const seen = new Set<string>();
    return filtered.filter((t) => {
      const key = `${(t.firstName || '').trim().toLowerCase()} ${(t.lastName || '').trim().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [staff]);

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.therapistName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = appointment.date === selectedDate;
    return matchesSearch && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'no-show': return 'outline';
      default: return 'secondary';
    }
  };

  const handleAddAppointment = async () => {
    if (!newAppointment.patientId || !newAppointment.therapistId || !newAppointment.time) {
      toast.error("Please fill in all required fields");
      return;
    }

    const patient = patients.find((p: any) => p.id === newAppointment.patientId) as any;
    const therapist = staff.find((s: any) => s.id === newAppointment.therapistId) as any;

    if (!patient || !therapist) {
      toast.error("Invalid patient or therapist selection");
      return;
    }

    const appointmentData = {
      ...newAppointment,
      patientName: `${patient.firstName} ${patient.lastName}`,
      therapistName: `${therapist.firstName} ${therapist.lastName}`,
    };

    await addAppointmentFs(appointmentData);
    toast.success("Appointment scheduled successfully");
    setIsAddDialogOpen(false);
    setNewAppointment({
      patientId: "",
      therapistId: "",
      date: new Date().toISOString().split('T')[0],
      time: "",
      duration: 60,
      type: "therapy",
      status: "scheduled",
      notes: "",
    });
  };

  const handleEditAppointment = async () => {
    if (!selectedAppointment) return;

    await updateAppointmentFs(selectedAppointment.id, selectedAppointment);
    toast.success("Appointment updated successfully");
    setIsEditDialogOpen(false);
    setSelectedAppointment(null);
  };

  const handleStatusChange = async (appointment: Appointment, newStatus: Appointment['status']) => {
    await updateAppointmentFs(appointment.id, { status: newStatus });
    toast.success(`Appointment marked as ${newStatus}`);
  };

  const handleDeleteAppointment = async (appointment: Appointment) => {
    if (confirm(`Are you sure you want to delete this appointment?`)) {
      await deleteAppointmentFs(appointment.id);
      toast.success("Appointment deleted successfully");
    }
  };

  const todayStats = {
    total: appointments.filter(a => a.date === selectedDate).length,
    completed: appointments.filter(a => a.date === selectedDate && a.status === 'completed').length,
    scheduled: appointments.filter(a => a.date === selectedDate && a.status === 'scheduled').length,
    cancelled: appointments.filter(a => a.date === selectedDate && a.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground">Manage patient appointments and scheduling</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Schedule Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-full sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="patient">Patient *</Label>
                <Select value={newAppointment.patientId} onValueChange={(value) => setNewAppointment({ ...newAppointment, patientId: value })}>
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
                <Label htmlFor="therapist">Therapist *</Label>
                <Select value={newAppointment.therapistId} onValueChange={(value) => setNewAppointment({ ...newAppointment, therapistId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select therapist" />
                  </SelectTrigger>
                  <SelectContent>
                    {therapists.map((therapist: Staff) => (
                      <SelectItem key={therapist.id} value={therapist.id}>
                        {therapist.firstName} {therapist.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select value={newAppointment.duration.toString()} onValueChange={(value) => setNewAppointment({ ...newAppointment, duration: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={newAppointment.type} onValueChange={(value: any) => setNewAppointment({ ...newAppointment, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="therapy">Therapy Session</SelectItem>
                      <SelectItem value="followup">Follow-up</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                  placeholder="Additional notes for this appointment"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAppointment}>Schedule Appointment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Today</p>
                <p className="text-2xl font-bold">{todayStats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{todayStats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{todayStats.scheduled}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{todayStats.cancelled}</p>
              </div>
              <X className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="selectedDate">Select Date</Label>
          <Input
            id="selectedDate"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div className="flex-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by patient or therapist name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="grid gap-4">
        {filteredAppointments
          .sort((a, b) => a.time.localeCompare(b.time))
          .map((appointment) => (
          <Card key={appointment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4 justify-center">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="font-semibold text-lg">{appointment.patientName}</h3>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 md:gap-4 text-sm text-muted-foreground">
                      <span><strong>Therapist:</strong> {appointment.therapistName}</span>
                      <span><strong>Time:</strong> {appointment.time}</span>
                      <span><strong>Duration:</strong> {appointment.duration} min</span>
                      <span><strong>Type:</strong> {appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1)}</span>
                    </div>
                    {appointment.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <strong>Notes:</strong> {appointment.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-center sm:self-auto">
                  <Badge variant={getStatusColor(appointment.status)}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </Badge>
                  
                  {appointment.status === 'scheduled' && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(appointment, 'completed')}
                        title="Mark as completed"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(appointment, 'cancelled')}
                        title="Cancel appointment"
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAppointment(appointment)}
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

      {/* View Appointment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-full sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Patient</Label>
                  <p className="font-medium">{selectedAppointment.patientName}</p>
                </div>
                <div>
                  <Label>Therapist</Label>
                  <p className="font-medium">{selectedAppointment.therapistName}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <p>{new Date(selectedAppointment.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Time</Label>
                  <p>{selectedAppointment.time}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duration</Label>
                  <p>{selectedAppointment.duration} minutes</p>
                </div>
                <div>
                  <Label>Type</Label>
                  <p>{selectedAppointment.type.charAt(0).toUpperCase() + selectedAppointment.type.slice(1)}</p>
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Badge variant={getStatusColor(selectedAppointment.status)}>
                  {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                </Badge>
              </div>

              {selectedAppointment.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="whitespace-pre-wrap">{selectedAppointment.notes}</p>
                </div>
              )}

              {selectedAppointment.treatmentProvided && (
                <div>
                  <Label>Treatment Provided</Label>
                  <p className="whitespace-pre-wrap">{selectedAppointment.treatmentProvided}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <Label>Created</Label>
                  <p>{new Date(selectedAppointment.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p>{new Date(selectedAppointment.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-full sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editDate">Date</Label>
                  <Input
                    id="editDate"
                    type="date"
                    value={selectedAppointment.date}
                    onChange={(e) => setSelectedAppointment({ ...selectedAppointment, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="editTime">Time</Label>
                  <Input
                    id="editTime"
                    type="time"
                    value={selectedAppointment.time}
                    onChange={(e) => setSelectedAppointment({ ...selectedAppointment, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editDuration">Duration (minutes)</Label>
                  <Select 
                    value={selectedAppointment.duration.toString()} 
                    onValueChange={(value) => setSelectedAppointment({ ...selectedAppointment, duration: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editStatus">Status</Label>
                  <Select 
                    value={selectedAppointment.status} 
                    onValueChange={(value: any) => setSelectedAppointment({ ...selectedAppointment, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no-show">No Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="editNotes">Notes</Label>
                <Textarea
                  id="editNotes"
                  value={selectedAppointment.notes || ''}
                  onChange={(e) => setSelectedAppointment({ ...selectedAppointment, notes: e.target.value })}
                  rows={3}
                />
              </div>

              {selectedAppointment.status === 'completed' && (
                <div>
                  <Label htmlFor="treatmentProvided">Treatment Provided</Label>
                  <Textarea
                    id="treatmentProvided"
                    value={selectedAppointment.treatmentProvided || ''}
                    onChange={(e) => setSelectedAppointment({ ...selectedAppointment, treatmentProvided: e.target.value })}
                    placeholder="Describe the treatment provided during this session"
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditAppointment}>Update Appointment</Button>
          </div>
        </DialogContent>
      </Dialog>

      {filteredAppointments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No appointments found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "No appointments match your search criteria" : `No appointments scheduled for ${new Date(selectedDate).toLocaleDateString()}`}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Appointment
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}