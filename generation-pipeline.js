/**
 * NEXORA CINEMATIC AI
 * Local Generation Pipeline v1.0
 *
 * Orchestration layer connecting all engines:
 * Schema -> Director -> Naturalism -> Prompt Composer -> Video Engine Adapter -> Provider Interface
 *
 * This module is vanilla JS, ES Module, provider-agnostic,
 * no external calls, no credentials, no storage, no UI changes,
 * no mock video success.
 */

import { createCinematicSchema } from "./cinematic-schema.js";
import { directCinematicScene } from "./cinematic-director.js";
import { applyNaturalism } from "./naturalism-engine.js";
import { composeCinematicPrompt } from "./prompt-composer.js";
import { createVideoGenerationRequest, validateGenerationRequest } from "./video-engine-adapter.js";

export const GENERATION_PIPELINE_VERSION = "1.0";

// ---------------------------------------------------------------------------
// Constants - Supported values mirror adapter/UI
// ---------------------------------------------------------------------------

const SUPPORTED_PLATFORMS = ["TikTok", "YouTube Shorts", "Facebook Reels"];
const SUPPORTED_ASPECT_RATIOS = ["9:16"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidDuration(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 && n <= 120;
}

function isValidDimension(value) {
  const n = Number(value);
  return Number.isFinite(n) && Number.isInteger(n) && n > 0 && n <= 7680;
}

function isValidPlatform(value) {
  return SUPPORTED_PLATFORMS.includes(trimString(value));
}

function isValidAspectRatio(value) {
  return SUPPORTED_ASPECT_RATIOS.includes(trimString(value));
}

// ---------------------------------------------------------------------------
// Input validation for pipeline (mirrors adapter but for pipeline entry)
// ---------------------------------------------------------------------------

function validatePipelineInput(input) {
  if (!isObject(input)) {
    throw new Error("Invalid input: input is required");
  }
  const prompt = input.prompt;
  if (typeof prompt !== "string" || trimString(prompt).length === 0) {
    throw new Error("Invalid prompt: prompt is required and must be a non-empty string");
  }
  const platform = input.platform;
  if (typeof platform !== "string" || trimString(platform).length === 0) {
    throw new Error("Invalid platform: platform is required");
  }
  if (!isValidPlatform(platform)) {
    throw new Error(`Invalid platform: platform must be one of ${SUPPORTED_PLATFORMS.join(", ")}`);
  }
  const aspectRatio = input.aspectRatio;
  if (typeof aspectRatio !== "string" || trimString(aspectRatio).length === 0) {
    throw new Error("Invalid aspectRatio: aspectRatio is required");
  }
  if (!isValidAspectRatio(aspectRatio)) {
    throw new Error(`Invalid aspectRatio: aspectRatio must be one of ${SUPPORTED_ASPECT_RATIOS.join(", ")}`);
  }
  if (input.width === undefined || input.width === null || input.width === "") {
    throw new Error("Invalid width: width is required");
  }
  if (!isValidDimension(input.width)) {
    throw new Error("Invalid width: width must be a valid positive integer");
  }
  if (input.height === undefined || input.height === null || input.height === "") {
    throw new Error("Invalid height: height is required");
  }
  if (!isValidDimension(input.height)) {
    throw new Error("Invalid height: height must be a valid positive integer");
  }
  if (input.duration !== undefined && input.duration !== null && input.duration !== "") {
    if (!isValidDuration(input.duration)) {
      throw new Error("Invalid duration: duration must be a number between 1 and 120");
    }
  }
  return true;
}

// Deep clone via JSON for immutability of returned objects (ensures no shared refs)
function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

// ---------------------------------------------------------------------------
// Core Pipeline
// ---------------------------------------------------------------------------

export function prepareGeneration(input) {
  if (!isObject(input)) {
    throw new Error("Invalid input: input is required");
  }

  // Keep original input untouched - work on normalized copy
  const promptRaw = input.prompt;
  const platformRaw = input.platform;
  const aspectRatioRaw = input.aspectRatio;
  const widthRaw = input.width;
  const heightRaw = input.height;
  const durationRaw = input.duration;

  // Validate pipeline input (prompt, platform, aspectRatio, width, height, duration)
  const normalizedForValidation = {
    prompt: typeof promptRaw === "string" ? trimString(promptRaw) : promptRaw,
    platform: typeof platformRaw === "string" ? trimString(platformRaw) : platformRaw,
    aspectRatio: typeof aspectRatioRaw === "string" ? trimString(aspectRatioRaw) : aspectRatioRaw,
    width: widthRaw,
    height: heightRaw,
    duration: durationRaw,
  };
  validatePipelineInput(normalizedForValidation);

  const normalizedPrompt = trimString(promptRaw);
  const normalizedPlatform = trimString(platformRaw);
  const normalizedAspectRatio = trimString(aspectRatioRaw);
  const normalizedWidth = Number(widthRaw);
  const normalizedHeight = Number(heightRaw);
  let normalizedDuration;
  if (durationRaw === undefined || durationRaw === null || durationRaw === "") {
    if (!Object.prototype.hasOwnProperty.call(input, "duration") || durationRaw === "") {
      normalizedDuration = undefined;
    } else {
      normalizedDuration = durationRaw;
    }
  } else {
    normalizedDuration = Math.round(Number(durationRaw));
  }
  if (normalizedDuration === "") normalizedDuration = undefined;

  // 1. Create new schema
  const schema = createCinematicSchema();

  // 2. Insert user intent into schema (do not mutate external input)
  // Prompt flows via subject.description, duration via scene.duration
  schema.subject.description = normalizedPrompt;
  // Keep action empty, description is enough for composer to generate subject sentence
  // Also set scene.duration if provided
  if (normalizedDuration !== undefined && normalizedDuration !== null) {
    schema.scene.duration = normalizedDuration;
  }
  // Also mirror prompt-related metadata for debugging (optional, not required)
  // 3. Director
  const cinematicDirective = directCinematicScene(schema);

  // 4. Naturalism
  const naturalismDirective = applyNaturalism(schema, cinematicDirective);

  // 5 & 6. Prompt Composer -> Cinematic Master Prompt
  const composerResult = composeCinematicPrompt(schema, cinematicDirective, naturalismDirective);
  const cinematicPrompt = composerResult.cinematicPrompt;

  // 7. Create generation request via Adapter (prompt must be cinematicPrompt)
  const generationRequest = createVideoGenerationRequest({
    prompt: cinematicPrompt,
    platform: normalizedPlatform,
    aspectRatio: normalizedAspectRatio,
    width: normalizedWidth,
    height: normalizedHeight,
    duration: normalizedDuration,
  });

  // Ensure generationRequest.prompt === cinematicPrompt (prompt flow guarantee)
  // This is already true since we used cinematicPrompt above

  // 8. Prepare job for Provider Interface (not sending to internet)
  const job = {
    status: "prepared",
    jobId: null,
    videoUrl: null,
    error: null,
  };

  // Return new object with deep clones to ensure immutability of internal state
  // Schema, directives, etc should not be mutated after return
  return {
    pipelineVersion: GENERATION_PIPELINE_VERSION,
    schema: deepClone(schema),
    cinematicDirective: deepClone(cinematicDirective),
    naturalismDirective: deepClone(naturalismDirective),
    cinematicPrompt,
    generationRequest: deepClone(generationRequest),
    job: { ...job },
  };
}

export function createGenerationJob(input) {
  if (!isObject(input)) {
    throw new Error("Invalid input: input is required");
  }

  // Reuse prepareGeneration to get validated request and ensure prompt flow, but job status is queued
  // We call prepareGeneration which already validates and creates pipeline
  const prepared = prepareGeneration(input);

  // Build job with queued status, null jobId/videoUrl, request is prepared.generationRequest
  const job = {
    status: "queued",
    jobId: null,
    videoUrl: null,
    request: deepClone(prepared.generationRequest),
    error: null,
  };

  return job;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createGenerationPipeline() {
  return {
    version: GENERATION_PIPELINE_VERSION,
    pipelineVersion: GENERATION_PIPELINE_VERSION,
    prepare: prepareGeneration,
    prepareGeneration,
    createJob: createGenerationJob,
    createGenerationJob,
  };
}
