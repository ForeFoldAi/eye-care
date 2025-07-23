import { Router } from 'express';
import { Appointment, DoctorAvailability } from '../models';
import { insertAppointmentSchema } from '../shared/schema';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';
import { enforceTenantIsolation, buildTenantFilter, TenantRequest } from '../middleware/tenant';
import { createAuditLogger, SecurityEvents } from '../utils/audit';
import mongoose from 'mongoose';
//new
interface TimeSlot {
  startTime: string;
  endTime: string;
  hoursAvailable: number;
  tokenCount: number;
  bookedTokens: number[];
}

const router = Router();

// Apply tenant middleware to all routes
router.use(enforceTenantIsolation);

// Get all appointments (tenant-isolated)
router.get('/', authenticateToken, async (req: TenantRequest, res) => {
  const auditLogger = createAuditLogger(req);
  
  try {
    const { doctorId, patientId, date, status, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    console.log('Query params:', { doctorId, patientId, date, status });
    
    const tenantFilter = buildTenantFilter(req);
    let query = Appointment.find(tenantFilter);

    // Apply filters
    if (doctorId) {
      query = query.where('doctorId', doctorId);
    }
    if (patientId) {
      query = query.where('patientId', patientId);
    }
    if (status) {
      query = query.where('status', status);
    }
    if (date) {
      const startDate = new Date(date as string);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      console.log('Date filter:', { startDate, endDate });
      query = query.where({
        datetime: {
          $gte: startDate,
          $lt: endDate
        }
      });
    } else {
      // Show all upcoming appointments by default
      const now = new Date();
      console.log('Default date filter - showing appointments from:', now);
      query = query.where({
        datetime: {
          $gte: now
        }
      });
    }

    // Debug: Log the raw query before population
    console.log('MongoDB query:', query.getFilter());

    // Populate related data
    query = query
      .populate('patientId', 'firstName lastName phone email')
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ datetime: 1 })
      .skip(skip)
      .limit(Number(limit));

    const [appointments, total] = await Promise.all([
      query.exec(),
      Appointment.countDocuments(tenantFilter)
    ]);

    console.log('Fetched appointments count:', appointments.length);
    console.log('Fetched appointments:', JSON.stringify(appointments, null, 2));

    await auditLogger.logRead('appointment', {
      filters: { doctorId, patientId, date, status },
      page: Number(page),
      limit: Number(limit),
      totalResults: appointments.length,
      totalCount: total
    });

    res.json({
      data: appointments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await auditLogger.logError('READ', 'appointment', { error: errorMessage }, 'Error fetching appointments');
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

// Get appointment by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'firstName lastName phone email')
      .populate('doctorId', 'firstName lastName specialization');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ message: 'Error fetching appointment' });
  }
});

// Create new appointment
router.post('/', authenticateToken, authorizeRole(['receptionist']), async (req: AuthRequest, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const appointmentData = insertAppointmentSchema.parse(req.body);
    
    // Check doctor availability
    const appointmentDate = new Date(appointmentData.datetime);
    const dayOfWeek = appointmentDate.getDay();
    const time = appointmentDate.toTimeString().slice(0, 5); // Get HH:mm format

    const availability = await DoctorAvailability.findOne({
      doctorId: appointmentData.doctorId,
      dayOfWeek,
      'slots.startTime': { $lte: time },
      'slots.endTime': { $gte: time }
    });

    if (!availability) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Doctor is not available at this time' });
    }

    // Find the specific time slot
    const timeSlot = availability.slots.find(
      (slot: TimeSlot) => slot.startTime <= time && slot.endTime >= time
    );

    if (!timeSlot) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Time slot not found' });
    }

    // Check if token is available
    if (timeSlot.bookedTokens.includes(appointmentData.tokenNumber)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Token number is already booked' });
    }

    // Check if token number is valid
    if (appointmentData.tokenNumber < 1 || appointmentData.tokenNumber > timeSlot.tokenCount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid token number' });
    }

    // Create the appointment
    const appointment = new Appointment({
      ...appointmentData,
      status: 'scheduled'
    });
    await appointment.save({ session });

    // Update the doctor's availability to mark the token as booked
    const updateResult = await DoctorAvailability.updateOne(
      {
        _id: availability._id,
        'slots.startTime': timeSlot.startTime,
        'slots.endTime': timeSlot.endTime
      },
      {
        $push: { 'slots.$.bookedTokens': appointmentData.tokenNumber }
      },
      { session }
    );

    if (updateResult.modifiedCount === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({ message: 'Failed to update doctor availability' });
    }

    await session.commitTransaction();
    session.endSession();

    // Return populated appointment
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'firstName lastName phone email')
      .populate('doctorId', 'firstName lastName specialization');
    
    res.status(201).json(populatedAppointment);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('Error creating appointment:', error);
    if (error instanceof Error) {
      if (error.name === 'ValidationError') {
        res.status(400).json({ message: error.message });
      } else if (error.name === 'MongoServerError' && error.message.includes('duplicate key')) {
        res.status(400).json({ message: 'This token is already booked for this time slot' });
      } else {
        res.status(500).json({ message: 'Error creating appointment' });
      }
    } else {
      res.status(500).json({ message: 'Error creating appointment' });
    }
  }
});

// Update appointment status
router.patch('/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
    .populate('patientId', 'firstName lastName phone email')
    .populate('doctorId', 'firstName lastName specialization');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    res.json(appointment);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ message: 'Error updating appointment status' });
  }
});

// Update appointment (status, approved, followUpDate)
router.patch('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status, approved, followUpDate } = req.body;
    const updateFields: any = {};
    if (status) updateFields.status = status;
    if (typeof approved !== 'undefined') updateFields.approved = approved;
    if (followUpDate) updateFields.followUpDate = followUpDate;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    )
      .populate('patientId', 'firstName lastName phone email')
      .populate('doctorId', 'firstName lastName specialization');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Error updating appointment' });
  }
});

// Update appointment
router.put('/:id', authenticateToken, authorizeRole(['receptionist']), async (req: AuthRequest, res) => {
  try {
    const appointmentData = insertAppointmentSchema.parse(req.body);
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      appointmentData,
      { new: true }
    ).populate('patientId', 'firstName lastName phone')
     .populate('doctorId', 'firstName lastName specialization');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(400).json({ message: 'Invalid request data' });
  }
});

// Delete appointment
router.delete('/:id', authenticateToken, authorizeRole(['receptionist']), async (req: AuthRequest, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting appointment' });
  }
});

export default router; 