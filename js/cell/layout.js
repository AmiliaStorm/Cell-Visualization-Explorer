import * as THREE from "three";

export const cellLayout = {
  /* ========================================================
     Nucleus

     Large focal structure on the left, slightly
     forward so the DNA remains easy to see.
     ======================================================== */

  nucleus: {
    position: new THREE.Vector3(
      -0.82,
      0.08,
      0.1
    ),

    scale: new THREE.Vector3(
      0.78,
      0.78,
      0.78
    ),
  },

  /* ========================================================
     Rough ER

     Centred around the nucleus but placed slightly
     behind it, preventing the ER from obscuring DNA.
     ======================================================== */

  roughER: {
    position: new THREE.Vector3(
      -0.78,
      0.04,
      -0.16
    ),

    rotation: new THREE.Euler(
      -0.07,
      0.16,
      -0.06
    ),

    scale: new THREE.Vector3(
      0.78,
      0.78,
      0.78
    ),
  },

  /* ========================================================
     Smooth ER

     ======================================================== */
smoothER: {
  position: new THREE.Vector3(
    0.38,
    0.72,
    -0.08
  ),

  rotation: new THREE.Euler(
    -0.12,
    0.28,
    -0.06
  ),

  scale: new THREE.Vector3(
    0.74,
    0.74,
    0.74
  ),
},
  /* ========================================================
     Mitochondria

     Distributed around the outer cytoplasm at different
     depths, framing the main protein-production pathway.
     ======================================================== */

  mitochondria: [
    {
      position: new THREE.Vector3(
        -1.55,
        1.12,
        -0.42
      ),

      rotation: new THREE.Euler(
        0.18,
        -0.38,
        0.58
      ),

      scale: 0.44,
    },

    {
      position: new THREE.Vector3(
        1.48,
        1.08,
        -0.48
      ),

      rotation: new THREE.Euler(
        -0.14,
        0.46,
        -0.38
      ),

      scale: 0.43,
    },

    {
      position: new THREE.Vector3(
        1.5,
        -1.12,
        -0.34
      ),

      rotation: new THREE.Euler(
        0.3,
        -0.2,
        0.76
      ),

      scale: 0.42,
    },
  ],

  /* ========================================================
    Lysosomes
     ======================================================== */

  lysosomes: [
  {
    position: new THREE.Vector3(
      0.35,
      1.02,
      0.28
    ),

    rotation: new THREE.Euler(
      0.15,
      -0.25,
      0.12
    ),

    scale: 0.78,
  },

  {
    position: new THREE.Vector3(
      1.52,
      0.35,
      -0.18
    ),

    rotation: new THREE.Euler(
      -0.1,
      0.3,
      -0.18
    ),

    scale: 0.68,
  },

  {
    position: new THREE.Vector3(
      1.55,
      -0.78,
      0.24
    ),

    rotation: new THREE.Euler(
      0.2,
      -0.15,
      0.28
    ),

    scale: 0.76,
  },

  {
    position: new THREE.Vector3(
      0.45,
      -1.22,
      -0.12
    ),

    rotation: new THREE.Euler(
      -0.18,
      0.22,
      0.08
    ),

    scale: 0.7,
  },

  {
    position: new THREE.Vector3(
      -0.18,
      1.3,
      -0.22
    ),

    rotation: new THREE.Euler(
      0.12,
      0.18,
      -0.2
    ),

    scale: 0.62,
  },
],

/* ========================================================
   Peroxisomes

   Small oxidative organelles distributed throughout the
   cytoplasm. Positioned separately from lysosomes so the
   two populations remain visually distinguishable.
   ======================================================== */

peroxisomes: [
  {
    position: new THREE.Vector3(
      -1.34,
      -0.72,
      0.28
    ),

    rotation: new THREE.Euler(
      0.12,
      -0.18,
      0.22
    ),

    scale: 0.82,
  },

  {
    position: new THREE.Vector3(
      -1.28,
      0.68,
      0.3
    ),

    rotation: new THREE.Euler(
      -0.16,
      0.24,
      -0.12
    ),

    scale: 0.72,
  },

  {
    position: new THREE.Vector3(
      0.88,
      0.78,
      0.34
    ),

    rotation: new THREE.Euler(
      0.18,
      -0.26,
      0.1
    ),

    scale: 0.86,
  },

  {
    position: new THREE.Vector3(
      0.96,
      -1.18,
      0.3
    ),

    rotation: new THREE.Euler(
      -0.12,
      0.2,
      0.18
    ),

    scale: 0.78,
  },

  {
    position: new THREE.Vector3(
      -0.62,
      -1.34,
      -0.2
    ),

    rotation: new THREE.Euler(
      0.2,
      0.14,
      -0.24
    ),

    scale: 0.68,
  },
],


  /* ========================================================
     Golgi apparatus

     Positioned at the end of the hard-coded transport
     pathway and slightly forward so its curved membranes
     and budding vesicles remain visible.
     ======================================================== */

 golgi: {
  position: new THREE.Vector3(
    1.08,
    -0.18,
    0.08
  ),

  rotation: new THREE.Euler(
    0.02,
    -0.2,
    -0.03
  ),

  scale: new THREE.Vector3(
    0.4,
    0.4,
    0.4
  ),
},
};