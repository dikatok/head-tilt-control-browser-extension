import React, { ReactElement, useEffect } from 'react';
import ReactDOM from 'react-dom';

function App(): ReactElement {
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true });
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
