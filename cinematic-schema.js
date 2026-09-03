/**
 * NEXORA CINEMATIC AI
 * Cinematic Schema v1.0
 *
 * Internal contract between:
 * Prompt Analyzer
 * → Cinematic Director
 * → Naturalism Engine
 * → Prompt Composer
 * → Video Engine
 */

export const CINEMATIC_SCHEMA_VERSION = "1.0";

export function createCinematicSchema() {
  return {
    version: CINEMATIC_SCHEMA_VERSION,

    scene: {
      location: "",
      timeOfDay: "",
      weather: "",
      environment: "",
      duration: 10
    },

    subject: {
      description: "",
      action: "",
      appearance: "",
      behavior: ""
    },

    camera: {
      perspective: "cinematic",
      movement: "",
      framing: "",
      lens: "",
      focalLength: null,
      depthOfField: "",
      stabilization: "natural"
    },

    lighting: {
      keyLight: "",
      direction: "",
      intensity: "",
      colorTemperature: null,
      contrast: "",
      shadowBehavior: "",
      volumetric: false
    },

    color: {
      palette: [],
      contrast: "natural",
      saturation: "restrained",
      colorScience: "cinematic"
    },

    composition: {
      framing: "",
      subjectPlacement: "",
      foreground: "",
      background: "",
      depth: ""
    },

    motion: {
      subjectMotion: "",
      cameraMotion: "",
      speed: "",
      motionBlur: "natural",
      temporalConsistency: "high"
    },

    atmosphere: {
      particles: "",
      fog: "",
      haze: "",
      environmentalMovement: "",
      depth: ""
    },

    material: {
      surfaceProperties: "",
      roughness: "",
      reflections: "",
      imperfections: "natural"
    },

    physics: {
      gravity: "physically_coherent",
      collision: "realistic",
      fluidInteraction: "",
      environmentalReaction: "",
      causeAndEffect: true
    },

    naturalism: {
      realisticLightFalloff: true,
      realisticShadows: true,
      realisticMaterials: true,
      naturalImperfections: true,
      realisticMotion: true,
      realisticDepth: true,
      restrainedColor: true,
      naturalExposure: true,
      temporalConsistency: true
    },

    quality: {
      resolution: "",
      detailLevel: "high",
      sharpness: "natural",
      noiseControl: "natural",
      artifactControl: "high",
      exposureConsistency: true,
      colorConsistency: true
    },

    audio: {
      ambience: true,
      foley: true,
      voice: false,
      music: false,
      intensity: 0.6,
      mixStyle: "cinematic",
      clarity: "high",
      noiseReduction: true,
      limiter: true,
      loudnessNormalization: true
    },

    negativeRules: [
      "excessive HDR",
      "oversaturation",
      "plastic skin or surfaces",
      "artificial glow",
      "oversharpening",
      "unnatural motion",
      "impossible shadows",
      "physically impossible interaction",
      "perfect artificial geometry",
      "temporal flickering",
      "random object deformation",
      "inconsistent lighting"
    ],

    output: {
      promptType: "natural",
      cinematicPrompt: "",
      generationSettings: {}
    }
  };
}