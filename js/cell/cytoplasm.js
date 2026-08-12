import * as THREE from "three";

/* ==========================================================
   Organic deformation

   Uses the same general visual language as the membrane,
   but slightly softer so the cytoplasm sits naturally
   inside the cell boundary.
   ========================================================== */

function deformGeometry(
  geometry
) {
  const position =
    geometry.attributes.position;

  const vertex =
    new THREE.Vector3();

  const direction =
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

    direction
      .copy(vertex)
      .normalize();

    const waveOne =
      Math.sin(
        direction.x * 3.1 +
        direction.y * 2.0 -
        direction.z * 1.5
      ) * 0.055;

    const waveTwo =
      Math.sin(
        direction.z * 4.2 -
        direction.x * 2.6 +
        direction.y * 0.8
      ) * 0.032;

    const waveThree =
      Math.cos(
        direction.y * 5.4 +
        direction.z * 2.8
      ) * 0.018;

    const deformation =
      waveOne +
      waveTwo +
      waveThree;

    vertex.addScaledVector(
      direction,
      deformation
    );

    position.setXYZ(
      index,
      vertex.x,
      vertex.y,
      vertex.z
    );
  }

  position.needsUpdate = true;

  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
}


/* ==========================================================
   Cytoplasm
   ========================================================== */

export function createCytoplasm() {

  /* ========================================================
     Main aqueous volume
     ======================================================== */

  const geometry =
    new THREE.SphereGeometry(
      2.91,
      80,
      72
    );

  deformGeometry(
    geometry
  );


  const material =
    new THREE.MeshPhysicalMaterial({
      color: 0x0a3651,

      transparent: true,
      opacity: 0.055,

      roughness: 0.82,
      metalness: 0,

      transmission: 0,

      clearcoat: 0.08,
      clearcoatRoughness: 0.8,

      emissive:
        new THREE.Color(
          0x031b2a
        ),

      emissiveIntensity: 0.18,

      side:
        THREE.BackSide,

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


  /* ========================================================
     Match new membrane silhouette

     Slightly smaller than the cell membrane.
     ======================================================== */

  cytoplasm.scale.set(
    1.20,
    0.80,
    0.92
  );

  cytoplasm.rotation.z =
    -0.018;

  cytoplasm.renderOrder = 0;


  /* ========================================================
     Middle haze layer

     Gives depth between the membrane and organelles.
     ======================================================== */

  const middleGeometry =
    new THREE.SphereGeometry(
      2.60,
      56,
      56
    );

  const middleMaterial =
    new THREE.MeshBasicMaterial({
      color: 0x0c4160,

      transparent: true,
      opacity: 0.026,

      side:
        THREE.BackSide,

      depthWrite: false,
      depthTest: true,
    });


  const middleHaze =
    new THREE.Mesh(
      middleGeometry,
      middleMaterial
    );


  middleHaze.scale.set(
    1.19,
    0.79,
    0.91
  );

  middleHaze.rotation.z =
    -0.018;

  middleHaze.renderOrder = 0;


  cytoplasm.add(
    middleHaze
  );


  /* ========================================================
     Deep internal haze

     A second extremely faint layer adds the soft blue
     depth visible in the target design without covering
     the organelles.
     ======================================================== */

  const innerGeometry =
    new THREE.SphereGeometry(
      2.18,
      48,
      48
    );


  const innerMaterial =
    new THREE.MeshBasicMaterial({
      color: 0x10506f,

      transparent: true,
      opacity: 0.018,

      side:
        THREE.BackSide,

      depthWrite: false,
      depthTest: true,
    });


  const innerHaze =
    new THREE.Mesh(
      innerGeometry,
      innerMaterial
    );


  innerHaze.scale.set(
    1.17,
    0.78,
    0.89
  );

  innerHaze.rotation.z =
    -0.018;

  innerHaze.renderOrder = 0;


  cytoplasm.add(
    innerHaze
  );


  /* ========================================================
     Soft central depth cloud

     Very subtle. This prevents the interior from looking
     like empty black space.
     ======================================================== */

  const depthGeometry =
    new THREE.SphereGeometry(
      1.68,
      40,
      40
    );


  const depthMaterial =
    new THREE.MeshBasicMaterial({
      color: 0x0d4565,

      transparent: true,
      opacity: 0.014,

      side:
        THREE.BackSide,

      depthWrite: false,
      depthTest: true,
    });


  const depthCloud =
    new THREE.Mesh(
      depthGeometry,
      depthMaterial
    );


  depthCloud.scale.set(
    1.15,
    0.76,
    0.86
  );


  depthCloud.position.set(
    0.20,
    0.04,
    -0.16
  );


  depthCloud.renderOrder = 0;


  cytoplasm.add(
    depthCloud
  );


  /* ========================================================
     Metadata
     ======================================================== */

  cytoplasm.userData.type =
    "cytoplasm";

  cytoplasm.userData.organelleId =
    "cytoplasm";

  cytoplasm.userData.organelleName =
    "Cytoplasm";

  cytoplasm.userData.description =
    "The cytoplasm is the aqueous interior where organelles and many cellular reactions are located.";

  cytoplasm.userData.middleHaze =
    middleHaze;

  cytoplasm.userData.innerHaze =
    innerHaze;

  cytoplasm.userData.depthCloud =
    depthCloud;


  return cytoplasm;
}