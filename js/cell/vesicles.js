
import * as THREE from "three";
 
/* ==========================================================
   Deterministic pseudo-random helpers
 
   Same approach as roughER.js so vesicles stay identical
   after every refresh.
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
   Deformed vesicle geometry
 
   Icosahedron pushed out along vertex normals with layered
   noise, so vesicles read as soft organic blobs rather than
   perfect spheres.
   ========================================================== */
 
function createVesicleGeometry(seed, radius) {
  const geometry =
    new THREE.IcosahedronGeometry(
      radius,
      3
    );
 
  const position =
    geometry.attributes.position;
 
  const vertex =
    new THREE.Vector3();
 
  for (
    let index = 0;
    index < position.count;
    index += 1
  ) {
    vertex.fromBufferAttribute(
      position,
      index
    );
 
    const normal =
      vertex
        .clone()
        .normalize();
 
    const noiseSeed =
      seed +
      index * 0.013;
 
    /* Large soft bulge */
 
    const bulge =
      Math.sin(
        normal.x * 3.1 +
        seed
      ) *
      Math.cos(
        normal.y * 2.7 +
        seed * 0.7
      ) *
        0.09;
 
    /* Fine membrane wobble */
 
    const wobble =
      randomBetween(
        noiseSeed,
        -0.035,
        0.035
      );
 
    const displacement =
      1 +
      bulge +
      wobble;
 
    vertex.multiplyScalar(
      displacement
    );
 
    position.setXYZ(
      index,
      vertex.x,
      vertex.y,
      vertex.z
    );
  }
 
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
 
  return geometry;
}
 
 
/* ==========================================================
   Create one vesicle (membrane shell + glowing cargo core)
   ========================================================== */
 
function createVesicle({
  seed,
  membraneMaterial,
  cargoMaterial,
}) {
  const group =
    new THREE.Group();
 
  const radius =
    randomBetween(
      seed + 1,
      0.052,
      0.078
    );
 
  const shellGeometry =
    createVesicleGeometry(
      seed,
      radius
    );
 
  const shell =
    new THREE.Mesh(
      shellGeometry,
      membraneMaterial
    );
 
  shell.castShadow = true;
  shell.renderOrder = 4;
 
 
  const cargoCount =
    Math.round(
      randomBetween(
        seed + 2,
        1,
        3
      )
    );
 
  for (
    let index = 0;
    index < cargoCount;
    index += 1
  ) {
    const cargoSeed =
      seed +
      100 +
      index * 11;
 
    const cargo =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          radius * 0.3,
          8,
          8
        ),
        cargoMaterial
      );
 
    cargo.position.set(
      randomBetween(
        cargoSeed + 1,
        -radius * 0.35,
        radius * 0.35
      ),
 
      randomBetween(
        cargoSeed + 2,
        -radius * 0.35,
        radius * 0.35
      ),
 
      randomBetween(
        cargoSeed + 3,
        -radius * 0.35,
        radius * 0.35
      )
    );
 
    cargo.renderOrder = 5;
 
    group.add(cargo);
  }
 
  group.add(shell);
 
  group.userData.baseScale = 1;
  group.userData.radius = radius;
 
  return group;
}
 
 
/* ==========================================================
   Build the transport curve
 
   A gentle bezier arc from the rough ER surface toward the
   Golgi, bowing slightly forward (+z) so vesicles read as
   travelling through the cytoplasm rather than in a straight
   line through the nucleus.
   ========================================================== */
 
function createTransportCurve({
  origin,
  destination,
}) {
  const midpoint =
    origin
      .clone()
      .lerp(
        destination,
        0.5
      );
 
  midpoint.z += 0.55;
  midpoint.y +=
    (
      origin.y +
      destination.y
    ) *
      0.15;
 
  return new THREE.QuadraticBezierCurve3(
    origin,
    midpoint,
    destination
  );
}
 
 
/* ==========================================================
   Transport Vesicles
   ========================================================== */
 
export function createVesicles({
  origin = new THREE.Vector3(
    -0.35,
    0.10,
    0.05
  ),
 
  destination = new THREE.Vector3(
    0.75,
    -0.02,
    0.14
  ),
 
  count = 6,
} = {}) {
  const group =
    new THREE.Group();
 
  group.name = "transportVesicles";
 
  group.userData.type = "vesicles";
 
  group.userData.organelleId =
    "vesicles";
 
  group.userData.info = {
    title: "Transport Vesicle",
 
    subtitle:
      "Cargo transport carrier",
 
    summary:
      "A membrane-bound sac that buds from the rough ER, carrying newly made protein to the Golgi apparatus for processing.",
 
    functions: [
      "Protein cargo transport",
      "Membrane budding and fusion",
      "ER-to-Golgi trafficking",
    ],
  };
 
 
  /* ========================================================
     Materials
 
     Membrane shell echoes the rough ER's translucent,
     clearcoated look. Cargo core is a warm glow, distinct
     from the golden ribosome color.
     ======================================================== */
 
  const membraneMaterial =
    new THREE.MeshPhysicalMaterial({
      color: 0x4fa8e8,
 
      transparent: true,
      opacity: 0.55,
 
      roughness: 0.22,
      metalness: 0,
 
      transmission: 0.35,
      thickness: 0.08,
 
      clearcoat: 0.6,
      clearcoatRoughness: 0.18,
 
      emissive: 0x0c3a99,
      emissiveIntensity: 0.3,
 
      side: THREE.DoubleSide,
 
      depthWrite: false,
      depthTest: true,
    });
 
 
  const cargoMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xff9d5c,
 
      emissive: 0xb84e0f,
      emissiveIntensity: 0.55,
 
      roughness: 0.35,
      metalness: 0,
    });
 
 
  const curve =
    createTransportCurve({
      origin,
      destination,
    });
 
 
  const vesicles = [];
 
 
  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    const seed =
      index * 53 + 7;
 
    const vesicle =
      createVesicle({
        seed,
        membraneMaterial,
        cargoMaterial,
      });
 
    /*
     * Stagger each vesicle's position along the curve and
     * give it its own speed so the stream feels continuous
     * rather than a single-file convoy.
     */
 
    vesicle.userData.progress =
      randomBetween(
        seed + 3,
        0,
        1
      );
 
    vesicle.userData.speed =
      randomBetween(
        seed + 4,
        0.045,
        0.075
      );
 
    vesicle.userData.wobblePhase =
      randomBetween(
        seed + 5,
        0,
        Math.PI * 2
      );
 
    vesicle.userData.wobbleSpeed =
      randomBetween(
        seed + 6,
        0.6,
        1.1
      );
 
    group.add(vesicle);
 
    vesicles.push(vesicle);
  }
 
 
  /* ========================================================
     Animation
 
     Each vesicle travels origin -> destination along the
     shared bezier curve, loops back to the start, and gets
     a slight scale pulse plus lateral wobble so the motion
     doesn't look mechanically identical between vesicles.
     ======================================================== */
 
  function animate(elapsedTime) {
    vesicles.forEach((vesicle) => {
      const data = vesicle.userData;
 
      data.progress =
        (
          data.progress +
          data.speed * 0.01
        ) %
        1;
 
      const point =
        curve.getPointAt(
          data.progress
        );
 
      const tangent =
        curve
          .getTangentAt(
            data.progress
          )
          .normalize();
 
      const lateral =
        new THREE.Vector3(
          -tangent.y,
          tangent.x,
          0
        ).normalize();
 
      const wobble =
        Math.sin(
          elapsedTime *
            data.wobbleSpeed +
          data.wobblePhase
        ) *
        0.04;
 
      vesicle.position
        .copy(point)
        .addScaledVector(
          lateral,
          wobble
        );
 
      /*
       * Fade in near the ER, fade out near the Golgi, so
       * budding/fusion feels implied rather than abrupt.
       */
 
      const fadeIn =
        THREE.MathUtils.smoothstep(
          data.progress,
          0,
          0.08
        );
 
      const fadeOut =
        1 -
        THREE.MathUtils.smoothstep(
          data.progress,
          0.9,
          1
        );
 
      const pulse =
        1 +
        Math.sin(
          elapsedTime * 0.9 +
          data.wobblePhase
        ) *
          0.05;
 
      vesicle.scale.setScalar(
        fadeIn *
          fadeOut *
          pulse
      );
 
      vesicle.rotation.y =
        elapsedTime *
          0.2 +
        data.wobblePhase;
    });
  }
 
 
  /* ========================================================
     Return API
 
     Same shape as createRoughER(): group, member collection,
     animate. cell.js can wire this up the same way.
     ======================================================== */
 
  return {
    group,
    vesicles,
    curve,
    animate,
  };
}