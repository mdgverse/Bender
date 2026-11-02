import * as THREE from 'three';

/** Keep the apparent size at the orbit target when switching projection. */
export function switchProjection(current, target, aspect) {
  const direction=current.position.clone().sub(target);
  const distance=Math.max(direction.length(),.001);
  direction.normalize();
  let next;
  if(current.isPerspectiveCamera) {
    const height=2*distance*Math.tan(THREE.MathUtils.degToRad(current.fov/2))/current.zoom;
    next=new THREE.OrthographicCamera(-height*aspect/2,height*aspect/2,height/2,-height/2,.01,100000);
    next.userData.viewHeight=height;
    next.position.copy(current.position);
  } else {
    const height=(current.top-current.bottom)/current.zoom;
    next=new THREE.PerspectiveCamera(40,aspect,.01,100000);
    const newDistance=height/(2*Math.tan(THREE.MathUtils.degToRad(next.fov/2)));
    next.position.copy(target).addScaledVector(direction,newDistance);
  }
  next.up.copy(current.up);next.quaternion.copy(current.quaternion);next.updateProjectionMatrix();next.updateMatrixWorld();return next;
}

export function resizeCamera(camera, aspect) {
  if(camera.isPerspectiveCamera)camera.aspect=aspect;
  else {const height=camera.userData.viewHeight;camera.top=height/2;camera.bottom=-height/2;camera.left=-height*aspect/2;camera.right=height*aspect/2;}
  camera.updateProjectionMatrix();
}
