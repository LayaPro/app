
import './App.css'
import { useEffect, useState } from 'react';
import axios from 'axios';
import type { Role } from 'laya-shared';

function App() {
  const [apiResult, setApiResult] = useState<string>('');
  const exampleRole: Role = {name: 'admin', roleId: '123e4567-e89b-12d3-a456-426614174000', description: 'Administrator role'};

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
