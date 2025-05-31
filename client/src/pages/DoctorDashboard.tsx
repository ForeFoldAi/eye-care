import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import PrescriptionModal from "@/components/PrescriptionModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Users, 
  FileText, 
  DollarSign,
  Search,
  CalendarPlus,
  BarChart3,
  TrendingUp
} from "lucide-react";

export default function DoctorDashboard() {
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: appointments } = useQuery({
    queryKey: ['/api/appointments'],
  });

  const { data: prescriptions } = useQuery({
    queryKey: ['/api/prescriptions'],
  });

  const { data: patients } = useQuery({
    queryKey: ['/api/patients'],
  });

  const statsCards = [
    {
      title: "Today's Appointments",
      value: stats?.todayAppointments || 0,
      icon: Calendar,
      color: "text-medical-blue-600",
      bgColor: "bg-medical-blue-100",
      trend: "+8% from yesterday",
      trendColor: "text-medical-green-500"
    },
    {
      title: "Total Patients",
      value: stats?.totalPatients || 0,
      icon: Users,
      color: "text-medical-green-600",
      bgColor: "bg-medical-green-100",
      trend: "+12 new patients",
      trendColor: "text-medical-green-500"
    },
    {
      title: "Active Prescriptions",
      value: stats?.prescriptions || 0,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      trend: "This week",
      trendColor: "text-medical-green-500"
    },
    {
      title: "Patient Satisfaction",
      value: "98%",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
      trend: "+2% this month",
      trendColor: "text-medical-green-500"
    }
  ];

  const quickActions = [
    {
      title: "Search Patient",
      description: "Find patient records quickly",
      icon: Search,
      color: "bg-medical-blue-50 hover:bg-medical-blue-100",
      iconColor: "bg-medical-blue-500",
      action: () => {},
    },
    {
      title: "Write Prescription",
      description: "Create new prescription",
      icon: FileText,
      color: "bg-medical-green-50 hover:bg-medical-green-100",
      iconColor: "bg-medical-green-500",
      action: () => setShowPrescriptionModal(true),
    },
    {
      title: "Set Availability",
      description: "Update your schedule",
      icon: CalendarPlus,
      color: "bg-blue-50 hover:bg-blue-100",
      iconColor: "bg-blue-500",
      action: () => {},
    },
    {
      title: "View Reports",
      description: "Patient analytics & insights",
      icon: BarChart3,
      color: "bg-purple-50 hover:bg-purple-100",
      iconColor: "bg-purple-500",
      action: () => {},
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-medical-green-100 text-medical-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPatientInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <ProtectedRoute requiredRole="doctor">
      {(user) => (
        <Layout user={user}>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="border border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className={`text-sm font-medium ${stat.trendColor}`}>
                        {stat.trend}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Today's Appointments */}
            <Card className="border border-gray-100">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Today's Appointments
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-medical-blue-500 hover:text-medical-blue-600">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {appointments?.slice(0, 3).map((appointment: any) => (
                    <div key={appointment.id} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-b-0">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {patients?.find((p: any) => p.id === appointment.patientId) 
                              ? getPatientInitials(
                                  patients.find((p: any) => p.id === appointment.patientId).firstName,
                                  patients.find((p: any) => p.id === appointment.patientId).lastName
                                )
                              : 'UN'
                            }
                          </span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {patients?.find((p: any) => p.id === appointment.patientId)
                              ? `${patients.find((p: any) => p.id === appointment.patientId).firstName} ${patients.find((p: any) => p.id === appointment.patientId).lastName}`
                              : 'Unknown Patient'
                            }
                          </p>
                          <p className="text-xs text-gray-500">{appointment.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(appointment.datetime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {!appointments?.length && (
                    <p className="text-gray-500 text-center py-8">No appointments scheduled for today</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border border-gray-100">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      className={`w-full flex items-center p-4 ${action.color} transition-colors h-auto`}
                      onClick={action.action}
                    >
                      <div className={`w-10 h-10 ${action.iconColor} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-4 text-left">
                        <p className="text-sm font-medium text-gray-900">{action.title}</p>
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </div>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Recent Prescriptions */}
          <Card className="mt-8 border border-gray-100">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Recent Prescriptions</CardTitle>
                <Button variant="ghost" size="sm" className="text-medical-blue-500 hover:text-medical-blue-600">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Medication
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dosage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {prescriptions?.slice(0, 5).map((prescription: any) => (
                      <tr key={prescription.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">
                                {patients?.find((p: any) => p.id === prescription.patientId) 
                                  ? getPatientInitials(
                                      patients.find((p: any) => p.id === prescription.patientId).firstName,
                                      patients.find((p: any) => p.id === prescription.patientId).lastName
                                    )
                                  : 'UN'
                                }
                              </span>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {patients?.find((p: any) => p.id === prescription.patientId)
                                  ? `${patients.find((p: any) => p.id === prescription.patientId).firstName} ${patients.find((p: any) => p.id === prescription.patientId).lastName}`
                                  : 'Unknown Patient'
                                }
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {prescription.medication}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {prescription.dosage}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(prescription.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={prescription.isActive ? 'bg-medical-green-100 text-medical-green-800' : 'bg-gray-100 text-gray-800'}>
                            {prescription.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {!prescriptions?.length && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No prescriptions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Prescription Modal */}
          {showPrescriptionModal && (
            <PrescriptionModal
              isOpen={showPrescriptionModal}
              onClose={() => setShowPrescriptionModal(false)}
            />
          )}
        </Layout>
      )}
    </ProtectedRoute>
  );
}
