import React from 'react';
import { Medication } from '../types';
import MedicationCard from './MedicationCard';

interface MedicationListProps {
  medications: Medication[];
  onDeleteMedication: (id: string) => void;
  onEditMedication: (med: Medication) => void;
  onUpdateMedication: (med: Medication) => void;
  onShowHistory: (med: Medication) => void;
}

const MedicationList: React.FC<MedicationListProps> = ({ medications, onDeleteMedication, onEditMedication, onUpdateMedication, onShowHistory }) => {
  const sortedMedications = [...medications].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  
  if (medications.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedMedications.map(med => (
        <MedicationCard
          key={med.id}
          medication={med}
          onDelete={onDeleteMedication}
          onEdit={onEditMedication}
          onUpdate={onUpdateMedication}
          onShowHistory={onShowHistory}
        />
      ))}
    </div>
  );
};

export default MedicationList;