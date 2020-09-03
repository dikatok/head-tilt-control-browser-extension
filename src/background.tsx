import { load } from '@tensorflow-models/facemesh';
// import '@tensorflow/tfjs-backend-webgl';
import React, { ReactElement, useEffect } from 'react';
import ReactDOM from 'react-dom';

function App(): ReactElement {
  useEffect(() => {
    load({ maxFaces: 1 })
      .then((loadedModel: any) => {
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
