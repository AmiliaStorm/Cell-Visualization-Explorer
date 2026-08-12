import * as THREE from "three";

/* ==========================================================
   Deterministic random helpers
   ========================================================== */

function pseudoRandom(seed) {
  const value =
    Math.sin(seed * 12.9898) *
    43758.5453;

  return value - Math.floor(value);
}

function randomBetween(seed, minimum, maximum) {
  return THREE.MathUtils.lerp(
    minimum,
    maximum,
    pseudoRandom(seed)
  );
}

/* ==========================================================
   Create one phospholipid

   A small sphere "head" with a thin cylinder "tail"
   pointing away from the head, toward the membrane centre.
   ========================================================== */

function createPhospholipid({
  headMaterial,
  tailMaterial,
  facingOutward,
}) {
  const group = new THREE.Group();

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.028, 12, 12),
    headMaterial
  );

  const tailLength = 0.11;

  const tail = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.007,
      0.004,
      tailLength,
      6
    ),
    tailMaterial
  );

  /*
   * Position the tail so it extends from the head,
   * pointing inward (toward the membrane's centre plane).
   */
  const direction = facingOutward ? 1 : -1;

  tail.position.y =
    -direction * (tailLength / 2 + 0.026);

  head.position.y =
    direction * 0.026;

  group.add(head, tail);

  return group;
}

/* ==========================================================
   Bilayer patch

   A small rectangular patch of two opposing phospholipid
   rows, meant to be embedded at a fixed point on the
   membrane surface and shown only in Cutaway mode.
   ========================================================== */

export function createBilayerPatch() {
  const group = new THREE.Group();

  group.name = "membraneBilayerPatch";

  group.userData.type = "bilayerPatch";

  group.userData.info = {
    title: "Phospholipid Bilayer",
    subtitle: "Cell membrane structure",
    summary:
      "The membrane is built from two layers of phospholipids, with hydrophilic heads facing outward and hydrophobic tails facing inward.",
    functions: [
      "Selective permeability",
      "Structural boundary",
      "Embedded protein anchoring",
    ],
  };

  /* ========================================================
     Materials
     ======================================================== */

  const headMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0x5fd0ff,
      emissive: 0x1a6f96,
      emissiveIntensity: 0.55,
      roughness: 0.25,
      metalness: 0,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
    });

  const tailMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xffd98a,
      emissive: 0x8a5a1c,
      emissiveIntensity: 0.28,
      roughness: 0.45,
      metalness: 0,
    });

  /* ========================================================
     Grid of lipids

     Two rows, offset slightly, mimicking the reference
     bilayer diagram look.
     ======================================================== */

  const columns = 7;
  const rowSpacing = 0.12;
  const columnSpacing = 0.09;

  for (let column = 0; column < columns; column += 1) {
    const seed = column * 11;

    const xJitter =
      randomBetween(seed + 1, -0.012, 0.012);

    const x =
      (column - (columns - 1) / 2) *
        columnSpacing +
      xJitter;

    /*
     * Outer row (heads facing away from membrane centre).
     */
    const outerLipid = createPhospholipid({
      headMaterial,
      tailMaterial,
      facingOutward: true,
    });

    outerLipid.position.set(
      x,
      rowSpacing / 2,
      randomBetween(seed + 2, -0.01, 0.01)
    );

    /*
     * Inner row (heads facing the opposite direction).
     */
    const innerLipid = createPhospholipid({
      headMaterial,
      tailMaterial,
      facingOutward: false,
    });

    innerLipid.position.set(
      x + columnSpacing * 0.4,
      -rowSpacing / 2,
      randomBetween(seed + 3, -0.01, 0.01)
    );

    group.add(outerLipid, innerLipid);
  }

  /* ========================================================
     Subtle backing plate

     Gives the patch a slight glowing base so it reads as
     "embedded" in the membrane rather than floating.
     ======================================================== */

  const backing = new THREE.Mesh(
    new THREE.PlaneGeometry(
      columns * columnSpacing + 0.1,
      rowSpacing + 0.12
    ),
    new THREE.MeshBasicMaterial({
      color: 0x0d2c3c,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );

  backing.position.z = -0.02;

  group.add(backing);

  group.renderOrder = 12;

  group.traverse((child) => {
    if (child.isMesh) {
      child.renderOrder = 12;
    }
  });

  /* ========================================================
     Animation

     Very gentle sway, giving the lipids a slight sense of
     fluidity without being distracting.
     ======================================================== */

  function animate(elapsedTime) {
    group.children.forEach((child, index) => {
      if (!child.isGroup) {
        return;
      }

      child.rotation.z =
        Math.sin(
          elapsedTime * 0.5 + index * 0.4
        ) * 0.03;
    });
  }

  return {
    group,
    animate,
  };
}