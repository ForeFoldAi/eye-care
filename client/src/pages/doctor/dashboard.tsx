import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PrescriptionFormModal } from "@/components/modals/prescription-form";
import { getCurrentUser } from "@/lib/auth";
import { APPOINTMENT_STATUS } from "@/lib/constants";
import {
  Calendar,
  Users,
  FileText,
  Clock,
  CalendarPlus,
  UserPlus,
  BarChart3,
  CheckCircle
} from "lucide-react";

export default function DoctorDashboard() {
  const user = getCurrentUser();
  const today = new Date().toISOString().split('T')[0];

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: todayAppointments = [] } = useQuery({
    queryKey: ["/api/appointments", { doctorId: user?.id, date: today }],
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ["/api/appointments", { doctorId: user?.id }],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case APPOINTMENT_STATUS.CONFIRMED:
        return "bg-green-100 text-green-800";
      case APPOINTMENT_STATUS.WAITING:
        return "bg-yellow-100 text-yellow-800";
      case APPOINTMENT_STATUS.IN_PROGRESS:
        return "bg-blue-100 text-blue-800";
      case APPOINTMENT_STATUS.COMPLETED:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case APPOINTMENT_STATUS.CONFIRMED:
        return "Confirmed";
      case APPOINTMENT_STATUS.WAITING:
        return "Waiting";
      case APPOINTMENT_STATUS.IN_PROGRESS:
        return "In Progress";
      case APPOINTMENT_STATUS.COMPLETED:
        return "Completed";
      case APPOINTMENT_STATUS.SCHEDULED:
        return "Scheduled";
      default:
        return status;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="ml-64 flex-1">
        <Header title="Doctor Dashboard" />
        
        <main className="p-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Calendar className="h-6 w-6 text-medical-blue" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Today's Appointments</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats?.todayAppointments || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Users className="h-6 w-6 text-medical-green" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Patients</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats?.totalPatients || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Prescriptions</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats?.prescriptions || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-amber-100 rounded-full">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pending Reviews</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats?.pendingReviews || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Schedule and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayAppointments.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No appointments today</p>
                  ) : (
                    todayAppointments.map((appointment: any) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-medical-blue rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {getInitials(appointment.patient.firstName, appointment.patient.lastName)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {appointment.patient.firstName} {appointment.patient.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{appointment.reason || "Regular Checkup"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{appointment.appointmentTime}</p>
                          <Badge className={getStatusColor(appointment.status)}>
                            {getStatusLabel(appointment.status)}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                  
                  <Button variant="outline" className="w-full border-medical-blue text-medical-blue hover:bg-blue-50">
                    View All Appointments
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <PrescriptionFormModal
                    trigger={
                      <Button className="w-full justify-start bg-blue-50 hover:bg-blue-100 text-gray-900 border-0">
                        <FileText className="mr-3 h-4 w-4 text-medical-blue" />
                        Write Prescription
                      </Button>
                    }
                  />

                  <Button className="w-full justify-start bg-green-50 hover:bg-green-100 text-gray-900 border-0">
                    <CalendarPlus className="mr-3 h-4 w-4 text-medical-green" />
                    Set Availability
                  </Button>

                  <Button className="w-full justify-start bg-purple-50 hover:bg-purple-100 text-gray-900 border-0">
                    <UserPlus className="mr-3 h-4 w-4 text-purple-600" />
                    View Patients
                  </Button>

                  <Button className="w-full justify-start bg-amber-50 hover:bg-amber-100 text-gray-900 border-0">
                    <BarChart3 className="mr-3 h-4 w-4 text-amber-600" />
                    Generate Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map((activity: any) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-medical-green" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">
                          {activity.patient.firstName} {activity.patient.lastName}
                        </span>{" "}
                        appointment {activity.status === APPOINTMENT_STATUS.COMPLETED ? "completed" : "scheduled"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
