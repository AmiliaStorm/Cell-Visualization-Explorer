import * as THREE from "three";
import { createDNA } from "./dna.js";

/* ==========================================================
   Deterministic random helpers

   These prevent the nucleus layout from changing
   every time the browser refreshes.
   ========================================================== */

function pseudoRandom(seed) {
  const value =
    Math.sin(seed * 12.9898) *
    43758.5453;

  return value -
    Math.floor(value);
}

function randomBetween(
  seed,
  minimum,
  maximum
) {
  return THREE.MathUtils.lerp(
    minimum,
    maximum,
    pseudoRandom(seed)
  );
}

/* ==========================================================
   Create a deterministic point inside the nucleus
   ========================================================== */

function pointInsideNucleus(
  seed,
  radius = 0.72
) {
  const direction =
    new THREE.Vector3(
      randomBetween(
        seed + 1,
        -1,
        1
      ),

      randomBetween(
        seed + 2,
        -1,
        1
      ),

      randomBetween(
        seed + 3,
        -1,
        1
      )
    );

  if (
    direction.lengthSq() <
    0.001
  ) {
    direction.set(
      1,
      0,
      0
    );
  }

  direction.normalize();

  const distance =
    Math.cbrt(
      pseudoRandom(
        seed + 4
      )
    ) * radius;

  return direction.multiplyScalar(
    distance
  );
}

/* ==========================================================
   Create one chromatin strand
   ========================================================== */

function createTube(
  points,
  radius,
  baseMaterial
) {
  const curve =
    new THREE.CatmullRomCurve3(
      points
    );

  const geometry =
    new THREE.TubeGeometry(
      curve,
      38,
      radius,
      7,
      false
    );

  /*
   * Each strand gets a separate material.
   * This allows individual opacity animation.
   */
  const material =
    baseMaterial.clone();

  material.depthWrite = false;

  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );

  mesh.userData.baseOpacity =
    material.opacity;

  return mesh;
}

/* ==========================================================
   Create one nuclear pore
   ========================================================== */

function createNuclearPore({
  position,
  normal,
  baseMaterial,
  phase,
}) {
  const material =
    baseMaterial.clone();

  const pore =
    new THREE.Mesh(
      new THREE.TorusGeometry(
        0.039,
        0.009,
        7,
        18
      ),
      material
    );

  pore.position.copy(
    position
  );

  pore.quaternion.setFromUnitVectors(
    new THREE.Vector3(
      0,
      0,
      1
    ),
    normal
  );

  pore.userData.phase =
    phase;

  pore.userData.baseIntensity =
    material.emissiveIntensity;

  return pore;
}

/* ==========================================================
   Nucleus
   ========================================================== */

export function createNucleus() {
  const group =
    new THREE.Group();

  group.name =
    "nucleus";

  group.userData.type =
    "nucleus";

  group.userData.organelleId =
    "nucleus";

  group.userData.info = {
    title:
      "Nucleus",

    subtitle:
      "Genetic control centre",

    summary:
      "Stores the cell's DNA and regulates gene expression.",

    functions: [
      "DNA storage",
      "Gene regulation",
      "Transcription",
      "Ribosomal RNA production",
    ],
  };

  /* ========================================================
     Nuclear envelope
     ======================================================== */

  const outerMembraneMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0x7546c5,

      transparent: true,
      opacity: 0.5,

      roughness: 0.3,
      metalness: 0,

      transmission: 0,

      clearcoat: 0.55,
      clearcoatRoughness: 0.28,

      emissive: 0x3a1a70,
      emissiveIntensity: 0.35,

      side: THREE.DoubleSide,

      depthWrite: false,
      depthTest: true,
    });

  const outerMembrane =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        1,
        72,
        72
      ),
      outerMembraneMaterial
    );

  outerMembrane.scale.set(
    1.05,
    0.94,
    0.98
  );

  outerMembrane.userData.baseScale =
    outerMembrane.scale.clone();

  const innerMembraneMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0x9b70df,

      transparent: true,
      opacity: 0.3,

      roughness: 0.36,
      metalness: 0,

      transmission: 0,

      emissive: 0x4a1f7d,
      emissiveIntensity: 0.28,

      side: THREE.DoubleSide,

      depthWrite: false,
      depthTest: true,
    });

  const innerMembrane =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.93,
        64,
        64
      ),
      innerMembraneMaterial
    );

  innerMembrane.scale.set(
    1.05,
    0.94,
    0.98
  );

  innerMembrane.userData.baseScale =
    innerMembrane.scale.clone();

  /* ========================================================
     Nucleoplasm

     A very subtle interior volume gives the
     nucleus depth without hiding the DNA.
     ======================================================== */

  const nucleoplasm =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.89,
        56,
        56
      ),

      new THREE.MeshStandardMaterial({
        color: 0x5a2f96,

        transparent: true,
        opacity: 0.28,

        emissive: 0x2a1050,
        emissiveIntensity: 0.32,

        roughness: 0.55,

        depthWrite: false,
      })
    );

  nucleoplasm.scale.set(
    1.05,
    0.94,
    0.98
  );

  /* ========================================================
     Nucleolus
     ======================================================== */

  const nucleolus =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.21,
        40,
        40
      ),

      new THREE.MeshStandardMaterial({
        color: 0xc29aef,

        emissive: 0x56317c,
        emissiveIntensity: 0.52,

        roughness: 0.34,
      })
    );

  nucleolus.position.set(
    0.24,
    0.14,
    -0.12
  );

  nucleolus.userData.baseScale =
    nucleolus.scale.clone();

  /* ========================================================
     DNA
     ======================================================== */

  const dna =
    createDNA();

  dna.group.position.set(
    -0.08,
    -0.03,
    0.08
  );

  /*
   * Store the starting scale so other simulations
   * can still animate the DNA safely.
   */
  dna.group.userData.baseScale =
    dna.group.scale.clone();

  /* ========================================================
     Chromatin network
     ======================================================== */

  const chromatinGroup =
    new THREE.Group();

  chromatinGroup.name =
    "chromatin";

  const chromatinBaseMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xc9b0ec,

      transparent: true,
      opacity: 0.13,

      roughness: 0.42,

      emissive: 0x3b1d61,
      emissiveIntensity: 0.15,

      depthWrite: false,
    });

  const chromatinStrands = [];

  const chromatinCount = 7;

  for (
    let index = 0;
    index < chromatinCount;
    index += 1
  ) {
    const seed =
      index * 30 + 1;

    const strand =
      createTube(
        [
          pointInsideNucleus(
            seed + 1,
            0.46
          ),

          pointInsideNucleus(
            seed + 5,
            0.66
          ),

          pointInsideNucleus(
            seed + 9,
            0.54
          ),

          pointInsideNucleus(
            seed + 13,
            0.64
          ),
        ],

        0.0065,

        chromatinBaseMaterial
      );

    strand.userData.phase =
      randomBetween(
        seed + 20,
        0,
        Math.PI * 2
      );

    chromatinGroup.add(
      strand
    );

    chromatinStrands.push(
      strand
    );
  }

  /* ========================================================
     Nuclear pores
     ======================================================== */

  const poreGroup =
    new THREE.Group();

  poreGroup.name =
    "nuclearPores";

  const poreBaseMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x74cde9,

      emissive: 0x174a60,
      emissiveIntensity: 0.34,

      roughness: 0.38,
    });

  const pores = [];

  const poreCount = 24;

  const goldenAngle =
    Math.PI *
    (
      3 -
      Math.sqrt(5)
    );

  for (
    let index = 0;
    index < poreCount;
    index += 1
  ) {
    /*
     * Fibonacci-sphere placement gives a more
     * even distribution than pure randomness.
     */
    const vertical =
      1 -
      (
        index /
        (poreCount - 1)
      ) * 2;

    const horizontalRadius =
      Math.sqrt(
        Math.max(
          0,
          1 -
          vertical * vertical
        )
      );

    const theta =
      goldenAngle * index;

    const normal =
      new THREE.Vector3(
        Math.cos(theta) *
          horizontalRadius,

        vertical,

        Math.sin(theta) *
          horizontalRadius
      ).normalize();

    const position =
      new THREE.Vector3(
        normal.x * 1.055,
        normal.y * 0.945,
        normal.z * 0.985
      );

    const pore =
      createNuclearPore({
        position,
        normal,

        baseMaterial:
          poreBaseMaterial,

        phase:
          index * 0.63,
      });

    poreGroup.add(
      pore
    );

    pores.push(
      pore
    );
  }

  /* ========================================================
     Small nucleoplasmic particles
     ======================================================== */

  const particleGroup =
    new THREE.Group();

  const particles = [];

  const particleGeometry =
    new THREE.SphereGeometry(
      0.012,
      8,
      8
    );

  const particleMaterial =
    new THREE.MeshBasicMaterial({
      color: 0xaecde7,

      transparent: true,
      opacity: 0.42,

      depthWrite: false,
    });

  const particleCount = 14;

  for (
    let index = 0;
    index < particleCount;
    index += 1
  ) {
    const seed =
      index * 18 + 200;

    const particle =
      new THREE.Mesh(
        particleGeometry,
        particleMaterial
      );

    particle.position.copy(
      pointInsideNucleus(
        seed,
        0.7
      )
    );

    particle.userData.basePosition =
      particle.position.clone();

    particle.userData.phase =
      randomBetween(
        seed + 5,
        0,
        Math.PI * 2
      );

    particle.userData.speed =
      randomBetween(
        seed + 6,
        0.18,
        0.38
      );

    particleGroup.add(
      particle
    );

    particles.push(
      particle
    );
  }

  /* ========================================================
     Assemble nucleus
     ======================================================== */

  group.add(
    nucleoplasm,
    chromatinGroup,
    dna.group,
    nucleolus,
    particleGroup,
    innerMembrane,
    outerMembrane,
    poreGroup
  );

  /* ========================================================
     Animation
     ======================================================== */

  function animate(
    elapsedTime
  ) {
    /*
     * Preserve the scale applied by layout.js.
     *
     * The old version used setScalar(pulse),
     * which erased the configured 0.72 scale.
     */
    if (
      !group.userData.layoutScale
    ) {
      group.userData.layoutScale =
        group.scale.clone();
    }

    const layoutScale =
      group.userData.layoutScale;

    const nucleusPulse =
      1 +
      Math.sin(
        elapsedTime * 0.45
      ) *
        0.004;

    group.scale.set(
      layoutScale.x *
        nucleusPulse,

      layoutScale.y *
        nucleusPulse,

      layoutScale.z *
        nucleusPulse
    );

    const envelopePulse =
      1 +
      Math.sin(
        elapsedTime * 0.38
      ) *
        0.003;

    outerMembrane.scale.set(
      outerMembrane.userData
        .baseScale.x *
        envelopePulse,

      outerMembrane.userData
        .baseScale.y *
        envelopePulse,

      outerMembrane.userData
        .baseScale.z *
        envelopePulse
    );

    innerMembrane.scale.set(
      innerMembrane.userData
        .baseScale.x *
        envelopePulse,

      innerMembrane.userData
        .baseScale.y *
        envelopePulse,

      innerMembrane.userData
        .baseScale.z *
        envelopePulse
    );

    const nucleolusPulse =
      1 +
      Math.sin(
        elapsedTime * 0.8
      ) *
        0.025;

    nucleolus.scale.setScalar(
      nucleolusPulse
    );

    chromatinGroup.rotation.y =
      elapsedTime * 0.012;

    chromatinGroup.rotation.x =
      Math.sin(
        elapsedTime * 0.15
      ) * 0.018;

    dna.animate(
      elapsedTime
    );

    chromatinStrands.forEach(
      (
        strand,
        index
      ) => {
        const opacityVariation =
          Math.sin(
            elapsedTime * 0.35 +
              strand.userData.phase +
              index * 0.15
          ) * 0.018;

        strand.material.opacity =
          strand.userData
            .baseOpacity +
          opacityVariation;
      }
    );

    pores.forEach(
      (pore) => {
        pore.material
          .emissiveIntensity =
          pore.userData
            .baseIntensity +
          Math.sin(
            elapsedTime * 0.55 +
              pore.userData.phase
          ) * 0.055;
      }
    );

    particles.forEach(
      (particle) => {
        const base =
          particle.userData
            .basePosition;

        const phase =
          particle.userData
            .phase;

        const speed =
          particle.userData
            .speed;

        particle.position.set(
          base.x +
            Math.sin(
              elapsedTime *
                speed +
                phase
            ) * 0.012,

          base.y +
            Math.cos(
              elapsedTime *
                speed +
                phase
            ) * 0.012,

          base.z +
            Math.sin(
              elapsedTime *
                0.35 +
                phase
            ) * 0.009
        );
      }
    );
  }

  return {
    group,
    outerMembrane,
    innerMembrane,
    nucleoplasm,
    nucleolus,
    chromatinGroup,
    poreGroup,
    particleGroup,
    particles,
    dna,
    animate,
  };
}