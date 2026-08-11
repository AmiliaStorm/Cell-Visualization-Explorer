import * as THREE from "three";


/* ==========================================================
   Deterministic random helpers
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
   Organic deformation

   Breaks the perfect ellipsoid shape so every mitochondrion
   feels slightly biological rather than mathematically smooth.
   ========================================================== */

function deformGeometry(
  geometry,
  seed,
  strength = 0.035
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
        direction.x * 3.1 +
        direction.y * 2.4 -
        direction.z * 1.8 +
        seed
      ) *
      strength;


    const waveTwo =
      Math.cos(
        direction.z * 4.3 -
        direction.x * 2.5 +
        seed * 0.7
      ) *
      strength *
      0.55;


    const waveThree =
      Math.sin(
        direction.y * 5.2 +
        direction.z * 2.9 +
        seed * 1.2
      ) *
      strength *
      0.32;


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
  geometry.computeBoundingSphere();


  return geometry;
}


/* ==========================================================
   Create one crista

   These are broad glowing internal folds rather than tiny
   almost invisible lines.
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

  const segments = 34;


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


    const mainFold =
      Math.sin(
        progress *
          Math.PI *
          2.4 +
        seed
      ) *
      amplitude;


    const secondaryFold =
      Math.sin(
        progress *
          Math.PI *
          5.0 +
        seed * 0.63
      ) *
      amplitude *
      0.24;


    const depthFold =
      Math.cos(
        progress *
          Math.PI *
          2.2 +
        seed * 0.8
      ) *
      amplitude *
      0.36;


    points.push(
      new THREE.Vector3(
        x,

        y +
          mainFold +
          secondaryFold,

        z +
          depthFold
      )
    );
  }


  const curve =
    new THREE.CatmullRomCurve3(
      points,
      false,
      "catmullrom",
      0.45
    );


  const geometry =
    new THREE.TubeGeometry(
      curve,
      54,
      0.021,
      10,
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


  group.userData.organelleId =
    "mitochondrion";


  /* ========================================================
     Materials
     ======================================================== */

  const outerMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0xb65338,

      transparent: true,

      /*
       * Lower transparency lets us see the internal cristae.
       */
      opacity: 0.64,

      roughness: 0.28,

      metalness: 0,

      transmission: 0.05,

      thickness: 0.18,

      clearcoat: 0.72,

      clearcoatRoughness: 0.18,

      emissive:
        0x46140c,

      emissiveIntensity:
        0.28,

      side:
        THREE.DoubleSide,

      depthWrite: false,
    });


  const innerMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0xe37b4f,

      transparent: true,

      opacity: 0.16,

      roughness: 0.34,

      metalness: 0,

      transmission: 0.04,

      thickness: 0.08,

      emissive:
        0x702514,

      emissiveIntensity:
        0.23,

      side:
        THREE.DoubleSide,

      depthWrite: false,
    });


  const matrixMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x74251c,

      transparent: true,

      opacity: 0.22,

      emissive:
        0x38100b,

      emissiveIntensity:
        0.18,

      roughness: 0.52,

      depthWrite: false,
    });


  const cristaMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0xffb274,

      emissive:
        0xb3441e,

      emissiveIntensity:
        0.72,

      roughness: 0.26,

      metalness: 0,

      clearcoat: 0.48,

      clearcoatRoughness:
        0.2,
    });


  const atpMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xffde79,

      emissive:
        0xffa51c,

      emissiveIntensity:
        1.1,

      roughness: 0.22,

      metalness: 0,
    });


  /* ========================================================
     Outer membrane
     ======================================================== */

  const outerGeometry =
    deformGeometry(
      new THREE.SphereGeometry(
        0.62,
        64,
        56
      ),
      seed,
      0.036
    );


  const outerMembrane =
    new THREE.Mesh(
      outerGeometry,
      outerMaterial
    );


  /*
   * Broad bean-like proportions.
   */

  outerMembrane.scale.set(
    1.48,
    0.62,
    0.78
  );


  outerMembrane.castShadow = true;

  outerMembrane.renderOrder = 5;


  /* ========================================================
     Inner membrane
     ======================================================== */

  const innerGeometry =
    deformGeometry(
      new THREE.SphereGeometry(
        0.535,
        56,
        48
      ),
      seed + 2.4,
      0.025
    );


  const innerMembrane =
    new THREE.Mesh(
      innerGeometry,
      innerMaterial
    );


  innerMembrane.scale.set(
    1.38,
    0.55,
    0.69
  );


  innerMembrane.renderOrder = 3;


  /* ========================================================
     Matrix
     ======================================================== */

  const matrix =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.47,
        44,
        40
      ),
      matrixMaterial
    );


  matrix.scale.set(
    1.30,
    0.49,
    0.62
  );


  matrix.renderOrder = 1;


  /* ========================================================
     Cristae

     More visible and slightly more densely packed.
     ======================================================== */

  const cristaeGroup =
    new THREE.Group();


  const cristae = [];


  const cristaCount = 8;


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
        -0.22,
        0.22,
        progress
      );


    const z =
      randomBetween(
        seed * 100 +
          index,

        -0.10,

        0.11
      );


    /*
     * Central folds are slightly longer.
     */

    const centreWeight =
      1 -
      Math.abs(
        progress - 0.5
      ) *
        2;


    const length =
      randomBetween(
        seed * 110 +
          index,

        0.68,

        0.79
      ) +
      centreWeight *
        0.12;


    const amplitude =
      randomBetween(
        seed * 120 +
          index,

        0.055,

        0.078
      );


    const crista =
      createCrista({
        seed:
          seed * 10 +
          index * 0.83,

        y,

        z,

        length,

        amplitude,

        material:
          cristaMaterial,
      });


    crista.rotation.x =
      randomBetween(
        seed * 130 +
          index,

        -0.14,

        0.14
      );


    crista.rotation.z =
      randomBetween(
        seed * 140 +
          index,

        -0.075,

        0.075
      );


    crista.userData.baseRotationZ =
      crista.rotation.z;


    crista.userData.baseRotationX =
      crista.rotation.x;


    crista.userData.phase =
      randomBetween(
        seed * 150 +
          index,

        0,

        Math.PI * 2
      );


    cristaeGroup.add(
      crista
    );


    cristae.push(
      crista
    );
  }


  /*
   * Move cristae very slightly toward the camera.
   * This helps them remain visible through the membrane.
   */

  cristaeGroup.position.z =
    0.045;


  cristaeGroup.renderOrder = 4;


  /* ========================================================
     ATP particles
     ======================================================== */

  const atpGroup =
    new THREE.Group();


  const atpParticles = [];


  const atpCount = 10;


  for (
    let index = 0;
    index < atpCount;
    index += 1
  ) {
    const particle =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.018,
          10,
          10
        ),
        atpMaterial
      );


    const localSeed =
      seed * 200 +
      index;


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
        -0.12,
        0.16
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


    atpGroup.add(
      particle
    );


    atpParticles.push(
      particle
    );
  }


  atpGroup.position.z =
    0.06;


  /* ========================================================
     Tiny highlight layer

     Gives the mitochondrion the glossy upper edge visible
     in the reference design.
     ======================================================== */

  const highlightMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0xff8b62,

      transparent: true,

      opacity: 0.12,

      roughness: 0.18,

      metalness: 0,

      clearcoat: 0.85,

      clearcoatRoughness:
        0.12,

      emissive:
        0x7a2816,

      emissiveIntensity:
        0.25,

      side:
        THREE.FrontSide,

      depthWrite: false,
    });


  const highlightGeometry =
    deformGeometry(
      new THREE.SphereGeometry(
        0.625,
        48,
        42
      ),
      seed,
      0.036
    );


  const highlight =
    new THREE.Mesh(
      highlightGeometry,
      highlightMaterial
    );


  highlight.scale.set(
    1.49,
    0.625,
    0.785
  );


  highlight.position.set(
    0,
    0.025,
    0.02
  );


  highlight.renderOrder = 6;


  /* ========================================================
     Metadata
     ======================================================== */

  group.userData.info = {
    title:
      "Mitochondrion",

    subtitle:
      "ATP production",

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


  /* ========================================================
     Assemble
     ======================================================== */

  group.add(
    matrix,
    innerMembrane,
    cristaeGroup,
    atpGroup,
    outerMembrane,
    highlight
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

   Five instances so the distribution in layout.js can
   actually be used.
   ========================================================== */

export function createMitochondria() {
  const mitochondria = [
    createMitochondrion(0.4),
    createMitochondrion(1.8),
    createMitochondrion(3.1),
    createMitochondrion(4.7),
    createMitochondrion(6.2),
  ];


  /* ========================================================
     Animation
     ======================================================== */

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


          /*
           * Tiny breathing motion.
           */

          const pulse =
            1 +
            Math.sin(
              elapsedTime *
                0.45 +
              phase
            ) *
              0.008;


          /*
           * Preserve scale set by layout.js.
           */

          const layoutScale =
            mitochondrion
              .userData
              .layoutScale ??
            mitochondrion.scale.x;


          mitochondrion.scale.setScalar(
            layoutScale *
            pulse
          );


          /* ------------------------------------------------
             Cristae movement
             ------------------------------------------------ */

          mitochondrion
            .userData
            .cristae
            .forEach(
              (
                crista,
                cristaIndex
              ) => {
                crista.rotation.z =
                  crista.userData
                    .baseRotationZ +
                  Math.sin(
                    elapsedTime *
                      0.30 +
                    crista.userData
                      .phase +
                    cristaIndex *
                      0.17
                  ) *
                    0.012;


                crista.rotation.x =
                  crista.userData
                    .baseRotationX +
                  Math.cos(
                    elapsedTime *
                      0.26 +
                    crista.userData
                      .phase
                  ) *
                    0.008;
              }
            );


          /* ------------------------------------------------
             ATP particle motion
             ------------------------------------------------ */

          mitochondrion
            .userData
            .atpParticles
            .forEach(
              (
                particle
              ) => {
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
                      0.011,

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
                      0.009,

                  base.z +
                    Math.sin(
                      elapsedTime *
                        0.55 +
                      particle
                        .userData
                        .phase
                    ) *
                      0.008
                );


                const particlePulse =
                  0.84 +
                  Math.sin(
                    elapsedTime *
                      1.05 +
                    particle
                      .userData
                      .phase
                  ) *
                    0.11;


                particle.scale.setScalar(
                  particlePulse
                );
              }
            );


          /*
           * Almost imperceptible rotation.
           */

          mitochondrion.rotation.y +=
            0.000055 *
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