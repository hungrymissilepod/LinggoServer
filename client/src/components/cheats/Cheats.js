import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

const Cheats = () => {
  const [code, setCode] = useState({
    appName: '',
    appCode: ''
  });

  useEffect(async () => {
    const data = await (await fetch('/api/cheats')).json();
    setCode(data);
  }, [])

  return (
      <div className='dark-overlay'>
        <div className='landing-inner'>
          {code && <div>{code.appName} - {code.appCode}</div>}
        </div>
      </div>
  );
};

export default connect()(Cheats);