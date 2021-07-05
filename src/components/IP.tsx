import React, {useEffect, useState} from 'react';
import axios from 'axios';

const IP = (): JSX.Element => {
  const [_IP, setIP] = useState("127.0.0.1");

  useEffect(() => {
    const getIP = async () => {
      try {
        const response = await axios.get("https://api.ipify.org?format=json");
        const {ip}: {ip: string} = response.data;
        setIP(ip);
      } catch (error) {
        setIP("QQ");
      }
    };
    getIP();
  }, [_IP]);

  return <>{_IP}</>;
};

export default IP;
