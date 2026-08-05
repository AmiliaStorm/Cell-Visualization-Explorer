import * as THREE from "three";

/* ==========================================================
   Deterministic random helpers

   Keeps the mitochondria consistent across refreshes.
   ========================================================== */

function pseudoRandom(seed) {
  const value =
    Math.sin(seed * 12.9898) *
    43758.5453;

  return value - Math.floor(value);
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
   Slightly deform a sphere so the mitochondrion
   feels more organic and less perfectly smooth
   ========================================================== */

function deformGeometry(
  geometry,
  strength = 0.045
) {
  const position =
    geometry.attributes.position;

  const vertex =
    new THREE.Vector3();

  const direction =
    new THREE.Vector3();

  for (
    let index = 0;
    index < position.count;
    index += 1
  ) {
    vertex.fromBufferAttribute(
      position,
      index
    );

    direction
      .copy(vertex)
      .normalize();

    const waveOne =
      Math.sin(
        direction.x * 3.2 +
          direction.y * 2.1 -
          direction.z * 1.9
      ) * strength;

    const waveTwo =
      Math.cos(
        direction.z * 4.1 -
          direction.x * 2.7
      ) *
      strength *
      0.65;

    const waveThree =
      Math.sin(
        direction.y * 5.8 +
          direction.z * 3.2
      ) *
      strength *
      0.4;

    const deformation =
      waveOne +
      waveTwo +
      waveThree;

    vertex.addScaledVector(
      direction,
      deformation
    );

    position.setXYZ(
      index,
      vertex.x,
      vertex.y,
      vertex.z
    );
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();

  return geometry;
}

/* ==========================================================
   Create one curved crista
   ========================================================== */

function createCrista({
  seed,
  y,
  z,
  length,
  amplitude,
  material,
}) {
  const points = [];

  const segments = 24;

  for (
    let index = 0;
    index <= segments;
    index += 1
  ) {
    const progress =
      index / segments;

    const x =
      THREE.MathUtils.lerp(
        -length * 0.5,
        length * 0.5,
        progress
      );

    const wave =
      Math.sin(
        progress *
          Math.PI *
          3.2 +
          seed
      ) * amplitude;

    const verticalFold =
      Math.sin(
        progress *
          Math.PI *
          1.5 +
          seed * 0.7
      ) *
      amplitude *
      0.45;

    points.push(
      new THREE.Vector3(
        x,
        y + wave,
        z + verticalFold
      )
    );
  }

  const curve =
    new THREE.CatmullRomCurve3(
      points
    );

  const geometry =
    new THREE.TubeGeometry(
      curve,
      40,
      0.014,
      8,
      false
    );

  const crista =
    new THREE.Mesh(
      geometry,
      material
    );

  crista.castShadow = true;
  crista.receiveShadow = true;

  return crista;
}

/* ==========================================================
   Create one mitochondrion
   ========================================================== */

function createMitochondrion(
  seed = 0
) {
  const group =
    new THREE.Group();

  group.name =
    "mitochondrion";

  group.userData.type =
    "mitochondrion";

  /* --------------------------------------------------------
     Materials
     -------------------------------------------------------- */

  const outerMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0xa84f34,

      transparent: true,
      opacity: 0.9,

      roughness: 0.38,
      metalness: 0,

      transmission: 0.03,
      thickness: 0.18,

      clearcoat: 0.45,
      clearcoatRoughness: 0.24,

      emissive: 0x3d120d,
      emissiveIntensity: 0.18,

      side: THREE.DoubleSide,
    });

  const innerMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0xe28a5d,

      transparent: true,
      opacity: 0.22,

      roughness: 0.42,
      metalness: 0,

      transmission: 0.02,
      thickness: 0.08,

      emissive: 0x552013,
      emissiveIntensity: 0.12,

      side: THREE.DoubleSide,
      depthWrite: false,
    });

  const matrixMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x68231b,

      transparent: true,
      opacity: 0.5,

      emissive: 0x37110c,
      emissiveIntensity: 0.22,

      roughness: 0.55,
      depthWrite: false,
    });

  const cristaMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xffbf8a,

      emissive: 0x7a2b15,
      emissiveIntensity: 0.34,

      roughness: 0.4,
      metalness: 0,
    });

  const atpMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xffd86a,

      emissive: 0xff9f18,
      emissiveIntensity: 0.8,

      roughness: 0.28,
      metalness: 0,
    });

  /* --------------------------------------------------------
     Outer membrane
     -------------------------------------------------------- */

  const outerGeometry =
    deformGeometry(
      new THREE.SphereGeometry(
        0.62,
        56,
        56
      ),
      0.035
    );

  const outerMembrane =
    new THREE.Mesh(
      outerGeometry,
      outerMaterial
    );

  /*
   * Smaller and more proportional than before.
   */
  outerMembrane.scale.set(
    1.42,
    0.6,
    0.78
  );

  outerMembrane.castShadow =
    true;

  /* --------------------------------------------------------
     Inner membrane
     -------------------------------------------------------- */

  const innerGeometry =
    deformGeometry(
      new THREE.SphereGeometry(
        0.54,
        48,
        48
      ),
      0.026
    );

  const innerMembrane =
    new THREE.Mesh(
      innerGeometry,
      innerMaterial
    );

  innerMembrane.scale.set(
    1.34,
    0.55,
    0.7
  );

  /* --------------------------------------------------------
     Matrix
     -------------------------------------------------------- */

  const matrix =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.48,
        40,
        40
      ),
      matrixMaterial
    );

  matrix.scale.set(
    1.28,
    0.5,
    0.64
  );

  /* --------------------------------------------------------
     Cristae
     -------------------------------------------------------- */

  const cristaeGroup =
    new THREE.Group();

  const cristae = [];

  const cristaCount = 7;

  for (
    let index = 0;
    index < cristaCount;
    index += 1
  ) {
    const progress =
      index /
      (cristaCount - 1);

    const y =
      THREE.MathUtils.lerp(
        -0.2,
        0.2,
        progress
      );

    const z =
      randomBetween(
        seed * 100 + index,
        -0.12,
        0.12
      );

    const length =
      randomBetween(
        seed * 110 + index,
        0.68,
        0.9
      );

    const amplitude =
      randomBetween(
        seed * 120 + index,
        0.045,
        0.07
      );

    const crista =
      createCrista({
        seed:
          seed * 10 +
          index * 0.8,
        y,
        z,
        length,
        amplitude,
        material:
          cristaMaterial,
      });

    crista.rotation.x =
      randomBetween(
        seed * 130 + index,
        -0.22,
        0.22
      );

    crista.rotation.z =
      randomBetween(
        seed * 140 + index,
        -0.12,
        0.12
      );

    crista.userData.baseRotationZ =
      crista.rotation.z;

    crista.userData.baseRotationX =
      crista.rotation.x;

    crista.userData.phase =
      randomBetween(
        seed * 150 + index,
        0,
        Math.PI * 2
      );

    cristaeGroup.add(crista);
    cristae.push(crista);
  }

  /* --------------------------------------------------------
     ATP particles
     -------------------------------------------------------- */

  const atpGroup =
    new THREE.Group();

  const atpParticles = [];

  const atpCount = 8;

  for (
    let index = 0;
    index < atpCount;
    index += 1
  ) {
    const particle =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.016,
          9,
          9
        ),
        atpMaterial
      );

    const localSeed =
      seed * 200 + index;

    particle.position.set(
      randomBetween(
        localSeed + 1,
        -0.34,
        0.34
      ),
      randomBetween(
        localSeed + 2,
        -0.18,
        0.18
      ),
      randomBetween(
        localSeed + 3,
        -0.15,
        0.15
      )
    );

    particle.userData.basePosition =
      particle.position.clone();

    particle.userData.phase =
      randomBetween(
        localSeed + 4,
        0,
        Math.PI * 2
      );

    particle.userData.speed =
      randomBetween(
        localSeed + 5,
        0.35,
        0.7
      );

    atpGroup.add(particle);
    atpParticles.push(particle);
  }

  /* --------------------------------------------------------
     Info
     -------------------------------------------------------- */

  group.userData.organelleId =
    "mitochondrion";

  group.userData.info = {
    title:
      "Mitochondrion",

    subtitle:
      "Powerhouse",

    summary:
      "Produces ATP through cellular respiration.",

    functions: [
      "Citric Acid Cycle",
      "Electron Transport Chain",
      "Chemiosmosis",
      "ATP Synthase",
    ],

    simulation: {
      id:
        "atpProduction",

      label:
        "Explore ATP Production",
    },
  };

  /* --------------------------------------------------------
     Assemble
     -------------------------------------------------------- */

  group.add(
    matrix,
    cristaeGroup,
    innerMembrane,
    outerMembrane,
    atpGroup
  );

  group.userData.outerMembrane =
    outerMembrane;

  group.userData.innerMembrane =
    innerMembrane;

  group.userData.matrix =
    matrix;

  group.userData.cristae =
    cristae;

  group.userData.atpParticles =
    atpParticles;

  group.userData.phase =
    randomBetween(
      seed * 500 + 1,
      0,
      Math.PI * 2
    );

  return group;
}

/* ==========================================================
   Create all mitochondria
   ========================================================== */

export function createMitochondria() {
  const mitochondria = [
    createMitochondrion(0.4),
    createMitochondrion(1.8),
    createMitochondrion(3.1),
  ];

  mitochondria.animate =
    function animate(
      elapsedTime
    ) {
      mitochondria.forEach(
        (
          mitochondrion,
          index
        ) => {
          const phase =
            mitochondrion
              .userData.phase;

          const pulse =
            1 +
            Math.sin(
              elapsedTime *
                0.45 +
                phase
            ) *
              0.01;

          /*
           * Preserve the scale assigned
           * by layout.js while adding
           * a tiny breathing motion.
           */
          const layoutScale =
            mitochondrion
              .userData
              .layoutScale ??
            mitochondrion.scale.x;

          mitochondrion.scale.setScalar(
            layoutScale * pulse
          );

          mitochondrion.userData.cristae.forEach(
            (
              crista,
              cristaIndex
            ) => {
              crista.rotation.z =
                crista.userData
                  .baseRotationZ +
                Math.sin(
                  elapsedTime *
                    0.32 +
                    crista.userData
                      .phase +
                    cristaIndex *
                      0.18
                ) *
                  0.018;

              crista.rotation.x =
                crista.userData
                  .baseRotationX +
                Math.cos(
                  elapsedTime *
                    0.28 +
                    crista.userData
                      .phase
                ) *
                  0.012;
            }
          );

          mitochondrion.userData.atpParticles.forEach(
            (particle) => {
              const base =
                particle.userData
                  .basePosition;

              particle.position.set(
                base.x +
                  Math.sin(
                    elapsedTime *
                      particle
                        .userData
                        .speed +
                      particle
                        .userData
                        .phase
                  ) *
                    0.012,

                base.y +
                  Math.cos(
                    elapsedTime *
                      particle
                        .userData
                        .speed +
                      particle
                        .userData
                        .phase
                  ) *
                    0.01,

                base.z +
                  Math.sin(
                    elapsedTime *
                      0.55 +
                      particle
                        .userData
                        .phase
                  ) *
                    0.009
              );

              const particlePulse =
                0.82 +
                Math.sin(
                  elapsedTime *
                    1.05 +
                    particle
                      .userData
                      .phase
                ) *
                  0.12;

              particle.scale.setScalar(
                particlePulse
              );
            }
          );

          mitochondrion.rotation.y +=
            0.00008 *
            (
              index % 2 === 0
                ? 1
                : -1
            );
        }
      );
    };

  return mitochondria;
}