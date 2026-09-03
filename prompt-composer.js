/**
 * NEXORA CINEMATIC AI
 * Prompt Composer v1.0
 *
 * Combines user intent + cinematic directive + naturalism directive
 * into a single natural-language Cinematic Master Prompt
 *
 * Architecture:
 * USER PROMPT -> SCHEMA -> DIRECTOR -> NATURALISM -> COMPOSER -> MASTER PROMPT
 */

export const PROMPT_COMPOSER_VERSION = "1.0";

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

function cleanSentence(text) {
  return trimString(text).replace(/\s+/g, " ");
}

function dedupePhrases(phrases) {
  const seen = new Set();
  const out = [];
  for (const p of phrases) {
    const key = p.toLowerCase();
    if (!seen.has(key) && p) {
      seen.add(key);
      out.push(p);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateInputs(schema, cinematicDirective, naturalismDirective) {
  if (!isObject(schema)) {
    throw new Error("Invalid schema: schema is required");
  }
  if (!isObject(cinematicDirective)) {
    throw new Error("Invalid cinematic directive: cinematicDirective is required");
  }
  if (!isObject(naturalismDirective)) {
    throw new Error("Invalid naturalism directive: naturalismDirective is required");
  }

  if (!isObject(schema.scene) || !isObject(schema.subject)) {
    throw new Error("Invalid schema: schema is required");
  }
  // More specific minimal checks per spec
  if (!isObject(schema.scene)) throw new Error("Invalid schema: schema is required");
  if (!isObject(schema.subject)) throw new Error("Invalid schema: schema is required");

  const dirRequired = ["sceneDirection", "cameraDirection", "lightingDirection"];
  for (const k of dirRequired) {
    if (!isObject(cinematicDirective[k])) {
      throw new Error("Invalid cinematic directive: cinematicDirective is required");
    }
  }

  const natRequired = ["lighting", "materials", "motion"];
  for (const k of natRequired) {
    if (!isObject(naturalismDirective[k])) {
      throw new Error("Invalid naturalism directive: naturalismDirective is required");
    }
  }
}

// ---------------------------------------------------------------------------
// Section Composers
// ---------------------------------------------------------------------------

function composeOpening(schema, directive) {
  const duration = isValidDuration(schema.scene.duration) ? Math.round(Number(schema.scene.duration)) : null;
  const env = trimString(directive.sceneDirection.environment);
  const time = trimString(directive.sceneDirection.timeOfDay);
  const hasEnv = env && env !== "neutral cinematic environment";
  const hasTime = time && time !== "neutral cinematic time";

  let text = "";
  if (duration !== null) {
    if (hasEnv) {
      text = `A cinematic ${duration}-second continuous shot unfolds in ${env}`;
    } else {
      text = `A cinematic ${duration}-second continuous shot unfolds`;
    }
  } else {
    if (hasEnv) {
      text = `A cinematic continuous shot unfolds in ${env}`;
    } else {
      text = `A cinematic continuous shot unfolds`;
    }
  }

  if (hasTime) {
    text += ` during ${time}`;
  }

  text += ".";

  // Add visual priority if meaningful and not generic balanced
  const vp = trimString(directive.sceneDirection.visualPriority);
  if (vp && vp !== "balanced cinematic composition" && hasEnv) {
    // Keep opening concise, don't over-describe
  }

  return cleanSentence(text);
}

function composeSubject(schema) {
  const stripPunct = (s) => trimString(s).replace(/[.!?]+$/g, "").trim();
  const desc = stripPunct(schema.subject.description);
  const action = stripPunct(schema.subject.action);
  const appearance = stripPunct(schema.subject.appearance);
  const behavior = stripPunct(schema.subject.behavior);

  if (!desc && !action && !appearance && !behavior) {
    return "";
  }

  let parts = [];
  if (desc && action) {
    // Natural combination without "is seen" spam; handle verb phrasing
    if (/^(is|are|was|were|be|being|been)\b/i.test(action)) {
      parts.push(`${desc} ${action}`);
    } else {
      // Avoid "is seen explores" duplication; join directly
      const lowerAction = action.toLowerCase();
      const lowerDesc = desc.toLowerCase();
      if (lowerAction.startsWith(lowerDesc)) {
        parts.push(action);
      } else {
        parts.push(`${desc} ${action}`);
      }
    }
  } else if (desc) {
    parts.push(`${desc} is present`);
  } else if (action) {
    parts.push(`${action}`);
  }

  if (appearance) {
    parts.push(`showing ${appearance}`);
  }
  if (behavior && behavior !== action) {
    parts.push(behavior);
  }

  let text = parts.join(" ") + ".";
  // Normalize: ensure first letter capital, ensure not double period
  text = text.replace(/\s+/g, " ").replace(/\.\./g, ".");
  // Capitalize first letter
  if (text.length > 0) text = text.charAt(0).toUpperCase() + text.slice(1);
  return cleanSentence(text);
}

function composeEnvironment(schema, directive) {
  const env = trimString(directive.sceneDirection.environment);
  const hasEnv = env && env !== "neutral cinematic environment";
  const schemaEnv = trimString(schema.scene.environment);
  const location = trimString(schema.scene.location);
  const weather = trimString(schema.scene.weather);

  // If opening already described environment, keep this subtle or skip if duplicate
  // Only add if there's additional nuance
  const parts = [];
  if (hasEnv && schemaEnv && env !== schemaEnv) {
    parts.push(`The surrounding environment reveals ${schemaEnv} within ${env}`);
  } else if (hasEnv && !schemaEnv) {
    // Opening already covers, add depth nuance via directive visualPriority
    const vp = trimString(directive.sceneDirection.visualPriority);
    if (vp === "environmental depth" || vp === "subject clarity and environmental depth") {
      parts.push(`The environment extends with natural depth and layered separation`);
    }
  }

  if (weather) {
    parts.push(`under ${weather} conditions`);
  }
  if (location && location !== env && location !== schemaEnv) {
    if (parts.length === 0) {
      parts.push(`The scene is set near ${location}`);
    } else {
      parts.push(`near ${location}`);
    }
  }

  if (parts.length === 0) return "";

  let text = parts.join(" ") + ".";
  // Ensure sentence starts with capital
  text = text.charAt(0).toUpperCase() + text.slice(1);
  return cleanSentence(text);
}

function composeCamera(directive) {
  const cam = directive.cameraDirection;
  const perspective = trimString(cam.perspective);
  const movement = trimString(cam.movement);
  const framing = trimString(cam.framing);
  const lens = trimString(cam.lens);
  const depth = trimString(cam.depthOfField);
  const stab = trimString(cam.stabilization);

  const hasPersp = perspective && perspective !== "cinematic";
  const hasMovement = movement && movement !== "subtle cinematic movement";
  const hasFraming = framing && framing !== "subject centered with environmental depth" && framing !== "balanced cinematic framing";
  const hasLens = lens && lens !== "cinematic lens perspective";
  const hasDepth = depth && depth !== "natural depth of field";
  const hasStab = stab && stab !== "natural stabilization";

  // Build natural sentence, even if values are generic we still describe generically but keep coherence
  const sentences = [];

  let camSentence = "The camera";
  if (hasPersp) {
    if (perspective.toLowerCase().includes("first-person") || perspective.toLowerCase().includes("pov")) {
      camSentence += " maintains an immersive first-person perspective";
    } else {
      camSentence += ` maintains a ${perspective.toLowerCase()} perspective`;
    }
  } else {
    camSentence += " maintains a cinematic perspective";
  }

  if (hasLens) {
    if (lens.toLowerCase().includes("wide")) {
      camSentence += " with a wide action-camera framing";
    } else {
      camSentence += ` with ${lens.toLowerCase()}`;
    }
  }

  if (cam.focalLength && typeof cam.focalLength === "number") {
    // Integrate focal length naturally only if wide
    if (hasLens && lens.toLowerCase().includes("wide")) {
      camSentence += ` (${cam.focalLength}mm)`;
    }
  }

  if (hasMovement) {
    // movement already enriched: e.g., "slow controlled forward movement with subtle handheld reaction"
    const lower = movement.toLowerCase();
    if (lower.includes("handheld")) {
      camSentence += `, moving slowly forward with a subtle handheld response`;
    } else if (lower.includes("subtle cinematic")) {
      camSentence += `, moving with subtle cinematic motion`;
    } else {
      camSentence += `, moving ${movement.toLowerCase()}`;
    }
  } else {
    camSentence += `, moving with subtle cinematic motion`;
  }

  if (hasFraming) {
    camSentence += `, framed as ${framing.toLowerCase()}`;
  } else if (hasDepth) {
    camSentence += `, preserving ${depth.toLowerCase()}`;
  }

  if (hasStab) {
    // avoid "perfectly stabilized"
    if (stab.toLowerCase().includes("natural")) {
      camSentence += ` and stabilized naturally`;
    } else {
      camSentence += ` with ${stab.toLowerCase()}`;
    }
  } else {
    camSentence += ` with natural stabilization`;
  }

  camSentence += ".";

  // Add depth of field nuance if not already included and meaningful
  if (hasDepth && !camSentence.toLowerCase().includes(depth.toLowerCase())) {
    sentences.push(`Depth of field maintains ${depth.toLowerCase()}.`);
  }

  sentences.unshift(camSentence);

  return cleanSentence(sentences.join(" "));
}

function composeLighting(directive, naturalism) {
  const light = directive.lightingDirection;
  const natLight = naturalism.lighting;

  const keyLight = trimString(light.keyLight);
  const direction = trimString(light.direction);
  const intensity = trimString(light.intensity);
  const shadow = trimString(light.shadowBehavior);
  const hasKey = keyLight && keyLight !== "soft cinematic key light";
  const hasDir = direction && direction !== "natural directional light";
  const hasIntensity = intensity && intensity !== "balanced cinematic intensity";
  const volumetric = Boolean(light.volumetric);

  let sentence = "";

  if (hasKey && hasDir) {
    sentence = `${keyLight} casts ${direction.toLowerCase()}`;
  } else if (hasKey) {
    sentence = `${keyLight} illuminates the scene`;
  } else if (hasDir) {
    sentence = `Directional light falls ${direction.toLowerCase()}`;
  } else {
    sentence = `Soft cinematic light illuminates the scene`;
  }

  // Add shadow behavior naturally
  if (shadow && shadow !== "natural shadows") {
    sentence += `, creating ${shadow.toLowerCase()}`;
  } else {
    sentence += ` with natural shadow behavior`;
  }

  // Add intensity nuance
  if (hasIntensity) {
    if (intensity.toLowerCase().includes("high contrast")) {
      sentence += ` and high contrast that sculpts form while retaining detail in darkness`;
    } else {
      sentence += ` with balanced intensity`;
    }
  }

  // Add volumetric and naturalism light falloff subtly
  const falloff = trimString(natLight.lightFalloff);
  if (falloff && falloff.includes("falloff")) {
    if (volumetric) {
      sentence += `, light falls with physically plausible falloff through volumetric space`;
    } else {
      sentence += `, light exhibits ${falloff.toLowerCase()}`;
    }
  }

  // Exposure naturalism
  const exposure = trimString(natLight.exposure);
  if (exposure && exposure.includes("controlled highlights")) {
    sentence += ` and natural exposure preserves highlight and shadow detail`;
  }

  sentence += ".";

  return cleanSentence(sentence);
}

function composeColor(directive) {
  const col = directive.colorDirection;
  const palette = Array.isArray(col.palette) ? col.palette : [];
  const saturation = trimString(col.saturation);
  const contrast = trimString(col.contrast);
  const science = trimString(col.colorScience);

  let sentence = "";
  const parts = [];

  if (palette.length > 0) {
    const palStr = palette.slice(0, 4).join(", ");
    parts.push(`palette of ${palStr}`);
  }

  if (saturation && saturation !== "restrained cinematic saturation") {
    parts.push(saturation.toLowerCase());
  } else {
    parts.push(`restrained cinematic saturation`);
  }

  if (contrast && contrast !== "natural contrast") {
    parts.push(contrast.toLowerCase());
  }

  if (parts.length === 0 && science) {
    return "";
  }

  // Build natural color sentence
  if (palette.length > 0) {
    sentence = `Color remains restrained and cinematic, with ${parts.join(" and ")} and ${science ? science.toLowerCase() + " color science" : "natural color science"}`;
  } else {
    sentence = `Color stays restrained and cinematic with ${saturation.toLowerCase() || "restrained cinematic saturation"} and ${contrast.toLowerCase() || "controlled contrast"}, preserving natural skin and material tones`;
  }

  sentence += ".";
  return cleanSentence(sentence);
}

function composeMotion(directive, naturalism) {
  const mot = directive.motionDirection;
  const natMot = naturalism.motion;

  const subjectMotion = trimString(mot.subjectMotion);
  const cameraMotion = trimString(mot.cameraMotion);
  const speed = trimString(mot.speed);
  const hasSubjectMot = subjectMotion && subjectMotion !== "natural subject motion";
  const hasCamMot = cameraMotion && cameraMotion !== "subtle cinematic movement";

  let sentence = "";

  if (hasSubjectMot && hasCamMot) {
    sentence = `Subject and camera move with ${speed.toLowerCase() || "natural speed"}, ${subjectMotion.toLowerCase()} accompanied by ${cameraMotion.toLowerCase()}`;
  } else if (hasSubjectMot) {
    sentence = `Subject moves with ${subjectMotion.toLowerCase()} at ${speed.toLowerCase() || "natural speed"}`;
  } else if (hasCamMot) {
    sentence = `Motion remains subtle, with ${cameraMotion.toLowerCase()}`;
  } else {
    sentence = `Motion remains subtle and coherent`;
  }

  // Integrate naturalism motion principles without dumping list
  const blur = trimString(natMot.motionBlur);
  const temporal = trimString(natMot.temporalConsistency);
  const accel = trimString(natMot.acceleration);

  const naturalParts = [];
  if (blur && blur !== "natural motion blur") {
    // dedupe: use proportional blur phrase once
    naturalParts.push(`motion blur responds proportionally to movement`);
  } else if (blur) {
    naturalParts.push(`natural motion blur`);
  }

  if (accel && accel.includes("physically coherent")) {
    naturalParts.push(`physically coherent acceleration and deceleration`);
  }

  if (temporal && temporal.includes("stable subject identity")) {
    naturalParts.push(`stable geometry and texture across frames`);
  }

  if (naturalParts.length > 0) {
    sentence += `, featuring ${dedupePhrases(naturalParts).join(" and ")}`;
  }

  // Deformation control subtly
  const deform = trimString(natMot.deformationControl);
  if (deform && deform.includes("stable geometry")) {
    sentence += ` without random deformation`;
  }

  sentence += ".";
  return cleanSentence(sentence);
}

function composeAtmosphere(directive, naturalism) {
  const atm = directive.atmosphereDirection;
  const envNat = naturalism.environment;

  const particles = trimString(atm.particles);
  const fog = trimString(atm.fog);
  const haze = trimString(atm.haze);
  const envMove = trimString(atm.environmentalMovement);
  const depth = trimString(atm.depth);

  const hasParticles = particles && particles !== "subtle atmospheric particles";
  const hasFog = fog && fog !== "light atmospheric fog";
  const hasHaze = haze && haze !== "natural haze";
  const hasDepth = depth && depth !== "atmospheric depth";

  if (!hasParticles && !hasFog && !hasHaze && !hasDepth && !trimString(envMove)) {
    // Check naturalism particle behavior for relevance
    const pb = trimString(envNat.particleBehavior);
    if (pb && pb !== "natural environmental particle behavior") {
      // Still relevant if fluid/fog
      if (pb.includes("fluid") || pb.includes("atmospheric")) {
        return cleanSentence(`Subtle ${pb.toLowerCase()} drifts through the space, enhancing depth.`);
      }
    }
    return "";
  }

  let sentence = "";

  const parts = [];
  if (hasParticles) parts.push(particles.toLowerCase());
  else if (trimString(envNat.particleBehavior) && envNat.particleBehavior !== "natural environmental particle behavior") {
    // use naturalism particle behavior if more specific
    const pb = trimString(envNat.particleBehavior);
    if (pb.includes("fluid")) parts.push(`fluid particles with subtle displacement`);
    else if (pb.includes("atmospheric")) parts.push(`subtle atmospheric particles`);
  }

  if (hasFog) parts.push(fog.toLowerCase());
  if (hasHaze) parts.push(haze.toLowerCase());

  if (parts.length > 0) {
    sentence = `${parts.join(", ")} drift gently, adding ${depth.toLowerCase() || "atmospheric depth"}`;
  } else {
    sentence = `Atmospheric haze adds subtle depth and separation`;
  }

  if (trimString(envMove) && envMove !== "gentle environmental movement") {
    sentence += ` as ${envMove.toLowerCase()} continues subtly`;
  }

  sentence += ".";
  return cleanSentence(sentence);
}

function composeMaterial(directive, naturalism) {
  const mat = directive.materialDirection;
  const natMat = naturalism.materials;

  const surface = trimString(mat.surfaceProperties);
  const roughness = trimString(mat.roughness);
  const reflections = trimString(mat.reflections);
  const imperfections = trimString(mat.imperfections);

  const hasSurface = surface && surface !== "natural surface properties";
  const hasRough = roughness && roughness !== "natural roughness";
  const hasRefl = reflections && reflections !== "natural reflections";
  const hasImp = imperfections && imperfections !== "natural imperfections";

  // Use naturalism subtle variation if available
  const natSurface = trimString(natMat.surfaceVariation);
  const natImperf = trimString(natMat.imperfections);

  if (!hasSurface && !hasRough && !hasRefl && !hasImp && !natSurface.includes("realistic")) {
    // Still add generic subtle if material realism is core
    const hasAnyMaterial = !!(hasSurface || hasRough || hasRefl);
    if (!hasAnyMaterial) {
      // Provide subtle generic but not spam
      return cleanSentence(`Surfaces show subtle natural variation and realistic response.`);
    }
  }

  let sentence = "";

  const details = [];
  if (hasSurface) details.push(surface.toLowerCase());
  else if (natSurface && natSurface.includes("realistic")) details.push(`subtle surface variation and realistic response`);

  if (hasRough) details.push(roughness.toLowerCase());
  if (hasRefl) details.push(reflections.toLowerCase());

  if (details.length > 0) {
    sentence = `Surfaces exhibit ${details.join(", ")}`;
  } else {
    sentence = `Surfaces exhibit natural variation`;
  }

  if (hasImp || (natImperf && natImperf.includes("subtle"))) {
    sentence += ` with subtle natural imperfections`;
  }

  sentence += `, avoiding perfectly smooth synthetic appearance.`;

  // Dedupe: ensure not repeating "natural" too many times, but keep once
  return cleanSentence(sentence);
}

function composePhysics(directive, naturalism) {
  const phys = directive.physicsDirection;
  const natPhys = naturalism.physics;

  const cause = Boolean(phys.causeAndEffect);
  const gravity = trimString(phys.gravity);
  const fluid = trimString(phys.fluidInteraction);
  const envReact = trimString(phys.environmentalReaction);

  const natCause = trimString(natPhys.causeAndEffect);
  const hasFluid = fluid && fluid !== "natural fluid interaction";
  const hasEnvReact = envReact && envReact !== "natural environmental reaction";

  if (!cause && !hasFluid && !hasEnvReact && natCause.includes("natural cause-and-effect")) {
    // Still need to mention cause-and-effect if true
    if (!cause) return "";
  }

  let sentence = "";

  if (cause && natCause.includes("clear physically coherent")) {
    sentence = `Movement produces clear physically coherent cause-and-effect, with surrounding elements responding naturally`;
  } else if (cause) {
    sentence = `Movement produces natural cause-and-effect responses`;
  } else {
    sentence = `Physical interactions remain coherent`;
  }

  if (hasFluid) {
    sentence += `, including ${fluid.toLowerCase()}`;
  } else if (trimString(natPhys.fluidBehavior) && natPhys.fluidBehavior.includes("displacement")) {
    // Only mention if fluid context exists in naturalism and directive physics suggests fluid
    if (hasFluid || natPhys.fluidBehavior.includes("displacement") && (fluid || natPhys.fluidBehavior.includes("natural fluid"))) {
      // Avoid hallucinating fluid if not in schema - check directive physics fluid
      if (hasFluid) sentence += ` with natural displacement`;
    }
  }

  if (hasEnvReact) {
    sentence += ` and ${envReact.toLowerCase()}`;
  }

  // Gravity naturalism
  const gravNat = trimString(natPhys.gravityBehavior);
  if (gravNat && gravNat.includes("natural gravity")) {
    sentence += ` under natural gravity`;
  }

  sentence += ".";

  // Don't hallucinate fluid if not present
  if (!hasFluid && sentence.toLowerCase().includes("fluid") && !trimString(natPhys.fluidBehavior).includes("displacement")) {
    // Remove fluid mention if not relevant - simplify
    sentence = sentence.replace(/, including.*fluid[^.]*,?/i, "");
  }

  return cleanSentence(sentence);
}

function composeNaturalism(naturalism) {
  // Integrate naturalism principles subtly, not as list
  const parts = [];

  const lightFalloff = trimString(naturalism.lighting.lightFalloff);
  const shadow = trimString(naturalism.lighting.shadowRealism);
  const surface = trimString(naturalism.materials.surfaceVariation);
  const motionBlur = trimString(naturalism.motion.motionBlur);
  const depth = trimString(naturalism.depth.depthCue);
  const colorSat = trimString(naturalism.color.saturation);
  const temporal = trimString(naturalism.motion.temporalConsistency);

  // Choose 2-3 most relevant to avoid spam, dedupe
  if (lightFalloff && lightFalloff.includes("falloff")) parts.push(`natural light falloff`);
  if (surface && surface.includes("realistic material")) parts.push(`realistic material response`);
  else if (surface) parts.push(`subtle surface variation`);

  if (motionBlur && motionBlur.includes("proportional")) parts.push(`natural motion blur proportional to movement`);
  if (depth && depth.includes("atmospheric separation")) parts.push(`natural depth with atmospheric separation`);
  if (colorSat && colorSat.includes("restrained")) parts.push(`restrained cinematic color`);
  if (temporal && temporal.includes("stable subject identity")) parts.push(`stable geometry and texture across frames`);

  if (parts.length === 0) return "";

  // Limit to 3-4 to avoid spam
  const selected = dedupePhrases(parts).slice(0, 3);

  let sentence = `Overall rendering preserves ${selected.join(", ")}`;
  // Add exposure/consistency nuance
  const exposure = trimString(naturalism.lighting.exposure);
  if (exposure && exposure.includes("controlled highlights")) {
    sentence += ` with natural exposure and controlled highlights`;
  }

  sentence += `, maintaining temporal consistency and avoiding artificial exaggeration.`;

  return cleanSentence(sentence);
}

function composeClosing(directive, naturalism) {
  const intent = trimString(directive.cinematicIntent);
  const natIntent = trimString(naturalism.naturalismIntent);

  // Prefer cinematic intent but integrate naturalism subtly
  if (intent) {
    // Closing should be short, reuse intent's feeling but not copy verbatim long
    // Take last clause or create short closing
    const priorities = directive.priorities || [];
    if (priorities.length > 0) {
      return cleanSentence(`The result feels immersive, grounded and cinematically coherent.`);
    }
    return cleanSentence(`The result feels immersive and cinematically grounded.`);
  }

  if (natIntent) {
    return cleanSentence(`The image remains grounded, immersive and visually coherent.`);
  }

  return cleanSentence(`The result remains cinematic, immersive and grounded.`);
}

// ---------------------------------------------------------------------------
// Main Composer
// ---------------------------------------------------------------------------

export function composeCinematicPrompt(schema, cinematicDirective, naturalismDirective) {
  validateInputs(schema, cinematicDirective, naturalismDirective);

  const opening = composeOpening(schema, cinematicDirective);
  const subject = composeSubject(schema);
  const environment = composeEnvironment(schema, cinematicDirective);
  const camera = composeCamera(cinematicDirective);
  const lighting = composeLighting(cinematicDirective, naturalismDirective);
  const color = composeColor(cinematicDirective);
  const motion = composeMotion(cinematicDirective, naturalismDirective);
  const atmosphere = composeAtmosphere(cinematicDirective, naturalismDirective);
  const material = composeMaterial(cinematicDirective, naturalismDirective);
  const physics = composePhysics(cinematicDirective, naturalismDirective);
  const naturalism = composeNaturalism(naturalismDirective);
  const closing = composeClosing(cinematicDirective, naturalismDirective);

  const composition = {
    opening,
    subject,
    environment,
    camera,
    lighting,
    color,
    motion,
    atmosphere,
    material,
    physics,
    naturalism,
    closing,
  };

  // Build final prompt: join non-empty sections in logical order, dedupe, ensure single shot continuity
  const orderedKeys = [
    "opening",
    "subject",
    "environment",
    "camera",
    "lighting",
    "color",
    "motion",
    "atmosphere",
    "material",
    "physics",
    "naturalism",
    "closing",
  ];

  const parts = [];
  for (const key of orderedKeys) {
    const val = composition[key];
    if (val && trimString(val).length > 0) {
      parts.push(val);
    }
  }

  let cinematicPrompt = parts.join(" ");

  // Final cleanup
  cinematicPrompt = cinematicPrompt.replace(/\s+/g, " ").trim();
  // Remove any accidental parameter dumps
  cinematicPrompt = cinematicPrompt.replace(/\b\w+:\s*/g, (m) => {
    // Keep natural colons only if preceded by legitimate word? Simpler: remove dumps like "camera:" etc
    const lower = m.toLowerCase();
    if (["camera:", "lighting:", "physics:", "naturalism:", "quality:"].some(k => lower.includes(k))) {
      return "";
    }
    return m;
  });

  // Ensure not empty
  if (!cinematicPrompt) {
    cinematicPrompt = "A cinematic continuous shot with natural lighting, realistic materials and coherent motion.";
  }

  // Ensure no undefined/null
  if (cinematicPrompt.includes("undefined") || cinematicPrompt.includes("null")) {
    cinematicPrompt = cinematicPrompt.replace(/undefined/g, "").replace(/null/g, "").replace(/\s+/g, " ").trim();
  }

  // Ensure no cut/transition phrases unless schema indicates
  // (we never add them, so safe)

  // Deduplication pass: if phrase repeated, keep first
  // Simple dedupe for "realistic" spam: ensure not more than 3 occurrences of "realistic"
  // (we already limited)

  const duration = isValidDuration(schema.scene.duration) ? Math.round(Number(schema.scene.duration)) : null;
  const sectionCount = parts.length;

  const promptMetadata = {
    duration,
    promptType: "natural",
    sectionCount,
  };

  return {
    version: PROMPT_COMPOSER_VERSION,
    cinematicPrompt,
    promptMetadata: { ...promptMetadata },
    composition: { ...composition },
  };
}

export function createPromptComposer() {
  return {
    version: PROMPT_COMPOSER_VERSION,
    compose: composeCinematicPrompt,
  };
}
