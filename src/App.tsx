import '@tensorflow/tfjs-backend-webgl';
import _ from 'highland';
import React, {
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import './App.css';
import { TiltDegrees } from './types';
import { calculateTiltDegrees, predictTiltLandmarks } from './utils';

type Command = 'none' | 'scroll_up' | 'scroll_down' | 'next_tab' | 'prev_tab';

const facemesh = require('@tensorflow-models/facemesh');

function App(): ReactElement {
  const [error, setError] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>();

  const controlRef = useRef<FrameRequestCallback>(console.log);

  const queue = useMemo(() => _<Command>().throttle(1000), []);

  const [model, setModel] = useState<any>(null);

  const [pivotDeg, setPivotDeg] = useState<TiltDegrees>();

  const [capture, setCapture] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });
  }, []);

  useEffect(() => {
    queue.each((command) => {
      if (command === 'none' || !chrome.tabs || !chrome.windows) return;

      if (command === 'prev_tab' || command === 'next_tab') {
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
          if (tabs.length <= 1) return;

          const currentTab = tabs.findIndex((tab) => tab.active);
          chrome.tabs.update(
            tabs[currentTab]?.id as number,
            { highlighted: false, active: false, selected: false },
            console.log
          );

          const movement = command === 'prev_tab' ? -1 : 1;
          const nextTabIndex = (currentTab + movement) % tabs.length;
          const nextTab = tabs[nextTabIndex];
          chrome.tabs.update(
            nextTab?.id as number,
            { highlighted: true, active: true, selected: true },
            console.log
          );
        });

        return;
      }

      chrome.windows.getCurrent((window) => {
        const height = window.height ?? 50;
        const scrollByY = command === 'scroll_up' ? -height : height;
        chrome.tabs.query(
          { currentWindow: true, active: true, highlighted: true },
          (tabs) => {
            if (tabs.length === 0 || tabs[0].url?.startsWith('chrome')) return;

            const code = `window.scrollBy({ behavior: 'smooth', top: ${scrollByY} })`;
            chrome.tabs.executeScript({ code: code }, console.error);
          }
        );
      });

      // window.scrollBy({ left: 0, top: scrollByY, behavior: 'smooth' });
    });
  }, [queue]);

  controlRef.current = async () => {
    if (capture && model && pivotDeg) {
      const tilt = await predictTiltLandmarks(model, videoRef.current);

      if (tilt) {
        const { vertical: v, horizontal: h } = calculateTiltDegrees(tilt);

        const { vertical: vPivot, horizontal: hPivot } = pivotDeg;

        const vDiff = (v - vPivot) * (180 / Math.PI);
        const hDiff = (h - hPivot) * (180 / Math.PI);

        let command: Command = 'none';

        if (hDiff > 5) command = 'next_tab';
        else if (hDiff < -5) command = 'prev_tab';
        else if (vDiff < -5) command = 'scroll_up';
        else if (vDiff > 5) command = 'scroll_down';

        queue.write(command);
      }
    }

    requestAnimationFrame(controlRef.current);
  };

  useEffect(() => {
    const timerId = requestAnimationFrame(controlRef.current);
    return () => cancelAnimationFrame(timerId);
  }, []);

  useEffect(() => {
    facemesh
      .load({ maxFaces: 1 })
      .then((loadedModel: any) => {
        setModel(loadedModel);
        setError('loadded');
      })
      .catch(console.error);
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
            const tilt = await predictTiltLandmarks(model, videoRef.current);

            if (!tilt) return;

            setPivotDeg(calculateTiltDegrees(tilt));
          }}
        >
          Calibrate
        </button>

        <button onClick={() => setCapture(!capture)}>
          {capture ? 'OFF' : 'ON'}
        </button>

        <div>{error as string}</div>
      </header>
    </div>
  );
}

export default App;
