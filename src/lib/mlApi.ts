const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'https://alimusarizvi-ddos-preventor.hf.space';

export interface MLPrediction {
  prediction: number;
  label: string;
  confidence: number;
  attack_probability: number;
  model_agreement: {
    random_forest: number;
    xgboost: number;
    lightgbm: number;
  };
}

export interface MLHealth {
  status: string;
  models_loaded: boolean;
  feature_count: number;
}

export const ML_FEATURE_NAMES = [
  "URG_Flag_Count", "Down/Up_Ratio", "Bwd_Packet_Length_Mean", "Init_Win_bytes_backward", 
  "Init_Win_bytes_forward", "Subflow_Bwd_Bytes", "Total_Length_of_Bwd_Packets", "RST_Flag_Count", 
  "Fwd_PSH_Flags", "CWE_Flag_Count", "Packet_Length_Std", "Bwd_Packet_Length_Std", 
  "Packet_Length_Mean", "Average_Packet_Size", "Fwd_Packet_Length_Mean", "Subflow_Bwd_Packets", 
  "ACK_Flag_Count", "Bwd_Header_Length", "Total_Backward_Packets", "Total_Length_of_Fwd_Packets", 
  "Flow_IAT_Mean", "Bwd_IAT_Mean", "Flow_Duration", "Fwd_Packet_Length_Std", "min_seg_size_forward", 
  "Fwd_Header_Length", "Idle_Mean", "Flow_IAT_Std", "Subflow_Fwd_Bytes", "Active_Mean"
];

export const MLService = {
  checkHealth: async (): Promise<MLHealth> => {
    const res = await fetch(`${ML_API_URL}/health`);
    if (!res.ok) throw new Error('ML Engine not reachable');
    return res.json();
  },

  predictFlow: async (features: number[]): Promise<MLPrediction> => {
    if (features.length !== 30) {
      throw new Error(`Expected exactly 30 features, got ${features.length}`);
    }
    const res = await fetch(`${ML_API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features })
    });
    if (!res.ok) throw new Error('Prediction failed');
    return res.json();
  },

  predictBatch: async (records: { features: number[] }[]): Promise<any> => {
    if (records.length === 0 || records.length > 100) {
      throw new Error('Batch size must be between 1 and 100');
    }
    const res = await fetch(`${ML_API_URL}/predict/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records })
    });
    if (!res.ok) throw new Error('Batch prediction failed');
    return res.json();
  }
};
