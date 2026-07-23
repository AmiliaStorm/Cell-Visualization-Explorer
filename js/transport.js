import * as THREE from "three";
import { createScene } from "./scene.js";
import { createControls } from "./controls.js";
import { addLighting } from "./lighting.js";
import { buildCell } from "./cell/cell.js";

const container = document.querySelector("#cell-canvas");
if (!container) throw new Error('Could not find "#cell-canvas".');

const { scene, camera, renderer } = createScene(container);
const controls = createControls(camera, renderer.domElement);
addLighting(scene);
const cell = buildCell(scene);

const clock = new THREE.Clock();

function animate() {
  const elapsedTime = clock.getElapsedTime();
  cell.group.rotation.y += 0.0008;
  cell.animate(elapsedTime);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});
