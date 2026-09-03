/**
 * NEXORA CINEMATIC AI
 * Video Engine Adapter v1.0
 *
 * Provider-agnostic adapter between NEXORA internal request/response
 * and external video generation engines.
 *
 * Architecture:
 * USER PROMPT -> SCHEMA -> DIRECTOR -> NATURALISM -> COMPOSER -> ADAPTER -> VIDEO ENGINE
 *
 * This module does NOT call any external service, does NOT use credentials,
 * remote targets, hardcoded providers, or mock videos. It only validates and normalizes.
 */

export const VIDEO_ENGINE_ADAPTER_VERSION = "1.0";

// ---------------------------------------------------------------------------
// Constants - Current UI Support Only
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
  const trimmed = trimString(value);
  return SUPPORTED_PLATFORMS.includes(trimmed);
}

function isValidAspectRatio(value) {
  const trimmed = trimString(value);
  return SUPPORTED_ASPECT_RATIOS.includes(trimmed);
}

function cloneInput(input) {
  // shallow clone to avoid mutation, preserve primitives
  if (!isObject(input)) return input;
  return { ...input };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateGenerationRequest(request) {
  if (!isObject(request)) {
    throw new Error("Invalid request: request is required");
  }

  // prompt wajib string tidak kosong
  const prompt = request.prompt;
  if (typeof prompt !== "string" || trimString(prompt).length === 0) {
    throw new Error("Invalid prompt: prompt is required and must be a non-empty string");
  }

  // platform valid
  const platform = request.platform;
  if (typeof platform !== "string" || trimString(platform).length === 0) {
    throw new Error("Invalid platform: platform is required");
  }
  if (!isValidPlatform(platform)) {
    throw new Error(`Invalid platform: platform must be one of ${SUPPORTED_PLATFORMS.join(", ")}`);
  }

  // aspectRatio valid
  const aspectRatio = request.aspectRatio;
  if (typeof aspectRatio !== "string" || trimString(aspectRatio).length === 0) {
    throw new Error("Invalid aspectRatio: aspectRatio is required");
  }
  if (!isValidAspectRatio(aspectRatio)) {
    throw new Error(`Invalid aspectRatio: aspectRatio must be one of ${SUPPORTED_ASPECT_RATIOS.join(", ")}`);
  }

  // width valid
  if (request.width === undefined || request.width === null || request.width === "") {
    throw new Error("Invalid width: width is required");
  }
  if (!isValidDimension(request.width)) {
    throw new Error("Invalid width: width must be a valid positive integer");
  }

  // height valid
  if (request.height === undefined || request.height === null || request.height === "") {
    throw new Error("Invalid height: height is required");
  }
  if (!isValidDimension(request.height)) {
    throw new Error("Invalid height: height must be a valid positive integer");
  }

  // duration valid jika tersedia (optional)
  if (request.duration !== undefined && request.duration !== null && request.duration !== "") {
    if (!isValidDuration(request.duration)) {
      throw new Error("Invalid duration: duration must be a number between 1 and 120");
    }
  }

  // Consistency check for current supported format: 9:16 => 1080x1920 is the UI standard,
  // but we keep validation permissive for width/height as long as they are valid positive integers.
  // If strict 1080x1920 is required, the request with other valid dimensions will still pass
  // validation (provider-agnostic), allowing future expansion without breaking current UI.

  return true;
}

// ---------------------------------------------------------------------------
// Request Creation
// ---------------------------------------------------------------------------

export function createVideoGenerationRequest(input) {
  if (!isObject(input)) {
    throw new Error("Invalid input: input is required");
  }

  // Do not modify original input - work on cloned values
  const promptRaw = input.prompt;
  const platformRaw = input.platform;
  const aspectRatioRaw = input.aspectRatio;
  const widthRaw = input.width;
  const heightRaw = input.height;
  const durationRaw = input.duration;

  // Build normalized request for validation
  const candidate = {
    prompt: typeof promptRaw === "string" ? trimString(promptRaw) : promptRaw,
    platform: typeof platformRaw === "string" ? trimString(platformRaw) : platformRaw,
    aspectRatio: typeof aspectRatioRaw === "string" ? trimString(aspectRatioRaw) : aspectRatioRaw,
    width: widthRaw,
    height: heightRaw,
    duration: durationRaw,
  };

  // Validate (will throw if invalid)
  validateGenerationRequest(candidate);

  // Normalize types - return new object, never mutate input
  const normalizedPrompt = trimString(promptRaw);
  const normalizedPlatform = trimString(platformRaw);
  const normalizedAspectRatio = trimString(aspectRatioRaw);
  const normalizedWidth = Number(widthRaw);
  const normalizedHeight = Number(heightRaw);

  let normalizedDuration;
  if (durationRaw === undefined || durationRaw === null || durationRaw === "") {
    normalizedDuration = durationRaw === "" ? undefined : durationRaw;
    // Keep undefined/null as is for optional field - output will have same
    // If input had no duration property, candidate had undefined, so we keep undefined
    if (!Object.prototype.hasOwnProperty.call(input, "duration")) {
      normalizedDuration = undefined;
    } else {
      normalizedDuration = input.duration;
      // If explicitly undefined/null keep as is
      if (normalizedDuration !== undefined && normalizedDuration !== null && normalizedDuration !== "") {
        normalizedDuration = Math.round(Number(normalizedDuration));
      }
    }
  } else {
    normalizedDuration = Math.round(Number(durationRaw));
  }

  // Handle case where duration was provided as empty string - treat as undefined
  if (normalizedDuration === "") normalizedDuration = undefined;

  const request = {
    prompt: normalizedPrompt,
    platform: normalizedPlatform,
    aspectRatio: normalizedAspectRatio,
    width: normalizedWidth,
    height: normalizedHeight,
    duration: normalizedDuration,
  };

  // If original input had no duration key, ensure output still has duration key with undefined
  // to match spec Output request {prompt, platform, aspectRatio, width, height, duration}
  // We always include duration even if undefined for spec completeness
  if (!Object.prototype.hasOwnProperty.call(request, "duration")) {
    request.duration = undefined;
  }

  return request;
}

// ---------------------------------------------------------------------------
// Result Normalization
// ---------------------------------------------------------------------------

export function normalizeVideoGenerationResult(response) {
  // Provider-agnostic, no mock video, no credentials, no remote target
  if (!isObject(response)) {
    return {
      status: "failed",
      provider: null,
      jobId: null,
      videoUrl: null,
      platform: null,
      aspectRatio: null,
      width: null,
      height: null,
      duration: null,
      error: "Invalid response: response is required",
    };
  }

  // Extract fields with agnostic fallbacks - do not assume provider-specific keys
  // Support both camelCase and snake_case variations
  const rawStatus = response.status !== undefined ? response.status : response.state !== undefined ? response.state : null;
  const rawProvider = response.provider !== undefined ? response.provider : response.engine !== undefined ? response.engine : null;
  const rawJobId = response.jobId !== undefined ? response.jobId : response.job_id !== undefined ? response.job_id : response.id !== undefined ? response.id : null;
  const rawVideoUrl = response.videoUrl !== undefined ? response.videoUrl : response.video_url !== undefined ? response.video_url : response.url !== undefined ? response.url : response.video_url_alt !== undefined ? response.video_url_alt : response.output !== undefined ? response.output : null;
  const rawPlatform = response.platform !== undefined ? response.platform : null;
  const rawAspectRatio = response.aspectRatio !== undefined ? response.aspectRatio : response.aspect_ratio !== undefined ? response.aspect_ratio : null;
  const rawWidth = response.width !== undefined ? response.width : null;
  const rawHeight = response.height !== undefined ? response.height : null;
  const rawDuration = response.duration !== undefined ? response.duration : null;
  const rawError = response.error !== undefined ? response.error : response.message !== undefined ? response.message : null;

  // Normalize status - agnostic, keep as trimmed lower? Keep original string but trimmed
  let status = null;
  if (typeof rawStatus === "string" && trimString(rawStatus).length > 0) {
    const s = trimString(rawStatus).toLowerCase();
    // Allowed statuses are generic, keep provider value as-is but normalized
    if (["pending", "processing", "completed", "failed", "succeeded", "success", "unknown"].includes(s)) {
      // Map succeeded/success to completed for standard
      if (s === "succeeded" || s === "success") status = "completed";
      else status = s;
    } else {
      status = trimString(rawStatus);
    }
  } else if (rawStatus !== null && rawStatus !== undefined) {
    status = String(rawStatus).trim() || null;
  } else {
    status = "unknown";
  }

  // Provider - keep as string trimmed or null, never inject fake provider
  let provider = null;
  if (typeof rawProvider === "string" && trimString(rawProvider).length > 0) {
    provider = trimString(rawProvider);
  } else if (rawProvider !== null && rawProvider !== undefined) {
    provider = String(rawProvider).trim() || null;
  } else {
    provider = null;
  }

  // jobId - string trimmed or null
  let jobId = null;
  if (typeof rawJobId === "string" && trimString(rawJobId).length > 0) {
    jobId = trimString(rawJobId);
  } else if (rawJobId !== null && rawJobId !== undefined && String(rawJobId).trim().length > 0) {
    jobId = String(rawJobId).trim();
  } else {
    jobId = null;
  }

  // videoUrl - string trimmed or null, do NOT create mock if missing
  let videoUrl = null;
  if (typeof rawVideoUrl === "string" && trimString(rawVideoUrl).length > 0) {
    videoUrl = trimString(rawVideoUrl);
  } else if (rawVideoUrl !== null && rawVideoUrl !== undefined && typeof rawVideoUrl === "string") {
    const t = trimString(rawVideoUrl);
    videoUrl = t.length > 0 ? t : null;
  } else {
    videoUrl = null;
  }

  // platform - if valid platform keep, else keep as provided trimmed or null
  let platform = null;
  if (typeof rawPlatform === "string" && trimString(rawPlatform).length > 0) {
    const p = trimString(rawPlatform);
    // keep as is, no validation to stay agnostic, but trim
    platform = p;
  } else if (rawPlatform !== null && rawPlatform !== undefined) {
    platform = String(rawPlatform).trim() || null;
  }

  // aspectRatio
  let aspectRatio = null;
  if (typeof rawAspectRatio === "string" && trimString(rawAspectRatio).length > 0) {
    aspectRatio = trimString(rawAspectRatio);
  } else if (rawAspectRatio !== null && rawAspectRatio !== undefined) {
    aspectRatio = String(rawAspectRatio).trim() || null;
  }

  // width / height / duration - normalize to number or null
  let width = null;
  if (rawWidth !== null && rawWidth !== undefined && rawWidth !== "") {
    const n = Number(rawWidth);
    if (Number.isFinite(n) && Number.isInteger(n) && n > 0) width = n;
    else if (Number.isFinite(n) && n > 0) width = Math.round(n);
    else width = null;
  }

  let height = null;
  if (rawHeight !== null && rawHeight !== undefined && rawHeight !== "") {
    const n = Number(rawHeight);
    if (Number.isFinite(n) && Number.isInteger(n) && n > 0) height = n;
    else if (Number.isFinite(n) && n > 0) height = Math.round(n);
    else height = null;
  }

  let duration = null;
  if (rawDuration !== null && rawDuration !== undefined && rawDuration !== "") {
    const n = Number(rawDuration);
    if (Number.isFinite(n) && n > 0 && n <= 120) duration = Math.round(n);
    else if (rawDuration === null) duration = null;
    else duration = null; // invalid duration becomes null, not throw
  }

  // error - string or null
  let error = null;
  if (typeof rawError === "string" && trimString(rawError).length > 0) {
    error = trimString(rawError);
  } else if (rawError !== null && rawError !== undefined && String(rawError).trim().length > 0) {
    error = String(rawError).trim();
  } else {
    error = null;
  }

  // If status is failed and no error provided, keep error null (do not fake)
  // If status is completed but no videoUrl, keep videoUrl null (do not fake)

  const result = {
    status,
    provider,
    jobId,
    videoUrl,
    platform,
    aspectRatio,
    width,
    height,
    duration,
    error,
  };

  return result;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createVideoEngineAdapter() {
  return {
    version: VIDEO_ENGINE_ADAPTER_VERSION,
    validateGenerationRequest,
    createVideoGenerationRequest,
    normalizeVideoGenerationResult,
    // aliases for convenience
    validate: validateGenerationRequest,
    createRequest: createVideoGenerationRequest,
    normalizeResult: normalizeVideoGenerationResult,
  };
}
