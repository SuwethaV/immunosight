import { DecisionSupportThresholds } from '../types';

/**
 * IMMUNOSIGHT AI - Decision Support Configuration Module
 * 
 * IMPORTANT DISCLAIMER:
 * These thresholds are configurable analytical heuristics designed for research demonstration
 * and decision-support simulation. They should NOT be presented or construed as official WHO 
 * or UNICEF standard policy mandates, nor as medical diagnoses.
 */
export const DEFAULT_THRESHOLDS: DecisionSupportThresholds = {
  // Below this coverage level triggers HIGH risk classification
  highRiskCoverage: 70.0,
  
  // Between highRiskCoverage and targetCoverage is classified as MEDIUM risk
  mediumRiskCoverage: 89.9,
  
  // Standard target coverage benchmark (e.g. WHO global 90% target)
  targetCoverage: 90.0,
  
  // Drop of this many percentage points between latest observed and forecast triggers critical alarm
  criticalDeclineThreshold: 3.0,
  
  // Moderate decline drop threshold
  moderateDeclineThreshold: 1.0,
};

export interface RecommendationTemplate {
  ruleId: string;
  conditionDescription: string;
  priority: 'Immediate Intervention' | 'Targeted Outreach' | 'Routine Monitoring' | 'Sustain Coverage';
  actionTitle: string;
  actionGuidance: string;
  recommendedChannels: string[];
}

export const RECOMMENDATION_RULES: RecommendationTemplate[] = [
  {
    ruleId: 'RULE_CRITICAL_DROP',
    conditionDescription: 'Forecast projects significant negative drop (> 3% coverage loss)',
    priority: 'Immediate Intervention',
    actionTitle: 'Emergency Immunization Audit & Mobile Catch-Up Operations',
    actionGuidance: 'Forecast projects severe coverage contraction. Prioritize deep-dive logistics audit to identify supply-chain bottlenecks, vaccine stockouts, and cold-chain disruptions. Deploy mobile immunization units to zero-dose populations.',
    recommendedChannels: ['District Cold Chain Audits', 'Zero-Dose Mobile Outreaches', 'Community Health Worker Surge']
  },
  {
    ruleId: 'RULE_LOW_COVERAGE_STAGNANT',
    conditionDescription: 'Coverage remains below critical 70% threshold with sluggish or stagnant trend',
    priority: 'Immediate Intervention',
    actionTitle: 'Intensive Routine Immunization Strengthening (IRIS)',
    actionGuidance: 'Routine coverage is critically below herd protection thresholds. Establish targeted sub-district micro-planning, partner with grassroots community leaders to address vaccine hesitancy, and establish recurring fixed-site outreach days.',
    recommendedChannels: ['Supplementary Immunization Activities (SIAs)', 'Faith & Community Leaders Engagement', 'School & Daycare Verification']
  },
  {
    ruleId: 'RULE_MODERATE_PROGRESS',
    conditionDescription: 'Coverage is between 70% and 89%, showing positive momentum towards targets',
    priority: 'Targeted Outreach',
    actionTitle: 'Coverage Acceleration & Dropout Rate Reduction',
    actionGuidance: 'Progress is positive but vulnerable to dropouts between earlier and later series doses. Focus on digital tracking registries to minimize dropout between 1st dose (e.g., DTP1/MCV1) and completion (DTP3/MCV2).',
    recommendedChannels: ['SMS & Digital Reminder Registries', 'Primary Healthcare Clinic Training', 'Electronic Immunization Registry (EIR)']
  },
  {
    ruleId: 'RULE_TARGET_ACHIEVED',
    conditionDescription: 'Coverage meets or exceeds global 90% benchmark with stable or expanding trajectory',
    priority: 'Sustain Coverage',
    actionTitle: 'Sustained Surveillance & Equity Maintenance',
    actionGuidance: 'Optimal population-level coverage achieved. Focus on micro-targeting vulnerable pockets, remote migrant communities, and maintaining resilient cold-chain logistics to prevent sudden post-disaster resurgences.',
    recommendedChannels: ['Sentinel Surveillance', 'Post-Marketing Quality Control', 'Equity Deficit Auditing']
  }
];

