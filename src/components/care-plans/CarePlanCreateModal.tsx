import React, { useState } from 'react';
import { Patient, TaskType } from '../../types';
import { Modal } from '../ui/Modal';
import { PlusCircle, Calendar } from 'lucide-react';

interface CarePlanCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  onCreate: (data: {
    patientId: string;
    doctorId: string;
    title: string;
    diagnosis: string;
    taskTitle: string;
    taskType: TaskType;
    deadlineDays: number;
    fastingRequired: boolean;
    partnerFacility: string;
    instructions: string;
  }) => void;
}

export const CarePlanCreateModal: React.FC<CarePlanCreateModalProps> = ({
  isOpen,
  onClose,
  patients,
  onCreate
}) => {
  const [patientId, setPatientId] = useState(patients[0]?.id || 'patient-1');
  const [taskTitle, setTaskTitle] = useState('HbA1c Blood Test');
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [instructions, setInstructions] = useState(
    'Fasting blood draw. Do not eat or drink anything except water for 8 hours before the test.'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === patientId) || patients[0];
    
    onCreate({
      patientId,
      doctorId: 'user-doctor-1',
      title: `${taskTitle} Follow-Up`,
      diagnosis: patient.primaryDiagnosis,
      taskTitle,
      taskType: 'Lab Test',
      deadlineDays,
      fastingRequired: instructions.toLowerCase().includes('fasting'),
      partnerFacility: 'MetroPath Central Clinic',
      instructions
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Care Plan"
      subtitle="Assign a required test or follow-up for a patient"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Patient */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Patient
          </label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.fullName} ({p.mrn}) — {p.primaryDiagnosis}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Required Test or Referral */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Required Test or Referral
          </label>
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            required
            placeholder="e.g. HbA1c Blood Test, Lipid Panel, Cardiology Follow-up"
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* 3. Due Date */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Due In
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={90}
              value={deadlineDays}
              onChange={(e) => setDeadlineDays(Number(e.target.value))}
              className="w-24 text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-teal-500"
            />
            <span className="text-xs text-slate-600 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              days from today
            </span>
          </div>
        </div>

        {/* 4. Instructions */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Instructions for Patient
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
            placeholder="e.g. 8-hour fasting required. Visit nearest laboratory."
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Care Plan</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
