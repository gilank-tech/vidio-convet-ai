/**
 * NEXORA CINEMATIC AI
 * Cinematic Director v1.0
 *
 * Processing layer after Cinematic Schema
 * Determines how a scene should be filmed
 *
 * Architecture:
 * USER PROMPT -> CINEMATIC SCHEMA -> CINEMATIC DIRECTOR -> CINEMATIC DIRECTIVE
 */

export const CINEMATIC_DIRECTOR_VERSION = "1.0";

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

function validateSchema(schema) {
  if (!isObject(schema)) {
    throw new Error("Invalid schema: schema object is required");
  }
  if (!trimString(schema.version)) {
    throw new Error("Invalid schema: version is required");
  }
  const required = [
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
  for (const key of required) {
    if (!isObject(schema[key])) {
      throw new Error(`Invalid schema: ${key} is required and must be an object`);
    }
  }
}

// ---------------------------------------------------------------------------
// Internal Directors (9 modules)
// ---------------------------------------------------------------------------

function sceneDirector(scene, subject) {
  const envRaw = trimString(scene.environment) || trimString(scene.location);
  const environment = envRaw || "neutral cinematic environment";
  const timeRaw = trimString(scene.timeOfDay);
  const timeOfDay = timeRaw || "neutral cinematic time";

  const hasSubject = !!(trimString(subject.description) || trimString(subject.action));
  const hasEnv = !!envRaw;

  let visualPriority = "";
  if (hasSubject && hasEnv) {
    visualPriority = "subject clarity and environmental depth";
  } else if (hasSubject) {
    visualPriority = "subject clarity";
  } else if (hasEnv) {
    visualPriority = "environmental depth";
  } else {
    visualPriority = "balanced cinematic composition";
  }

  return {
    environment,
    timeOfDay,
    visualPriority,
  };
}

function cameraDirector(camera) {
  const perspectiveRaw = trimString(camera.perspective);
  const perspective = perspectiveRaw || "cinematic";

  const movementRaw = trimString(camera.movement);
  let movement = "";
  if (!movementRaw) {
    movement = "subtle cinematic movement";
  } else if (movementRaw.toLowerCase().includes("handheld")) {
    // Enrich handheld intent generically without hard-coded subject
    movement = "slow controlled forward movement with subtle handheld reaction";
  } else {
    movement = movementRaw;
  }

  const framingRaw = trimString(camera.framing);
  const framing = framingRaw || "subject centered with environmental depth";

  const lensRaw = trimString(camera.lens);
  let lens = lensRaw;
  if (!lens) {
    if (perspective.toLowerCase().includes("pov") || perspective.toLowerCase().includes("first-person")) {
      lens = "wide action-camera perspective";
    } else {
      lens = "cinematic lens perspective";
    }
  }

  const focalLength = camera.focalLength ?? null;
  let resolvedFocal = focalLength;
  if (resolvedFocal === null || resolvedFocal === undefined) {
    if (lens.toLowerCase().includes("wide")) {
      resolvedFocal = 18;
    } else {
      resolvedFocal = null;
    }
  }

  const depthRaw = trimString(camera.depthOfField);
  let depthOfField = depthRaw;
  if (!depthOfField) {
    if (perspective.toLowerCase().includes("pov")) {
      depthOfField = "moderate environmental depth";
    } else {
      depthOfField = "natural depth of field";
    }
  }

  const stabRaw = trimString(camera.stabilization);
  let stabilization = "";
  if (!stabRaw) stabilization = "natural stabilization";
  else if (stabRaw.toLowerCase() === "natural") stabilization = "natural stabilization";
  else stabilization = stabRaw;

  return {
    perspective,
    movement,
    framing,
    lens,
    focalLength: resolvedFocal,
    depthOfField,
    stabilization,
  };
}

function lightingDirector(lighting) {
  const keyLightRaw = trimString(lighting.keyLight);
  const keyLight = keyLightRaw || "soft cinematic key light";

  const directionRaw = trimString(lighting.direction);
  let direction = "";
  if (!directionRaw) {
    direction = "natural directional light";
  } else if (!directionRaw.toLowerCase().includes("directional")) {
    const keyLower = keyLightRaw.toLowerCase();
    if (keyLower.includes("flashlight") || keyLower.includes("beam")) {
      direction = directionRaw + " directional beam";
    } else {
      direction = directionRaw + " directional light";
    }
  } else {
    direction = directionRaw;
  }

  const intensityRaw = trimString(lighting.intensity);
  let intensity = intensityRaw;
  if (!intensity) {
    if (keyLightRaw.toLowerCase().includes("flashlight") || keyLightRaw.toLowerCase().includes("beam")) {
      intensity = "high contrast";
    } else {
      intensity = "balanced cinematic intensity";
    }
  }

  const colorTemperature = lighting.colorTemperature ?? null;
  let resolvedTemp = colorTemperature;
  if (resolvedTemp === null || resolvedTemp === undefined) {
    // Preserve intent: keep null if not provided, but if keyLight flashlight use 5000 as example safe
    if (keyLightRaw.toLowerCase().includes("flashlight") && direction.includes("forward")) {
      resolvedTemp = 5000;
    } else {
      resolvedTemp = null;
    }
  }

  const contrastRaw = trimString(lighting.contrast);
  let contrast = contrastRaw;
  if (!contrast) {
    if (intensity.toLowerCase().includes("high contrast") || intensity.toLowerCase().includes("high")) {
      contrast = "strong";
    } else {
      contrast = "natural contrast";
    }
  }

  const shadowRaw = trimString(lighting.shadowBehavior);
  let shadowBehavior = shadowRaw;
  if (!shadowBehavior) {
    if (intensity.toLowerCase().includes("high contrast")) {
      shadowBehavior = "defined natural shadows";
    } else {
      shadowBehavior = "natural shadows";
    }
  }

  let volumetric = Boolean(lighting.volumetric);
  if (!volumetric && (keyLightRaw.toLowerCase().includes("flashlight") || keyLightRaw.toLowerCase().includes("beam"))) {
    volumetric = true;
  }

  return {
    keyLight,
    direction,
    intensity,
    colorTemperature: resolvedTemp,
    contrast,
    shadowBehavior: shadowBehavior.includes("natural") && !shadowRaw ? shadowBehavior : shadowBehavior || "defined natural shadows",
    volumetric,
  };
}

function colorDirector(color) {
  const palette = cloneArray(color.palette);
  const contrastRaw = trimString(color.contrast);
  const contrast = contrastRaw || "natural contrast";
  const saturationRaw = trimString(color.saturation);
  let saturation = "";
  if (!saturationRaw) saturation = "restrained cinematic saturation";
  else if (saturationRaw.toLowerCase() === "restrained") saturation = "restrained cinematic saturation";
  else saturation = saturationRaw;
  const scienceRaw = trimString(color.colorScience);
  const colorScience = scienceRaw || "cinematic";

  return {
    palette,
    contrast,
    saturation,
    colorScience,
  };
}

function compositionDirector(composition) {
  const framingRaw = trimString(composition.framing);
  const framing = framingRaw || "balanced cinematic framing";
  const placementRaw = trimString(composition.subjectPlacement);
  const subjectPlacement = placementRaw || "centered subject placement";
  const fgRaw = trimString(composition.foreground);
  const foreground = fgRaw || "subtle foreground depth";
  const bgRaw = trimString(composition.background);
  const background = bgRaw || "environmental background";
  const depthRaw = trimString(composition.depth);
  const depth = depthRaw || "natural depth";

  return {
    framing,
    subjectPlacement,
    foreground,
    background,
    depth,
  };
}

function motionDirector(motion, camera) {
  const subjectMotionRaw = trimString(motion.subjectMotion);
  const subjectMotion = subjectMotionRaw || "natural subject motion";

  const cameraMotionRaw = trimString(motion.cameraMotion) || trimString(camera.movement);
  const cameraMotion = cameraMotionRaw || "subtle cinematic movement";

  const speedRaw = trimString(motion.speed);
  const speed = speedRaw || "natural speed";

  const blurRaw = trimString(motion.motionBlur);
  let motionBlur = "";
  if (!blurRaw) motionBlur = "natural motion blur";
  else if (blurRaw.toLowerCase() === "natural") motionBlur = "natural motion blur";
  else motionBlur = blurRaw;

  const temporalRaw = trimString(motion.temporalConsistency);
  let temporalConsistency = "";
  if (!temporalRaw) temporalConsistency = "high temporal consistency";
  else if (temporalRaw.toLowerCase() === "high") temporalConsistency = "high temporal consistency";
  else temporalConsistency = temporalRaw;

  return {
    subjectMotion,
    cameraMotion,
    speed,
    motionBlur,
    temporalConsistency,
  };
}

function atmosphereDirector(atmosphere) {
  const particlesRaw = trimString(atmosphere.particles);
  const particles = particlesRaw || "subtle atmospheric particles";
  const fogRaw = trimString(atmosphere.fog);
  const fog = fogRaw || "light atmospheric fog";
  const hazeRaw = trimString(atmosphere.haze);
  const haze = hazeRaw || "natural haze";
  const envMoveRaw = trimString(atmosphere.environmentalMovement);
  const environmentalMovement = envMoveRaw || "gentle environmental movement";
  const depthRaw = trimString(atmosphere.depth);
  const depth = depthRaw || "atmospheric depth";

  return {
    particles,
    fog,
    haze,
    environmentalMovement,
    depth,
  };
}

function materialDirector(material) {
  const surfaceRaw = trimString(material.surfaceProperties);
  const surfaceProperties = surfaceRaw || "natural surface properties";
  const roughRaw = trimString(material.roughness);
  const roughness = roughRaw || "natural roughness";
  const reflRaw = trimString(material.reflections);
  const reflections = reflRaw || "natural reflections";
  const impRaw = trimString(material.imperfections);
  const imperfections = impRaw || "natural imperfections";

  return {
    surfaceProperties,
    roughness,
    reflections,
    imperfections,
  };
}

function physicsDirector(physics) {
  const gravityRaw = trimString(physics.gravity);
  const gravity = gravityRaw || "physically_coherent";
  const collisionRaw = trimString(physics.collision);
  const collision = collisionRaw || "realistic";
  const fluidRaw = trimString(physics.fluidInteraction);
  const fluidInteraction = fluidRaw || "natural fluid interaction";
  const envReactRaw = trimString(physics.environmentalReaction);
  const environmentalReaction = envReactRaw || "natural environmental reaction";
  const causeAndEffect = physics.causeAndEffect ?? true;

  return {
    gravity,
    collision,
    fluidInteraction,
    environmentalReaction,
    causeAndEffect: Boolean(causeAndEffect),
  };
}

// ---------------------------------------------------------------------------
// Priorities & Intent
// ---------------------------------------------------------------------------

function prioritiesDirector(schema, directions) {
  const priorities = [];

  const hasSubject = !!(trimString(schema.subject.description) || trimString(schema.subject.action));
  const hasEnv = !!(trimString(schema.scene.environment) || trimString(schema.scene.location));
  const hasCamera = !!(trimString(schema.camera.perspective) || trimString(schema.camera.movement));
  const hasLighting = !!(trimString(schema.lighting.keyLight) || trimString(schema.lighting.direction));
  const hasColor = Array.isArray(schema.color.palette) && schema.color.palette.length > 0;
  const hasAtmosphere = !!(trimString(schema.atmosphere.particles) || trimString(schema.atmosphere.fog) || trimString(schema.atmosphere.haze));
  const hasMotion = !!(trimString(schema.motion.subjectMotion) || trimString(schema.motion.cameraMotion));
  const hasMaterial = !!(trimString(schema.material.surfaceProperties) || trimString(schema.material.roughness));
  const hasPhysics = !!(trimString(schema.physics.gravity) || trimString(schema.physics.collision));

  if (hasSubject) priorities.push("subject clarity");
  if (hasCamera) priorities.push("camera immersion");
  if (hasLighting) priorities.push("lighting realism");
  if (hasEnv) priorities.push("environmental depth");
  if (hasMotion) priorities.push("natural motion");
  else if (directions.motionDirection) priorities.push("natural motion");
  if (hasPhysics) priorities.push("physical coherence");
  if (hasColor) priorities.push("color harmony");
  if (hasAtmosphere) priorities.push("atmospheric depth");
  if (hasMaterial) priorities.push("material realism");

  // Ensure at least 4 unique priorities, fill with generic cinematic essentials
  const fillers = ["temporal consistency", "natural exposure", "composition balance"];
  for (const f of fillers) {
    if (priorities.length >= 6) break;
    if (!priorities.includes(f)) priorities.push(f);
  }

  // If still less than 4, ensure core set
  const core = ["subject clarity", "camera immersion", "lighting realism", "environmental depth"];
  for (const c of core) {
    if (priorities.length >= 4) break;
    if (!priorities.includes(c)) priorities.push(c);
  }

  return priorities;
}

function intentDirector(schema, directions, priorities) {
  const subjectDesc = trimString(schema.subject.description) || trimString(schema.subject.action) || "subject";
  const env = trimString(schema.scene.environment) || trimString(schema.scene.location) || "environment";
  const cameraPersp = directions.cameraDirection.perspective || "cinematic";
  const lightDir = directions.lightingDirection.direction || "natural";
  const hasPhysicsCoherent = directions.physicsDirection.causeAndEffect;

  // Build concise single sentence
  // Use priorities to make intent relevant but not always identical
  const prioritySnippet = priorities.slice(0, 2).join(" and ") || "cinematic quality";

  let intent = `Create an immersive cinematic ${env !== "neutral cinematic environment" ? "encounter in " + env : "scene"} `;
  intent += `focused on ${subjectDesc.length > 40 ? subjectDesc.slice(0, 40) + "..." : subjectDesc} `;
  intent += `with ${cameraPersp} perspective, ${lightDir} lighting, ${prioritySnippet} and ${hasPhysicsCoherent ? "physically coherent" : "natural"} motion.`;

  // Normalize spaces
  intent = intent.replace(/\s+/g, " ").trim();
  if (!intent.endsWith(".")) intent += ".";

  // Keep short: if too long (>200 chars) shorten
  if (intent.length > 220) {
    intent = `Create an immersive cinematic scene with ${prioritySnippet}, ${lightDir} lighting, controlled camera movement and physically coherent interaction.`;
  }

  return intent;
}

// ---------------------------------------------------------------------------
// Main Directing Function
// ---------------------------------------------------------------------------

export function directCinematicScene(schema) {
  validateSchema(schema);

  const sceneDirection = sceneDirector(schema.scene, schema.subject);
  const cameraDirection = cameraDirector(schema.camera);
  const lightingDirection = lightingDirector(schema.lighting);
  const colorDirection = colorDirector(schema.color);
  const compositionDirection = compositionDirector(schema.composition);
  const motionDirection = motionDirector(schema.motion, schema.camera);
  const atmosphereDirection = atmosphereDirector(schema.atmosphere);
  const materialDirection = materialDirector(schema.material);
  const physicsDirection = physicsDirector(schema.physics);

  const tempDirections = {
    sceneDirection,
    cameraDirection,
    lightingDirection,
    motionDirection,
    physicsDirection,
  };

  const priorities = prioritiesDirector(schema, tempDirections);
  const cinematicIntent = intentDirector(schema, { cameraDirection, lightingDirection, physicsDirection, sceneDirection }, priorities);

  // Ensure new object, no shared references with schema
  return {
    version: CINEMATIC_DIRECTOR_VERSION,
    sceneDirection: { ...sceneDirection },
    cameraDirection: {
      ...cameraDirection,
      // ensure array/string primitives copied
    },
    lightingDirection: { ...lightingDirection },
    colorDirection: {
      ...colorDirection,
      palette: [...colorDirection.palette],
    },
    compositionDirection: { ...compositionDirection },
    motionDirection: { ...motionDirection },
    atmosphereDirection: { ...atmosphereDirection },
    materialDirection: { ...materialDirection },
    physicsDirection: { ...physicsDirection },
    priorities: [...priorities],
    cinematicIntent,
  };
}

export function createCinematicDirector() {
  return {
    version: CINEMATIC_DIRECTOR_VERSION,
    direct: directCinematicScene,
  };
}
