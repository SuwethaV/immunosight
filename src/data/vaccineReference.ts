export interface VaccineReferenceItem {
  code: string;
  name: string;
  targetDisease: string;
  recommendedAge: string;
  doses: number;
  whoTarget: number;
  description: string;
}

export const VACCINE_REFERENCE: VaccineReferenceItem[] = [
  { code: 'DTP3', name: 'Diphtheria, Tetanus, Pertussis (3rd dose)', targetDisease: 'Diphtheria, Tetanus, Pertussis', recommendedAge: '14 weeks', doses: 3, whoTarget: 90, description: 'Core global health proxy for routine childhood immunization system reach and performance.' },
  { code: 'MCV1', name: 'Measles-Containing Vaccine (1st dose)', targetDisease: 'Measles', recommendedAge: '9-12 months', doses: 1, whoTarget: 95, description: 'Critical safeguard against explosive measles outbreaks among infants; requires 95% herd immunity.' },
  { code: 'MCV2', name: 'Measles-Containing Vaccine (2nd dose)', targetDisease: 'Measles', recommendedAge: '15-18 months', doses: 2, whoTarget: 95, description: 'Second opportunity dose to induce immunity in children who failed to seroconvert on dose 1.' },
  { code: 'BCG', name: 'Bacille Calmette-Guérin', targetDisease: 'Tuberculosis', recommendedAge: 'At birth', doses: 1, whoTarget: 90, description: 'Administered at birth to protect newborns from severe childhood tuberculous meningitis.' },
  { code: 'Pol3', name: 'Polio (3rd dose)', targetDisease: 'Poliomyelitis', recommendedAge: '14 weeks', doses: 3, whoTarget: 90, description: 'Third oral or inactivated polio dose vital for global eradication and paralysis prevention.' },
  { code: 'HepB3', name: 'Hepatitis B (3rd dose)', targetDisease: 'Hepatitis B', recommendedAge: '14 weeks', doses: 3, whoTarget: 90, description: 'Prevents chronic liver disease and primary liver cancer stemming from childhood exposure.' },
  { code: 'Hib3', name: 'Haemophilus Influenzae type b (3rd dose)', targetDisease: 'Meningitis, Pneumonia', recommendedAge: '14 weeks', doses: 3, whoTarget: 90, description: 'Protects infants against severe bacterial meningitis, epiglottitis, and sepsis.' },
  { code: 'PCV3', name: 'Pneumococcal Conjugate Vaccine (3rd dose)', targetDisease: 'Pneumococcal Pneumonia', recommendedAge: '14 weeks', doses: 3, whoTarget: 90, description: 'Combats leading infectious killer of children under five: acute bacterial pneumonia.' },
  { code: 'RotaC', name: 'Rotavirus (Complete series)', targetDisease: 'Rotaviral Diarrhea', recommendedAge: '10-14 weeks', doses: 2, whoTarget: 90, description: 'Prevents fatal dehydrating rotaviral gastroenteritis in infants and young children.' },
  { code: 'RCV1', name: 'Rubella-Containing Vaccine (1st dose)', targetDisease: 'Rubella & Congenital Rubella Syndrome', recommendedAge: '9-12 months', doses: 1, whoTarget: 90, description: 'Prevents congenital birth defects, blindness, and deafness due to maternal rubella infection.' }
];

