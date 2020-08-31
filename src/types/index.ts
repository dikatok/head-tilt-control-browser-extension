export type Coordinate = {
  x: number;
  y: number;
  z: number;
};

export type TiltLandmarks = {
  top: Coordinate;
  bottom: Coordinate;
  left: Coordinate;
  right: Coordinate;
};

export type TiltDegrees = {
  vertical: number;
  horizontal: number;
};
