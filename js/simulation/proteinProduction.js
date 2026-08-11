import * as THREE from "three";

const STAGES = [
  {
    id: "dna",
    label: "DNA",
    start: 0,
    end: 4,
  },
  {
    id: "mrna",
    label: "mRNA",
    start: 4,
    end: 10,
  },
  {
    id: "translation",
    label: "Translation",
    start: 10,
    end: 18,
  },
  {
    id: "transport",
    label: "Vesicle Transport",
    start: 18,
    end: 26,
  },
  {
    id: "golgi",
    label: "Golgi Processing",
    start: 26,
    end: 34,
  },
  {
    id: "secretion",
    label: "Secretion",
    start: 34,
    end: 42,
  },
];

const TOTAL_DURATION = 42;

/* ==========================================================
   Helpers
   ========================================================== */

function clamp01(value) {
  return THREE.MathUtils.clamp(
    value,
    0,
    1
  );
}

function smoothStep(value) {
  const progress =
    clamp01(value);

  return (
    progress *
    progress *
    (
      3 -
      2 * progress
    )
  );
}

function stageProgress(
  time,
  stage
) {
  return clamp01(
    (
      time -
      stage.start
    ) /
    (
      stage.end -
      stage.start
    )
  );
}

function createParticle(
  radius,
  material
) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(
      radius,
      14,
      14
    ),
    material
  );
}

function createGlowPath({
  curve,
  color,
  radius = 0.014,
  opacity = 0.2,
}) {
  const material =
    new THREE.MeshBasicMaterial({
      color,

      transparent: true,
      opacity,

      blending:
        THREE.AdditiveBlending,

      depthWrite: false,
      depthTest: true,
    });

  const geometry =
    new THREE.TubeGeometry(
      curve,
      100,
      radius,
      8,
      false
    );

  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );

  mesh.visible = false;
  mesh.renderOrder = 7;

  return mesh;
}

function setScaledFromBase(
  object,
  baseScale,
  multiplier
) {
  object.scale.set(
    baseScale.x *
      multiplier,

    baseScale.y *
      multiplier,

    baseScale.z *
      multiplier
  );
}

/* ==========================================================
   Protein-production simulation
   ========================================================== */

export function createProteinProductionSimulation({
  cell,
}) {
  const group =
    new THREE.Group();

  group.name =
    "proteinProductionSimulation";

  group.userData.type =
    "proteinProductionSimulation";

  /* ========================================================
     Shared materials
     ======================================================== */

  const mrnaMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xff58d3,

      emissive: 0xff1493,
      emissiveIntensity: 1.35,

      roughness: 0.34,
      metalness: 0,
    });

  const mrnaHeadMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xffffff,

      emissive: 0xff4ed8,
      emissiveIntensity: 2.2,

      roughness: 0.22,
      metalness: 0,
    });

  const ribosomeMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xf0b85f,

      emissive: 0x9d520d,
      emissiveIntensity: 0.7,

      roughness: 0.42,
      metalness: 0,
    });

  const proteinMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xb866ff,

      emissive: 0x7b24ff,
      emissiveIntensity: 1.15,

      roughness: 0.34,
      metalness: 0,
    });

  const vesicleMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0x8edaff,

      transparent: true,
      opacity: 0.25,

      transmission: 0,
      thickness: 0.12,

      roughness: 0.22,
      metalness: 0,

      clearcoat: 0.75,
      clearcoatRoughness: 0.18,

      emissive: 0x0d526d,
      emissiveIntensity: 0.18,

      side: THREE.DoubleSide,

      depthWrite: false,
    });

  const secretionMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xd779ff,

      emissive: 0xa431ff,
      emissiveIntensity: 1.35,

      roughness: 0.3,
      metalness: 0,
    });

  const transportMarkerMaterial =
    new THREE.MeshBasicMaterial({
      color: 0xc9f7ff,

      transparent: true,
      opacity: 0.9,

      blending:
        THREE.AdditiveBlending,

      depthWrite: false,
    });

  const secretionMarkerMaterial =
    new THREE.MeshBasicMaterial({
      color: 0xf1d0ff,

      transparent: true,
      opacity: 0.92,

      blending:
        THREE.AdditiveBlending,

      depthWrite: false,
    });

  /* ========================================================
     mRNA path: nucleus → nuclear pore → rough ER
     ======================================================== */

  const mrnaPoints = [
  /* Near the DNA inside the nucleus */
  new THREE.Vector3(
    -0.92,
    0.10,
    0.44
  ),

  /* Newly transcribed RNA */
  new THREE.Vector3(
    -0.72,
    0.07,
    0.50
  ),

  /* Moving toward nuclear envelope */
  new THREE.Vector3(
    -0.44,
    -0.02,
    0.53
  ),

  /* Nuclear pore / exit region */
  new THREE.Vector3(
    -0.18,
    -0.20,
    0.50
  ),

  /* Cytoplasmic side */
  new THREE.Vector3(
    0.02,
    -0.45,
    0.44
  ),

  /* Rough ER translation site */
  new THREE.Vector3(
    0.16,
    -0.68,
    0.40
  ),
  ];

  const mrnaCurve =
    new THREE.CatmullRomCurve3(
      mrnaPoints
    );

  const mrnaGroup =
    new THREE.Group();

  mrnaGroup.name =
    "messengerRNA";

  const mrnaBeads = [];

  const mrnaBeadGeometry =
    new THREE.SphereGeometry(
      0.022,
      10,
      10
    );

  const mrnaBeadCount = 52;

  for (
    let index = 0;
    index < mrnaBeadCount;
    index += 1
  ) {
    const bead =
      new THREE.Mesh(
        mrnaBeadGeometry,
        mrnaMaterial
      );

    const progress =
      index /
      (
        mrnaBeadCount -
        1
      );

    bead.position.copy(
      mrnaCurve.getPoint(
        progress
      )
    );

    bead.visible = false;

    bead.userData.progress =
      progress;

    bead.userData.phase =
      Math.random() *
      Math.PI *
      2;

    bead.userData.baseScale =
      index % 3 === 0
        ? 1.08
        : 0.86;

    bead.scale.setScalar(
      bead.userData
        .baseScale
    );

    mrnaGroup.add(
      bead
    );

    mrnaBeads.push(
      bead
    );
  }

  const mrnaHead =
    createParticle(
      0.048,
      mrnaHeadMaterial
    );

  mrnaHead.visible = false;

  mrnaGroup.add(
    mrnaHead
  );

  /* ========================================================
     Ribosome at rough ER
     ======================================================== */

  const ribosome =
    new THREE.Group();

  ribosome.name =
    "translationRibosome";

  const largeSubunit =
    createParticle(
      0.13,
      ribosomeMaterial
    );

  largeSubunit.scale.set(
    1.25,
    0.8,
    0.9
  );

  const smallSubunit =
    createParticle(
      0.085,
      ribosomeMaterial
    );

  smallSubunit.position.set(
    0.08,
    0.08,
    0.04
  );

  ribosome.add(
    largeSubunit,
    smallSubunit
  );

  ribosome.position.copy(
    mrnaCurve.getPoint(1)
  );

  ribosome.visible = false;

  /* ========================================================
     Growing protein chain
     ======================================================== */

  const proteinGroup =
    new THREE.Group();

  proteinGroup.name =
    "growingProtein";

  const proteinParticles = [];

  const proteinParticleCount = 24;

  for (
    let index = 0;
    index < proteinParticleCount;
    index += 1
  ) {
    const radius =
      index % 4 === 0
        ? 0.032
        : 0.026;

    const particle =
      createParticle(
        radius,
        proteinMaterial
      );

    const progress =
      index /
      (
        proteinParticleCount -
        1
      );

    particle.position.set(
      ribosome.position.x +
        Math.sin(
          progress * 10
        ) *
          0.09,

      ribosome.position.y -
        progress * 0.65,

      ribosome.position.z +
        Math.cos(
          progress * 8
        ) *
          0.08
    );

    particle.visible = false;

    particle.userData.progress =
      progress;

    particle.userData.phase =
      Math.random() *
      Math.PI *
      2;

    particle.userData.baseScale =
      index % 4 === 0
        ? 1.05
        : 0.9;

    particle.scale.setScalar(
      particle.userData
        .baseScale
    );

    proteinGroup.add(
      particle
    );

    proteinParticles.push(
      particle
    );
  }

  /* ========================================================
     Transport path: rough ER → Golgi
     ======================================================== */

  const transportCurve =
  new THREE.CatmullRomCurve3([
    /* Rough ER */
    new THREE.Vector3(
      0.16,
      -0.68,
      0.40
    ),

    /* Vesicle buds away from ER */
    new THREE.Vector3(
      0.40,
      -0.76,
      0.48
    ),

    /* Cytoplasmic transport */
    new THREE.Vector3(
      0.72,
      -0.55,
      0.44
    ),

    /* Approaching cis-Golgi */
    new THREE.Vector3(
      0.96,
      -0.28,
      0.36
    ),

    /* Golgi arrival */
    new THREE.Vector3(
      1.12,
      -0.08,
      0.28
    ),
    ]);

  const transportPath =
    createGlowPath({
      curve:
        transportCurve,

      color:
        0x6ddfff,

      radius:
        0.013,

      opacity:
        0.2,
    });

  const transportPathMarker =
    createParticle(
      0.034,
      transportMarkerMaterial
    );

  transportPathMarker.visible =
    false;

  /* ========================================================
     Transport vesicle
     ======================================================== */

  const transportVesicle =
    new THREE.Group();

  transportVesicle.name =
    "transportVesicle";

  const transportShell =
    createParticle(
      0.19,
      vesicleMaterial
    );

  transportVesicle.add(
    transportShell
  );

  const transportCargo = [];

  for (
    let index = 0;
    index < 9;
    index += 1
  ) {
    const cargo =
      createParticle(
        0.038,
        proteinMaterial
      );

    cargo.position.set(
      THREE.MathUtils.randFloat(
        -0.09,
        0.09
      ),

      THREE.MathUtils.randFloat(
        -0.09,
        0.09
      ),

      THREE.MathUtils.randFloat(
        -0.09,
        0.09
      )
    );

    cargo.userData.basePosition =
      cargo.position.clone();

    cargo.userData.phase =
      Math.random() *
      Math.PI *
      2;

    transportVesicle.add(
      cargo
    );

    transportCargo.push(
      cargo
    );
  }

  transportVesicle.visible =
    false;

  /* ========================================================
     Secretion path: Golgi → plasma membrane
     ======================================================== */
const secretionCurve =
  new THREE.CatmullRomCurve3([
    /* Trans-Golgi */
    new THREE.Vector3(
      1.12,
      -0.08,
      0.28
    ),

    /* Newly formed secretory vesicle */
    new THREE.Vector3(
      1.45,
      0.02,
      0.32
    ),

    /* Cytoplasmic transport */
    new THREE.Vector3(
      1.85,
      0.14,
      0.30
    ),

    /* Approaching plasma membrane */
    new THREE.Vector3(
      2.25,
      0.28,
      0.26
    ),

    /* Plasma membrane fusion site */
    new THREE.Vector3(
      2.70,
      0.45,
      0.20
    ),
    ]);

  const secretionPath =
    createGlowPath({
      curve:
        secretionCurve,

      color:
        0xc36cff,

      radius:
        0.014,

      opacity:
        0.22,
    });

  const secretionPathMarker =
    createParticle(
      0.036,
      secretionMarkerMaterial
    );

  secretionPathMarker.visible =
    false;

  /* ========================================================
     Secretion vesicle
     ======================================================== */

  const secretionVesicle =
    new THREE.Group();

  secretionVesicle.name =
    "secretionVesicle";

  const secretionShell =
    createParticle(
      0.18,
      vesicleMaterial
    );

  secretionVesicle.add(
    secretionShell
  );

  const secretionCargo = [];

  for (
    let index = 0;
    index < 10;
    index += 1
  ) {
    const cargo =
      createParticle(
        0.036,
        secretionMaterial
      );

    cargo.position.set(
      THREE.MathUtils.randFloat(
        -0.085,
        0.085
      ),

      THREE.MathUtils.randFloat(
        -0.085,
        0.085
      ),

      THREE.MathUtils.randFloat(
        -0.085,
        0.085
      )
    );

    cargo.userData.basePosition =
      cargo.position.clone();

    cargo.userData.phase =
      Math.random() *
      Math.PI *
      2;

    secretionVesicle.add(
      cargo
    );

    secretionCargo.push(
      cargo
    );
  }

  secretionVesicle.visible =
    false;

  /* ========================================================
     Released proteins outside the cell
     ======================================================== */

  const releasedGroup =
    new THREE.Group();

  releasedGroup.name =
    "releasedProteins";

  const releasedParticles = [];

  for (
    let index = 0;
    index < 18;
    index += 1
  ) {
    const particle =
      createParticle(
        0.04,
        secretionMaterial
      );

    particle.position.copy(
      secretionCurve.getPoint(1)
    );

    particle.visible = false;

    particle.userData.direction =
      new THREE.Vector3(
        THREE.MathUtils.randFloat(
          0.4,
          1
        ),

        THREE.MathUtils.randFloat(
          -0.3,
          0.8
        ),

        THREE.MathUtils.randFloat(
          -0.4,
          0.4
        )
      ).normalize();

    particle.userData.speed =
      THREE.MathUtils.randFloat(
        0.35,
        0.75
      );

    particle.userData.phase =
      Math.random() *
      Math.PI *
      2;

    releasedGroup.add(
      particle
    );

    releasedParticles.push(
      particle
    );
  }

  /* ========================================================
     Assemble simulation
     ======================================================== */

  group.add(
    mrnaGroup,
    ribosome,
    proteinGroup,

    transportPath,
    transportPathMarker,
    transportVesicle,

    secretionPath,
    secretionPathMarker,
    secretionVesicle,

    releasedGroup
  );

  /*
   * Attach the pathway to the same scaled
   * group as the major cell organelles.
   */
  if (cell.contentGroup) {
    cell.contentGroup.add(
      group
    );
  } else {
    /*
     * Safe fallback if contentGroup has not
     * been added to cell.js yet.
     */
    cell.group.add(
      group
    );
  }

  /* ========================================================
     Preserve organelle layout scales
     ======================================================== */

  const dnaGroup =
    cell.nucleus?.dna?.group ??
    null;

  const dnaBaseScale =
    dnaGroup
      ? dnaGroup.scale.clone()
      : new THREE.Vector3(
          1,
          1,
          1
        );

  const golgiGroup =
    cell.golgi?.group ??
    null;

  const golgiBaseScale =
    golgiGroup
      ? golgiGroup.scale.clone()
      : new THREE.Vector3(
          1,
          1,
          1
        );

  /* ========================================================
     Simulation state
     ======================================================== */

  let currentTime = 0;

  /*
   * animationTime only advances while playing.
   * This freezes particle pulsing when paused.
   */
  let animationTime = 0;

  /*
   * Start paused.
   */
  let playing = false;

  let playbackSpeed = 1;

  let currentStageId =
    "dna";

  function getCurrentStage() {
    return (
      STAGES.find(
        (stage) =>
          currentTime >=
            stage.start &&
          currentTime <
            stage.end
      ) ??
      STAGES[
        STAGES.length - 1
      ]
    );
  }

  /* ========================================================
     Reset stage visuals
     ======================================================== */

  function resetVisuals() {
    /*
     * Restore DNA and Golgi scales before
     * applying the current stage animation.
     */
    if (dnaGroup) {
      dnaGroup.scale.copy(
        dnaBaseScale
      );
    }

    if (golgiGroup) {
      golgiGroup.scale.copy(
        golgiBaseScale
      );
    }

    mrnaBeads.forEach(
      (bead) => {
        bead.visible = false;

        bead.scale.setScalar(
          bead.userData
            .baseScale
        );
      }
    );

    mrnaHead.visible = false;

    ribosome.visible = false;
    ribosome.scale.setScalar(1);

    proteinParticles.forEach(
      (particle) => {
        particle.visible = false;

        particle.scale.setScalar(
          particle.userData
            .baseScale
        );
      }
    );

    transportPath.visible =
      false;

    transportPathMarker.visible =
      false;

    transportVesicle.visible =
      false;

    transportVesicle.scale.setScalar(
      1
    );

    secretionPath.visible =
      false;

    secretionPathMarker.visible =
      false;

    secretionVesicle.visible =
      false;

    secretionVesicle.scale.setScalar(
      1
    );

    releasedParticles.forEach(
      (particle) => {
        particle.visible =
          false;
      }
    );
  }

  /* ========================================================
     Stage 1: DNA
     ======================================================== */

  function updateDNAStage(
    elapsedTime
  ) {
    const progress =
      stageProgress(
        currentTime,
        STAGES[0]
      );

    if (!dnaGroup) {
      return;
    }

    const pulse =
      1 +
      Math.sin(
        elapsedTime * 1.5
      ) *
        0.025 *
        smoothStep(progress);

    setScaledFromBase(
      dnaGroup,
      dnaBaseScale,
      pulse
    );
  }

  /* ========================================================
     Stage 2: mRNA
     ======================================================== */

  function updateMRNAStage(
    elapsedTime
  ) {
    const progress =
      stageProgress(
        currentTime,
        STAGES[1]
      );

    const easedProgress =
      smoothStep(progress);

    mrnaBeads.forEach(
      (bead) => {
        bead.visible =
          bead.userData
            .progress <=
          easedProgress;

        if (!bead.visible) {
          return;
        }

        const pulse =
          bead.userData
            .baseScale *
          (
            1 +
            Math.sin(
              elapsedTime *
                2.2 +
              bead.userData.phase
            ) *
              0.055
          );

        bead.scale.setScalar(
          pulse
        );
      }
    );

    mrnaHead.visible = true;

    mrnaHead.position.copy(
      mrnaCurve.getPoint(
        easedProgress
      )
    );

    mrnaHead.scale.setScalar(
      0.92 +
        Math.sin(
          elapsedTime * 2.8
        ) *
          0.08
    );
  }

  /* ========================================================
     Stage 3: Translation
     ======================================================== */

  function updateTranslationStage(
    elapsedTime
  ) {
    const progress =
      stageProgress(
        currentTime,
        STAGES[2]
      );

    const easedProgress =
      smoothStep(progress);

    mrnaBeads.forEach(
      (bead) => {
        bead.visible = true;
      }
    );

    mrnaHead.visible = false;

    ribosome.visible = true;

    const ribosomePulse =
      1 +
      Math.sin(
        elapsedTime * 2
      ) *
        0.06;

    ribosome.scale.setScalar(
      ribosomePulse
    );

    proteinParticles.forEach(
      (particle) => {
        particle.visible =
          particle.userData
            .progress <=
          easedProgress;

        if (!particle.visible) {
          return;
        }

        const pulse =
          particle.userData
            .baseScale *
          (
            1 +
            Math.sin(
              elapsedTime *
                1.8 +
              particle.userData
                .phase
            ) *
              0.07
          );

        particle.scale.setScalar(
          pulse
        );
      }
    );
  }

  /* ========================================================
     Stage 4: Transport vesicle
     ======================================================== */

  function updateTransportStage(
    elapsedTime
  ) {
    const progress =
      stageProgress(
        currentTime,
        STAGES[3]
      );

    const easedProgress =
      smoothStep(progress);

    transportPath.visible =
      true;

    transportPathMarker.visible =
      true;

    transportVesicle.visible =
      true;

    transportVesicle.position.copy(
      transportCurve.getPoint(
        easedProgress
      )
    );

    transportPathMarker.position.copy(
      transportCurve.getPoint(
        clamp01(
          easedProgress +
            0.06
        )
      )
    );

    transportPathMarker.scale.setScalar(
      0.8 +
        Math.sin(
          elapsedTime * 2.4
        ) *
          0.12
    );

    const tangent =
      transportCurve
        .getTangent(
          easedProgress
        )
        .normalize();

    transportVesicle.quaternion
      .setFromUnitVectors(
        new THREE.Vector3(
          0,
          1,
          0
        ),
        tangent
      );

    transportCargo.forEach(
      (cargo) => {
        const base =
          cargo.userData
            .basePosition;

        cargo.position.set(
          base.x +
            Math.sin(
              elapsedTime * 2 +
                cargo.userData
                  .phase
            ) *
              0.012,

          base.y +
            Math.cos(
              elapsedTime * 2 +
                cargo.userData
                  .phase
            ) *
              0.012,

          base.z +
            Math.sin(
              elapsedTime *
                1.7 +
                cargo.userData
                  .phase
            ) *
              0.012
        );
      }
    );
  }

  /* ========================================================
     Stage 5: Golgi processing
     ======================================================== */

  function updateGolgiStage(
    elapsedTime
  ) {
    const progress =
      stageProgress(
        currentTime,
        STAGES[4]
      );

    transportPath.visible =
      progress < 0.22;

    transportPathMarker.visible =
      progress < 0.2;

    transportVesicle.visible =
      progress < 0.2;

    transportVesicle.position.copy(
      transportCurve.getPoint(1)
    );

    if (golgiGroup) {
      const pulse =
        1 +
        Math.sin(
          elapsedTime * 1.05
        ) *
          0.025 +
        Math.sin(
          smoothStep(progress) *
            Math.PI
        ) *
          0.035;

      setScaledFromBase(
        golgiGroup,
        golgiBaseScale,
        pulse
      );
    }

    /*
     * Form the secretion vesicle near
     * the trans side of the Golgi.
     */
    if (progress > 0.48) {
      const formation =
        smoothStep(
          (
            progress -
            0.48
          ) /
          0.52
        );

      secretionVesicle.visible =
        true;

      secretionVesicle.position.copy(
        secretionCurve.getPoint(0)
      );

      secretionVesicle.scale.setScalar(
        0.2 +
          formation * 0.8
      );
    }
  }

  /* ========================================================
     Stage 6: Secretion
     ======================================================== */

  function updateSecretionStage(
    elapsedTime
  ) {
    const progress =
      stageProgress(
        currentTime,
        STAGES[5]
      );

    const movementProgress =
      smoothStep(
        clamp01(
          progress * 1.38
        )
      );

    secretionPath.visible =
      true;

    secretionPathMarker.visible =
      progress < 0.75;

    secretionVesicle.visible =
      progress < 0.76;

    secretionVesicle.scale.setScalar(
      1
    );

    secretionVesicle.position.copy(
      secretionCurve.getPoint(
        movementProgress
      )
    );

    secretionPathMarker.position.copy(
      secretionCurve.getPoint(
        clamp01(
          movementProgress +
            0.055
        )
      )
    );

    secretionPathMarker.scale.setScalar(
      0.82 +
        Math.sin(
          elapsedTime * 2.5
        ) *
          0.13
    );

    secretionCargo.forEach(
      (cargo) => {
        const base =
          cargo.userData
            .basePosition;

        cargo.position.set(
          base.x +
            Math.sin(
              elapsedTime *
                2.2 +
                cargo.userData
                  .phase
            ) *
              0.012,

          base.y +
            Math.cos(
              elapsedTime * 2 +
                cargo.userData
                  .phase
            ) *
              0.012,

          base.z +
            Math.sin(
              elapsedTime *
                1.8 +
                cargo.userData
                  .phase
            ) *
              0.012
        );
      }
    );

    const releaseProgress =
      clamp01(
        (
          progress -
          0.68
        ) /
        0.32
      );

    releasedParticles.forEach(
      (
        particle,
        index
      ) => {
        const individualDelay =
          (
            index /
            releasedParticles.length
          ) *
          0.35;

        const particleProgress =
          smoothStep(
            clamp01(
              (
                releaseProgress -
                individualDelay
              ) /
              0.65
            )
          );

        particle.visible =
          particleProgress > 0;

        if (!particle.visible) {
          return;
        }

        const fusionPoint =
  secretionCurve.getPoint(1);

const releaseOrigin =
  fusionPoint
    .clone()
    .add(
      new THREE.Vector3(
        0.08,
        0.03,
        0
      )
    );

particle.position.copy(
  releaseOrigin
);

        particle.position
          .addScaledVector(
            particle.userData
              .direction,

            particleProgress *
              particle.userData
                .speed
          );

        particle.scale.setScalar(
          0.8 +
            Math.sin(
              elapsedTime * 3 +
                particle.userData
                  .phase
            ) *
              0.18
        );
      }
    );
  }

  /* ========================================================
     Main update
     ======================================================== */

  function update(
    deltaTime
  ) {
    if (playing) {
      const safeDelta =
        Math.min(
          Math.max(
            deltaTime,
            0
          ),
          0.05
        );

      const scaledDelta =
        safeDelta *
        playbackSpeed;

      currentTime +=
        scaledDelta;

      animationTime +=
        scaledDelta;

      if (
        currentTime >=
        TOTAL_DURATION
      ) {
        currentTime = 0;
        animationTime = 0;
      }
    }

    resetVisuals();

    const stage =
      getCurrentStage();

    currentStageId =
      stage.id;

    if (
      stage.id ===
      "dna"
    ) {
      updateDNAStage(
        animationTime
      );
    }

    if (
      stage.id ===
      "mrna"
    ) {
      updateMRNAStage(
        animationTime
      );
    }

    if (
      stage.id ===
      "translation"
    ) {
      updateTranslationStage(
        animationTime
      );
    }

    if (
      stage.id ===
      "transport"
    ) {
      updateTransportStage(
        animationTime
      );
    }

    if (
      stage.id ===
      "golgi"
    ) {
      updateGolgiStage(
        animationTime
      );
    }

    if (
      stage.id ===
      "secretion"
    ) {
      updateSecretionStage(
        animationTime
      );
    }
  }

  /* ========================================================
     Playback controls
     ======================================================== */

  function play() {
    playing = true;
  }

  function pause() {
    playing = false;
  }

  function toggle() {
    playing = !playing;
  }

  function restart() {
    currentTime = 0;
    animationTime = 0;
    playing = true;
  }

  function setSpeed(speed) {
    playbackSpeed =
      Math.max(
        0.1,

        Number.isFinite(speed)
          ? speed
          : 1
      );
  }

  function seek(time) {
    currentTime =
      THREE.MathUtils.clamp(
        Number.isFinite(time)
          ? time
          : 0,

        0,
        TOTAL_DURATION
      );

    /*
     * Match the visual animation state
     * to the selected timeline time.
     */
    animationTime =
      currentTime;
  }

  /* ========================================================
     Public API
     ======================================================== */

  return {
    group,

    stages:
      STAGES,

    totalDuration:
      TOTAL_DURATION,

    update,
    play,
    pause,
    toggle,
    restart,
    setSpeed,
    seek,

    get time() {
      return currentTime;
    },

    get stage() {
      return currentStageId;
    },

    get isPlaying() {
      return playing;
    },
  };
}