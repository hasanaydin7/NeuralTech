import type { NeuralThemePresetName, NeuralThemePresetQuality } from './types.js';

export const BUILT_IN_THEME_PRESET_QUALITY = {
  "neutral": {
    "status": "release",
    "minimumPrimarySurfaceContrast": 3,
    "allowedDiagnosticCodes": []
  },
  "glass": {
    "status": "preview",
    "minimumPrimarySurfaceContrast": 3,
    "allowedDiagnosticCodes": [
      "contrast.primary.light",
      "contrast.primary.dark"
    ]
  },
  "mist": {
    "status": "preview",
    "minimumPrimarySurfaceContrast": 3,
    "allowedDiagnosticCodes": []
  },
  "futuristic": {
    "status": "preview",
    "minimumPrimarySurfaceContrast": 3,
    "allowedDiagnosticCodes": [
      "contrast.primary.light",
      "contrast.primary.dark"
    ]
  }
} as const satisfies Readonly<Record<NeuralThemePresetName, NeuralThemePresetQuality>>;

export function getThemePresetQuality(
  preset: NeuralThemePresetName,
): NeuralThemePresetQuality {
  return BUILT_IN_THEME_PRESET_QUALITY[preset];
}
