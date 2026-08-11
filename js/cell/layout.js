import * as THREE from "three";

export const cellLayout = {
  /* ========================================================
     Nucleus

     Larger focal structure on the left, slightly forward
     so the DNA remains clearly visible.
     ======================================================== */
  nucleus: {
    position: new THREE.Vector3(
      -0.92,
      0.10,
      0.16
    ),

    scale: new THREE.Vector3(
      0.92,
      0.92,
      0.92
    ),
  },

  /* ========================================================
     Rough ER

     Wrapped closely around the nucleus, slightly behind it,
     but still visually dominant like in the reference model.
     ======================================================== */
  roughER: {
    position: new THREE.Vector3(
      -0.88,
      0.02,
      -0.10
    ),

    rotation: new THREE.Euler(
      -0.06,
      0.18,
      -0.04
    ),

    scale: new THREE.Vector3(
      0.92,
      0.92,
      0.92
    ),
  },

  /* ========================================================
     Smooth ER

     Smaller branching network in the upper-right area.
     ======================================================== */
  smoothER: {
    position: new THREE.Vector3(
      0.52,
      0.52,
      0.00
    ),

    rotation: new THREE.Euler(
      -0.10,
      0.34,
      -0.08
    ),

    scale: new THREE.Vector3(
      0.60,
      0.60,
      0.60
    ),
  },

  /* ========================================================
     Mitochondria

     Distributed around the outer cytoplasm to frame the
     main scene like in the concept image.
     ======================================================== */
  mitochondria: [
    {
      position: new THREE.Vector3(
        -1.58,
        0.98,
        -0.28
      ),

      rotation: new THREE.Euler(
        0.18,
        -0.34,
        0.52
      ),

      scale: 0.44,
    },

    {
      position: new THREE.Vector3(
        0.42,
        1.02,
        -0.30
      ),

      rotation: new THREE.Euler(
        -0.08,
        0.42,
        -0.22
      ),

      scale: 0.40,
    },

    {
      position: new THREE.Vector3(
        1.55,
        0.48,
        -0.22
      ),

      rotation: new THREE.Euler(
        -0.16,
        0.34,
        -0.36
      ),

      scale: 0.43,
    },

    {
      position: new THREE.Vector3(
        1.46,
        -1.02,
        -0.20
      ),

      rotation: new THREE.Euler(
        0.24,
        -0.16,
        0.72
      ),

      scale: 0.42,
    },

    {
      position: new THREE.Vector3(
        -0.16,
        -1.08,
        -0.24
      ),

      rotation: new THREE.Euler(
        0.14,
        0.22,
        -0.42
      ),

      scale: 0.39,
    },
  ],

  /* ========================================================
     Lysosomes
     ======================================================== */
  lysosomes: [
    {
      position: new THREE.Vector3(
        0.88,
        0.72,
        0.22
      ),

      rotation: new THREE.Euler(
        0.14,
        -0.20,
        0.10
      ),

      scale: 0.72,
    },

    {
      position: new THREE.Vector3(
        1.42,
        0.02,
        0.10
      ),

      rotation: new THREE.Euler(
        -0.08,
        0.28,
        -0.14
      ),

      scale: 0.66,
    },

    {
      position: new THREE.Vector3(
        1.12,
        -0.86,
        0.18
      ),

      rotation: new THREE.Euler(
        0.18,
        -0.14,
        0.24
      ),

      scale: 0.70,
    },

    {
      position: new THREE.Vector3(
        0.10,
        -1.18,
        0.06
      ),

      rotation: new THREE.Euler(
        -0.14,
        0.16,
        0.10
      ),

      scale: 0.64,
    },

    {
      position: new THREE.Vector3(
        -0.06,
        0.98,
        0.12
      ),

      rotation: new THREE.Euler(
        0.10,
        0.16,
        -0.16
      ),

      scale: 0.58,
    },
  ],

  /* ========================================================
     Peroxisomes

     Smaller oxidative organelles distributed separately
     from lysosomes.
     ======================================================== */
  peroxisomes: [
    {
      position: new THREE.Vector3(
        -1.34,
        -0.56,
        0.22
      ),

      rotation: new THREE.Euler(
        0.10,
        -0.16,
        0.18
      ),

      scale: 0.72,
    },

    {
      position: new THREE.Vector3(
        -1.22,
        0.42,
        0.20
      ),

      rotation: new THREE.Euler(
        -0.12,
        0.20,
        -0.08
      ),

      scale: 0.64,
    },

    {
      position: new THREE.Vector3(
        0.46,
        0.96,
        0.22
      ),

      rotation: new THREE.Euler(
        0.14,
        -0.18,
        0.08
      ),

      scale: 0.68,
    },

    {
      position: new THREE.Vector3(
        0.78,
        -1.08,
        0.18
      ),

      rotation: new THREE.Euler(
        -0.10,
        0.16,
        0.14
      ),

      scale: 0.66,
    },

    {
      position: new THREE.Vector3(
        -0.56,
        -1.12,
        -0.08
      ),

      rotation: new THREE.Euler(
        0.16,
        0.12,
        -0.18
      ),

      scale: 0.60,
    },
  ],

  /* ========================================================
     Golgi apparatus

     Larger and more prominent on the right side, slightly
     forward so the stacked cisternae are clearly visible.
     ======================================================== */
golgi: {
  position: new THREE.Vector3(
    1.12,
    -0.08,
    0.16
  ),

  rotation: new THREE.Euler(
    0.04,
    -0.22,
    -0.04
  ),

  scale: new THREE.Vector3(
    0.58,
    0.58,
    0.58
  ),
},

  /* ========================================================
     Centrosome

     Near the nucleus-Golgi region.
     Remove this block only if your cell.js does not use it.
     ======================================================== */
centrosome: {
  position: new THREE.Vector3(
    0.12,
    -0.10,
    -0.14
  ),

  rotation: new THREE.Euler(
    0.18,
    0.24,
    -0.08
  ),

  scale: new THREE.Vector3(
    0.54,
    0.54,
    0.54
  ),
},
};
