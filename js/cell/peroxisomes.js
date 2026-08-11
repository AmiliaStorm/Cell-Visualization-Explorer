import * as THREE from "three";


/* ==========================================================
   Deterministic pseudo-random helpers

   Keeps peroxisome appearance consistent after refresh.
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
   Slightly deform spherical geometry

   Peroxisomes remain compact and rounded, but not perfectly
   mathematical spheres.
   ========================================================== */

function deformGeometry(
  geometry,
  seed,
  strength = 0.012
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
        direction.x * 4.8 +
        direction.y * 3.7 +
        seed
      ) *
      strength;


    const waveTwo =
      Math.cos(
        direction.z * 5.1 -
        direction.x * 2.9 +
        seed * 0.8
      ) *
      strength *
      0.45;


    const waveThree =
      Math.sin(
        direction.y * 6.0 +
        direction.z * 2.8 +
        seed * 1.3
      ) *
      strength *
      0.25;


    vertex.addScaledVector(
      direction,
      waveOne +
      waveTwo +
      waveThree
    );


    position.setXYZ(
      index,
      vertex.x,
      vertex.y,
      vertex.z
    );
  }


  position.needsUpdate =
    true;


  geometry.computeVertexNormals();

  geometry.computeBoundingSphere();


  return geometry;
}


/* ==========================================================
   Create one peroxisome
   ========================================================== */

function createPeroxisome(
  seed = 1
) {
  const group =
    new THREE.Group();


  group.name =
    "peroxisome";


  group.userData.type =
    "peroxisome";


  group.userData.organelleId =
    "peroxisome";


  group.userData.info = {
    title:
      "Peroxisome",

    subtitle:
      "Oxidative metabolic compartment",

    summary:
      "A small membrane-bound organelle that performs oxidative reactions, breaks down very-long-chain fatty acids, and helps control hydrogen peroxide.",

    functions: [
      "Fatty acid oxidation",
      "Hydrogen peroxide metabolism",
      "Reactive oxygen species control",
      "Lipid metabolism",
    ],
  };


  /* ========================================================
     Size

     Slightly smaller than lysosomes so the two organelle
     populations remain easy to distinguish.
     ======================================================== */

  const radius =
    randomBetween(
      seed + 1,
      0.112,
      0.150
    );


  /* ========================================================
     Materials
     ======================================================== */

  const membraneMaterial =
    new THREE.MeshPhysicalMaterial({
      color:
        0x42d9d0,

      transparent: true,

      opacity: 0.46,

      roughness: 0.16,

      metalness: 0,

      transmission: 0.07,

      thickness: 0.10,

      clearcoat: 0.84,

      clearcoatRoughness:
        0.13,

      emissive:
        0x0b625f,

      emissiveIntensity:
        0.48,

      side:
        THREE.DoubleSide,

      depthWrite: false,

      depthTest: true,
    });


  const matrixMaterial =
    new THREE.MeshPhysicalMaterial({
      color:
        0x145c5b,

      transparent: true,

      opacity: 0.27,

      roughness: 0.38,

      metalness: 0,

      transmission: 0.02,

      emissive:
        0x082f30,

      emissiveIntensity:
        0.30,

      clearcoat: 0.18,

      clearcoatRoughness:
        0.34,

      depthWrite: false,
    });


  const enzymeMaterial =
    new THREE.MeshStandardMaterial({
      color:
        0xa9fff4,

      emissive:
        0x42e7d5,

      emissiveIntensity:
        0.90,

      roughness: 0.22,

      metalness: 0,
    });


  /*
   * Bright crystalline / enzyme-rich core.
   *
   * This gives peroxisomes a visual signature that is
   * deliberately different from the diffuse contents of
   * lysosomes.
   */

  const coreMaterial =
    new THREE.MeshPhysicalMaterial({
      color:
        0xdffffa,

      transparent: true,

      opacity: 0.88,

      roughness: 0.16,

      metalness: 0,

      clearcoat: 0.68,

      clearcoatRoughness:
        0.12,

      emissive:
        0x72f4e7,

      emissiveIntensity:
        0.72,
    });


  /* ========================================================
     Outer membrane
     ======================================================== */

  const membraneGeometry =
    deformGeometry(
      new THREE.SphereGeometry(
        radius,
        42,
        42
      ),

      seed,

      radius * 0.065
    );


  const membrane =
    new THREE.Mesh(
      membraneGeometry,
      membraneMaterial
    );


  membrane.castShadow =
    true;


  membrane.renderOrder =
    5;


  membrane.scale.set(
    randomBetween(
      seed + 2,
      0.94,
      1.06
    ),

    randomBetween(
      seed + 3,
      0.92,
      1.07
    ),

    randomBetween(
      seed + 4,
      0.94,
      1.06
    )
  );


  /* ========================================================
     Internal matrix
     ======================================================== */

  const matrix =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        radius * 0.81,
        32,
        32
      ),

      matrixMaterial
    );


  matrix.scale.copy(
    membrane.scale
  );


  matrix.renderOrder =
    2;


  /* ========================================================
     Dense enzyme-rich core

     Slightly angular crystalline centre distinguishes the
     peroxisome from lysosomes and other vesicles.
     ======================================================== */

  const coreGeometry =
    new THREE.IcosahedronGeometry(
      radius * 0.27,
      1
    );


  const core =
    new THREE.Mesh(
      coreGeometry,
      coreMaterial
    );


  core.scale.set(
    1.05,
    0.78,
    0.90
  );


  core.rotation.set(
    randomBetween(
      seed + 8,
      -0.5,
      0.5
    ),

    randomBetween(
      seed + 9,
      -0.5,
      0.5
    ),

    randomBetween(
      seed + 10,
      -0.5,
      0.5
    )
  );


  core.position.set(
    randomBetween(
      seed + 11,
      -radius * 0.08,
      radius * 0.08
    ),

    randomBetween(
      seed + 12,
      -radius * 0.06,
      radius * 0.06
    ),

    radius * 0.05
  );


  core.castShadow =
    false;


  core.renderOrder =
    4;


  /* ========================================================
     Enzyme particles
     ======================================================== */

  const enzymeGroup =
    new THREE.Group();


  const enzymes = [];


  const enzymeCount =
    Math.floor(
      randomBetween(
        seed + 20,
        8,
        13
      )
    );


  for (
    let index = 0;
    index < enzymeCount;
    index += 1
  ) {
    const particle =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          randomBetween(
            seed * 31 +
              index,

            0.010,
            0.018
          ),

          9,
          9
        ),

        enzymeMaterial
      );


    const direction =
      new THREE.Vector3(
        randomBetween(
          seed * 40 +
            index * 3 +
            1,

          -1,
          1
        ),

        randomBetween(
          seed * 40 +
            index * 3 +
            2,

          -1,
          1
        ),

        randomBetween(
          seed * 40 +
            index * 3 +
            3,

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


    /*
     * Keep enzyme particles around the crystalline core
     * rather than directly overlapping it.
     */

    const distance =
      randomBetween(
        seed * 70 +
          index,

        radius * 0.34,

        radius * 0.64
      );


    particle.position.copy(
      direction.multiplyScalar(
        distance
      )
    );


    particle.userData.basePosition =
      particle.position.clone();


    particle.userData.phase =
      randomBetween(
        seed * 90 +
          index,

        0,

        Math.PI * 2
      );


    particle.userData.speed =
      randomBetween(
        seed * 120 +
          index,

        0.28,

        0.60
      );


    particle.renderOrder =
      4;


    enzymeGroup.add(
      particle
    );


    enzymes.push(
      particle
    );
  }


  /* ========================================================
     Soft cyan inner glow

     Very subtle layer that helps the peroxisome read as
     luminous without making it look like a neon sphere.
     ======================================================== */

  const glowMaterial =
    new THREE.MeshBasicMaterial({
      color:
        0x66fff0,

      transparent: true,

      opacity: 0.05,

      blending:
        THREE.AdditiveBlending,

      side:
        THREE.FrontSide,

      depthWrite: false,

      depthTest: true,
    });


  const glow =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        radius * 0.92,
        28,
        28
      ),

      glowMaterial
    );


  glow.scale.copy(
    membrane.scale
  );


  glow.position.set(
    -radius * 0.06,
    radius * 0.08,
    radius * 0.10
  );


  glow.renderOrder =
    6;


  /* ========================================================
     Tiny oxidative activity particles

     These are deliberately subtle. They help distinguish
     the peroxisome from lysosomes without cluttering it.
     ======================================================== */

  const activityMaterial =
    new THREE.MeshBasicMaterial({
      color:
        0xc7fff8,

      transparent: true,

      opacity: 0.72,

      blending:
        THREE.AdditiveBlending,

      depthWrite: false,
    });


  const activityParticles = [];


  const activityGroup =
    new THREE.Group();


  const activityCount = 3;


  for (
    let index = 0;
    index < activityCount;
    index += 1
  ) {
    const particle =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          radius * 0.035,
          8,
          8
        ),

        activityMaterial
      );


    const angle =
      (
        index /
        activityCount
      ) *
        Math.PI *
        2 +
      seed;


    particle.position.set(
      Math.cos(angle) *
        radius *
        0.44,

      Math.sin(angle) *
        radius *
        0.34,

      randomBetween(
        seed * 230 +
          index,

        -radius * 0.16,

        radius * 0.18
      )
    );


    particle.userData.basePosition =
      particle.position.clone();


    particle.userData.phase =
      index *
      2.1 +
      seed;


    activityGroup.add(
      particle
    );


    activityParticles.push(
      particle
    );
  }


  /* ========================================================
     Assemble peroxisome
     ======================================================== */

  group.add(
    matrix,
    core,
    enzymeGroup,
    activityGroup,
    membrane,
    glow
  );


  /* ========================================================
     Metadata / animation references
     ======================================================== */

  group.userData.membrane =
    membrane;


  group.userData.matrix =
    matrix;


  group.userData.core =
    core;


  group.userData.enzymes =
    enzymes;


  group.userData.activityParticles =
    activityParticles;


  group.userData.glow =
    glow;


  group.userData.phase =
    randomBetween(
      seed * 190,

      0,

      Math.PI * 2
    );


  return group;
}


/* ==========================================================
   Create all peroxisomes

   Five instances correspond to the five positions in
   layout.js.
   ========================================================== */

export function createPeroxisomes() {
  const peroxisomes = [
    createPeroxisome(1.7),
    createPeroxisome(3.2),
    createPeroxisome(4.8),
    createPeroxisome(6.5),
    createPeroxisome(8.1),
  ];


  /* ========================================================
     Animation
     ======================================================== */

  peroxisomes.animate =
    function animate(
      elapsedTime
    ) {
      peroxisomes.forEach(
        (
          peroxisome,
          index
        ) => {
          const phase =
            peroxisome
              .userData
              .phase;


          /* ------------------------------------------------
             Preserve scale assigned by layout.js
             ------------------------------------------------ */

          const layoutScale =
            peroxisome
              .userData
              .layoutScale ??
            peroxisome.scale.x;


          /* ------------------------------------------------
             Very subtle membrane breathing
             ------------------------------------------------ */

          const pulse =
            1 +
            Math.sin(
              elapsedTime *
                0.45 +
              phase
            ) *
              0.012;


          peroxisome.scale.setScalar(
            layoutScale *
            pulse
          );


          /* ------------------------------------------------
             Slow organelle rotation
             ------------------------------------------------ */

          peroxisome.rotation.y +=
            0.00008 *
            (
              index % 2 === 0
                ? 1
                : -1
            );


          peroxisome.rotation.x +=
            0.000018 *
            (
              index % 2 === 0
                ? -1
                : 1
            );


          /* ------------------------------------------------
             Crystalline core movement
             ------------------------------------------------ */

          const core =
            peroxisome
              .userData
              .core;


          core.rotation.x +=
            0.00038;


          core.rotation.y -=
            0.00031;


          core.rotation.z +=
            0.00012;


          /* ------------------------------------------------
             Enzyme movement
             ------------------------------------------------ */

          peroxisome
            .userData
            .enzymes
            .forEach(
              (
                enzyme
              ) => {
                const base =
                  enzyme.userData
                    .basePosition;


                const enzymePhase =
                  enzyme.userData
                    .phase;


                const speed =
                  enzyme.userData
                    .speed;


                enzyme.position.set(
                  base.x +
                    Math.sin(
                      elapsedTime *
                        speed +
                      enzymePhase
                    ) *
                      0.0045,

                  base.y +
                    Math.cos(
                      elapsedTime *
                        speed +
                      enzymePhase
                    ) *
                      0.0045,

                  base.z +
                    Math.sin(
                      elapsedTime *
                        0.48 +
                      enzymePhase
                    ) *
                      0.004
                );


                enzyme.scale.setScalar(
                  0.92 +
                  Math.sin(
                    elapsedTime *
                      0.8 +
                    enzymePhase
                  ) *
                    0.07
                );
              }
            );


          /* ------------------------------------------------
             Oxidative activity particles
             ------------------------------------------------ */

          peroxisome
            .userData
            .activityParticles
            .forEach(
              (
                particle,
                particleIndex
              ) => {
                const base =
                  particle.userData
                    .basePosition;


                const particlePhase =
                  particle.userData
                    .phase;


                particle.position.set(
                  base.x +
                    Math.sin(
                      elapsedTime *
                        0.58 +
                      particlePhase
                    ) *
                      0.005,

                  base.y +
                    Math.cos(
                      elapsedTime *
                        0.54 +
                      particlePhase
                    ) *
                      0.005,

                  base.z +
                    Math.sin(
                      elapsedTime *
                        0.50 +
                      particlePhase +
                      particleIndex
                    ) *
                      0.004
                );


                particle.scale.setScalar(
                  0.75 +
                  Math.sin(
                    elapsedTime *
                      1.25 +
                    particlePhase
                  ) *
                    0.16
                );
              }
            );


          /* ------------------------------------------------
             Very faint glow shimmer
             ------------------------------------------------ */

          const glow =
            peroxisome
              .userData
              .glow;


          if (
            glow?.material
          ) {
            glow.material.opacity =
              0.045 +
              Math.sin(
                elapsedTime *
                  0.38 +
                phase
              ) *
                0.010;
          }
        }
      );
    };


  return peroxisomes;
}