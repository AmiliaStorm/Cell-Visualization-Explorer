import * as THREE from "three";


/* ==========================================================
   Centrosome

   Two perpendicular centrioles surrounded by a subtle
   pericentriolar material cloud.

   Visual goals:
   - biologically recognizable
   - warm gold / amber contrast
   - compact enough not to compete with nucleus / Golgi
   - compatible with the existing animation architecture
   ========================================================== */


/* ==========================================================
   Deterministic pseudo-random helper
   ========================================================== */

function pseudoRandom(seed) {
  const value =
    Math.sin(seed * 12.9898) *
    43758.5453;

  return value -
    Math.floor(value);
}


/* ==========================================================
   Centriole material
   ========================================================== */

function createTubulinMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xf2bd55,

    roughness: 0.24,
    metalness: 0,

    clearcoat: 0.62,
    clearcoatRoughness: 0.18,

    emissive: 0x8d4c08,
    emissiveIntensity: 0.48,
  });
}


/* ==========================================================
   Create one microtubule triplet

   Each centriole is made from nine triplets arranged
   around a cylinder.
   ========================================================== */

function createTriplet(
  radius,
  length,
  material
) {
  const triplet =
    new THREE.Group();


  const tubeRadius =
    0.018;


  const spacing =
    0.029;


  for (
    let index = 0;
    index < 3;
    index += 1
  ) {
    const geometry =
      new THREE.CylinderGeometry(
        tubeRadius,
        tubeRadius,
        length,
        10,
        1,
        false
      );


    const tube =
      new THREE.Mesh(
        geometry,
        material
      );


    tube.position.x =
      (
        index - 1
      ) *
      spacing;


    tube.castShadow = true;


    triplet.add(
      tube
    );
  }


  triplet.position.x =
    radius;


  return triplet;
}


/* ==========================================================
   Create one centriole
   ========================================================== */

function createCentriole(
  seed = 1
) {
  const group =
    new THREE.Group();


  const material =
    createTubulinMaterial();


  const centrioleRadius =
    0.12;


  const centrioleLength =
    0.42;


  const tripletCount =
    9;


  /* --------------------------------------------------------
     Nine-fold microtubule arrangement
     -------------------------------------------------------- */

  for (
    let index = 0;
    index < tripletCount;
    index += 1
  ) {
    const angle =
      (
        index /
        tripletCount
      ) *
      Math.PI *
      2;


    const triplet =
      createTriplet(
        centrioleRadius,
        centrioleLength,
        material
      );


    /*
     * CylinderGeometry extends along Y.
     *
     * The triplet is positioned around the centriole's
     * circumference and rotated into the ring.
     */

    triplet.position.set(
      Math.cos(angle) *
        centrioleRadius,

      0,

      Math.sin(angle) *
        centrioleRadius
    );


    triplet.rotation.y =
      -angle;


    group.add(
      triplet
    );
  }


  /* ========================================================
     Subtle central lumen
     ======================================================== */

  const lumenMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0x7d5218,

      transparent: true,
      opacity: 0.25,

      roughness: 0.42,

      emissive: 0x4d2d05,
      emissiveIntensity: 0.25,

      depthWrite: false,
    });


  const lumen =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.075,
        0.075,
        centrioleLength * 0.94,
        24,
        1,
        false
      ),
      lumenMaterial
    );


  group.add(
    lumen
  );


  /* ========================================================
     Ring accents

     These give the centriole enough structure to be readable
     when viewed from a distance.
     ======================================================== */

  const ringMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xffd979,

      emissive: 0xa9610b,
      emissiveIntensity: 0.55,

      roughness: 0.24,
      metalness: 0,
    });


  const ringPositions = [
    -centrioleLength * 0.42,
    0,
    centrioleLength * 0.42,
  ];


  ringPositions.forEach(
    (
      y,
      index
    ) => {
      const ring =
        new THREE.Mesh(
          new THREE.TorusGeometry(
            centrioleRadius,
            0.012,
            8,
            28
          ),

          ringMaterial
        );


      ring.rotation.x =
        Math.PI / 2;


      ring.position.y =
        y;


      ring.scale.setScalar(
        1 +
        pseudoRandom(
          seed * 20 +
          index
        ) *
        0.025
      );


      group.add(
        ring
      );
    }
  );


  group.userData.phase =
    seed * 0.73;


  return group;
}


/* ==========================================================
   Pericentriolar material

   A faint halo around the centriole pair.
   ========================================================== */

function createPCM() {
  const material =
    new THREE.MeshBasicMaterial({
      color: 0xf4c65f,

      transparent: true,
      opacity: 0.035,

      blending:
        THREE.AdditiveBlending,

      depthWrite: false,
      depthTest: true,
    });


  const geometry =
    new THREE.SphereGeometry(
      0.39,
      32,
      32
    );


  const pcm =
    new THREE.Mesh(
      geometry,
      material
    );


  pcm.scale.set(
    1.15,
    0.9,
    1
  );


  return pcm;
}


/* ==========================================================
   Short nucleating microtubules

   Not the entire cytoskeleton — only a few subtle fibers
   emerging from the centrosome so the role of the organelle
   is visually suggested.
   ========================================================== */

function createMicrotubuleRay({
  angle,
  elevation,
  length,
  material,
}) {
  const direction =
    new THREE.Vector3(
      Math.cos(angle),

      Math.sin(elevation),

      Math.sin(angle)
    ).normalize();


  const end =
    direction.multiplyScalar(
      length
    );


  const middle =
    end
      .clone()
      .multiplyScalar(0.5);


  /*
   * Tiny curve so rays don't look like rigid straight wires.
   */

  middle.y +=
    Math.sin(
      angle * 2.1
    ) *
    0.055;


  const curve =
    new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(
        0,
        0,
        0
      ),

      middle,

      end
    );


  const geometry =
    new THREE.TubeGeometry(
      curve,
      24,
      0.007,
      6,
      false
    );


  const ray =
    new THREE.Mesh(
      geometry,
      material
    );


  return ray;
}


/* ==========================================================
   Create centrosome
   ========================================================== */

export function createCentrosome() {
  const group =
    new THREE.Group();


  group.name =
    "centrosome";


  group.userData.type =
    "centrosome";


  group.userData.organelleId =
    "centrosome";


  group.userData.info = {
    title:
      "Centrosome",

    subtitle:
      "Microtubule-organizing center",

    summary:
      "The centrosome contains a pair of centrioles and organizes microtubules within the animal cell.",

    functions: [
      "Microtubule organization",
      "Mitotic spindle formation",
      "Cell polarity",
      "Intracellular organization",
    ],
  };


  /* ========================================================
     First centriole
     ======================================================== */

  const centrioleA =
    createCentriole(
      1.3
    );


  centrioleA.rotation.set(
    0.18,
    0.22,
    Math.PI / 2 - 0.12
  );


  centrioleA.position.set(
    -0.13,
    0.03,
    0.03
  );


  /* ========================================================
     Second centriole

     Approximately perpendicular to the first.
     ======================================================== */

  const centrioleB =
    createCentriole(
      3.7
    );


  centrioleB.rotation.set(
    Math.PI / 2 - 0.16,
    0.28,
    0.24
  );


  centrioleB.position.set(
    0.11,
    -0.04,
    -0.025
  );


  /* ========================================================
     Pericentriolar material
     ======================================================== */

  const pcm =
    createPCM();


  /* ========================================================
     Short microtubule nucleation rays
     ======================================================== */

  const rayMaterial =
    new THREE.MeshBasicMaterial({
      color: 0x72d8ef,

      transparent: true,
      opacity: 0.24,

      blending:
        THREE.AdditiveBlending,

      depthWrite: false,
    });


  const microtubules = [];


  const rayCount =
    12;


  for (
    let index = 0;
    index < rayCount;
    index += 1
  ) {
    const angle =
      (
        index /
        rayCount
      ) *
        Math.PI *
        2 +
      0.17;


    const elevation =
      Math.sin(
        index * 1.73
      ) *
      0.42;


    const length =
      0.48 +
      pseudoRandom(
        index + 12
      ) *
      0.30;


    const ray =
      createMicrotubuleRay({
        angle,
        elevation,
        length,
        material:
          rayMaterial,
      });


    ray.userData.phase =
      index * 0.63;


    ray.userData.baseScale =
      ray.scale.clone();


    microtubules.push(
      ray
    );


    group.add(
      ray
    );
  }


  /* ========================================================
     Central warm glow
     ======================================================== */

  const glowMaterial =
    new THREE.MeshBasicMaterial({
      color: 0xffc95e,

      transparent: true,
      opacity: 0.07,

      blending:
        THREE.AdditiveBlending,

      depthWrite: false,
    });


  const glow =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.28,
        24,
        24
      ),

      glowMaterial
    );


  glow.scale.set(
    1.25,
    0.9,
    1
  );


  /* ========================================================
     Assemble
     ======================================================== */

  group.add(
    pcm,
    centrioleA,
    centrioleB,
    glow
  );


  /* ========================================================
     Animation
     ======================================================== */

  function animate(
    elapsedTime
  ) {
    /*
     * Extremely subtle rotation of the centriole pair.
     */

    centrioleA.rotation.y =
      0.22 +
      Math.sin(
        elapsedTime * 0.18
      ) *
      0.012;


    centrioleB.rotation.z =
      0.24 +
      Math.cos(
        elapsedTime * 0.17
      ) *
      0.012;


    /*
     * Soft pericentriolar pulse.
     */

    const pcmPulse =
      1 +
      Math.sin(
        elapsedTime * 0.42
      ) *
      0.035;


    pcm.scale.set(
      1.15 * pcmPulse,
      0.9 * pcmPulse,
      pcmPulse
    );


    /*
     * Small changes in microtubule visibility.
     */

    microtubules.forEach(
      (
        ray,
        index
      ) => {
        const pulse =
          0.96 +
          Math.sin(
            elapsedTime *
              0.26 +
            ray.userData.phase +
            index * 0.1
          ) *
          0.04;


        ray.scale.setScalar(
          pulse
        );
      }
    );


    /*
     * Very faint glow breathing.
     */

    glow.material.opacity =
      0.055 +
      Math.sin(
        elapsedTime * 0.36
      ) *
      0.015;
  }


  /* ========================================================
     Compatibility helpers

     This allows either:

     const centrosome = createCentrosome();
     scene.add(centrosome);

     OR:

     scene.add(centrosome.group);

     depending on how cell.js currently handles organelles.
     ======================================================== */

  group.group =
    group;


  group.centrioles = [
    centrioleA,
    centrioleB,
  ];


  group.microtubules =
    microtubules;


  group.animate =
    animate;


  group.userData.animate =
    animate;


  return group;
}