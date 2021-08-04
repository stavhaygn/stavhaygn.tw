import React from 'react';
import styles from './FlexCenterBox.module.css';

type AppProps = {
  children: JSX.Element | JSX.Element[];
};

const FlexCenterBox = ({children}: AppProps): JSX.Element => (
  <div className={styles.flexCenterBox}>{children}</div>
);

export default FlexCenterBox;
