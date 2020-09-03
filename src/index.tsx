import { load } from '@tensorflow-models/facemesh';
import React, {
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import ReactDOM from 'react-dom';
import { browser } from 'webextension-polyfill-ts';
import { calculateTiltDegrees, predictTiltLandmarks } from './utils';

require('@tensorflow/tfjs-backend-webgl');

type Command = 'none' | 'scroll_up' | 'scroll_down' | 'next_tab' | 'prev_tab';

//TODO advise user to allow webcam access in options page
function App(): ReactElement {
  const console = useMemo(
    () => browser.extension.getBackgroundPage().window.console,
    []
  );

  const videoRef = useRef<HTMLVideoElement>();

  const [capture, setCapture] = useState(false);

  const [model, setModel] = useState<any>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });
  }, []);

  useEffect(() => {
    load({ maxFaces: 1 })
      .then((loadedModel: any) => {
        setModel(loadedModel);
        console.log('model loaded');
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
          onClick={async (): Promise<void> => {
            const tilt = await predictTiltLandmarks(model, videoRef.current);

            if (!tilt) return;

            const degrees = calculateTiltDegrees(tilt);

            browser.runtime.sendMessage({
              command: 'setPivot',
              payload: degrees
            });
          }}
        >
          Calibrate
        </button>

        <button
          onClick={async (): Promise<void> => {
            const newValue = !capture;
            setCapture(newValue);
            browser.runtime.sendMessage({
              command: 'setCapture',
              payload: newValue
            });
          }}
        >
          {capture ? 'OFF' : 'ON'}
        </button>
      </header>
    </div>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
