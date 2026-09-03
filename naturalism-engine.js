/**
 * NEXORA CINEMATIC AI
 * Naturalism Engine v1.0
 *
 * Processing layer after Cinematic Director
 * Reduces artificial generative characteristics and enforces realism
 *
 * Architecture:
 * USER PROMPT -> CINEMATIC SCHEMA -> CINEMATIC DIRECTOR -> NATURALISM ENGINE -> NATURALISM DIRECTIVE
 */

export const NATURALISM_ENGINE_VERSION = "1.0";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cloneArray(arr) {
  return Array.isArray(arr) ? [...arr] : [];
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateInputs(schema, directive) {
  if (!isObject(schema)) {
    throw new Error("Invalid schema: schema is required");
  }
  if (!isObject(directive)) {
    throw new Error("Invalid cinematic directive: cinematicDirective is required");
  }

  const schemaRequired = [
    "scene",
    "subject",
    "camera",
    "lighting",
    "color",
    "composition",
    "motion",
    "atmosphere",
    "material",
    "physics",
  ];
  for (const key of schemaRequired) {
    if (!isObject(schema[key])) {
      throw new Error(`Invalid schema: ${key} is required and must be an object`);
    }
  }

  const directiveRequired = [
    "sceneDirection",
    "cameraDirection",
    "lightingDirection",
    "colorDirection",
    "compositionDirection",
    "motionDirection",
    "atmosphereDirection",
    "materialDirection",
    "physicsDirection",
  ];
  for (const key of directiveRequired) {
    if (!isObject(directive[key])) {
      throw new Error(`Invalid cinematic directive: ${key} is required and must be an object`);
    }
  }
}

// ---------------------------------------------------------------------------
// Internal Naturalism Modules
// ---------------------------------------------------------------------------

function lightingNaturalism(schema, directive) {
  const schemaLight = trimString(schema.lighting.keyLight);
  const dirLight = trimString(directive.lightingDirection.keyLight);
  const hasLightInfo = !!(schemaLight || (dirLight && dirLight !== "soft cinematic key light"));

  return {
    lightFalloff: hasLightInfo ? "physically plausible light falloff" : "physically plausible",
    exposure: "natural exposure with controlled highlights and shadow detail",
    shadowRealism: hasLightInfo
      ? "soft-to-hard shadow transitions appropriate to the light source"
      : "natural shadow behavior",
    highlightControl: "controlled highlight and shadow detail",
  };
}

function materialsNaturalism(schema) {
  const hasMaterial =
    !!(trimString(schema.material.surfaceProperties) || trimString(schema.material.roughness) || trimString(schema.material.reflections));
  return {
    surfaceVariation: hasMaterial
      ? "subtle surface variation and realistic material response"
      : "subtle natural surface variation",
    roughnessVariation: "natural roughness variation",
    reflectionBehavior: "physically accurate reflection behavior",
    imperfections: "subtle natural imperfections",
  };
}

function motionNaturalism(schema, directive) {
  const hasMotion = !!(
    trimString(schema.motion.subjectMotion) ||
    trimString(schema.motion.cameraMotion) ||
    trimString(schema.motion.speed)
  );
  const rawBlur = trimString(schema.motion.motionBlur);
  const rawTemporal = trimString(schema.motion.temporalConsistency) || trimString(directive.motionDirection.temporalConsistency);

  return {
    acceleration: "physically coherent acceleration and deceleration",
    deceleration: "physically coherent deceleration",
    motionBlur: hasMotion ? "natural motion blur proportional to movement" : "natural motion blur",
    temporalConsistency: rawTemporal && rawTemporal.toLowerCase().includes("high")
      ? "stable subject identity, geometry, texture, lighting and environment across frames"
      : "high temporal consistency",
    deformationControl: "stable geometry without random deformation",
  };
}

function depthNaturalism(schema, directive) {
  const hasDepth = !!(
    trimString(schema.composition.depth) ||
    trimString(schema.atmosphere.depth) ||
    trimString(schema.scene.environment) ||
    (trimString(directive.sceneDirection.environment) && directive.sceneDirection.environment !== "neutral cinematic environment")
  );
  const dirFog = trimString(directive.atmosphereDirection.fog);
  const hasFog = !!(trimString(schema.atmosphere.fog) || (dirFog && dirFog !== "light atmospheric fog" && dirFog !== "natural haze"));
  return {
    depthCue: hasDepth ? "natural depth cues with atmospheric separation" : "natural depth separation",
    atmosphericDepth: hasFog ? "enhanced atmospheric depth with natural haze separation" : "natural atmospheric depth",
    foregroundSeparation: "natural foreground separation",
    backgroundSeparation: "natural background separation",
  };
}

function colorNaturalism() {
  return {
    saturation: "restrained cinematic saturation",
    contrast: "controlled cinematic contrast",
    highlightRollOff: "smooth highlight roll-off",
    colorConsistency: "consistent color response across frames",
  };
}

function environmentNaturalism(schema, directive) {
  const envCombined = (
    trimString(schema.scene.environment) +
    " " +
    trimString(schema.scene.location) +
    " " +
    trimString(directive.sceneDirection.environment)
  ).toLowerCase();

  const hasFluidSchema = !!trimString(schema.physics.fluidInteraction);
  const hasFluidDirective = !!(directive.physicsDirection && trimString(directive.physicsDirection.fluidInteraction) && directive.physicsDirection.fluidInteraction !== "natural fluid interaction");
  const fluidKeyword = /water|ocean|fluid|underwater|sea|river|lake/.test(envCombined);
  const isFluid = hasFluidSchema || hasFluidDirective || fluidKeyword;

  const hasFog = !!(trimString(schema.atmosphere.fog) || trimString(schema.atmosphere.haze) || trimString(schema.atmosphere.particles));
  const dirFog = trimString(directive.atmosphereDirection.fog);
  const isFoggy = hasFog || (dirFog && dirFog !== "light atmospheric fog");

  const isIndoor = /indoor|room|interior|inside|studio/.test(envCombined);

  let particleBehavior = "";
  if (isFluid) particleBehavior = "natural fluid particle behavior with displacement";
  else if (isFoggy) particleBehavior = "subtle atmospheric particle behavior";
  else particleBehavior = "natural environmental particle behavior";

  let environmentalInteraction = "";
  if (isIndoor) environmentalInteraction = "natural indoor environmental interaction";
  else environmentalInteraction = "natural environmental interaction with subtle reactions";

  return {
    particleBehavior,
    environmentalInteraction,
    secondaryMotion: "subtle secondary motion in response to primary action",
    reactionToAction: "physically coherent reaction to subject action",
  };
}

function physicsNaturalism(schema, directive) {
  const causeTrue = schema.physics.causeAndEffect === true;
  const hasGravity = !!trimString(schema.physics.gravity);
  const fluidSchema = trimString(schema.physics.fluidInteraction);
  const fluidDirective = directive.physicsDirection ? trimString(directive.physicsDirection.fluidInteraction) : "";
  const hasFluid = !!(fluidSchema || (fluidDirective && fluidDirective !== "natural fluid interaction"));

  const envCombined = (
    trimString(schema.scene.environment) +
    " " +
    trimString(directive.sceneDirection.environment)
  ).toLowerCase();
  const fluidKeyword = /water|ocean|fluid|underwater|sea|river|lake/.test(envCombined);
  const fluidContext = hasFluid || fluidKeyword;

  return {
    causeAndEffect: causeTrue
      ? "clear physically coherent cause-and-effect relationships"
      : "natural cause-and-effect relationships",
    objectInteraction: "physically coherent object interaction",
    gravityBehavior: hasGravity ? "natural gravity behavior" : "physically plausible gravity",
    fluidBehavior: fluidContext ? "natural fluid behavior with displacement" : "natural fluid behavior when applicable",
  };
}

function realismRulesEngine(schema, directive) {
  const rules = [];
  rules.push("physically plausible lighting");
  rules.push("natural material response");
  rules.push("subtle surface imperfections");
  rules.push("physically coherent motion");
  rules.push("natural depth separation");
  rules.push("restrained cinematic color");
  rules.push("stable geometry across frames");
  rules.push("consistent lighting across frames");

  // Context-aware extensions (generic, not hard-coded scene)
  const hasEnv = !!(trimString(schema.scene.environment) || trimString(directive.sceneDirection.environment) && directive.sceneDirection.environment !== "neutral cinematic environment");
  const hasAtmosphere = !!(trimString(schema.atmosphere.fog) || trimString(schema.atmosphere.particles));
  const hasPhysics = schema.physics.causeAndEffect === true;

  if (hasEnv) rules.push("environmental interaction coherent with scene");
  if (hasAtmosphere) rules.push("atmospheric depth with natural haze");
  if (hasPhysics) rules.push("cause-and-effect coherent with physics");

  // Ensure uniqueness
  return [...new Set(rules)];
}

function avoidEngine() {
  return [
    "excessive HDR",
    "oversaturation",
    "plastic surfaces",
    "artificial glow",
    "oversharpening",
    "unnatural motion",
    "impossible shadows",
    "temporal flickering",
    "random geometry deformation",
    "inconsistent lighting",
    "perfect artificial surfaces",
  ];
}

function prioritiesEngine(schema, directive) {
  const priorities = [];
  const hasSubject = !!(trimString(schema.subject.description) || trimString(schema.subject.action));
  const hasEnv = !!(trimString(schema.scene.environment) || trimString(directive.sceneDirection.environment) && directive.sceneDirection.environment !== "neutral cinematic environment");
  const hasLighting = !!(trimString(schema.lighting.keyLight) || trimString(directive.lightingDirection.keyLight) && directive.lightingDirection.keyLight !== "soft cinematic key light");
  const hasMaterial = !!(trimString(schema.material.surfaceProperties) || trimString(schema.material.roughness));
  const hasMotion = !!(trimString(schema.motion.subjectMotion) || trimString(directive.motionDirection.subjectMotion));
  const hasPhysics = schema.physics.causeAndEffect === true;
  const hasAtmosphere = !!(trimString(schema.atmosphere.fog) || trimString(directive.atmosphereDirection.fog) && directive.atmosphereDirection.fog !== "light atmospheric fog");

  if (hasPhysics) priorities.push("physical coherence");
  if (hasMotion) priorities.push("natural motion");
  else priorities.push("temporal consistency");

  if (hasLighting) priorities.push("natural lighting");
  else priorities.push("temporal consistency");

  if (hasMaterial) priorities.push("material realism");
  else if (hasSubject) priorities.push("material realism");

  if (hasEnv || hasAtmosphere) priorities.push("environmental interaction");
  else priorities.push("natural lighting");

  // Ensure core set variation
  const candidates = [
    "physical coherence",
    "temporal consistency",
    "natural lighting",
    "material realism",
    "environmental interaction",
    "natural motion",
    "depth realism",
  ];
  for (const c of candidates) {
    if (priorities.length >= 6) break;
    if (!priorities.includes(c)) priorities.push(c);
  }

  // Keep 5-6 priorities, unique, order relevant to context
  if (hasSubject && !priorities.includes("material realism")) priorities.unshift("material realism");
  return [...new Set(priorities)].slice(0, 6);
}

function naturalismIntentEngine(priorities) {
  // One short sentence, agnostic
  // Example: Preserve realistic lighting, material response, natural motion, environmental interaction, and temporal consistency while avoiding artificial visual exaggeration.
  const core = priorities.slice(0, 5).join(", ");
  let intent = "";
  if (core) {
    intent = `Preserve ${core} while avoiding artificial visual exaggeration.`;
  } else {
    intent = "Preserve realistic lighting, material response, natural motion, environmental interaction, and temporal consistency while avoiding artificial visual exaggeration.";
  }

  // Ensure single sentence and short (<200)
  intent = intent.replace(/\s+/g, " ").trim();
  if (!intent.endsWith(".")) intent += ".";
  if (intent.length > 200) {
    intent = "Preserve realistic lighting, material response, natural motion, environmental interaction, and temporal consistency while avoiding artificial visual exaggeration.";
  }
  // Ensure starts with Preserve
  if (!intent.startsWith("Preserve")) {
    intent = "Preserve realistic lighting, material response, natural motion, environmental interaction, and temporal consistency while avoiding artificial visual exaggeration.";
  }
  return intent;
}

// ---------------------------------------------------------------------------
// Main Function
// ---------------------------------------------------------------------------

export function applyNaturalism(schema, cinematicDirective) {
  validateInputs(schema, cinematicDirective);

  const lighting = lightingNaturalism(schema, cinematicDirective);
  const materials = materialsNaturalism(schema);
  const motion = motionNaturalism(schema, cinematicDirective);
  const depth = depthNaturalism(schema, cinematicDirective);
  const color = colorNaturalism();
  const environment = environmentNaturalism(schema, cinematicDirective);
  const physics = physicsNaturalism(schema, cinematicDirective);

  const realismRules = realismRulesEngine(schema, cinematicDirective);
  const avoid = avoidEngine();
  const priorities = prioritiesEngine(schema, cinematicDirective);
  const naturalismIntent = naturalismIntentEngine(priorities);

  return {
    version: NATURALISM_ENGINE_VERSION,
    lighting: { ...lighting },
    materials: { ...materials },
    motion: { ...motion },
    depth: { ...depth },
    color: { ...color },
    environment: { ...environment },
    physics: { ...physics },
    realismRules: [...realismRules],
    avoid: [...avoid],
    priorities: [...priorities],
    naturalismIntent,
  };
}

export function createNaturalismEngine() {
  return {
    version: NATURALISM_ENGINE_VERSION,
    apply: applyNaturalism,
  };
}
