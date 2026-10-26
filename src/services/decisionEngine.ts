import { ForecastResponse, DecisionSupportResult, DecisionSupportThresholds, RiskLevel, TrendClassification } from '../types';
import { DEFAULT_THRESHOLDS, RECOMMENDATION_RULES } from '../config/thresholds.config';

export function buildDecisionSupport(
  forecast: ForecastResponse,
  thresholds: DecisionSupportThresholds = DEFAULT_THRESHOLDS
): DecisionSupportResult {
  const pred = forecast.predictedCoverage;
  const change = forecast.absoluteChange;

  let riskLevel: RiskLevel = 'MEDIUM';
  let trendClass: TrendClassification = 'Stagnant';
  let priorityLevel: 'Immediate Intervention' | 'Targeted Outreach' | 'Routine Monitoring' | 'Sustain Coverage' = 'Targeted Outreach';
  let suggestedAction = '';
  let rationale = '';
  const triggeredRules: string[] = [];

  if (pred < thresholds.highRiskCoverage || change <= -thresholds.criticalDeclineThreshold) {
    riskLevel = 'HIGH';
    priorityLevel = 'Immediate Intervention';
    trendClass = change < -1 ? 'Declining' : 'Stagnant';
    const rule = RECOMMENDATION_RULES.find(r => r.ruleId === (change <= -thresholds.criticalDeclineThreshold ? 'RULE_CRITICAL_DROP' : 'RULE_LOW_COVERAGE_STAGNANT')) || RECOMMENDATION_RULES[1];
    suggestedAction = rule.actionGuidance;
    rationale = `Coverage is projected at ${pred}%, which is severely below the minimum ${thresholds.highRiskCoverage}% vulnerability threshold. Critical protection deficits leave birth cohorts vulnerable to outbreak transmission.`;
    triggeredRules.push(`RULE_HIGH_EPIDEMIOLOGICAL_RISK (< ${thresholds.highRiskCoverage}% threshold)`);
    if (change < -1) triggeredRules.push('RULE_NEGATIVE_MOMENTUM_DETECTION');
  } else if (pred >= thresholds.targetCoverage) {
    riskLevel = 'TARGET_ACHIEVED';
    priorityLevel = 'Sustain Coverage';
    trendClass = 'High Coverage Target Reached';
    const rule = RECOMMENDATION_RULES.find(r => r.ruleId === 'RULE_TARGET_ACHIEVED') || RECOMMENDATION_RULES[3];
    suggestedAction = rule.actionGuidance;
    rationale = `Projected coverage of ${pred}% meets or exceeds the global benchmark of ${thresholds.targetCoverage}%. National systems are functioning effectively; prioritize zero-dose equity in remote communities.`;
    triggeredRules.push(`RULE_GLOBAL_TARGET_MET (>= ${thresholds.targetCoverage}% WHO standard)`);
  } else {
    riskLevel = 'MEDIUM';
    priorityLevel = 'Targeted Outreach';
    trendClass = change > 1.5 ? 'Accelerating' : 'Stagnant';
    const rule = RECOMMENDATION_RULES.find(r => r.ruleId === 'RULE_MODERATE_PROGRESS') || RECOMMENDATION_RULES[2];
    suggestedAction = rule.actionGuidance;
    rationale = `Projected coverage is ${pred}%. While performing above critical danger thresholds, there remains a ${Math.round((thresholds.targetCoverage - pred) * 10) / 10}% deficit below the 90% target.`;
    triggeredRules.push(`RULE_INTERMEDIATE_DEFICIT (${thresholds.highRiskCoverage}% - ${thresholds.mediumRiskCoverage}% range)`);
  }

  return {
    country: forecast.country,
    countryName: forecast.countryName,
    vaccine: forecast.vaccine,
    vaccineName: forecast.vaccineName,
    latestObservedCoverage: forecast.latestObserved,
    predictedCoverage: pred,
    coverageChange: change,
    trendClassification: trendClass,
    riskLevel,
    suggestedAction,
    rationale,
    priorityLevel,
    triggeredRules,
    recommendedChannels: [
      'Mobile Outreach in Peri-Urban Settlements',
      'Electronic Immunization Registry (EIR) Dropout Tracking',
      'Community Health Worker In-Person Tracing',
      'Sub-District Vaccine Logistics Buffer Stocks'
    ],
    isDemo: false
  };
}

