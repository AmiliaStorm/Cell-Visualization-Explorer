import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
 
/* ==========================================================
   Mitochondria
 
   Loads the Blender mitochondrion model and creates several
   copies positioned throughout the cell.
 
   The GLB already contains:
   - Mito_Outer material
   - Mito_Inner material
   - detailed cristae geometry
   ========================================================== */
 
export function createMitochondria() {
  const mitochondriaGroup = new THREE.Group();
 
  mitochondriaGroup.name = "mitochondria";
 
  const loader = new GLTFLoader();
 
  const modelURL = new URL(
    "./models/Mito.glb",
    import.meta.url
  );
 
  loader.load(
    modelURL.href,
 
    (gltf) => {
      const sourceModel = gltf.scene;
 
      sourceModel.name = "mitochondrionSource";
 
      sourceModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
 
          if (child.material) {
            child.material.needsUpdate = true;
          }
        }
      });
 
      /* ------------------------------------------------------
         Normalize Blender model size
         ------------------------------------------------------ */
 
      const box = new THREE.Box3().setFromObject(
        sourceModel
      );
 
      const size = new THREE.Vector3();
      box.getSize(size);
 
      const longestSide = Math.max(
        size.x,
        size.y,
        size.z
      );
 
      /* Slightly smaller so they do not dominate the scene */
      const targetSize = 0.34;
 
      const normalizationScale =
        targetSize / longestSide;
 
      sourceModel.scale.setScalar(
        normalizationScale
      );
 
      sourceModel.updateMatrixWorld(true);
 
      const normalizedBox =
        new THREE.Box3().setFromObject(
          sourceModel
        );
 
      const center = new THREE.Vector3();
      normalizedBox.getCenter(center);
 
      sourceModel.position.sub(center);
 
      /* ------------------------------------------------------
         Base orientation
 
         Fixed: was upside-down with -1.15 on X, flipped to
         positive so the cristae face the camera correctly
         instead of being mirrored top-to-bottom.
         ------------------------------------------------------ */
 
      sourceModel.rotation.set(
        1.15,
        0.18,
        0.0
      );
 
      /* ======================================================
         Individual mitochondria
 
         Spread out across x, y AND z (previous version barely
         varied y/z, which is why they read as clustered/
         overlapping despite different x positions).
         ====================================================== */
 
      const instances = [
        {
          position: [-0.85, -0.45, 0.35],
          rotation: [0.10, -0.15, -0.35],
          scale: 1.00,
        },
 
        {
          position: [-0.25, 0.75, 0.20],
          rotation: [0.08, 0.22, 0.25],
          scale: 0.92,
        },
 
        {
          position: [0.55, -0.80, -0.15],
          rotation: [-0.05, 0.18, 0.72],
          scale: 0.88,
        },
 
        {
          position: [1.05, 0.30, 0.30],
          rotation: [0.04, -0.28, -0.42],
          scale: 0.84,
        },
 
        {
          position: [1.35, -0.35, 0.05],
          rotation: [0.06, 0.12, 0.38],
          scale: 0.78,
        },
      ];
 
      instances.forEach(
        (config, index) => {
          const wrapper =
            new THREE.Group();
 
          wrapper.name =
            `mitochondrion_${index + 1}`;
 
          const mitochondrion =
            sourceModel.clone(true);
 
          mitochondrion.position.set(
            0,
            0,
            0
          );
 
          wrapper.add(
            mitochondrion
          );
 
          wrapper.position.set(
            ...config.position
          );
 
          wrapper.rotation.set(
            ...config.rotation
          );
 
          wrapper.scale.setScalar(
            config.scale
          );
 
          mitochondriaGroup.add(
            wrapper
          );
        }
      );
 
      console.log(
        "3D mitochondria loaded successfully:",
        mitochondriaGroup
      );
    },
 
    undefined,
 
    (error) => {
      console.error(
        "Could not load Mito.glb:",
        error
      );
 
      console.error(
        "Attempted URL:",
        modelURL.href
      );
    }
  );
 
  return mitochondriaGroup;
}