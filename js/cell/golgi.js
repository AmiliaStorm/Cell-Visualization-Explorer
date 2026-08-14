import * as THREE from "three";

import {
  GLTFLoader,
} from "three/addons/loaders/GLTFLoader.js";


/* ==========================================================
   Golgi model URL

   import.meta.url makes the path relative to THIS file,
   so it also works when the site is hosted on GitHub Pages.
   ========================================================== */

const GOLGI_MODEL_URL =
  new URL(
    "./models/golgi3D.glb",
    import.meta.url
  ).href;


/* ==========================================================
   Golgi apparatus
   ========================================================== */

export function createGolgi() {
  const group =
    new THREE.Group();


  group.name =
    "golgiApparatus";


  group.userData.type =
    "golgi";


  group.userData.organelleId =
    "golgi";


  group.userData.info = {
    title:
      "Golgi Apparatus",

    subtitle:
      "Protein processing and sorting",

    summary:
      "A stack of curved cisternae that modifies, sorts and packages proteins. The cis face receives material from the ER; the trans face releases finished vesicles.",

    functions: [
      "Protein modification",
      "Protein sorting",
      "Vesicle packaging",
      "Secretion",
    ],
  };


  /* ========================================================
     Container for imported model
     ======================================================== */

  const modelContainer =
    new THREE.Group();


  modelContainer.name =
    "golgiImportedModel";


  group.add(
    modelContainer
  );


  /* ========================================================
     Loader
     ======================================================== */

  const loader =
    new GLTFLoader();


  let importedModel = null;


  loader.load(
    GOLGI_MODEL_URL,


    /* ------------------------------------------------------
       Loaded successfully
       ------------------------------------------------------ */

    (gltf) => {
      importedModel =
        gltf.scene;


      importedModel.name =
        "golgi3D";


      /*
       * Blender is Z-up.
       * Three.js is Y-up.
       *
       * This rotates the model so the same face that we saw
       * in Blender points toward the cell camera.
       */

      importedModel.rotation.x =
        Math.PI * 0.5;


      importedModel.updateMatrixWorld(
        true
      );


      /* ----------------------------------------------------
         Automatically normalize model size

         The old procedural Golgi occupied roughly this scale
         inside the cell. We normalize the imported model so
         layout.js can continue controlling its final size.
         ---------------------------------------------------- */

      const initialBox =
        new THREE.Box3()
          .setFromObject(
            importedModel
          );


      const initialSize =
        initialBox.getSize(
          new THREE.Vector3()
        );


      const largestDimension =
        Math.max(
          initialSize.x,
          initialSize.y,
          initialSize.z
        );


      const targetSize =
        1.55;


      if (
        largestDimension >
        0
      ) {
        const scale =
          targetSize /
          largestDimension;


        importedModel.scale.setScalar(
          scale
        );
      }


      importedModel.updateMatrixWorld(
        true
      );


      /* ----------------------------------------------------
         Center model at its own origin
         ---------------------------------------------------- */

      const centeredBox =
        new THREE.Box3()
          .setFromObject(
            importedModel
          );


      const center =
        centeredBox.getCenter(
          new THREE.Vector3()
        );


      importedModel.position.sub(
        center
      );


      /* ----------------------------------------------------
         Mesh configuration
         ---------------------------------------------------- */

      importedModel.traverse(
        (child) => {
          if (!child.isMesh) {
            return;
          }


          child.castShadow =
            true;


          child.receiveShadow =
            true;


          /*
           * Give every mesh the same organelle metadata.
           *
           * This makes later raycasting / clicking much
           * easier when we add organelle interaction.
           */

          child.userData.type =
            "golgi";


          child.userData.organelleId =
            "golgi";


          child.userData.info =
            group.userData.info;


          /*
           * Preserve Meshy / Blender materials.
           */

          if (
            child.material
          ) {
            child.material.needsUpdate =
              true;
          }
        }
      );


      modelContainer.add(
        importedModel
      );


      console.log(
        "Golgi GLB loaded successfully:",
        GOLGI_MODEL_URL
      );
    },


    /* ------------------------------------------------------
       Loading progress
       ------------------------------------------------------ */

    (progress) => {
      if (
        progress.total >
        0
      ) {
        const percent =
          (
            progress.loaded /
            progress.total
          ) *
          100;


        console.log(
          `Golgi loading: ${percent.toFixed(1)}%`
        );
      }
    },


    /* ------------------------------------------------------
       Error
       ------------------------------------------------------ */

    (error) => {
      console.error(
        "Failed to load Golgi model:",
        error
      );
    }
  );


  /* ========================================================
     Animation

     Keep this function because cell.js already calls
     golgi.animate(...).

     For now the imported model remains essentially static,
     with only an extremely subtle biological movement.
     ======================================================== */

  function animate(
    elapsedTime
  ) {
    if (!importedModel) {
      return;
    }


    modelContainer.rotation.z =
      Math.sin(
        elapsedTime *
        0.15
      ) *
      0.003;


    const pulse =
      1 +
      Math.sin(
        elapsedTime *
        0.32
      ) *
      0.002;


    modelContainer.scale.setScalar(
      pulse
    );
  }


  /* ========================================================
     Public Golgi object

     Empty arrays are retained for compatibility with the old
     procedural Golgi API.
     ======================================================== */

  return {
    group,

    cisternae: [],

    cisternaGroups: [],

    vesicles: [],

    cargoParticles: [],

    animate,
  };
}