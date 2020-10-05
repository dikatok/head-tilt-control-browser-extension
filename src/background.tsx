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
import { calculateTiltDegrees, predictTiltLandmarks } from './utils';

require('@tensorflow/tfjs-backend-webgl');

type Command = 'none' | 'scroll_up' | 'scroll_down' | 'next_tab' | 'prev_tab';

function App(): ReactElement {
  window.open('content.html', '', 'height=200,width=200');

  const queue = useMemo(() => _<Command>().throttle(200), []);

  useEffect(() => {
    browser.runtime.onMessage.addListener((message, sender) => {
      // console.log(message);

      if (!message || !message['command']) return;

      const { command } = message;

      queue.write(command);
    });
  }, []);

  useEffect(() => {
    queue.each(async (command) => {
      if (command === 'none' || !browser.tabs || !browser.windows) return;

      if (command === 'prev_tab' || command === 'next_tab') {
        const tabs = await browser.tabs.query({ currentWindow: true });

        if (tabs.length <= 1) return;

        const currentTabIndex = tabs.findIndex((tab) => tab.active);
        const currentTab = tabs[currentTabIndex];
        if (currentTab.url?.startsWith('chrome')) return;
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
        const tabs = await browser.tabs.query({
          currentWindow: true,
          active: true
        });

        if (tabs.some((tab) => tab.url?.startsWith('chrome'))) return;

        const window = await browser.windows.getCurrent();
        const height = window.height ?? 50;
        const scrollByY = command === 'scroll_up' ? -height : height;
        console.log(scrollByY);
        const code = `window.scrollBy({ behavior: 'smooth', top: ${scrollByY} })`;
        await browser.tabs.executeScript({ code });
      }

      // window.scrollBy({ left: 0, top: scrollByY, behavior: 'smooth' });
    });
  }, [queue]);

  return (
    <div className="App" style={{ height: 20000 }}>
      <header className="App-header"></header>
    </div>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
