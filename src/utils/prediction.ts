import { TiltLandmarks } from '../types';

export const predictTiltLandmarks = async (
  model: any,
  video?: HTMLVideoElement
): Promise<TiltLandmarks | undefined> => {
  if (!model) return undefined;

  const predictions = await model?.estimateFaces(video);

  if (predictions.length > 0) {
    const prediction = predictions[0];

    const annotations = prediction.annotations;

    const [topX, topY, topZ] = annotations['midwayBetweenEyes'][0];
    const top = { x: topX, y: topY, z: topZ };

    const [rightX, rightY, rightZ] = annotations['rightCheek'][0];
    const right = { x: rightX, y: rightY, z: rightZ };

    const [leftX, leftY, leftZ] = annotations['leftCheek'][0];
    const left = { x: leftX, y: leftY, z: leftZ };

    const bottomX = (rightX + leftX) / 2;
    const bottomY = (rightY + leftY) / 2;
    const bottomZ = (rightZ + leftZ) / 2;
    const bottom = { x: bottomX, y: bottomY, z: bottomZ };

    return { top, bottom, left, right };
  }

  return undefined;
};
