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
   * Keep the cell from shrinking into the void.
   */
  controls.maxDistance = 16;

  controls.zoomSpeed = 1.5;
  controls.rotateSpeed = 0.6;

  /*
   * Orbit around the nucleus-weighted focal point,
   * matching the camera's initial lookAt in scene.js.
   */
  controls.target.set(-0.3, 0, 0);

  controls.update();

  return controls;
}