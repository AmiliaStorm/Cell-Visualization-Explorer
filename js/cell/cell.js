import * as THREE from "three";

import {
  createMembrane,
} from "./membrane.js";

import {
  createCytoplasm,
} from "./cytoplasm.js";

import {
  createNucleus,
} from "./nucleus.js";

import {
  createMitochondria,
} from "./mitochondria.js";

import {
  createRibosomes,
} from "./ribosomes.js";

import {
  createCytoskeleton,
} from "./cytoskeleton.js";

import {
  createRoughER,
} from "./roughER.js";

import {
  createSmoothER,
} from "./smoothER.js";

import {
  createGolgi,
} from "./golgi.js";

import {
  createCentrosome,
} from "./centrosome.js";

import {
  cellLayout,
} from "./layout.js";

import {
  createCytoplasmParticles,
} from "./cytoplasmParticles.js";

import {
  createLysosomes,
} from "./lysosomes.js";

import {
  createPeroxisomes,
} from "./peroxisomes.js";

import {
  createVesicles,
} from "./vesicles.js";


/* ==========================================================
   Build complete animal cell
   ========================================================== */

export function buildCell(
  scene,
  environmentMap = null
) {
  const group =
    new THREE.Group();


  group.name =
    "animalCell";


  /* ========================================================
     Content group
     ======================================================== */

  const contentGroup =
    new THREE.Group();


  contentGroup.name =
    "cellContent";


  contentGroup.scale.setScalar(
    1.3
  );


  group.scale.setScalar(
    0.78
  );


  group.position.set(
    0,
    0,
    0
  );


  group.rotation.set(
    -0.03,
    0.07,
    0
  );


  /* ========================================================
     Create structures
     ======================================================== */

  const membrane =
    createMembrane(
      environmentMap
    );


  const cytoplasm =
    createCytoplasm();


  const nucleus =
    createNucleus();


  const roughER =
    createRoughER();


  const smoothER =
    createSmoothER();


  const golgi =
    createGolgi();


  const vesicles =
    createVesicles({
      origin:
        cellLayout
          .vesiclePath
          .origin,

      destination:
        cellLayout
          .vesiclePath
          .destination,

      count:
        6,
    });


  /*
   * Mitochondria is now a THREE.Group.
   *
   * The Blender GLB is loaded inside
   * mitochondria.js and its individual
   * mitochondria are added to this group
   * asynchronously.
   */
  const mitochondria =
    createMitochondria();


  const ribosomes =
    createRibosomes();


  const cytoskeleton =
    createCytoskeleton();


  const centrosome =
    createCentrosome();


  const cytoplasmParticles =
    createCytoplasmParticles({
      proteinCount:
        280,

      cellRadius:
        3.05,

      nucleusRadius:
        1.18,

      edgePadding:
        0.2,
    });


  const lysosomes =
    createLysosomes();


  const peroxisomes =
    createPeroxisomes();


  /* ========================================================
     Nucleus layout
     ======================================================== */

  nucleus.group.position.copy(
    cellLayout.nucleus.position
  );


  nucleus.group.scale.copy(
    cellLayout.nucleus.scale
  );


  /* ========================================================
     Rough ER layout
     ======================================================== */

  roughER.group.position.copy(
    cellLayout.roughER.position
  );


  roughER.group.rotation.copy(
    cellLayout.roughER.rotation
  );


  roughER.group.scale.copy(
    cellLayout.roughER.scale
  );


  /* ========================================================
     Smooth ER layout
     ======================================================== */

  smoothER.group.position.copy(
    cellLayout.smoothER.position
  );


  smoothER.group.rotation.copy(
    cellLayout.smoothER.rotation
  );


  smoothER.group.scale.copy(
    cellLayout.smoothER.scale
  );


  /* ========================================================
     Golgi layout
     ======================================================== */

  golgi.group.position.copy(
    cellLayout.golgi.position
  );


  golgi.group.rotation.copy(
    cellLayout.golgi.rotation
  );


  golgi.group.scale.copy(
    cellLayout.golgi.scale
  );


  /* ========================================================
     Centrosome layout
     ======================================================== */

  if (
    cellLayout.centrosome
  ) {
    centrosome.position.copy(
      cellLayout
        .centrosome
        .position
    );


    centrosome.rotation.copy(
      cellLayout
        .centrosome
        .rotation
    );


    centrosome.scale.copy(
      cellLayout
        .centrosome
        .scale
    );
  }


  /* ========================================================
     Mitochondrial layout

     The old mitochondria.forEach() layout is intentionally
     removed.

     Positions, rotations and scales for the new Blender
     mitochondria are controlled inside mitochondria.js.
     ======================================================== */


  /* ========================================================
     Lysosome layout
     ======================================================== */

  lysosomes.forEach(
    (
      lysosome,
      index
    ) => {
      const layout =
        cellLayout
          .lysosomes[
            index
          ];


      if (!layout) {
        return;
      }


      lysosome.position.copy(
        layout.position
      );


      lysosome.rotation.copy(
        layout.rotation
      );


      lysosome.scale.setScalar(
        layout.scale
      );


      lysosome.userData
        .layoutScale =
        layout.scale;
    }
  );


  /* ========================================================
     Peroxisome layout
     ======================================================== */

  peroxisomes.forEach(
    (
      peroxisome,
      index
    ) => {
      const layout =
        cellLayout
          .peroxisomes[
            index
          ];


      if (!layout) {
        return;
      }


      peroxisome.position.copy(
        layout.position
      );


      peroxisome.rotation.copy(
        layout.rotation
      );


      peroxisome.scale.setScalar(
        layout.scale
      );


      peroxisome.userData
        .layoutScale =
        layout.scale;
    }
  );


  /* ========================================================
     Assemble major organelles
     ======================================================== */

  contentGroup.add(
    roughER.group,

    smoothER.group,

    nucleus.group,

    centrosome,

    golgi.group,

    vesicles.group,

    ribosomes,

    /*
     * Mitochondria is already one THREE.Group,
     * so there is NO spread operator here.
     */
    mitochondria,

    ...lysosomes,

    ...peroxisomes
  );


  /* ========================================================
     Assemble complete cell
     ======================================================== */

  group.add(
    cytoplasm,

    cytoplasmParticles.group,

    cytoskeleton.group,

    contentGroup,

    membrane
  );


  scene.add(
    group
  );


  /* ========================================================
     Public cell object
     ======================================================== */

  return {
    group,

    contentGroup,

    membrane,

    cytoplasm,

    cytoplasmParticles,

    nucleus,

    roughER,

    smoothER,

    golgi,

    vesicles,

    centrosome,

    mitochondria,

    ribosomes,

    cytoskeleton,

    lysosomes,

    peroxisomes,


    /* ======================================================
       Animation
       ====================================================== */

    animate(
      elapsedTime,
      deltaTime = 1 / 60
    ) {
      nucleus.animate(
        elapsedTime
      );


      cytoskeleton.animate(
        elapsedTime
      );


      roughER.animate(
        elapsedTime
      );


      smoothER.animate(
        elapsedTime,
        deltaTime
      );


      /*
       * No mitochondria.animate() here yet.
       *
       * The new GLB mitochondria group currently
       * does not expose an animate() method.
       */


      golgi.animate(
        elapsedTime
      );


      vesicles.animate(
        elapsedTime
      );


      cytoplasmParticles.animate(
        elapsedTime,
        deltaTime
      );


      lysosomes.animate(
        elapsedTime
      );


      peroxisomes.animate(
        elapsedTime
      );


      if (
        typeof centrosome.animate ===
        "function"
      ) {
        centrosome.animate(
          elapsedTime
        );
      }


      /* ----------------------------------------------------
         Gentle plasma-membrane breathing
         ---------------------------------------------------- */

      const membranePulse =
        1 +
        Math.sin(
          elapsedTime * 0.55
        ) *
          0.006;


      membrane.scale.set(
        membrane.userData
          .baseScale.x *
          membranePulse,

        membrane.userData
          .baseScale.y *
          (
            1 +
            Math.cos(
              elapsedTime * 0.55
            ) *
              0.005
          ),

        membrane.userData
          .baseScale.z *
          membranePulse
      );
    },
  };
}