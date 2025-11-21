import { create } from 'zustand';

interface Medication {
  id: number;
  category: string;
  hospital: string;
  frequency: number;
  startDate: string;
  timePeriods?: string[];
}

interface MedicationState {
  medications: Medication[];
  selectedMedication: Medication | null;
  setMedications: (medications: Medication[]) => void;
  addMedication: (medication: Medication) => void;
  updateMedication: (id: number, updates: Partial<Medication>) => void;
  deleteMedication: (id: number) => void;
  setSelectedMedication: (medication: Medication | null) => void;
}

export const useMedicationStore = create<MedicationState>((set) => ({
  medications: [],
  selectedMedication: null,
  setMedications: (medications) => {
    set({ medications });
  },
  addMedication: (medication) => {
    set((state) => ({
      medications: [...state.medications, medication],
    }));
  },
  updateMedication: (id, updates) => {
    set((state) => ({
      medications: state.medications.map((med) =>
        med.id === id ? { ...med, ...updates } : med
      ),
    }));
  },
  deleteMedication: (id) => {
    set((state) => ({
      medications: state.medications.filter((med) => med.id !== id),
      selectedMedication:
        state.selectedMedication?.id === id
          ? null
          : state.selectedMedication,
    }));
  },
  setSelectedMedication: (medication) => {
    set({ selectedMedication: medication });
  },
}));

