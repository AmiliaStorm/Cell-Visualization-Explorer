import * as THREE from "three";

import { OrbitControls } from
  "three/addons/controls/OrbitControls.js";

const container = document.querySelector("#cell-canvas");

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);

camera.position.set(0, 0, 9);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
  container.clientWidth,
  container.clientHeight
);

renderer.outputColorSpace = THREE.SRGBColorSpace;

container.appendChild(renderer.domElement);

/* Controls */

const controls = new OrbitControls(
  camera,
  renderer.domElement
);

controls.enableDamping = true;
controls.enablePan = false;

controls.minDistance = 5;
controls.maxDistance = 13;

/* Cell group */

const cellGroup = new THREE.Group();

scene.add(cellGroup);

/* Cell membrane */

const membraneGeometry =
  new THREE.SphereGeometry(2.65, 96, 96);

const membraneMaterial =
  new THREE.MeshPhysicalMaterial({
    color: 0x64b5d8,
    transparent: true,
    opacity: 0.19,
    roughness: 0.18,
    metalness: 0,
    transmission: 0.2,
    thickness: 0.7,
    clearcoat: 0.8,
    side: THREE.DoubleSide,
  });

const membrane = new THREE.Mesh(
  membraneGeometry,
  membraneMaterial
);

membrane.scale.set(1.12, 0.94, 1);

cellGroup.add(membrane);

/* Cytoplasm */

const cytoplasmGeometry =
  new THREE.SphereGeometry(2.52, 64, 64);

const cytoplasmMaterial =
  new THREE.MeshPhysicalMaterial({
    color: 0x176b8c,
    transparent: true,
    opacity: 0.08,
    roughness: 0.4,
  });

const cytoplasm = new THREE.Mesh(
  cytoplasmGeometry,
  cytoplasmMaterial
);

cytoplasm.scale.copy(membrane.scale);

cellGroup.add(cytoplasm);

/* Nucleus */

const nucleusGeometry =
  new THREE.SphereGeometry(0.95, 64, 64);

const nucleusMaterial =
  new THREE.MeshPhysicalMaterial({
    color: 0x9869d9,
    roughness: 0.3,
    transparent: true,
    opacity: 0.9,
    clearcoat: 0.4,
  });

const nucleus = new THREE.Mesh(
  nucleusGeometry,
  nucleusMaterial
);

nucleus.position.set(-0.25, 0.05, 0);

cellGroup.add(nucleus);

/* Nucleolus */

const nucleolusGeometry =
  new THREE.SphereGeometry(0.28, 40, 40);

const nucleolusMaterial =
  new THREE.MeshStandardMaterial({
    color: 0xd99fc7,
    roughness: 0.45,
  });

const nucleolus = new THREE.Mesh(
  nucleolusGeometry,
  nucleolusMaterial
);

nucleolus.position.set(-0.12, 0.14, 0.72);

nucleus.add(nucleolus);

/* Mitochondria */

function createMitochondrion(position, rotation) {
  const geometry =
    new THREE.CapsuleGeometry(0.27, 0.72, 8, 24);

  const material =
    new THREE.MeshStandardMaterial({
      color: 0xee8b62,
      roughness: 0.38,
      metalness: 0.03,
    });

  const mitochondrion = new THREE.Mesh(
    geometry,
    material
  );

  mitochondrion.position.copy(position);
  mitochondrion.rotation.copy(rotation);

  mitochondrion.userData.type = "mitochondrion";

  cellGroup.add(mitochondrion);

  return mitochondrion;
}

createMitochondrion(
  new THREE.Vector3(1.25, 0.65, 0.5),
  new THREE.Euler(0.35, 0.1, 1.05)
);

createMitochondrion(
  new THREE.Vector3(1.2, -0.9, -0.3),
  new THREE.Euler(-0.4, 0.5, 0.6)
);

createMitochondrion(
  new THREE.Vector3(-1.2, -1, 0.75),
  new THREE.Euler(0.8, -0.2, -0.8)
);

/* Small ribosome particles */

const ribosomeGeometry =
  new THREE.SphereGeometry(0.055, 12, 12);

const ribosomeMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x70e2df,
    roughness: 0.4,
  });

for (let index = 0; index < 65; index += 1) {
  const ribosome = new THREE.Mesh(
    ribosomeGeometry,
    ribosomeMaterial
  );

  const radius = 1.4 + Math.random() * 0.8;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  ribosome.position.set(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi)
  );

  cellGroup.add(ribosome);
}

/* Lighting */

const ambientLight =
  new THREE.AmbientLight(0xb7d9ff, 1.4);

scene.add(ambientLight);

const keyLight =
  new THREE.DirectionalLight(0xffffff, 2.5);

keyLight.position.set(4, 5, 7);

scene.add(keyLight);

const blueLight =
  new THREE.PointLight(0x3e8cff, 18, 15);

blueLight.position.set(-4, 1, 4);

scene.add(blueLight);

const cyanLight =
  new THREE.PointLight(0x62f3ed, 12, 12);

cyanLight.position.set(4, -3, 2);

scene.add(cyanLight);

/* UI information */

const organelleData = {
  cell: {
    name: "Whole cell",
    description:
      "A simplified three-dimensional model of a eukaryotic cell. Select an organelle to learn more.",
    role: "Cellular organization",
    location: "Entire cell",
  },

  nucleus: {
    name: "Nucleus",
    description:
      "The nucleus stores the cell's genetic material and regulates gene expression, DNA replication and many aspects of cell activity.",
    role: "Genome storage and regulation",
    location: "Usually near the cell centre",
  },

  mitochondrion: {
    name: "Mitochondrion",
    description:
      "Mitochondria convert energy from nutrients into ATP through cellular respiration.",
    role: "ATP production",
    location: "Cytoplasm",
  },
};

const nameElement =
  document.querySelector("#organelle-name");

const descriptionElement =
  document.querySelector("#organelle-description");

const roleElement =
  document.querySelector("#organelle-role");

const locationElement =
  document.querySelector("#organelle-location");

const buttons =
  document.querySelectorAll(".organelle-button");

function updateInfo(organelleKey) {
  const data = organelleData[organelleKey];

  if (!data) {
    return;
  }

  nameElement.textContent = data.name;
  descriptionElement.textContent = data.description;
  roleElement.textContent = data.role;
  locationElement.textContent = data.location;

  buttons.forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.organelle === organelleKey
    );
  });
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const organelle = button.dataset.organelle;

    updateInfo(organelle);

    if (organelle === "nucleus") {
      controls.target.copy(nucleus.position);
      camera.position.set(0, 0, 5.2);
    } else if (organelle === "mitochondrion") {
      controls.target.set(1.1, 0.1, 0);
      camera.position.set(1.5, 0.5, 5.5);
    } else {
      controls.target.set(0, 0, 0);
      camera.position.set(0, 0, 9);
    }

    controls.update();
  });
});

/* Animation */

const clock = new THREE.Clock();

function animate() {
  const elapsedTime = clock.getElapsedTime();

  cellGroup.rotation.y += 0.0014;

  nucleus.scale.setScalar(
    1 + Math.sin(elapsedTime * 1.3) * 0.012
  );

  membrane.scale.set(
    1.12 + Math.sin(elapsedTime * 0.8) * 0.008,
    0.94 + Math.cos(elapsedTime * 0.8) * 0.006,
    1
  );

  controls.update();

  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

/* ==================================================
   Clickable organelles
   ================================================== */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const clickableObjects = [
  nucleus,
  ...cellGroup.children.filter(
    (object) => object.userData.type === "mitochondrion"
  ),
];

nucleus.userData.type = "nucleus";

function selectOrganelle(organelleKey) {
  updateInfo(organelleKey);

  if (organelleKey === "nucleus") {
    controls.target.copy(nucleus.position);
    camera.position.set(0, 0, 5.2);
  } else if (organelleKey === "mitochondrion") {
    controls.target.set(1.1, 0.1, 0);
    camera.position.set(1.5, 0.5, 5.5);
  } else {
    controls.target.set(0, 0, 0);
    camera.position.set(0, 0, 9);
  }

  controls.update();
}

renderer.domElement.addEventListener("click", (event) => {
  const rectangle =
    renderer.domElement.getBoundingClientRect();

  pointer.x =
    ((event.clientX - rectangle.left) /
      rectangle.width) *
      2 -
    1;

  pointer.y =
    -(
      (event.clientY - rectangle.top) /
      rectangle.height
    ) *
      2 +
    1;

  raycaster.setFromCamera(pointer, camera);

  const intersections =
    raycaster.intersectObjects(
      clickableObjects,
      true
    );

  if (intersections.length === 0) {
    return;
  }

  const selectedObject = intersections[0].object;
  const organelleType =
    selectedObject.userData.type ||
    selectedObject.parent?.userData.type;

  if (organelleType) {
    selectOrganelle(organelleType);
  }
});

animate();


/* Resize */

window.addEventListener("resize", () => {
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
});
