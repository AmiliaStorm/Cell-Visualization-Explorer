import * as THREE from "three";

export function createOrganelleInteraction({
  camera,
  renderer,
  cell,
  onSelect,
}) {
  const raycaster =
    new THREE.Raycaster();

  const pointer =
    new THREE.Vector2();

  let selectedObject = null;

  const originalEmissive =
    new Map();

  function getSelectableRoot(
    object
  ) {
    let current = object;

    while (
      current &&
      current !== cell.group
    ) {
      if (
        current.userData
          ?.organelleId
      ) {
        return current;
      }

      current = current.parent;
    }

    return null;
  }

  function restoreMaterial(
    object
  ) {
    object.traverse(
      (child) => {
        if (
          !child.isMesh ||
          !child.material
        ) {
          return;
        }

        const materials =
          Array.isArray(
            child.material
          )
            ? child.material
            : [child.material];

        materials.forEach(
          (material) => {
            const saved =
              originalEmissive.get(
                material
              );

            if (
              saved &&
              material.emissive
            ) {
              material.emissive.copy(
                saved.color
              );

              material.emissiveIntensity =
                saved.intensity;
            }
          }
        );
      }
    );
  }

  function highlight(
    object
  ) {
    object.traverse(
      (child) => {
        if (
          !child.isMesh ||
          !child.material
        ) {
          return;
        }

        const materials =
          Array.isArray(
            child.material
          )
            ? child.material
            : [child.material];

        materials.forEach(
          (material) => {
            if (!material.emissive) {
              return;
            }

            if (
              !originalEmissive.has(
                material
              )
            ) {
              originalEmissive.set(
                material,
                {
                  color:
                    material.emissive
                      .clone(),

                  intensity:
                    material
                      .emissiveIntensity ??
                    1,
                }
              );
            }

            material.emissive.set(
              0x35d8ff
            );

            material.emissiveIntensity =
              2.2;
          }
        );
      }
    );
  }

  function clearSelection() {
    if (selectedObject) {
      restoreMaterial(
        selectedObject
      );
    }

    selectedObject = null;

    onSelect?.(null);
  }

  function select(
    object
  ) {
    if (
      selectedObject === object
    ) {
      return;
    }

    if (selectedObject) {
      restoreMaterial(
        selectedObject
      );
    }

    selectedObject = object;

    highlight(
      selectedObject
    );

    onSelect?.({
      id:
        selectedObject.userData
          .organelleId,

      name:
        selectedObject.userData
          .organelleName,

      description:
        selectedObject.userData
          .description,

      object:
        selectedObject,
    });
  }

  function handlePointerDown(
    event
  ) {
    const bounds =
      renderer.domElement
        .getBoundingClientRect();

    pointer.x =
      ((event.clientX -
        bounds.left) /
        bounds.width) *
        2 -
      1;

    pointer.y =
      -(
        (event.clientY -
          bounds.top) /
        bounds.height
      ) *
        2 +
      1;

    raycaster.setFromCamera(
      pointer,
      camera
    );

    const intersections =
      raycaster.intersectObject(
        cell.group,
        true
      );

    for (
      const intersection
      of intersections
    ) {
      const organelle =
        getSelectableRoot(
          intersection.object
        );

      if (organelle) {
        select(organelle);
        return;
      }
    }

    clearSelection();
  }

  renderer.domElement
    .addEventListener(
      "pointerdown",
      handlePointerDown
    );

  function dispose() {
    renderer.domElement
      .removeEventListener(
        "pointerdown",
        handlePointerDown
      );

    clearSelection();
  }

  return {
    select,
    clearSelection,
    dispose,

    get selected() {
      return selectedObject;
    },
  };
}