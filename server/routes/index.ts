import express from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import hospitalRoutes from './hospitals';
import subscriptionRoutes from './subscription-plans';
import supportRoutes from './support';
import knowledgeBaseRoutes from './knowledge-base';
import billingRoutes from './billing';
import financialRoutes from './financial';
import patientRoutes from './patients';
import paymentRoutes from './payments';
import appointmentRoutes from './appointments';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/hospitals', hospitalRoutes);
router.use('/subscription-plans', subscriptionRoutes);
router.use('/support', supportRoutes);
router.use('/knowledge-base', knowledgeBaseRoutes);
router.use('/billing', billingRoutes);
router.use('/financial', financialRoutes);
router.use('/patients', patientRoutes);
router.use('/payments', paymentRoutes);
router.use('/appointments', appointmentRoutes);

export default router; 