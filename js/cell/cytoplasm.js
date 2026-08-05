import * as THREE from "three";

/* ==========================================================
   Cytoplasm

   Creates a subtle aqueous volume inside the cell.
   The material is intentionally faint so organelles
   remain clear and readable.
   ========================================================== */

export function createCytoplasm() {
  /* --------------------------------------------------------
     Main cytoplasmic volume
     -------------------------------------------------------- */

  const geometry =
    new THREE.SphereGeometry(
      2.93,
      72,
      72
    );

  const material =
    new THREE.MeshPhysicalMaterial({
      color: 0x0b3550,

      transparent: true,
      opacity: 0.038,

      roughness: 0.9,
      metalness: 0,

      transmission: 0,

      clearcoat: 0,
      clearcoatRoughness: 1,

      emissive:
        new THREE.Color(
          0x031522
        ),

      emissiveIntensity: 0.12,

      side: THREE.BackSide,

      depthWrite: false,
      depthTest: true,
    });

  const cytoplasm =
    new THREE.Mesh(
      geometry,
      material
    );

  cytoplasm.name =
    "cytoplasm";

  /*
   * Match the proportions of the outer
   * cell membrane while remaining slightly
   * inside its boundary.
   */
  cytoplasm.scale.set(
    1.12,
    0.95,
    1
  );

  cytoplasm.renderOrder = 0;

  /* --------------------------------------------------------
     Soft internal haze

     This creates slight depth near the centre
     without producing a bright colored screen.
     -------------------------------------------------------- */

  const hazeGeometry =
    new THREE.SphereGeometry(
      2.55,
      48,
      48
    );

  const hazeMaterial =
    new THREE.MeshBasicMaterial({
      color: 0x0d4160,

      transparent: true,
      opacity: 0.018,

      side: THREE.BackSide,

      depthWrite: false,
      depthTest: true,
    });

  const innerHaze =
    new THREE.Mesh(
      hazeGeometry,
      hazeMaterial
    );

  innerHaze.scale.set(
    1.1,
    0.93,
    0.98
  );

  innerHaze.renderOrder = 0;

  cytoplasm.add(
    innerHaze
  );

  /* --------------------------------------------------------
     Metadata
     -------------------------------------------------------- */

  cytoplasm.userData.type =
    "cytoplasm";

  cytoplasm.userData.organelleId =
    "cytoplasm";

  cytoplasm.userData.organelleName =
    "Cytoplasm";

  cytoplasm.userData.description =
    "The cytoplasm is the aqueous interior where organelles and many cellular reactions are located.";

  cytoplasm.userData.innerHaze =
    innerHaze;

  return cytoplasm;
}