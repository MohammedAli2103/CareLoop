import { useState, useEffect, useMemo } from 'react';
import { careLoopService } from '../services/mockCareLoopService';
import { UserRole, DashboardStats } from '../types';

export function useCareLoop(activeRole: UserRole, activePatientId = 'patient-1') {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = careLoopService.subscribe(() => {
      setTick(t => t + 1);
    });
    return unsubscribe;
  }, []);

  const users = careLoopService.getUsers();
  const patients = careLoopService.getPatients();
  const carePlans = careLoopService.getCarePlans();
  const allTasks = careLoopService.getTasks();
  const roleTasks = careLoopService.getTasksForRole(activeRole, activePatientId);
  const notifications = careLoopService.getNotifications(activeRole);
  const allNotifications = careLoopService.getNotifications();
  const auditLogs = careLoopService.getAuditLogs();

  const currentPatient = useMemo(() => {
    return patients.find(p => p.id === activePatientId) || patients[0];
  }, [patients, activePatientId]);

  const currentUser = useMemo(() => {
    if (activeRole === 'patient') return users.find(u => u.role === 'patient') || users[0];
    if (activeRole === 'doctor') return users.find(u => u.role === 'doctor') || users[1];
    return users.find(u => u.role === 'coordinator') || users[2];
  }, [users, activeRole]);

  const stats: DashboardStats = useMemo(() => {
    const activePlans = carePlans.filter(p => p.status === 'Active').length;
    const pending = allTasks.filter(t => t.taskStatus === 'Pending').length;
    const inProgress = allTasks.filter(t => t.taskStatus === 'In Progress').length;
    const verified = allTasks.filter(t => t.taskStatus === 'Verified').length;
    const overdue = allTasks.filter(t => t.taskStatus === 'Overdue').length;
    const resolved = allTasks.filter(t => t.taskStatus === 'Resolved').length;

    return {
      activeCarePlans: activePlans,
      pendingTasks: pending,
      upcomingDeadlines: pending + inProgress,
      awaitingVerification: inProgress,
      awaitingDoctorReview: verified,
      overdueTasks: overdue,
      resolvedTasks: resolved
    };
  }, [carePlans, allTasks]);

  return {
    users,
    currentUser,
    patients,
    currentPatient,
    carePlans,
    allTasks,
    roleTasks,
    notifications,
    allNotifications,
    auditLogs,
    stats,
    service: careLoopService
  };
}
