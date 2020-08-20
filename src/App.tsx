import '@tensorflow/tfjs-backend-webgl';
import React, { ReactElement, useEffect, useRef, useState } from 'react';
import './App.css';

const facemesh = require('@tensorflow-models/facemesh');

type Tilt = {
  top: number[];
  bottom: number[];
  left: number[];
  right: number[];
};

const predict = async (
  model: any,
  video?: HTMLVideoElement
): Promise<Tilt | undefined> => {
  if (!model) return undefined;

  const predictions = await model?.estimateFaces(video);

  if (predictions.length > 0) {
    const prediction = predictions[0];

    const annotations = prediction.annotations;

    const top = annotations['midwayBetweenEyes'][0];
    const right = annotations['rightCheek'][0];
    const left = annotations['leftCheek'][0];

    const bottomX = (right[0] + left[0]) / 2;
    const bottomY = (right[1] + left[1]) / 2;
    const bottomZ = (right[2] + left[2]) / 2;

    const bottom = [bottomX, bottomY, bottomZ];

    return { left, right, top, bottom };
  }

  return undefined;
};

const calculate = (tilt: Tilt): number => {
  const { top, bottom } = tilt;

  const deg =
    Math.atan((Math.abs(top[2]) + Math.abs(bottom[2])) / (bottom[1] - top[1])) *
    (top[2] > bottom[2] ? -1 : 1);

  return deg;
};

function App(): ReactElement {
  const videoRef = useRef<HTMLVideoElement>();

  const control = useRef<FrameRequestCallback>(() => console.log());

  const [model, setModel] = useState<any>(null);

  const [pivot, setPivot] = useState<Tilt>();

  const [pivotDeg, setPivotDeg] = useState(0);

  const [capture, setCapture] = useState(false);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(console.log);
  }, []);

  useEffect(() => {
    facemesh
      .load({ maxFaces: 1 })
      .then((loadedModel: any) => setModel(loadedModel))
      .catch(console.log);
  }, []);

  control.current = async () => {
    if (capture && model && pivot) {
      const tilt = await predict(model, videoRef.current);

      if (tilt) {
        const deg = calculate(tilt);

        const diff = (deg - pivotDeg) * (180 / Math.PI);

        console.dir(diff);

        if (diff < -5) {
          window.scrollBy({ behavior: 'smooth', top: -100 });
        } else if (diff > 5) {
          window.scrollBy({ behavior: 'smooth', top: 100 });
        }
      }
    }

    requestAnimationFrame(control.current);
  };

  useEffect(() => {
    const timerId = requestAnimationFrame(control.current);
    return () => cancelAnimationFrame(timerId);
  }, []);

  return (
    <div className="App" style={{ height: 20000 }}>
      <header className="App-header">
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <video
          ref={videoRef as any}
          style={{ transform: 'rotateY(180deg)' }}
          autoPlay
        ></video>

        <button
          onClick={async () => {
            const tilt = await predict(model, videoRef.current);
            if (!tilt) return;
            setPivot(tilt);
            setPivotDeg(calculate(tilt));
          }}
        >
          Calibrate
        </button>

        <button onClick={() => setCapture(!capture)}>
          {capture ? 'OFF' : 'ON'}
        </button>

        <button
          onClick={() => {
            if (chrome.tabs) {
              chrome.tabs.query(
                { currentWindow: true, active: true, highlighted: true },
                (tabs) => {
                  if (tabs.length === 0 && !tabs[0].url?.startsWith('chrome')) {
                    chrome.tabs.executeScript(
                      { code: "window.scrollBy({behavior:'smooth',top:100})" },
                      (result) => console.log(result)
                    );
                  }
                }
              );
            }
          }}
        >
          DOWN
        </button>

        <button
          onClick={() => {
            if (chrome.tabs) {
              chrome.tabs.query({ currentWindow: true }, (tabs) => {
                if (tabs.length <= 1) return;

                const tabIndex = tabs.findIndex((tab) => tab.active);

                chrome.tabs.update(
                  tabs[tabIndex]?.id as number,
                  { highlighted: false, active: false, selected: false },
                  (tab) => console.log(tab)
                );

                const tabIndexToSelect = (tabIndex + 1) % tabs.length;

                const tabToSelect = tabs[tabIndexToSelect];

                chrome.tabs.update(
                  tabToSelect?.id as number,
                  { highlighted: true, active: true, selected: true },
                  (tab) => console.log(tab)
                );
              });
            }
          }}
        >
          NEXT
        </button>
      </header>
    </div>
  );
}

export default App;
