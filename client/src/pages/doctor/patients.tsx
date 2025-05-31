import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PrescriptionFormModal } from "@/components/modals/prescription-form";
import { Search, User, Phone, Mail, Calendar, Heart } from "lucide-react";

export default function DoctorPatients() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["/api/patients", { search: searchQuery }],
  });

  const { data: prescriptions = [] } = useQuery({
    queryKey: ["/api/prescriptions"],
  });

  const getPatientPrescriptions = (patientId: number) => {
    return prescriptions.filter((rx: any) => rx.patientId === patientId);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="ml-64 flex-1">
        <Header title="Patients" />
        
        <main className="p-6">
          {/* Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, phone, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Patients List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isLoading ? (
              <div className="col-span-2 text-center py-8">Loading patients...</div>
            ) : patients.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-gray-500">
                {searchQuery ? "No patients found matching your search" : "No patients found"}
              </div>
            ) : (
              patients.map((patient: any) => (
                <Card key={patient.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 bg-medical-blue rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {getInitials(patient.firstName, patient.lastName)}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {patient.firstName} {patient.lastName}
                          </CardTitle>
                          <p className="text-sm text-gray-500">{patient.patientId}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <PrescriptionFormModal
                          patientId={patient.id}
                          trigger={
                            <Button size="sm" className="bg-medical-blue hover:bg-blue-600">
                              Prescribe
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Patient Info */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{calculateAge(patient.dateOfBirth)} years, {patient.gender}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{patient.phone}</span>
                        </div>
                        {patient.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{patient.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{new Date(patient.dateOfBirth).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Blood Type */}
                      {patient.bloodType && (
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span className="text-sm">Blood Type: </span>
                          <Badge variant="outline" className="text-xs">
                            {patient.bloodType}
                          </Badge>
                        </div>
                      )}

                      {/* Allergies */}
                      {patient.allergies && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Allergies:</p>
                          <p className="text-sm text-gray-600 bg-red-50 p-2 rounded">
                            {patient.allergies}
                          </p>
                        </div>
                      )}

                      {/* Medical History */}
                      {patient.medicalHistory && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Medical History:</p>
                          <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                            {patient.medicalHistory}
                          </p>
                        </div>
                      )}

                      {/* Recent Prescriptions */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Recent Prescriptions ({getPatientPrescriptions(patient.id).length})
                        </p>
                        {getPatientPrescriptions(patient.id).length === 0 ? (
                          <p className="text-xs text-gray-500">No prescriptions yet</p>
                        ) : (
                          <div className="space-y-1">
                            {getPatientPrescriptions(patient.id).slice(0, 2).map((rx: any) => (
                              <div key={rx.id} className="text-xs text-gray-600 bg-green-50 p-2 rounded">
                                {new Date(rx.createdAt).toLocaleDateString()} - {JSON.parse(rx.medications).length} medication(s)
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Emergency Contact */}
                      {patient.emergencyContactName && (
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700">Emergency Contact:</p>
                          <p className="text-xs text-gray-600">
                            {patient.emergencyContactName} ({patient.emergencyContactRelation})
                            {patient.emergencyContactPhone && ` - ${patient.emergencyContactPhone}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
