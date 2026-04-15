export interface AssessmentForm {
  // Body stats — used for adjustments / BMI, not directly scored
  age?:         number;
  height?:      number;  // cm
  weight?:      number;  // kg

  // Strength
  pushups?:     number;
  pullups?:     number;
  squats?:      number;

  // Core & Endurance
  plank?:       number;  // seconds
  situps?:      number;  // reps in 1 min
  jogTime?:     number;  // minutes per 1 km

  // Flexibility & Recovery
  flexibility?: number;  // sit-and-reach, cm
  restingHR?:   number;  // beats per minute
}
