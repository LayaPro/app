
import './App.css'
import { useEffect, useState } from 'react';
import axios from 'axios';


function App() {
  const [apiResult, setApiResult] = useState<string>('');

  useEffect(() => {
    const apiUrl = `${import.meta.env.VITE_API_URL}/test`;
    axios.get(apiUrl)
      .then(res => {
        setApiResult(JSON.stringify(res.data));
      })
      .catch(err => {
        setApiResult('Error: ' + err.message);
      });
  }, []);

  return (
    <>
      <div>
        This is a placeholder for Admin App..<br />
        Keep looking here for updates!<br />
        - LAYA Productions
        <hr />
        <strong>API /test result:</strong>
        <pre>{apiResult}</pre>
      </div>
    </>
  );
}

export default App
