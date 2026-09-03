// ==========================================
// CINEMATIC AI - SCRIPT RAPIH
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
const videoActions = document.getElementById("videoActions");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");
const toast = document.getElementById("toast");

const MAX_LENGTH = 2000;
const DUMMY_VIDEO_URL = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

let isGenerating = false;
let toastTimer = null;

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

function updateCharCount() {
    const len = promptInput.value.length;
    charCount.textContent = `${len} / ${MAX_LENGTH}`;

    charCount.classList.remove("is-warning", "is-error");
    if (len > MAX_LENGTH) {
        charCount.classList.add("is-error");
    } else if (len > MAX_LENGTH * 0.9) {
        charCount.classList.add("is-warning");
    }

    // Sync disable: cegah generate jika melebihi batas (jaga kalau maxlength dihapus)
    if (len > MAX_LENGTH && !isGenerating) {
        generateBtn.disabled = true;
    } else if (!isGenerating) {
        generateBtn.disabled = false;
    }
}

function setGenerating(state) {
    isGenerating = state;
    generateBtn.disabled = state;
    generateBtn.classList.toggle("is-loading", state);
    generateBtn.innerHTML = state
        ? `GENERATING... <span aria-hidden="true">◌</span>`
        : `GENERATE VIDEO <span aria-hidden="true">✦</span>`;

    if (videoBox) videoBox.setAttribute("aria-busy", String(state));

    if (state) {
        emptyState.hidden = true;
        resultVideo.hidden = true;
        resultVideo.removeAttribute("src");
        resultVideo.load();
        if (videoActions) videoActions.hidden = true;
        loadingState.hidden = false;
    } else {
        loadingState.hidden = true;
    }
}

function showVideoResult(videoUrl) {
    loadingState.hidden = true;
    emptyState.hidden = true;
    resultVideo.src = videoUrl;
    resultVideo.hidden = false;
    resultVideo.load();
    // Auto-play preview muted (hindari autoplay block)
    resultVideo.muted = true;
    const playPromise = resultVideo.play();
    if (playPromise) playPromise.catch(() => {});

    if (videoActions) {
        videoActions.hidden = false;
        if (downloadBtn) {
            downloadBtn.href = videoUrl;
            downloadBtn.setAttribute("download", "cinematic-video.mp4");
        }
    }
    showToast("Video berhasil digenerate (dummy) — siap sambung API real");
}

function resetResult() {
    resultVideo.pause();
    resultVideo.hidden = true;
    resultVideo.removeAttribute("src");
    resultVideo.load();
    if (videoActions) videoActions.hidden = true;
    emptyState.hidden = false;
    loadingState.hidden = true;
    if (videoBox) videoBox.setAttribute("aria-busy", "false");
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
// GENERATE HANDLER
// ==========================================

async function handleGenerate() {
    if (isGenerating) return;

    const prompt = promptInput.value.trim();
    const error = validatePrompt(prompt);

    if (error) {
        showError(error);
        showToast(error, true);
        promptInput.focus();
        return;
    }

    clearError();
    setGenerating(true);

    try {
        // TODO: Ganti blok simulasi ini dengan fetch API real
        // const { jobId } = await api.generateVideo(prompt)
        // const videoUrl = await api.pollUntilDone(jobId)

        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Simulasi sukses — tampilkan dummy video supaya UX tidak balik kosong
        showVideoResult(DUMMY_VIDEO_URL);
    } catch (err) {
        resetResult();
        const msg = err && err.message ? err.message : "Gagal generate video. Coba lagi.";
        showError(msg);
        showToast(msg, true);
    } finally {
        setGenerating(false);
        // Pastikan loading hilang meski sukses (showVideoResult sudah hide loading)
        loadingState.hidden = true;
        if (videoBox) videoBox.setAttribute("aria-busy", "false");
    }
}

// ==========================================
// EVENTS
// ==========================================

generateBtn.addEventListener("click", handleGenerate);

promptInput.addEventListener("input", () => {
    updateCharCount();
    if (!promptError.hidden) clearError();
});

promptInput.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + Enter untuk generate (Enter biasa tetap new line)
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
    }
});

if (resetBtn) {
    resetBtn.addEventListener("click", () => {
        resetResult();
        showToast("Siap buat video baru");
    });
}

if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
        showToast("Download dimulai");
    });
}

resultVideo.addEventListener("error", () => {
    showToast("Gagal memuat video preview", true);
});

// Init
updateCharCount();
