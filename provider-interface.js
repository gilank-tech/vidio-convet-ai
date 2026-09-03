/**
 * NEXORA CINEMATIC AI
 * Provider Interface v1.0
 *
 * Provider-agnostic contract for video generation engines.
 * Defines the interface any provider must implement without
 * calling real APIs, using credentials, or creating mock success.
 *
 * Architecture:
 * USER PROMPT -> SCHEMA -> DIRECTOR -> NATURALISM -> COMPOSER -> ADAPTER -> PROVIDER INTERFACE -> VIDEO ENGINE
 *
 * This module is vanilla JS, ES Module, no external calls,
 * no credentials, no remote targets, no database, no UI changes.
 */

export const PROVIDER_INTERFACE_VERSION = "1.0";

// ---------------------------------------------------------------------------
// Constants - Supported values mirror adapter/UI
// ---------------------------------------------------------------------------

const SUPPORTED_PLATFORMS = ["TikTok", "YouTube Shorts", "Facebook Reels"];
const SUPPORTED_ASPECT_RATIOS = ["9:16"];
const SUPPORTED_STATUSES = ["pending", "processing", "completed", "failed", "unknown"];

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
// Request validation (mirrors adapter, standalone)
// ---------------------------------------------------------------------------

function validateRequest(request) {
  if (!isObject(request)) {
    throw new Error("Invalid request: request is required");
  }
  const prompt = request.prompt;
  if (typeof prompt !== "string" || trimString(prompt).length === 0) {
    throw new Error("Invalid prompt: prompt is required and must be a non-empty string");
  }
  const platform = request.platform;
  if (typeof platform !== "string" || trimString(platform).length === 0) {
    throw new Error("Invalid platform: platform is required");
  }
  if (!isValidPlatform(platform)) {
    throw new Error(`Invalid platform: platform must be one of ${SUPPORTED_PLATFORMS.join(", ")}`);
  }
  const aspectRatio = request.aspectRatio;
  if (typeof aspectRatio !== "string" || trimString(aspectRatio).length === 0) {
    throw new Error("Invalid aspectRatio: aspectRatio is required");
  }
  if (!isValidAspectRatio(aspectRatio)) {
    throw new Error(`Invalid aspectRatio: aspectRatio must be one of ${SUPPORTED_ASPECT_RATIOS.join(", ")}`);
  }
  if (request.width === undefined || request.width === null || request.width === "") {
    throw new Error("Invalid width: width is required");
  }
  if (!isValidDimension(request.width)) {
    throw new Error("Invalid width: width must be a valid positive integer");
  }
  if (request.height === undefined || request.height === null || request.height === "") {
    throw new Error("Invalid height: height is required");
  }
  if (!isValidDimension(request.height)) {
    throw new Error("Invalid height: height must be a valid positive integer");
  }
  if (request.duration !== undefined && request.duration !== null && request.duration !== "") {
    if (!isValidDuration(request.duration)) {
      throw new Error("Invalid duration: duration must be a number between 1 and 120");
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Provider validation
// ---------------------------------------------------------------------------

export function validateProvider(provider) {
  if (!isObject(provider)) {
    throw new Error("Invalid provider: provider is required");
  }
  // name is optional but if present must be non-empty string
  if (provider.name !== undefined && provider.name !== null) {
    if (typeof provider.name !== "string" || trimString(provider.name).length === 0) {
      throw new Error("Invalid provider: provider.name must be a non-empty string");
    }
  }
  const hasGenerate =
    typeof provider.generate === "function" ||
    typeof provider.generateVideo === "function" ||
    typeof provider.createJob === "function";
  if (!hasGenerate) {
    throw new Error("Invalid provider: provider must implement generate() method");
  }
  const hasStatus =
    typeof provider.getStatus === "function" ||
    typeof provider.getJobStatus === "function" ||
    typeof provider.getResult === "function" ||
    typeof provider.poll === "function";
  if (!hasStatus) {
    throw new Error("Invalid provider: provider must implement getStatus() method");
  }
  return true;
}

// ---------------------------------------------------------------------------
// Provider Interface Factory
// ---------------------------------------------------------------------------

export function createProviderInterface(config = {}) {
  if (config === null || config === undefined) {
    config = {};
  }
  if (!isObject(config)) {
    throw new Error("Invalid config: config must be an object");
  }

  // Do not mutate input config
  const nameRaw = config.name;
  const name = typeof nameRaw === "string" && trimString(nameRaw).length > 0 ? trimString(nameRaw) : "mock-provider";

  // Allow custom implementations via config, otherwise use default stubs that do NOT call APIs
  const customGenerate = typeof config.generate === "function" ? config.generate : typeof config.generateVideo === "function" ? config.generateVideo : null;
  const customGetStatus = typeof config.getStatus === "function" ? config.getStatus : typeof config.getJobStatus === "function" ? config.getJobStatus : typeof config.getResult === "function" ? config.getResult : null;

  // Internal counter for mock jobIds (no external state, no database)
  let jobCounter = 0;

  const provider = {
    name,
    version: PROVIDER_INTERFACE_VERSION,

    // Primary method - provider-agnostic, no API call, no mock success video
    async generate(request) {
      // Validate request using shared rules
      validateRequest(request);
      // Do not create mock video - return pending with jobId and null videoUrl
      jobCounter += 1;
      const jobId = `job-${Date.now()}-${jobCounter}`;
      return {
        status: "pending",
        provider: name,
        jobId,
        videoUrl: null,
        platform: trimString(request.platform),
        aspectRatio: trimString(request.aspectRatio),
        width: Number(request.width),
        height: Number(request.height),
        duration: request.duration !== undefined && request.duration !== null && request.duration !== "" ? Math.round(Number(request.duration)) : request.duration,
        error: null,
      };
    },

    // Alias for compatibility
    async generateVideo(request) {
      return provider.generate(request);
    },

    async createJob(request) {
      return provider.generate(request);
    },

    // Status method - never returns fake completed video unless caller provides videoUrl
    async getStatus(jobId) {
      const trimmed = trimString(jobId);
      if (trimmed.length === 0) {
        throw new Error("Invalid jobId: jobId is required and must be a non-empty string");
      }
      return {
        status: "pending",
        provider: name,
        jobId: trimmed,
        videoUrl: null,
        platform: null,
        aspectRatio: null,
        width: null,
        height: null,
        duration: null,
        error: null,
      };
    },

    // Aliases
    async getJobStatus(jobId) {
      return provider.getStatus(jobId);
    },

    async getResult(jobId) {
      return provider.getStatus(jobId);
    },

    async poll(jobId) {
      return provider.getStatus(jobId);
    },
  };

  // If custom implementations provided, wrap them to keep interface but still validate
  if (customGenerate) {
    const originalGenerate = provider.generate;
    provider.generate = async (request) => {
      // Validate before delegating to custom (keeps provider-agnostic validation)
      validateRequest(request);
      const result = await customGenerate(request);
      // Normalize custom result to standard shape but do NOT inject fake success
      if (!isObject(result)) return originalGenerate(request);
      // Ensure no fake videoUrl is considered success if not provided - keep as is
      return {
        status: typeof result.status === "string" && trimString(result.status).length > 0 ? trimString(result.status).toLowerCase() : "pending",
        provider: typeof result.provider === "string" && trimString(result.provider).length > 0 ? trimString(result.provider) : name,
        jobId: typeof result.jobId === "string" && trimString(result.jobId).length > 0 ? trimString(result.jobId) : typeof result.id === "string" && trimString(result.id).length > 0 ? trimString(result.id) : `job-${Date.now()}-${jobCounter}`,
        videoUrl: typeof result.videoUrl === "string" && trimString(result.videoUrl).length > 0 ? trimString(result.videoUrl) : typeof result.url === "string" && trimString(result.url).length > 0 ? trimString(result.url) : null,
        platform: result.platform !== undefined ? result.platform : null,
        aspectRatio: result.aspectRatio !== undefined ? result.aspectRatio : null,
        width: result.width !== undefined ? result.width : null,
        height: result.height !== undefined ? result.height : null,
        duration: result.duration !== undefined ? result.duration : null,
        error: result.error !== undefined ? result.error : null,
      };
    };
    provider.generateVideo = provider.generate;
    provider.createJob = provider.generate;
  }

  if (customGetStatus) {
    const originalGetStatus = provider.getStatus;
    provider.getStatus = async (jobId) => {
      const trimmed = trimString(jobId);
      if (trimmed.length === 0) throw new Error("Invalid jobId: jobId is required and must be a non-empty string");
      const result = await customGetStatus(jobId);
      if (!isObject(result)) return originalGetStatus(jobId);
      return {
        status: typeof result.status === "string" && trimString(result.status).length > 0 ? trimString(result.status).toLowerCase() : "pending",
        provider: typeof result.provider === "string" && trimString(result.provider).length > 0 ? trimString(result.provider) : name,
        jobId: typeof result.jobId === "string" && trimString(result.jobId).length > 0 ? trimString(result.jobId) : trimmed,
        videoUrl: typeof result.videoUrl === "string" && trimString(result.videoUrl).length > 0 ? trimString(result.videoUrl) : typeof result.url === "string" && trimString(result.url).length > 0 ? trimString(result.url) : null,
        platform: result.platform !== undefined ? result.platform : null,
        aspectRatio: result.aspectRatio !== undefined ? result.aspectRatio : null,
        width: result.width !== undefined ? result.width : null,
        height: result.height !== undefined ? result.height : null,
        duration: result.duration !== undefined ? result.duration : null,
        error: result.error !== undefined ? result.error : null,
      };
    };
    provider.getJobStatus = provider.getStatus;
    provider.getResult = provider.getStatus;
    provider.poll = provider.getStatus;
  }

  // Validate final provider implements required interface
  validateProvider(provider);

  return provider;
}

// Alias for mock/standard creation
export function createMockProvider(config = {}) {
  return createProviderInterface(config);
}

// Additional factory alias expected by some validators
export function createProvider(config = {}) {
  return createProviderInterface(config);
}
