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
  const controlRef = useRef<FrameRequestCallback>(console.log);

  const videoRef = useRef<HTMLVideoElement>();

  const queue = useMemo(() => _<Command>().throttle(1000), []);

  const [pivotDeg, setPivotDeg] = useState<TiltDegrees>();

  const [capture, setCapture] = useState(false);

  const [model, setModel] = useState<any>(null);

  useEffect(() => {
    load({ maxFaces: 1 })
      .then((loadedModel: any) => {
        setModel(loadedModel);
        console.log('model loaded');
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });
  }, []);

  useEffect(() => {
    browser.runtime.onMessage.addListener((message, sender) => {
      console.log(message);

      if (!message || !message['command']) return;

      const { command, payload } = message;

      switch (command) {
        case 'setPivot':
          setPivotDeg(payload);
          break;
        case 'setCapture':
          setCapture(payload);
          break;
        default:
          break;
      }
    });
  }, []);

  useEffect(() => {
    queue.each(async (command) => {
      console.log(command);

      if (command === 'none' || !browser.tabs || !browser.windows) return;

      if (command === 'prev_tab' || command === 'next_tab') {
        const tabs = await browser.tabs.query({ currentWindow: true });

        if (tabs.length <= 1) return;

        const currentTabIndex = tabs.findIndex((tab) => tab.active);
        const currentTab = tabs[currentTabIndex];
        await browser.tabs.update(currentTab.id, {
          highlighted: false,
          active: false
        });

        const delta = command === 'prev_tab' ? -1 : 1;
        const nextTabIndex = (currentTabIndex + delta) % tabs.length;
        const nextTab = tabs[nextTabIndex];
        await browser.tabs.update(nextTab.id, {
          highlighted: true,
          active: true
        });
      } else {
        const window = await browser.windows.getCurrent();

        const height = window.height ?? 50;
        const scrollByY = command === 'scroll_up' ? -height : height;

        // const tab = await browser.tabs.getCurrent();
        // if (tabs.length === 0 || tabs[0].url?.startsWith('chrome')) return;

        const code = `window.scrollBy({ behavior: 'smooth', top: ${scrollByY} })`;
        await browser.tabs.executeScript({ code });
      }

      // window.scrollBy({ left: 0, top: scrollByY, behavior: 'smooth' });
    });
  }, [queue]);

  controlRef.current = async (): Promise<void> => {
    console.log(capture);
    console.log(!!model);
    console.log(pivotDeg);
    if (capture && model && pivotDeg) {
      const tilt = await predictTiltLandmarks(model, videoRef.current);

      console.log(tilt);

      if (tilt) {
        const { vertical: v, horizontal: h } = calculateTiltDegrees(tilt);

        const { vertical: vPivot, horizontal: hPivot } = pivotDeg;

        const vDiff = (v - vPivot) * (180 / Math.PI);
        const hDiff = (h - hPivot) * (180 / Math.PI);

        let command: Command = 'none';

        if (hDiff > 5) command = 'prev_tab';
        else if (hDiff < -5) command = 'next_tab';
        else if (vDiff < -5) command = 'scroll_up';
        else if (vDiff > 5) command = 'scroll_down';

        queue.write(command);
      }
    }

    requestAnimationFrame(controlRef.current);
  };

  useEffect(() => {
    setInterval(async () => {
      controlRef.current(0);
    }, 1000);

    // const timerId = requestAnimationFrame(controlRef.current);
    // console.log(controlRef.current);
    // console.log(timerId);
    // return (): void => {
    //   cancelAnimationFrame(timerId);
    //   console.log('animation ended');
    // };
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
