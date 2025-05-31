import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PrescriptionFormModal } from "@/components/modals/prescription-form";
import { getCurrentUser } from "@/lib/auth";
import { Search, FileText, User, Calendar, Pill } from "lucide-react";

export default function DoctorPrescriptions() {
  const [searchQuery, setSearchQuery] = useState("");
  const user = getCurrentUser();

  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ["/api/prescriptions", { doctorId: user?.id }],
  });

  const filteredPrescriptions = prescriptions.filter((prescription: any) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      prescription.patient.firstName.toLowerCase().includes(searchLower) ||
      prescription.patient.lastName.toLowerCase().includes(searchLower) ||
      prescription.patient.patientId.toLowerCase().includes(searchLower) ||
      prescription.medications.toLowerCase().includes(searchLower)
    );
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const parseMedications = (medicationsJson: string) => {
    try {
      return JSON.parse(medicationsJson);
    } catch {
      return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="ml-64 flex-1">
        <Header 
          title="Prescriptions" 
          action={<PrescriptionFormModal />}
        />
        
        <main className="p-6">
          {/* Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Prescriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by patient name, ID, or medication..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Prescriptions List */}
          {isLoading ? (
            <div className="text-center py-8">Loading prescriptions...</div>
          ) : filteredPrescriptions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchQuery ? "No prescriptions found matching your search" : "No prescriptions yet"}
                </p>
                {!searchQuery && (
                  <PrescriptionFormModal
                    trigger={
                      <Button className="mt-4 bg-medical-blue hover:bg-blue-600">
                        Write First Prescription
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPrescriptions.map((prescription: any) => (
                <Card key={prescription.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="h-12 w-12 bg-medical-blue rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {getInitials(prescription.patient.firstName, prescription.patient.lastName)}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {prescription.patient.firstName} {prescription.patient.lastName}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {prescription.patient.patientId}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>Prescribed: {new Date(prescription.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="h-4 w-4" />
                              <span>Patient Age: {prescription.patient.dateOfBirth ? 
                                new Date().getFullYear() - new Date(prescription.patient.dateOfBirth).getFullYear() : 'N/A'} years</span>
                            </div>
                          </div>

                          {/* Medications */}
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                              <Pill className="h-4 w-4" />
                              Medications
                            </h4>
                            <div className="space-y-2">
                              {parseMedications(prescription.medications).map((med: any, index: number) => (
                                <div key={index} className="bg-blue-50 p-3 rounded-lg">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                    <div>
                                      <span className="font-medium text-gray-700">Name:</span>
                                      <p className="text-gray-900">{med.name}</p>
                                    </div>
                                    <div>
                                      <span className="font-medium text-gray-700">Dosage:</span>
                                      <p className="text-gray-900">{med.dosage}</p>
                                    </div>
                                    <div>
                                      <span className="font-medium text-gray-700">Frequency:</span>
                                      <p className="text-gray-900">{med.frequency}</p>
                                    </div>
                                    <div>
                                      <span className="font-medium text-gray-700">Duration:</span>
                                      <p className="text-gray-900">{med.duration}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Instructions */}
                          {prescription.instructions && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Instructions</h4>
                              <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg">
                                {prescription.instructions}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-medical-blue text-medical-blue hover:bg-blue-50"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
