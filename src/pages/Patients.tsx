import { useState, useEffect } from "react";
import { Plus, Search, Eye, Edit, Trash2, Phone, Mail, Calendar, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { staffStorage, type Patient } from "@/lib/storage";
import { subscribePatients, addPatient as addPatientFs, updatePatient as updatePatientFs, deletePatient as deletePatientFs } from "@/lib/patientsFirestore";
import { useStorage } from "@/hooks/useStorage";

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const staff = useStorage('mindspire_staff');

  useEffect(() => {
    const unsub = subscribePatients(setPatients);
    return unsub;
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [newPatient, setNewPatient] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    medicalHistory: "",
    currentCondition: "",
    treatmentGoals: "",
    status: "active" as const,
    assignedTherapist: "",
  });

  const therapists = staff.filter((s: any) => s.role === 'therapist' && s.status === 'active');

  const filteredPatients = patients.filter(patient =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  const handleAddPatient = async () => {
    if (!newPatient.firstName || !newPatient.lastName || !newPatient.email) {
      toast.error("Please fill in required fields");
      return;
    }

    await addPatientFs(newPatient);
    toast.success("Patient added successfully");
    setIsAddDialogOpen(false);
    setNewPatient({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      address: "",
      emergencyContact: "",
      emergencyPhone: "",
      medicalHistory: "",
      currentCondition: "",
      treatmentGoals: "",
      status: "active",
      assignedTherapist: "",
    });
  };

  const handleEditPatient = async () => {
    if (!selectedPatient) return;

    await updatePatientFs(selectedPatient.id, selectedPatient);
    toast.success("Patient updated successfully");
    setIsEditDialogOpen(false);
    setSelectedPatient(null);
  };

  const handleDeletePatient = async (patient: Patient) => {
    if (confirm(`Are you sure you want to delete ${patient.firstName} ${patient.lastName}?`)) {
      await deletePatientFs(patient.id);
      toast.success("Patient deleted successfully");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Patients</h1>
          <p className="text-muted-foreground">Manage patient records and information</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newPatient.firstName}
                    onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newPatient.lastName}
                    onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={newPatient.dateOfBirth}
                    onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={newPatient.status} onValueChange={(value: any) => setNewPatient({ ...newPatient, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newPatient.address}
                  onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                  placeholder="Enter full address"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={newPatient.emergencyContact}
                    onChange={(e) => setNewPatient({ ...newPatient, emergencyContact: e.target.value })}
                    placeholder="Contact name"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                  <Input
                    id="emergencyPhone"
                    value={newPatient.emergencyPhone}
                    onChange={(e) => setNewPatient({ ...newPatient, emergencyPhone: e.target.value })}
                    placeholder="Contact phone"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="assignedTherapist">Assigned Therapist</Label>
                <Select value={newPatient.assignedTherapist} onValueChange={(value) => setNewPatient({ ...newPatient, assignedTherapist: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select therapist" />
                  </SelectTrigger>
                  <SelectContent>
                    {therapists.map((therapist: any) => (
                      <SelectItem key={therapist.id} value={`${therapist.firstName} ${therapist.lastName}`}>
                        {therapist.firstName} {therapist.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="medicalHistory">Medical History</Label>
                <Textarea
                  id="medicalHistory"
                  value={newPatient.medicalHistory}
                  onChange={(e) => setNewPatient({ ...newPatient, medicalHistory: e.target.value })}
                  placeholder="Enter medical history"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="currentCondition">Current Condition</Label>
                <Textarea
                  id="currentCondition"
                  value={newPatient.currentCondition}
                  onChange={(e) => setNewPatient({ ...newPatient, currentCondition: e.target.value })}
                  placeholder="Describe current condition"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="treatmentGoals">Treatment Goals</Label>
                <Textarea
                  id="treatmentGoals"
                  value={newPatient.treatmentGoals}
                  onChange={(e) => setNewPatient({ ...newPatient, treatmentGoals: e.target.value })}
                  placeholder="Enter treatment goals"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPatient}>Add Patient</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Patients</p>
                <p className="text-2xl font-bold">{patients.length}</p>
              </div>
              <UserCheck className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{patients.filter(p => p.status === 'active').length}</p>
              </div>
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{patients.filter(p => p.status === 'completed').length}</p>
              </div>
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">
                  {patients.filter(p => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(p.createdAt) > weekAgo;
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search patients by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Patients List */}
      <div className="grid gap-4">
        {filteredPatients.map((patient) => (
          <Card key={patient.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <UserCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {patient.firstName} {patient.lastName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {patient.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {patient.phone}
                      </div>
                      {patient.dateOfBirth && (
                        <span>Age: {calculateAge(patient.dateOfBirth)}</span>
                      )}
                    </div>
                    {patient.currentCondition && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <strong>Condition:</strong> {patient.currentCondition}
                      </p>
                    )}
                    {patient.assignedTherapist && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Therapist:</strong> {patient.assignedTherapist}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:self-auto self-start">
                  <Badge variant={getStatusColor(patient.status)}>
                    {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPatient(patient);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPatient(patient);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePatient(patient)}
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

      {/* View Patient Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={getStatusColor(selectedPatient.status)}>
                    {selectedPatient.status.charAt(0).toUpperCase() + selectedPatient.status.slice(1)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <p>{selectedPatient.email}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p>{selectedPatient.phone}</p>
                </div>
              </div>

              {selectedPatient.dateOfBirth && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date of Birth</Label>
                    <p>{new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>Age</Label>
                    <p>{calculateAge(selectedPatient.dateOfBirth)} years</p>
                  </div>
                </div>
              )}

              {selectedPatient.address && (
                <div>
                  <Label>Address</Label>
                  <p>{selectedPatient.address}</p>
                </div>
              )}

              {(selectedPatient.emergencyContact || selectedPatient.emergencyPhone) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Emergency Contact</Label>
                    <p>{selectedPatient.emergencyContact}</p>
                  </div>
                  <div>
                    <Label>Emergency Phone</Label>
                    <p>{selectedPatient.emergencyPhone}</p>
                  </div>
                </div>
              )}

              {selectedPatient.assignedTherapist && (
                <div>
                  <Label>Assigned Therapist</Label>
                  <p>{selectedPatient.assignedTherapist}</p>
                </div>
              )}

              {selectedPatient.medicalHistory && (
                <div>
                  <Label>Medical History</Label>
                  <p className="whitespace-pre-wrap">{selectedPatient.medicalHistory}</p>
                </div>
              )}

              {selectedPatient.currentCondition && (
                <div>
                  <Label>Current Condition</Label>
                  <p className="whitespace-pre-wrap">{selectedPatient.currentCondition}</p>
                </div>
              )}

              {selectedPatient.treatmentGoals && (
                <div>
                  <Label>Treatment Goals</Label>
                  <p className="whitespace-pre-wrap">{selectedPatient.treatmentGoals}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <Label>Created</Label>
                  <p>{new Date(selectedPatient.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p>{new Date(selectedPatient.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    value={selectedPatient.firstName}
                    onChange={(e) => setSelectedPatient({ ...selectedPatient, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    value={selectedPatient.lastName}
                    onChange={(e) => setSelectedPatient({ ...selectedPatient, lastName: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    value={selectedPatient.email}
                    onChange={(e) => setSelectedPatient({ ...selectedPatient, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="editPhone">Phone</Label>
                  <Input
                    id="editPhone"
                    value={selectedPatient.phone}
                    onChange={(e) => setSelectedPatient({ ...selectedPatient, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editStatus">Status</Label>
                  <Select value={selectedPatient.status} onValueChange={(value: any) => setSelectedPatient({ ...selectedPatient, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editTherapist">Assigned Therapist</Label>
                  <Select value={selectedPatient.assignedTherapist} onValueChange={(value) => setSelectedPatient({ ...selectedPatient, assignedTherapist: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {therapists.map((therapist: any) => (
                        <SelectItem key={therapist.id} value={`${therapist.firstName} ${therapist.lastName}`}>
                          {therapist.firstName} {therapist.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="editCurrentCondition">Current Condition</Label>
                <Textarea
                  id="editCurrentCondition"
                  value={selectedPatient.currentCondition}
                  onChange={(e) => setSelectedPatient({ ...selectedPatient, currentCondition: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="editTreatmentGoals">Treatment Goals</Label>
                <Textarea
                  id="editTreatmentGoals"
                  value={selectedPatient.treatmentGoals}
                  onChange={(e) => setSelectedPatient({ ...selectedPatient, treatmentGoals: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPatient}>Update Patient</Button>
          </div>
        </DialogContent>
      </Dialog>

      {filteredPatients.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No patients found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "No patients match your search criteria" : "Get started by adding your first patient"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Patient
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}