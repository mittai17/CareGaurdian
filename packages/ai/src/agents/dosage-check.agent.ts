import { AIGatewayService } from '../ai-gateway.service';

export interface MedicationInput {
  drug_name: string;
  dose: string;
  unit: string;
  frequency: string;
  patient_age?: number;
  patient_weight?: number;
  renal_hepatic_flags?: string[];
}

export interface DosageCheckResult {
  drug: string;
  prescribed_dose: string;
  fda_labeled_range: string;
  flag: 'within range' | 'above max' | 'below typical' | 'insufficient_data';
  source: string;
  evidence: string;
}

export class DosageCheckAgent {
  private cache: Map<string, any> = new Map();
  private OPENFDA_API_KEY = '1LnKycukJyaeOn0pYDH7ygvdV27vrgXCab7lxkyb';

  constructor(private readonly aiGateway: AIGatewayService) {}

  async checkDosage(med: MedicationInput): Promise<DosageCheckResult> {
    const defaultResult: DosageCheckResult = {
      drug: med.drug_name,
      prescribed_dose: `${med.dose}${med.unit} ${med.frequency}`,
      fda_labeled_range: 'Unknown',
      flag: 'insufficient_data',
      source: 'openFDA drug label API',
      evidence: 'No FDA label data found or missing dosage section.'
    };

    try {
      // 1. Fetch from openFDA
      const cacheKey = med.drug_name.toLowerCase();
      let labelData = this.cache.get(cacheKey);

      if (!labelData) {
        const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(med.drug_name)}"&api_key=${this.OPENFDA_API_KEY}`;
        const res = await fetch(url);
        if (!res.ok) {
          return defaultResult;
        }
        const json = await res.json();
        labelData = (json as any).results?.[0];
        if (labelData) {
          this.cache.set(cacheKey, labelData);
        }
      }

      if (!labelData) return defaultResult;

      const dosageText = labelData.dosage_and_administration?.[0] || labelData.dosage_forms_and_strengths?.[0];
      if (!dosageText) return defaultResult;

      // 2. Extract and Parse using LLM
      const prompt = `
Extract the standard dosage range and max dosage from the following FDA drug label excerpt.
Then, compare it to the patient's prescribed dose. Follow deterministic rules: 
- if prescribed > max labeled dose, flag "above max"
- if prescribed < min typical therapeutic dose, flag "below typical"
- otherwise "within range"
If the patient is elderly/renal-impaired, adjust the labeled range based on the label's geriatric/renal dosing adjustments before comparison.

Drug: ${med.drug_name}
Prescribed: ${med.dose}${med.unit} ${med.frequency}
Patient Age: ${med.patient_age || 'Unknown'}
Patient Weight: ${med.patient_weight || 'Unknown'} kg
Renal/Hepatic Flags: ${med.renal_hepatic_flags?.join(', ') || 'None'}

FDA Label Excerpt:
${dosageText.substring(0, 3500)}

Output exactly valid JSON in this format, and nothing else (no markdown blocks, no backticks):
{
  "fda_labeled_range": "e.g., 500-2000mg/day (max 2550mg/day)",
  "flag": "within range",
  "evidence": "Brief verbatim excerpt from the label supporting this"
}`;

      const rawResponse = await this.aiGateway.getProvider().generateText(prompt, {
        temperature: 0.1,
        maxTokens: 1500,
      });

      const cleanResponse = rawResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();

      let parsed;
      try {
        parsed = JSON.parse(cleanResponse);
      } catch (e) {
        console.warn('DosageCheckAgent failed to parse LLM response as JSON. Falling back.', cleanResponse);
        parsed = { flag: 'insufficient_data', evidence: 'Failed to parse LLM output.' };
      }

      // Validate flag enum
      let parsedFlag = parsed.flag;
      if (!['within range', 'above max', 'below typical', 'insufficient_data'].includes(parsedFlag)) {
        parsedFlag = 'insufficient_data';
      }

      return {
        drug: med.drug_name,
        prescribed_dose: `${med.dose}${med.unit} ${med.frequency}`,
        fda_labeled_range: parsed.fda_labeled_range || 'Unknown',
        flag: parsedFlag,
        source: 'openFDA drug label API',
        evidence: parsed.evidence || dosageText.substring(0, 200)
      };

    } catch (error) {
      console.error(`[DosageCheckAgent] Error for ${med.drug_name}:`, error);
      return defaultResult;
    }
  }
}
