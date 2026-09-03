// ==========================================
// CINEMATIC AI - SCRIPT RAPIH + VIDEO FORMAT + DOWNLOAD + AI BRAIN
// ==========================================
"use strict";

const promptInput = document.getElementById("promptInput");
const generateBtn = document.getElementById("generateBtn");
const emptyState = document.getElementById("emptyState");
const loadingState = document.getElementById("loadingState");
const resultVideo = document.getElementById("resultVideo");
const promptError = document.getElementById("promptError");
const charCount = document.getElementById("charCount");
const videoBox = document.getElementById("videoBox");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");
const toast = document.getElementById("toast");
const clearPromptBtn = document.getElementById("clearPromptBtn");

// Format related
const formatCards = document.querySelectorAll(".format-card");
const selectedPlatformEl = document.getElementById("selectedPlatform");
const selectedRatioEl = document.getElementById("selectedRatio");
const selectedResolutionEl = document.getElementById("selectedResolution");
const resultMeta = document.getElementById("resultMeta");
const metaPlatform = document.getElementById("metaPlatform");
const metaRatio = document.getElementById("metaRatio");
const metaResolution = document.getElementById("metaResolution");
const metaOrientation = document.getElementById("metaOrientation");
const metaPrompt = document.getElementById("metaPrompt");

// Download bar related
const playBtn = document.getElementById("playBtn");
const videoResultBar = document.getElementById("videoResultBar");
const videoInfoPlatform = document.getElementById("videoInfoPlatform");
const videoInfoRatio = document.getElementById("videoInfoRatio");
const videoInfoRes = document.getElementById("videoInfoRes");

// AI Brain related
const promptModeBtns = document.querySelectorAll(".prompt-mode__btn");
const promptBox = document.querySelector(".prompt-box");
const jsonStatus = document.getElementById("jsonStatus");
const aiBrainPanel = document.getElementById("aiBrainPanel");
const aiBrainBadge = document.getElementById("aiBrainBadge");
const aiBrainValid = document.getElementById("aiBrainValid");
const aiBrainCount = document.getElementById("aiBrainCount");
const aiBrainNatural = document.getElementById("aiBrainNatural");
const aiBrainJson = document.getElementById("aiBrainJson");

// Control Deck new elements
const previewMeta = document.getElementById("previewMeta");
const previewPlatform = document.getElementById("previewPlatform");
const previewRatio = document.getElementById("previewRatio");
const previewRes = document.getElementById("previewRes");
const settingAspect = document.getElementById("settingAspect");
const settingRes = document.getElementById("settingRes");
const generateStatus = document.getElementById("generateStatus");
const resultMetaLabel = document.getElementById("resultMetaLabel");

const brandConfig = {
    company: "NEXORA",
    product: "CINEMATIC AI",
    descriptor: "AI VIDEO PRODUCTION ENGINE",
    aiCore: "NEXORA AI CORE",
    year: "2026",
    generatedBy: "NEXORA Cinematic AI"
};

const MAX_LENGTH = 10000;
const DUMMY_VIDEO_URL = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

const NATURAL_PLACEHOLDER = "Tulis prompt cinematic kamu di sini... Contoh: Seorang samurai berjalan di tengah hujan neon Tokyo, kamera mengikuti dari belakang, cinematic 4K...";
const JSON_PLACEHOLDER = `{
  "subject": "A deep-sea diver's hands opening a rusted underwater hatch to reveal gold bars and glowing blue beads.",
  "environment": "The dark, silty floor of the deep ocean, featuring a massive rusted chain and a circular metal porthole hatch.",
  "style": "Cinematic underwater documentary photography, hyper-realistic, high-action salvage aesthetic.",
  "lighting": "High-contrast volumetric lighting; a powerful white LED flashlight beam, dark ambient shadows, and a soft cyan bioluminescent glow from the treasure.",
  "color_palette": "Deep navy blue, pitch black, rusty orange-brown, metallic gold, and neon cyan (#00FFFF).",
  "composition": "First-person perspective (POV), wide-angle lens, close-up on the hands and the hatch opening.",
  "face_details": "N/A (Subject is a diver in gear, focus is on hands and environment).",
  "technical_settings": "4K resolution, 60fps, wide-angle action camera (GoPro style), deep depth of field, visible water particles and micro-bubbles.",
  "mood": "Mysterious, adventurous, suspenseful, and rewarding.",
  "negative_prompt": "Daylight, surface water, clear visibility, dry land, cartoonish, low resolution, blurry movement, missing fingers, distorted gold bars."
}`;

// ==========================================
// VIDEO FORMATS CONFIG - 3 PLATFORMS ONLY (9:16)
// Mudah diperluas nanti: tambah entry baru di sini
// ==========================================
const videoFormats = {
    tiktok: {
        platform: "TikTok",
        ratio: "9:16",
        width: 1080,
        height: 1920,
        orientation: "portrait"
    },
    youtubeShorts: {
        platform: "YouTube Shorts",
        ratio: "9:16",
        width: 1080,
        height: 1920,
        orientation: "portrait"
    },
    facebookReels: {
        platform: "Facebook Reels",
        ratio: "9:16",
        width: 1080,
        height: 1920,
        orientation: "portrait"
    }
};

let selectedFormat = "youtubeShorts";
let promptMode = "natural";
let lastGenerationSettings = null;
let lastCinematicPrompt = null;
let lastGenerationPrompt = "";
let generatedVideoUrl = null;
let isGenerating = false;
let toastTimer = null;

// ==========================================
// AUDIO ENGINE — UI ONLY (mock, no real audio)
// ==========================================
const audioEngine = {
    ambience: true,
    foley: true,
    voice: false,
    music: true,
    profile: "CINEMATIC",
    clarity: "HIGH",
    dynamic: "GENTLE",
    noiseReduction: true,
    loudness: true,
    masterVolume: 62,
    isPreviewing: false
};

const audioStatusEl = document.getElementById("audioStatus");
const masterAudioSlider = document.getElementById("masterAudioSlider");
const masterAudioValue = document.getElementById("masterAudioValue");
const masterAudioFill = document.getElementById("masterAudioFill");
const audioPreviewBtn = document.getElementById("audioPreviewBtn");
let audioPreviewTimer = null;

const audioControlOptions = {
    profile: ["CINEMATIC", "NATURAL", "WARM", "BRIGHT"],
    clarity: ["HIGH", "MEDIUM", "LOW"],
    dynamic: ["GENTLE", "NORMAL", "PUNCHY"]
};

// ==========================================
// HELPERS
// ==========================================

function showToast(message, isError = false) {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.toggle("is-error", isError);
    toast.hidden = false;
    toastTimer = setTimeout(() => {
        toast.hidden = true;
    }, 3000);
}

function showError(message) {
    promptError.textContent = message;
    promptError.hidden = false;
    promptInput.setAttribute("aria-invalid", "true");
}

function clearError() {
    promptError.textContent = "";
    promptError.hidden = true;
    promptInput.removeAttribute("aria-invalid");
}

function updateClearButton() {
    if (!clearPromptBtn) return;
    const hasContent = promptInput.value.length > 0;
    clearPromptBtn.disabled = !hasContent || isGenerating;
}

function updateCharCount() {
    const len = promptInput.value.length;
    charCount.textContent = `${len} / ${MAX_LENGTH}`;

    charCount.classList.remove("is-warning", "is-error");
    if (len > MAX_LENGTH) {
        charCount.classList.add("is-error");
    } else if (len > MAX_LENGTH * 0.9) {
        charCount.classList.add("is-warning");
    }

    if (len > MAX_LENGTH && !isGenerating) {
        generateBtn.disabled = true;
    } else if (!isGenerating) {
        generateBtn.disabled = false;
    }

    updateClearButton();
}

function clearPrompt() {
    if (!promptInput) return;
    if (isGenerating) return;
    if (promptInput.value.length === 0) return;

    promptInput.value = "";
    clearError();
    updateCharCount();

    if (promptMode === "json") {
        const validation = validateJSONPrompt(promptInput.value);
        updateJsonStatus(validation);
        updateAIBrainPanel(validation);
    } else {
        if (jsonStatus) jsonStatus.hidden = true;
        updateAIBrainPanel({ valid: false, parsed: null });
    }

    promptInput.focus();
}

// ==========================================
// AUDIO ENGINE — UI ONLY helpers (no real audio)
// ==========================================
function updateAudioStatus() {
    if (!audioStatusEl) return;
    audioStatusEl.classList.remove("is-ready", "is-preview", "is-off");
    if (audioEngine.isPreviewing) {
        audioStatusEl.classList.add("is-preview");
        audioStatusEl.innerHTML = '<span class="audio-status__dot" aria-hidden="true"></span> PREVIEW';
    } else {
        audioStatusEl.classList.add("is-ready");
        audioStatusEl.innerHTML = '<span class="audio-status__dot" aria-hidden="true"></span> READY';
    }
}

function syncAudioLayer(layer) {
    const isOn = !!audioEngine[layer];
    const layerEl = document.querySelector(`.audio-layer[data-layer="${layer}"]`);
    const toggle = document.querySelector(`.audio-toggle[data-layer="${layer}"]`);
    if (layerEl) layerEl.classList.toggle("is-on", isOn);
    if (toggle) {
        toggle.classList.toggle("is-on", isOn);
        toggle.setAttribute("aria-checked", String(isOn));
    }
}

function syncAudioControls() {
    const map = {
        profile: audioEngine.profile,
        clarity: audioEngine.clarity,
        dynamic: audioEngine.dynamic
    };
    Object.keys(map).forEach((key) => {
        const btn = document.querySelector(`.audio-ctrl__btn[data-ctrl="${key}"]`);
        if (btn) btn.textContent = map[key];
    });
    const noiseBtn = document.querySelector('.audio-ctrl__btn[data-ctrl="noise"]');
    if (noiseBtn) {
        noiseBtn.textContent = audioEngine.noiseReduction ? "NR ON" : "NR OFF";
        noiseBtn.classList.toggle("is-on", audioEngine.noiseReduction);
        noiseBtn.classList.toggle("is-off-toggle", !audioEngine.noiseReduction);
        noiseBtn.setAttribute("aria-checked", String(audioEngine.noiseReduction));
    }
    const loudBtn = document.querySelector('.audio-ctrl__btn[data-ctrl="loudness"]');
    if (loudBtn) {
        loudBtn.textContent = audioEngine.loudness ? "NORMALIZE ON" : "NORMALIZE OFF";
        loudBtn.classList.toggle("is-on", audioEngine.loudness);
        loudBtn.classList.toggle("is-off-toggle", !audioEngine.loudness);
        loudBtn.setAttribute("aria-checked", String(audioEngine.loudness));
    }
}

function toggleAudioLayer(layer) {
    if (!(layer in audioEngine)) return;
    audioEngine[layer] = !audioEngine[layer];
    syncAudioLayer(layer);
}

function updateMasterAudio(value) {
    const v = Math.max(0, Math.min(100, parseInt(value, 10) || 0));
    audioEngine.masterVolume = v;
    if (masterAudioValue) masterAudioValue.textContent = `${v}%`;
    if (masterAudioFill) masterAudioFill.style.width = `${v}%`;
    if (masterAudioSlider && String(masterAudioSlider.value) !== String(v)) {
        masterAudioSlider.value = String(v);
    }
}

function cycleAudioControl(key) {
    if (key === "noise") {
        audioEngine.noiseReduction = !audioEngine.noiseReduction;
        syncAudioControls();
        return;
    }
    if (key === "loudness") {
        audioEngine.loudness = !audioEngine.loudness;
        syncAudioControls();
        return;
    }
    const opts = audioControlOptions[key];
    if (!opts) return;
    const current = audioEngine[key === "profile" ? "profile" : key === "clarity" ? "clarity" : "dynamic"];
    const prop = key === "profile" ? "profile" : key === "clarity" ? "clarity" : "dynamic";
    const idx = opts.indexOf(current);
    const next = opts[(idx + 1) % opts.length];
    audioEngine[prop] = next;
    syncAudioControls();
}

function setAudioPreview(isPreview) {
    audioEngine.isPreviewing = !!isPreview;
    if (audioPreviewBtn) {
        audioPreviewBtn.classList.toggle("is-preview", audioEngine.isPreviewing);
        const textEl = audioPreviewBtn.querySelector(".audio-preview-btn__text");
        const iconEl = audioPreviewBtn.querySelector(".audio-preview-btn__icon");
        if (audioEngine.isPreviewing) {
            if (textEl) textEl.textContent = "PREVIEWING...";
            if (iconEl) iconEl.textContent = "■";
            audioPreviewBtn.setAttribute("aria-label", "Stop audio preview");
            audioPreviewBtn.disabled = false;
        } else {
            if (textEl) textEl.textContent = "AUDIO PREVIEW";
            if (iconEl) iconEl.textContent = "▶";
            audioPreviewBtn.setAttribute("aria-label", "Audio Preview");
        }
    }
    updateAudioStatus();
}

function handleAudioPreview() {
    if (audioEngine.isPreviewing) {
        clearTimeout(audioPreviewTimer);
        audioPreviewTimer = null;
        setAudioPreview(false);
        return;
    }
    setAudioPreview(true);
    clearTimeout(audioPreviewTimer);
    audioPreviewTimer = setTimeout(() => {
        setAudioPreview(false);
        audioPreviewTimer = null;
    }, 1800);
}

function getAudioEngineState() {
    return { ...audioEngine };
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function slugifyPlatform(platform) {
    return platform.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildDownloadFilename(platform) {
    const slug = slugifyPlatform(platform || "video");
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    return `cinematic-ai-${slug}-${ts}.mp4`;
}

function applyPreviewAspect(ratio) {
    if (!videoBox) return;
    videoBox.dataset.ratio = ratio;
}

function updateSelectedInfo(key) {
    const fmt = videoFormats[key];
    if (!fmt) return;
    if (selectedPlatformEl) selectedPlatformEl.textContent = fmt.platform;
    if (selectedRatioEl) selectedRatioEl.textContent = `${fmt.ratio} ${capitalize(fmt.orientation)}`;
    if (selectedResolutionEl) selectedResolutionEl.textContent = `${fmt.width} \u00D7 ${fmt.height}`;
    // Control Deck sync - preview and settings bar
    if (previewPlatform) previewPlatform.textContent = fmt.platform;
    if (previewRatio) previewRatio.textContent = fmt.ratio;
    if (previewRes) previewRes.textContent = `${fmt.width} \u00D7 ${fmt.height}`;
    if (previewMeta) previewMeta.textContent = `${fmt.ratio} • ${fmt.width}\u00D7${fmt.height}`;
    if (settingAspect) settingAspect.textContent = fmt.ratio;
    if (settingRes) settingRes.textContent = `${fmt.width}\u00D7${fmt.height}`;
    applyPreviewAspect(fmt.ratio);
}

function setSelectedFormat(key) {
    if (!videoFormats[key]) return;
    selectedFormat = key;
    formatCards.forEach((card) => {
        const isSel = card.dataset.format === key;
        card.classList.toggle("is-selected", isSel);
        card.setAttribute("aria-checked", String(isSel));
    });
    updateSelectedInfo(key);
    if (!generatedVideoUrl) {
        updateVideoResult();
    }
}

// ==========================================
// AI BRAIN - PROMPT ENGINE
// ==========================================

function parsePromptInput() {
    const raw = promptInput.value;
    const trimmed = raw.trim();
    return {
        raw: raw,
        trimmed: trimmed,
        mode: promptMode
    };
}

function validateJSONPrompt(jsonStr) {
    const trimmed = jsonStr.trim();
    if (!trimmed) {
        return { valid: false, error: "JSON kosong", parsed: null };
    }
    try {
        const parsed = JSON.parse(jsonStr);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
            return { valid: false, error: "JSON harus berupa object", parsed: null };
        }
        return { valid: true, parsed: parsed, error: null };
    } catch (e) {
        return { valid: false, error: e.message, parsed: null };
    }
}

function normalizePrompt(parsed) {
    const get = (obj, keys) => {
        for (const k of keys) {
            if (obj[k] !== undefined && obj[k] !== null) return obj[k];
        }
        return "";
    };
    const cinematicPrompt = {
        subject: String(get(parsed, ["subject"]) || ""),
        environment: String(get(parsed, ["environment"]) || ""),
        style: String(get(parsed, ["style"]) || ""),
        lighting: String(get(parsed, ["lighting"]) || ""),
        colorPalette: String(get(parsed, ["color_palette", "colorPalette"]) || ""),
        composition: String(get(parsed, ["composition"]) || ""),
        faceDetails: String(get(parsed, ["face_details", "faceDetails"]) || ""),
        technicalSettings: String(get(parsed, ["technical_settings", "technicalSettings"]) || ""),
        mood: String(get(parsed, ["mood"]) || ""),
        negativePrompt: String(get(parsed, ["negative_prompt", "negativePrompt"]) || "")
    };
    return cinematicPrompt;
}

function buildGenerationPrompt(cinematicPrompt) {
    const sections = [
        ["SUBJECT", cinematicPrompt.subject],
        ["ENVIRONMENT", cinematicPrompt.environment],
        ["STYLE", cinematicPrompt.style],
        ["LIGHTING", cinematicPrompt.lighting],
        ["COLOR PALETTE", cinematicPrompt.colorPalette],
        ["COMPOSITION", cinematicPrompt.composition],
        ["FACE DETAILS", cinematicPrompt.faceDetails],
        ["TECHNICAL SETTINGS", cinematicPrompt.technicalSettings],
        ["MOOD", cinematicPrompt.mood],
        ["NEGATIVE PROMPT", cinematicPrompt.negativePrompt]
    ];
    return sections.map(([label, val]) => `${label}:\n${val && String(val).trim() ? String(val).trim() : "-"}`).join("\n\n");
}

function buildGenerationSettings() {
    const fmt = videoFormats[selectedFormat];
    if (!fmt) return null;

    if (promptMode === "natural") {
        const raw = promptInput.value.trim();
        return {
            promptType: "natural",
            prompt: raw,
            generationPrompt: raw,
            cinematicPrompt: null,
            platform: fmt.platform,
            aspectRatio: fmt.ratio,
            width: fmt.width,
            height: fmt.height,
            orientation: fmt.orientation,
            generatedBy: brandConfig.generatedBy,
            brand: { ...brandConfig }
        };
    } else {
        const validation = validateJSONPrompt(promptInput.value);
        if (!validation.valid) return null;
        const cinematicPrompt = normalizePrompt(validation.parsed);
        const generationPrompt = buildGenerationPrompt(cinematicPrompt);
        return {
            promptType: "json",
            prompt: generationPrompt,
            generationPrompt: generationPrompt,
            cinematicPrompt: cinematicPrompt,
            platform: fmt.platform,
            aspectRatio: fmt.ratio,
            width: fmt.width,
            height: fmt.height,
            orientation: fmt.orientation,
            generatedBy: brandConfig.generatedBy,
            brand: { ...brandConfig }
        };
    }
}

async function generateVideo(generationSettings) {
    // API integration will be added later
    // Untuk sekarang hanya log dan return mock
    console.log("[AI Brain] generateVideo called with:", generationSettings);
    console.log("[AI Brain] generationPrompt:\n", generationSettings.generationPrompt || generationSettings.prompt);
    return {
        videoUrl: DUMMY_VIDEO_URL,
        platform: generationSettings.platform,
        aspectRatio: generationSettings.aspectRatio,
        width: generationSettings.width,
        height: generationSettings.height
    };
}

function updateJsonStatus(validation) {
    if (!jsonStatus) return;
    if (promptMode !== "json") {
        jsonStatus.hidden = true;
        return;
    }
    const raw = promptInput.value.trim();
    if (!raw) {
        jsonStatus.hidden = true;
        return;
    }
    if (validation.valid) {
        jsonStatus.textContent = "\u2713 JSON PROMPT VALID";
        jsonStatus.className = "json-status is-valid";
        jsonStatus.hidden = false;
    } else {
        jsonStatus.textContent = `\u26A0 Invalid JSON: ${validation.error}`;
        jsonStatus.className = "json-status is-invalid";
        jsonStatus.hidden = false;
    }
}

function updateAIBrainPanel(validation) {
    if (!aiBrainPanel) return;

    // Control Deck: handle both natural and json states
    const isJson = promptMode === "json";
    const isValid = isJson && validation && validation.valid;

    if (!isJson) {
        // Natural mode - show natural hint, hide json details
        if (aiBrainNatural) aiBrainNatural.hidden = false;
        if (aiBrainJson) aiBrainJson.hidden = true;
        if (aiBrainBadge) {
            aiBrainBadge.textContent = "NATURAL";
            aiBrainBadge.className = "ai-brain-badge";
        }
        aiBrainPanel.hidden = false;
        // Mark all chips as not detected in natural mode
        document.querySelectorAll(".ai-brain-chip").forEach((el) => {
            el.classList.remove("is-detected");
        });
        document.querySelectorAll(".ai-brain-param").forEach((el) => {
            el.classList.remove("is-detected");
            el.classList.add("is-missing");
        });
        return;
    }

    // JSON mode
    if (!validation || !validation.valid) {
        if (aiBrainNatural) aiBrainNatural.hidden = true;
        if (aiBrainJson) aiBrainJson.hidden = true;
        // Keep panel visible but show placeholder? For invalid, hide json details
        aiBrainPanel.hidden = false;
        if (aiBrainBadge) {
            aiBrainBadge.textContent = "INVALID";
            aiBrainBadge.className = "ai-brain-badge is-error";
        }
        return;
    }

    // Valid JSON
    if (aiBrainNatural) aiBrainNatural.hidden = true;
    if (aiBrainJson) aiBrainJson.hidden = false;

    const cinematicPrompt = normalizePrompt(validation.parsed);
    const total = 10;
    const detectedCount = Object.values(cinematicPrompt).filter((v) => String(v).trim().length > 0).length;

    if (aiBrainBadge) {
        aiBrainBadge.textContent = "JSON VALID";
        aiBrainBadge.className = "ai-brain-badge";
    }
    if (aiBrainValid) {
        aiBrainValid.textContent = "\u2713 JSON VALID";
        aiBrainValid.className = "ai-brain-status__item is-ok";
    }
    if (aiBrainCount) {
        aiBrainCount.textContent = `\u2713 ${detectedCount} / ${total} PARAMETERS`;
        aiBrainCount.className = "ai-brain-status__item is-ok";
    }

    const chipEls = document.querySelectorAll(".ai-brain-chip");
    chipEls.forEach((el) => {
        const key = el.dataset.param;
        const has = String(cinematicPrompt[key] || "").trim().length > 0;
        el.classList.toggle("is-detected", has);
    });

    const paramEls = document.querySelectorAll(".ai-brain-param");
    paramEls.forEach((el) => {
        const key = el.dataset.param;
        const has = String(cinematicPrompt[key] || "").trim().length > 0;
        el.classList.toggle("is-detected", has);
        el.classList.toggle("is-missing", !has);
    });

    aiBrainPanel.hidden = false;
}

function setPromptMode(mode) {
    if (mode !== "natural" && mode !== "json") return;
    promptMode = mode;

    promptModeBtns.forEach((btn) => {
        const isActive = btn.dataset.mode === mode;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-selected", String(isActive));
    });

    if (promptBox) promptBox.classList.toggle("is-json", mode === "json");

    if (mode === "json") {
        promptInput.placeholder = JSON_PLACEHOLDER;
    } else {
        promptInput.placeholder = NATURAL_PLACEHOLDER;
    }

    clearError();

    if (mode === "json") {
        const validation = validateJSONPrompt(promptInput.value);
        updateJsonStatus(validation);
        updateAIBrainPanel(validation);
    } else {
        if (jsonStatus) jsonStatus.hidden = true;
        // Show natural AI Brain state
        updateAIBrainPanel({ valid: false, parsed: null });
    }
}

// ==========================================
// DOWNLOAD & RESULT HELPERS (SIAP API)
// ==========================================

function updateDownloadButton() {
    const hasVideo = !!generatedVideoUrl;
    if (downloadBtn) downloadBtn.disabled = !hasVideo;
    if (playBtn) playBtn.disabled = !hasVideo;
    if (resetBtn) resetBtn.hidden = !hasVideo;
}

function updateVideoResult() {
    const settings = lastGenerationSettings || videoFormats[selectedFormat];
    if (!settings) return;

    const platform = settings.platform || videoFormats[selectedFormat].platform;
    const ratio = settings.aspectRatio || settings.ratio || videoFormats[selectedFormat].ratio;
    const width = settings.width || videoFormats[selectedFormat].width;
    const height = settings.height || videoFormats[selectedFormat].height;

    if (videoInfoPlatform) videoInfoPlatform.textContent = platform;
    if (videoInfoRatio) videoInfoRatio.textContent = ratio;
    if (videoInfoRes) videoInfoRes.textContent = `${width} \u00D7 ${height}`;

    // Sync Control Deck preview and settings bar
    if (previewPlatform) previewPlatform.textContent = platform;
    if (previewRatio) previewRatio.textContent = ratio;
    if (previewRes) previewRes.textContent = `${width} \u00D7 ${height}`;
    if (previewMeta) previewMeta.textContent = `${ratio} • ${width}\u00D7${height}`;
    if (settingAspect) settingAspect.textContent = ratio;
    if (settingRes) settingRes.textContent = `${width}\u00D7${height}`;
    if (resultMetaLabel) resultMetaLabel.textContent = generatedVideoUrl ? "READY" : "WAITING";

    if (videoResultBar) videoResultBar.hidden = false;
}

function setGeneratedVideo(url) {
    generatedVideoUrl = url || null;
    updateVideoResult();
    updateDownloadButton();
    if (videoResultBar) videoResultBar.hidden = false;
}

function downloadGeneratedVideo() {
    if (!generatedVideoUrl) {
        showToast("Generate video terlebih dahulu.", true);
        return;
    }

    try {
        const fmt = lastGenerationSettings || videoFormats[selectedFormat];
        const platform = fmt ? fmt.platform : "video";
        const fileName = buildDownloadFilename(platform);

        const link = document.createElement("a");
        link.href = generatedVideoUrl;
        link.download = fileName;
        link.rel = "noopener";
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        link.remove();

        if (generatedVideoUrl.startsWith("blob:")) {
            setTimeout(() => {
                try { URL.revokeObjectURL(generatedVideoUrl); } catch (_) {}
            }, 1000);
        }

        showToast(`Download ${fileName} dimulai`);
    } catch (err) {
        showToast("Gagal memulai download", true);
    }
}

function setGenerating(state) {
    isGenerating = state;
    generateBtn.disabled = state;
    generateBtn.classList.toggle("is-loading", state);
    if (state) {
        generateBtn.innerHTML = `GENERATING... <span aria-hidden="true">\u25CC</span>`;
        if (generateStatus) generateStatus.textContent = "GENERATING...";
    } else {
        generateBtn.innerHTML = `<span class="generate-btn__icon" aria-hidden="true">\u2726</span><span class="generate-btn__text">GENERATE CINEMATIC VIDEO</span>`;
        if (generateStatus) generateStatus.textContent = "READY TO GENERATE";
    }

    if (videoBox) videoBox.setAttribute("aria-busy", String(state));

    if (state) {
        emptyState.hidden = true;
        resultVideo.hidden = true;
        resultVideo.removeAttribute("src");
        resultVideo.load();
        if (resultMeta) resultMeta.hidden = true;
        loadingState.hidden = false;
        if (resultMetaLabel) resultMetaLabel.textContent = "GENERATING";
        updateClearButton();
    } else {
        loadingState.hidden = true;
        if (resultMetaLabel && !generatedVideoUrl) resultMetaLabel.textContent = "WAITING";
        updateCharCount();
    }
}

function showVideoResult(videoUrl, generationSettings) {
    loadingState.hidden = true;
    emptyState.hidden = true;
    resultVideo.src = videoUrl;
    resultVideo.hidden = false;
    resultVideo.load();
    resultVideo.muted = true;
    const playPromise = resultVideo.play();
    if (playPromise) playPromise.catch(() => {});

    if (generationSettings) {
        lastGenerationSettings = generationSettings;
        lastCinematicPrompt = generationSettings.cinematicPrompt || null;
        lastGenerationPrompt = generationSettings.generationPrompt || generationSettings.prompt || "";
    }
    setGeneratedVideo(videoUrl);

    if (resultMeta && generationSettings) {
        if (metaPlatform) metaPlatform.textContent = generationSettings.platform;
        if (metaRatio) metaRatio.textContent = generationSettings.aspectRatio;
        if (metaResolution) metaResolution.textContent = `${generationSettings.width} \u00D7 ${generationSettings.height}`;
        if (metaOrientation) metaOrientation.textContent = capitalize(generationSettings.orientation);
        const promptToShow = generationSettings.generationPrompt || generationSettings.prompt || "";
        if (metaPrompt) metaPrompt.textContent = promptToShow.length > 180 ? promptToShow.slice(0, 180) + "..." : promptToShow;
        resultMeta.hidden = false;
    }

    if (generationSettings) applyPreviewAspect(generationSettings.aspectRatio);

    showToast(`Video ${generationSettings.platform} ${generationSettings.aspectRatio} berhasil digenerate (mock)`);
}

function resetResult() {
    resultVideo.pause();
    resultVideo.hidden = true;
    resultVideo.removeAttribute("src");
    resultVideo.load();
    if (resultMeta) resultMeta.hidden = true;
    emptyState.hidden = false;
    loadingState.hidden = true;
    if (videoBox) videoBox.setAttribute("aria-busy", "false");
    setGeneratedVideo(null);
    promptInput.focus();
}

// ==========================================
// VALIDATION
// ==========================================

function validatePrompt(prompt) {
    if (!prompt) {
        return "Silakan masukkan prompt video terlebih dahulu.";
    }
    if (prompt.length < 5) {
        return "Prompt terlalu pendek. Jelaskan adegan minimal 5 karakter.";
    }
    if (prompt.length > MAX_LENGTH) {
        return `Prompt melebihi ${MAX_LENGTH} karakter.`;
    }
    return null;
}

// ==========================================
// GENERATE HANDLER - AI BRAIN PIPELINE
// ==========================================

async function handleGenerate() {
    if (isGenerating) return;

    clearError();

    let generationSettings = null;

    if (promptMode === "natural") {
        const prompt = promptInput.value.trim();
        const error = validatePrompt(prompt);
        if (error) {
            showError(error);
            showToast(error, true);
            promptInput.focus();
            return;
        }
        generationSettings = buildGenerationSettings();
    } else {
        const raw = promptInput.value.trim();
        if (!raw) {
            const msg = "Silakan masukkan JSON prompt terlebih dahulu.";
            showError(msg);
            showToast(msg, true);
            promptInput.focus();
            return;
        }
        const validation = validateJSONPrompt(promptInput.value);
        updateJsonStatus(validation);
        updateAIBrainPanel(validation);
        if (!validation.valid) {
            const msg = `Invalid JSON: ${validation.error}`;
            showError(msg);
            showToast(`\u26A0 Invalid JSON: ${validation.error}`, true);
            promptInput.focus();
            return;
        }
        generationSettings = buildGenerationSettings();
        if (!generationSettings) {
            const msg = "Gagal memproses JSON prompt.";
            showError(msg);
            showToast(msg, true);
            return;
        }
    }

    lastGenerationSettings = generationSettings;
    lastCinematicPrompt = generationSettings.cinematicPrompt || null;
    lastGenerationPrompt = generationSettings.generationPrompt || generationSettings.prompt || "";

    console.log("[AI Brain] generationSettings:", generationSettings);
    if (generationSettings.promptType === "json") {
        console.log("[AI Brain] cinematicPrompt:", generationSettings.cinematicPrompt);
        console.log("[AI Brain] generationPrompt:\n", generationSettings.generationPrompt);
    }

    // Tampilkan ringkasan konfigurasi pada UI via toast
    showToast(`AI Brain: ${generationSettings.promptType === "json" ? "JSON" : "Natural"} • ${generationSettings.platform} ${generationSettings.aspectRatio}`);

    setGenerating(true);

    try {
        // Untuk sementara jangan memanggil API video palsu
        // const response = await generateVideo(generationSettings);
        // setGeneratedVideo(response.videoUrl);
        // showVideoResult(response.videoUrl, generationSettings);

        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Simulasi sukses — tampilkan dummy video + info settings
        // generationSettings sudah siap untuk: await generateVideo(generationSettings)
        showVideoResult(DUMMY_VIDEO_URL, generationSettings);
    } catch (err) {
        resetResult();
        const msg = err && err.message ? err.message : "Gagal generate video. Coba lagi.";
        showError(msg);
        showToast(msg, true);
    } finally {
        setGenerating(false);
        loadingState.hidden = true;
        if (videoBox) videoBox.setAttribute("aria-busy", "false");
    }
}

// ==========================================
// EVENTS
// ==========================================

generateBtn.addEventListener("click", handleGenerate);

if (clearPromptBtn) {
    clearPromptBtn.addEventListener("click", clearPrompt);
}

promptInput.addEventListener("input", () => {
    updateCharCount();
    if (!promptError.hidden) clearError();

    // Live JSON validation & AI Brain panel update
    if (promptMode === "json") {
        const validation = validateJSONPrompt(promptInput.value);
        updateJsonStatus(validation);
        updateAIBrainPanel(validation);
    } else {
        // Keep AI Brain in natural state live
        updateAIBrainPanel({ valid: false, parsed: null });
    }
});

promptInput.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
    }
});

// Prompt mode switch
promptModeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        setPromptMode(btn.dataset.mode);
    });
});

// Format cards events
formatCards.forEach((card) => {
    card.addEventListener("click", () => {
        setSelectedFormat(card.dataset.format);
    });
    card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSelectedFormat(card.dataset.format);
        }
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            const cards = Array.from(formatCards);
            const idx = cards.indexOf(card);
            const next = cards[(idx + 1) % cards.length];
            next.focus();
            setSelectedFormat(next.dataset.format);
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            const cards = Array.from(formatCards);
            const idx = cards.indexOf(card);
            const prev = cards[(idx - 1 + cards.length) % cards.length];
            prev.focus();
            setSelectedFormat(prev.dataset.format);
        }
    });
});

if (resetBtn) {
    resetBtn.addEventListener("click", () => {
        resetResult();
        showToast("Siap buat video baru");
    });
}

if (downloadBtn) {
    downloadBtn.addEventListener("click", (e) => {
        e.preventDefault();
        downloadGeneratedVideo();
    });
}

if (playBtn) {
    playBtn.addEventListener("click", () => {
        if (!generatedVideoUrl) {
            showToast("Generate video terlebih dahulu.", true);
            return;
        }
        if (resultVideo.hidden) {
            showToast("Video belum siap", true);
            return;
        }
        resultVideo.play().catch(() => {
            showToast("Gagal memutar video", true);
        });
    });
}

resultVideo.addEventListener("error", () => {
    showToast("Gagal memuat video preview", true);
});

// Audio Engine — UI only (mock)
document.querySelectorAll(".audio-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
        const layer = btn.dataset.layer;
        if (layer) toggleAudioLayer(layer);
    });
});

document.querySelectorAll(".audio-ctrl__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        const ctrl = btn.dataset.ctrl;
        if (ctrl) cycleAudioControl(ctrl);
    });
});

if (masterAudioSlider) {
    masterAudioSlider.addEventListener("input", (e) => {
        updateMasterAudio(e.target.value);
    });
    masterAudioSlider.addEventListener("change", (e) => {
        updateMasterAudio(e.target.value);
    });
}

if (audioPreviewBtn) {
    audioPreviewBtn.addEventListener("click", handleAudioPreview);
}

// Init
updateCharCount();
setSelectedFormat(selectedFormat);
setPromptMode(promptMode);
updateVideoResult();
updateDownloadButton();

// Audio Engine init (UI only)
["ambience", "foley", "voice", "music"].forEach(syncAudioLayer);
syncAudioControls();
updateMasterAudio(audioEngine.masterVolume);
updateAudioStatus();
setAudioPreview(false);

// Expose for debugging / future API integration
window.brandConfig = brandConfig;
window.videoFormats = videoFormats;
window.getSelectedFormat = () => videoFormats[selectedFormat];
window.getLastGenerationSettings = () => lastGenerationSettings;
window.getLastCinematicPrompt = () => lastCinematicPrompt;
window.getLastGenerationPrompt = () => lastGenerationPrompt;
window.getPromptMode = () => promptMode;
window.setGeneratedVideo = setGeneratedVideo;
window.downloadGeneratedVideo = downloadGeneratedVideo;
window.getGeneratedVideoUrl = () => generatedVideoUrl;
window.parsePromptInput = parsePromptInput;
window.validateJSONPrompt = validateJSONPrompt;
window.normalizePrompt = normalizePrompt;
window.buildGenerationPrompt = buildGenerationPrompt;
window.buildGenerationSettings = buildGenerationSettings;
window.generateVideo = generateVideo;
window.getBrandConfig = () => ({ ...brandConfig });
window.audioEngine = audioEngine;
window.getAudioEngineState = getAudioEngineState;
window.toggleAudioLayer = toggleAudioLayer;
window.updateMasterAudio = updateMasterAudio;
window.cycleAudioControl = cycleAudioControl;
window.handleAudioPreview = handleAudioPreview;
