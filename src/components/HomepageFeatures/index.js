import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'The Power of Small, Consistent Actions',
    Svg: require('@site/static/img/undraw_healthy_lifestyle.svg').default,
    description: (
      <>
        Small, daily habits have a remarkable cumulative effect on our lives.
        Rather than aiming for big leaps, improving just 1% each day can lead us
        to long-term success.
      </>
    ),
  },
  {
    title: 'Identity-based Habits',
    Svg: require('@site/static/img/undraw_programmer.svg').default,
    description: (
      <>
        Real change starts from the inside out, transforming our self-identity
        first in order to drive lasting habit change.
      </>
    ),
  },
  {
    title: 'Systems Over Goals',
    Svg: require('@site/static/img/undraw_setup.svg').default,
    description: (
      <>
        It's crucial to focus more on systems rather than goals; while goals
        define our desired outcomes, it's the systems or processes that will
        consistently lead us there.
      </>
    ),
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
