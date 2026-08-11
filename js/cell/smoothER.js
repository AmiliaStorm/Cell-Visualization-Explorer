import * as THREE from "three";

/* ==========================================================
   Deterministic random helpers

   Keeps the smooth ER identical after every refresh.
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
   Create one tubular smooth-ER segment
   ========================================================== */

function createTubule({
  points,
  radius,
  material,
  tubularSegments = 48,
}) {
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
      tubularSegments,
      radius,
      10,
      false
    );

  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return {
    mesh,
    curve,
  };
}

/* ==========================================================
   Create one rounded junction

   These make connected branches look like one continuous
   membrane network instead of separate tubes.
   ========================================================== */

function createJunction({
  position,
  radius,
  material,
}) {
  const junction =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        radius,
        16,
        16
      ),
      material
    );

  junction.position.copy(
    position
  );

  junction.scale.set(
    1.15,
    0.9,
    1
  );

  junction.castShadow = true;

  return junction;
}

/* ==========================================================
   Create one small smooth-ER lumen particle
   ========================================================== */

function createLumenParticle(
  material
) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(
      0.013,
      8,
      8
    ),
    material
  );
}

/* ==========================================================
   Smooth endoplasmic reticulum
   ========================================================== */

export function createSmoothER() {
  const group =
    new THREE.Group();

  group.name =
    "smoothEndoplasmicReticulum";

  group.userData.type =
    "smoothER";

  group.userData.organelleId =
    "smoothER";

  group.userData.info = {
    title:
      "Smooth Endoplasmic Reticulum",

    subtitle:
      "Tubular membrane network",

    summary:
      "A branching membrane network involved in lipid synthesis, detoxification and calcium storage.",

    functions: [
      "Lipid synthesis",
      "Steroid synthesis",
      "Detoxification",
      "Calcium storage",
    ],
  };

  /* ========================================================
     Materials
     ======================================================== */

  const tubuleMaterial =
  new THREE.MeshPhysicalMaterial({
    color: 0x2c91ad,

    transparent: true,
    opacity: 0.94,

    roughness: 0.3,
    metalness: 0,

    transmission: 0,

    clearcoat: 0.55,
    clearcoatRoughness: 0.22,

    emissive: 0x0d6f8a,
    emissiveIntensity: 0.62,

    side: THREE.DoubleSide,

    depthWrite: true,
  });

  const junctionMaterial =
  new THREE.MeshPhysicalMaterial({
    color: 0x3ab1c9,

    transparent: true,
    opacity: 0.96,

    roughness: 0.28,
    metalness: 0,

    clearcoat: 0.58,
    clearcoatRoughness: 0.2,

    emissive: 0x0d7fa0,
    emissiveIntensity: 0.6,
  });
  const lumenParticleMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x77d9e8,

      emissive: 0x167489,
      emissiveIntensity: 0.55,

      roughness: 0.32,
      metalness: 0,
    });

  const tubules = [];
  const junctions = [];
  const lumenParticles = [];

  /* ========================================================
     Main tubule network

     Reworked into a broad, open arc that sweeps from the
     nucleus side up and over toward the Golgi/secretion
     side, instead of a dense, overlapping tangle in the
     centre. Local coordinates; final placement and scale
     are controlled through layout.js.
     ======================================================== */

  const tubuleConfigurations = [
    /*
     * Primary arc — the main sweeping backbone of the
     * network, matching the reference silhouette.
     */
    {
      points: [
        new THREE.Vector3(-1.05, -0.05, 0.05),
        new THREE.Vector3(-0.68, 0.42, 0.10),
        new THREE.Vector3(-0.18, 0.62, 0.02),
        new THREE.Vector3(0.35, 0.58, -0.04),
        new THREE.Vector3(0.85, 0.32, 0.04),
        new THREE.Vector3(1.15, 0.02, 0.06),
      ],

      radius: 0.05,
    },

    /*
     * Secondary lower arc, running roughly parallel but
     * with a wider, gentler curve so it reads as a distinct
     * strand rather than overlapping the primary arc.
     */
    {
      points: [
        new THREE.Vector3(-1.0, -0.32, -0.02),
        new THREE.Vector3(-0.6, -0.08, 0.06),
        new THREE.Vector3(-0.1, 0.10, -0.03),
        new THREE.Vector3(0.4, 0.14, 0.05),
        new THREE.Vector3(0.9, -0.02, -0.02),
        new THREE.Vector3(1.18, -0.28, 0.04),
      ],

      radius: 0.045,
    },

    /*
     * Short upper branch curling away from the primary arc.
     */
    {
      points: [
        new THREE.Vector3(-0.68, 0.42, 0.10),
        new THREE.Vector3(-0.58, 0.72, -0.06),
        new THREE.Vector3(-0.30, 0.86, 0.04),
      ],

      radius: 0.036,
    },

    /*
     * Short branch dropping from the primary arc toward
     * the translation / ribosome region.
     */
    {
      points: [
        new THREE.Vector3(-0.18, 0.62, 0.02),
        new THREE.Vector3(-0.12, 0.34, -0.05),
        new THREE.Vector3(-0.05, 0.10, 0.03),
      ],

      radius: 0.034,
    },

    /*
     * Short branch near the Golgi end, connecting the
     * two main arcs.
     */
    {
      points: [
        new THREE.Vector3(0.85, 0.32, 0.04),
        new THREE.Vector3(0.92, 0.14, -0.03),
        new THREE.Vector3(0.9, -0.02, -0.02),
      ],

      radius: 0.033,
    },

    /*
     * Small tail branch on the far left, giving the
     * network a bit of extra spread near the nucleus.
     */
    {
      points: [
        new THREE.Vector3(-1.05, -0.05, 0.05),
        new THREE.Vector3(-1.22, 0.14, -0.05),
        new THREE.Vector3(-1.18, 0.38, 0.05),
      ],

      radius: 0.032,
    },
  ];

  tubuleConfigurations.forEach(
    (
      configuration,
      index
    ) => {
      const tubule =
        createTubule({
          points:
            configuration.points,

          radius:
            configuration.radius,

          material:
            tubuleMaterial,

          tubularSegments:
            configuration
              .points.length *
            18,
        });

      tubule.mesh.userData.phase =
        index * 0.74;

      tubule.mesh.userData.baseRotation =
        tubule.mesh.rotation.clone();

      group.add(
        tubule.mesh
      );

      tubules.push(
        tubule
      );
    }
  );

  /* ========================================================
     Rounded branch junctions

     Placed only at true branch points on the new arc
     layout, rather than densely through the centre.
     ======================================================== */

  const junctionPositions = [
    new THREE.Vector3(-1.05, -0.05, 0.05),
    new THREE.Vector3(-0.68, 0.42, 0.10),
    new THREE.Vector3(-0.18, 0.62, 0.02),
    new THREE.Vector3(0.85, 0.32, 0.04),
    new THREE.Vector3(0.9, -0.02, -0.02),
  ];

  junctionPositions.forEach(
    (
      position,
      index
    ) => {
      const junction =
        createJunction({
          position,

          radius:
            randomBetween(
              index + 30,
              0.05,
              0.065
            ),

          material:
            junctionMaterial,
        });

      junction.userData.phase =
        index * 0.8;

      junction.userData.baseScale =
        junction.scale.clone();

      group.add(
        junction
      );

      junctions.push(
        junction
      );
    }
  );

  /* ========================================================
     Lumen particles

     Small particles moving inside selected tubules give a
     subtle indication of transport through the ER lumen.
     ======================================================== */

  const particleCount = 18;

  for (
    let index = 0;
    index < particleCount;
    index += 1
  ) {
    const tubuleIndex =
      index %
      tubules.length;

    const tubule =
      tubules[
        tubuleIndex
      ];

    const particle =
      createLumenParticle(
        lumenParticleMaterial
      );

    const progress =
      randomBetween(
        index + 80,
        0,
        1
      );

    particle.position.copy(
      tubule.curve.getPoint(
        progress
      )
    );

    particle.userData.tubule =
      tubule;

    particle.userData.progress =
      progress;

    particle.userData.speed =
      randomBetween(
        index + 100,
        0.025,
        0.055
      );

    particle.userData.phase =
      randomBetween(
        index + 120,
        0,
        Math.PI * 2
      );

    group.add(
      particle
    );

    lumenParticles.push(
      particle
    );
  }

  /* ========================================================
     Render order

     Ensures the ER tubes aren't drawn behind other
     transparent organelles nearby (mitochondria, membrane).
     ======================================================== */

  group.traverse((child) => {
    if (child.isMesh) {
      child.renderOrder = 7;
    }
  });

  /* ========================================================
     Animation
     ======================================================== */

  function animate(
    elapsedTime,
    deltaTime = 1 / 60
  ) {
    const safeDelta =
      Math.min(
        Math.max(
          deltaTime,
          0
        ),
        0.05
      );

    tubules.forEach(
      (
        tubule,
        index
      ) => {
        tubule.mesh.rotation.z =
          tubule.mesh.userData
            .baseRotation.z +
          Math.sin(
            elapsedTime *
              0.14 +
            tubule.mesh.userData
              .phase +
            index * 0.1
          ) *
            0.0025;
      }
    );

    junctions.forEach(
      (junction) => {
        const pulse =
          1 +
          Math.sin(
            elapsedTime *
              0.42 +
            junction.userData
              .phase
          ) *
            0.018;

        junction.scale.set(
          junction.userData
            .baseScale.x *
            pulse,

          junction.userData
            .baseScale.y *
            pulse,

          junction.userData
            .baseScale.z *
            pulse
        );
      }
    );

    lumenParticles.forEach(
      (particle) => {
        particle.userData.progress +=
          particle.userData.speed *
          safeDelta;

        if (
          particle.userData
            .progress > 1
        ) {
          particle.userData.progress -=
            1;
        }

        particle.position.copy(
          particle.userData
            .tubule.curve
            .getPoint(
              particle.userData
                .progress
            )
        );

        const pulse =
          0.82 +
          Math.sin(
            elapsedTime *
              1.1 +
            particle.userData
              .phase
          ) *
            0.12;

        particle.scale.setScalar(
          pulse
        );
      }
    );
  }

  return {
    group,
    tubules,
    junctions,
    lumenParticles,
    animate,
  };
}