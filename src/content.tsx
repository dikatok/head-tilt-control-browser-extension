import { load } from '@tensorflow-models/facemesh';
import _ from 'highland';
import React, {
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import ReactDOM from 'react-dom';
import { browser } from 'webextension-polyfill-ts';
import { TiltDegrees } from './types';
import { calculateTiltDegrees, predictTiltLandmarks } from './utils';

require('@tensorflow/tfjs-backend-webgl');

type Command = 'none' | 'scroll_up' | 'scroll_down' | 'next_tab' | 'prev_tab';

function App(): ReactElement {
  const controlRef = useRef((_: any) => {
    const a = 1;
  });

  const videoRef = useRef<HTMLVideoElement>();

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

  controlRef.current = async (image: any): Promise<void> => {
    if (model) {
      try {
        const tilt = await predictTiltLandmarks(model, videoRef.current);

        if (tilt) {
          const { vertical } = calculateTiltDegrees(tilt);
          console.dir(vertical);
          let command: Command = 'none';
          if (vertical > 1.5) command = 'scroll_up';
          else if (vertical < 1) command = 'scroll_down';
          await browser.runtime.sendMessage({ command });
        }
      } catch {}
    }

    requestAnimationFrame(controlRef.current);
  };

  useEffect(() => {
    const timerId = requestAnimationFrame(controlRef.current);
    return (): void => {
      cancelAnimationFrame(timerId);
      console.log('animation ended');
    };
  }, []);

  return (
    <div className="App" style={{ height: 20000 }}>
      <header className="App-header">
        <video
          ref={videoRef as any}
          style={{ transform: 'rotateY(180deg)' }}
          autoPlay
        ></video>
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
