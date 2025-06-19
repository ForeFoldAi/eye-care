import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import PrescriptionModal from "@/components/PrescriptionModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Search,
  FileText,
  Calendar,
  User,
  Plus,
  Download,
  Eye
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { authService } from "@/lib/auth";

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  patientId?: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  quantity?: number;
}

interface Prescription {
  _id: string;
  patientId: string;
  doctorId: string;
  medications: Medication[];
  instructions?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  patient?: Patient;
}

type PatientFilter = 'all' | string;

export default function DoctorPrescriptionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<PatientFilter>("all");
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => authService.getCurrentUser().then(res => res.user),
  });

  const { data: prescriptions = [] } = useQuery<Prescription[]>({
    queryKey: ['/api/prescriptions'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/prescriptions");
      return response.json();
    },
    enabled: !!currentUser?.id,
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/patients");
      return response.json();
    },
  });

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const patient = prescription.patient || patients.find(p => p._id === prescription.patientId);
    
    const matchesSearch = searchQuery === "" || 
      patient?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient?.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.medications.some(med => 
        med.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesPatient = selectedPatientId === "all" || prescription.patientId === selectedPatientId;

    return matchesSearch && matchesPatient;
  });

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p._id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  };

  const handleDownload = async (prescriptionId: string) => {
    try {
      const response = await apiRequest("GET", `/api/prescriptions/${prescriptionId}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription-${prescriptionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
    toast({
        title: "Error",
        description: "Failed to download prescription",
        variant: "destructive",
    });
    }
  };

  const handleView = (prescriptionId: string) => {
    navigate(`/doctor/prescriptions/${prescriptionId}`);
  };

  return (
    <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold">Prescriptions</CardTitle>
                <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Search prescriptions..."
                    className="max-w-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                  />
            <Select
              value={selectedPatientId}
              onValueChange={(value: PatientFilter) => setSelectedPatientId(value)}
            >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by Patient" />
                    </SelectTrigger>
                    <SelectContent>
                <SelectItem value="all">All Patients</SelectItem>
                      {patients.map((patient) => (
                  <SelectItem key={patient._id} value={patient._id}>
                          {patient.firstName} {patient.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => setShowPrescriptionModal(true)} size="sm">
              <FileText className="w-4 h-4 mr-2" /> New Prescription
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
          <div className="space-y-4">
            {filteredPrescriptions.map((prescription) => (
              <div
                key={prescription._id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-medical-blue-200 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-medical-blue-50 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-medical-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {getPatientName(prescription.patientId)}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      {prescription.medications.map((med, index) => (
                        <span key={index}>
                          {med.name} {med.dosage} • {med.frequency}
                          {index < prescription.medications.length - 1 && " | "}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={prescription.isActive ? "default" : "secondary"}
                    className={prescription.isActive ? "bg-green-100 text-green-800" : ""}
                  >
                    {prescription.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(prescription._id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(prescription._id)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ))}

            {filteredPrescriptions.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Prescriptions Found</h3>
                <p className="text-gray-500">
                  {searchQuery || selectedPatientId !== "all"
                    ? "Try adjusting your search or filters"
                    : "Start by creating a new prescription"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showPrescriptionModal && (
          <PrescriptionModal
            isOpen={showPrescriptionModal}
            onClose={() => setShowPrescriptionModal(false)}
            onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
            setShowPrescriptionModal(false);
            toast({
              title: "Success",
              description: "Prescription created successfully",
            });
            }}
          />
      )}
    </div>
  );
}
