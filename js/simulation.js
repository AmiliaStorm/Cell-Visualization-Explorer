import { OrbitControls } from
  "three/addons/controls/OrbitControls.js";

export function createControls(camera, canvas) {
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 5;
  controls.maxDistance = 13;
  return controls;
}
