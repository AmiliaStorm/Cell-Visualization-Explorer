import * as THREE from "three";


/* ==========================================================
   Deterministic pseudo-random helpers

   Keeps the cytoskeleton identical after every refresh.
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
   Deterministic direction
   ========================================================== */

function randomDirection(
  seed
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


  return direction.normalize();
}


/* ==========================================================
   Random point inside an ellipsoid

   Matches the broad, flattened animal-cell silhouette better
   than sampling from a perfect sphere.
   ========================================================== */

function randomPointInsideEllipsoid(
  seed,
  scale = 1
) {
  const direction =
    randomDirection(
      seed
    );


  const distance =
    Math.cbrt(
      pseudoRandom(
        seed + 10
      )
    ) *
    scale;


  direction.multiplyScalar(
    distance
  );


  direction.x *=
    2.65;


  direction.y *=
    1.72;


  direction.z *=
    2.05;


  return direction;
}


/* ==========================================================
   Random point in an outer ellipsoid shell

   Used especially for cortical actin and microtubule ends.
   ========================================================== */

function randomPointInShell(
  seed,
  innerScale,
  outerScale
) {
  const direction =
    randomDirection(
      seed
    );


  const distance =
    randomBetween(
      seed + 20,
      innerScale,
      outerScale
    );


  direction.x *=
    2.65 *
    distance;


  direction.y *=
    1.72 *
    distance;


  direction.z *=
    2.05 *
    distance;


  return direction;
}


/* ==========================================================
   Create a curved filament
   ========================================================== */

function createFilament(
  points,
  radius,
  baseMaterial,
  tubularSegments = 32,
  phase = 0
) {
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
      5,
      false
    );


  /*
   * Every filament receives its own material so opacity
   * animation remains independent.
   */

  const material =
    baseMaterial.clone();


  const filament =
    new THREE.Mesh(
      geometry,
      material
    );


  filament.userData.baseOpacity =
    material.opacity;


  filament.userData.phase =
    phase;


  filament.material.depthWrite =
    false;


  filament.material.depthTest =
    true;


  filament.renderOrder =
    1;


  return filament;
}


/* ==========================================================
   Cytoskeleton
   ========================================================== */

export function createCytoskeleton() {
  const group =
    new THREE.Group();


  group.name =
    "cytoskeleton";


  group.userData.type =
    "cytoskeleton";


  group.userData.organelleId =
    "cytoskeleton";


  group.userData.info = {
    title:
      "Cytoskeleton",

    subtitle:
      "Structural and transport network",

    summary:
      "A dynamic network of microtubules, actin filaments and intermediate filaments that supports cell structure and intracellular organization.",

    functions: [
      "Cell structure",
      "Intracellular transport",
      "Organelle positioning",
      "Cell movement",
    ],
  };


  /* ========================================================
     Materials

     Intentionally faint.

     The cytoskeleton should be discovered in the background,
     not compete visually with the nucleus or Golgi.
     ======================================================== */

  const microtubuleMaterial =
    new THREE.MeshBasicMaterial({
      color:
        0x178aaa,

      transparent: true,

      opacity: 0.07,

      blending:
        THREE.NormalBlending,

      depthWrite: false,

      depthTest: true,
    });


  const actinMaterial =
    new THREE.MeshBasicMaterial({
      color:
        0x328a73,

      transparent: true,

      opacity: 0.032,

      blending:
        THREE.NormalBlending,

      depthWrite: false,

      depthTest: true,
    });


  const intermediateMaterial =
    new THREE.MeshBasicMaterial({
      color:
        0x38538f,

      transparent: true,

      opacity: 0.04,

      blending:
        THREE.NormalBlending,

      depthWrite: false,

      depthTest: true,
    });


  /* ========================================================
     Centrosome anchor

     IMPORTANT:

     This is NOT another visible centrosome.

     The actual centrosome is now created in centrosome.js.

     This invisible Object3D only provides an approximate
     origin for the cytoskeletal microtubules.

     Because the real centrosome is inside contentGroup
     (scale 1.3), its layout position corresponds to roughly
     this position in full-cell coordinates.
     ======================================================== */

  const centrosomeAnchor =
    new THREE.Object3D();


  centrosomeAnchor.name =
    "cytoskeletonCentrosomeAnchor";


  centrosomeAnchor.position.set(
    0.16,
    -0.13,
    -0.18
  );


  group.add(
    centrosomeAnchor
  );


  /* ========================================================
     Microtubules

     Fewer and thinner than before.

     They radiate from the centrosome region, but most are
     biased slightly behind the main organelles.
     ======================================================== */

  const microtubules = [];


  const microtubuleCount =
    9;


  for (
    let index = 0;
    index < microtubuleCount;
    index += 1
  ) {
    const seed =
      100 +
      index * 17;


    const start =
      centrosomeAnchor
        .position
        .clone();


    const end =
      randomPointInShell(
        seed,
        0.68,
        0.94
      );


    /*
     * Keep the majority of long microtubules behind the
     * visually important nucleus / Golgi region.
     */

    end.z =
      Math.min(
        end.z,
        0.20
      ) -
      0.16;


    const middle =
      start
        .clone()
        .lerp(
          end,
          0.52
        );


    const curveDirection =
      randomDirection(
        seed + 30
      );


    curveDirection.z *=
      0.35;


    middle.add(
      curveDirection.multiplyScalar(
        randomBetween(
          seed + 40,
          0.10,
          0.24
        )
      )
    );


    const filament =
      createFilament(
        [
          start,
          middle,
          end,
        ],

        0.0055,

        microtubuleMaterial,

        38,

        index * 0.71
      );


    group.add(
      filament
    );


    microtubules.push(
      filament
    );
  }


  /* ========================================================
     Cortical actin

     Located mostly just inside the plasma membrane.

     Very faint because it should support the membrane
     visually rather than create another obvious wireframe.
     ======================================================== */

  const actinFilaments = [];


  const actinCount =
    10;


  for (
    let index = 0;
    index < actinCount;
    index += 1
  ) {
    const seed =
      400 +
      index * 23;


    const start =
      randomPointInShell(
        seed,
        0.76,
        0.90
      );


    const end =
      randomPointInShell(
        seed + 70,
        0.76,
        0.90
      );


    /*
     * Keep actin somewhat toward the outer half of the cell.
     */

    const middle =
      start
        .clone()
        .lerp(
          end,
          0.5
        );


    const offset =
      randomDirection(
        seed + 120
      );


    offset.multiplyScalar(
      randomBetween(
        seed + 130,
        0.05,
        0.15
      )
    );


    middle.add(
      offset
    );


    const filament =
      createFilament(
        [
          start,
          middle,
          end,
        ],

        0.003,

        actinMaterial,

        26,

        index * 0.57
      );


    group.add(
      filament
    );


    actinFilaments.push(
      filament
    );
  }


  /* ========================================================
     Intermediate filaments

     Shorter network through the middle of the cytoplasm.
     ======================================================== */

  const intermediateFilaments =
    [];


  const intermediateCount =
    6;


  for (
    let index = 0;
    index < intermediateCount;
    index += 1
  ) {
    const seed =
      700 +
      index * 29;


    const start =
      randomPointInsideEllipsoid(
        seed,
        0.38
      );


    const end =
      randomPointInShell(
        seed + 80,
        0.48,
        0.72
      );


    /*
     * Bias them slightly backward.
     */

    start.z -=
      0.12;


    end.z -=
      0.14;


    const middle =
      start
        .clone()
        .lerp(
          end,
          0.5
        );


    middle.add(
      randomDirection(
        seed + 140
      ).multiplyScalar(
        randomBetween(
          seed + 150,
          0.07,
          0.18
        )
      )
    );


    const filament =
      createFilament(
        [
          start,
          middle,
          end,
        ],

        0.0045,

        intermediateMaterial,

        30,

        index * 0.66
      );


    group.add(
      filament
    );


    intermediateFilaments.push(
      filament
    );
  }


  /* ========================================================
     Animation

     Extremely subtle opacity shimmer.

     No visible centrosome rotation here anymore because the
     real centrosome owns its own animation in centrosome.js.
     ======================================================== */

  function animate(
    elapsedTime
  ) {

    /* ------------------------------------------------------
       Microtubules
       ------------------------------------------------------ */

    microtubules.forEach(
      (
        filament,
        index
      ) => {
        const variation =
          Math.sin(
            elapsedTime *
              0.22 +
            filament.userData
              .phase +
            index * 0.08
          ) *
          0.009;


        filament.material.opacity =
          Math.max(
            0.035,

            filament.userData
              .baseOpacity +
            variation
          );
      }
    );


    /* ------------------------------------------------------
       Actin
       ------------------------------------------------------ */

    actinFilaments.forEach(
      (
        filament,
        index
      ) => {
        const variation =
          Math.sin(
            elapsedTime *
              0.28 +
            filament.userData
              .phase +
            index * 0.06
          ) *
          0.005;


        filament.material.opacity =
          Math.max(
            0.015,

            filament.userData
              .baseOpacity +
            variation
          );
      }
    );


    /* ------------------------------------------------------
       Intermediate filaments
       ------------------------------------------------------ */

    intermediateFilaments.forEach(
      (
        filament,
        index
      ) => {
        const variation =
          Math.sin(
            elapsedTime *
              0.20 +
            filament.userData
              .phase +
            index * 0.07
          ) *
          0.006;


        filament.material.opacity =
          Math.max(
            0.018,

            filament.userData
              .baseOpacity +
            variation
          );
      }
    );
  }


  /* ========================================================
     Return

     `centrosome` is kept as an alias to the invisible anchor
     for compatibility with any existing code that expects
     cytoskeleton.centrosome.

     The visible centrosome comes only from centrosome.js.
     ======================================================== */

  return {
    group,

    centrosome:
      centrosomeAnchor,

    centrosomeAnchor,

    microtubules,

    actinFilaments,

    intermediateFilaments,

    animate,
  };
}