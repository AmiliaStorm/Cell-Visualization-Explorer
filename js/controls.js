import { OrbitControls } from
  "three/addons/controls/OrbitControls.js";

export function createControls(camera, canvas) {
  const controls =
    new OrbitControls(camera, canvas);

  controls.enableDamping = true;
  controls.dampingFactor = 0.06;

  controls.enablePan = false;

  /*
   * Allow zooming very close.
   */
  controls.minDistance = 1;

  /*
   * Practically unlimited zoom out.
   */
  controls.maxDistance = 1000;

  controls.zoomSpeed = 1.5;
  controls.rotateSpeed = 0.6;

  controls.update();

  return controls;
}