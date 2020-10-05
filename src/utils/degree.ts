import { TiltDegrees, TiltLandmarks } from '../types';

export const calculateTiltDegrees = (tilt: TiltLandmarks): TiltDegrees => {
  const { top, bottom, left, right } = tilt;

  const vertical =
    Math.atan(Math.abs(top.y - bottom.y) / (top.z - bottom.z)) *
    (top.z >= bottom.z ? 1 : -1);

  // const horizontal =
  //   Math.atan((Math.abs(left.z) + Math.abs(right.z)) / (right.x - left.x)) *
  //   (left.z > right.z ? -1 : 1);

  return { vertical, horizontal: 0 };
};
