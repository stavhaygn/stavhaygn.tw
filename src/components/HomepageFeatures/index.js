import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: '小而持續行動的力量',
    Svg: require('@site/static/img/undraw_healthy_lifestyle.svg').default,
    description: (
      <>
        日常的小習慣對我們的生活產生顯著的累積影響。相較於尋求大躍進，每天只要進步
        1% 就可以帶領我們取得長期的成功。
      </>
    ),
  },
  {
    title: '基於身份的習慣',
    Svg: require('@site/static/img/undraw_programmer.svg').default,
    description: (
      <>
        真正的改變是從內而外開始的，首先要改變我們的自我認同，才能推動持久的習慣改變。
      </>
    ),
  },
  {
    title: '系統勝於目標',
    Svg: require('@site/static/img/undraw_setup.svg').default,
    description: (
      <>
        我們更需要專注於系統而非目標；雖然目標定義了我們想要的結果，但持續引領我們達到目標的是系統。
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
        <div className="row">
          <div className="col">
            <div className="text--center padding-horiz--md">
              <p>
                取自
                <a
                  href="https://www.kobo.com/tw/zh/ebook/pGo8y2e4ET6pdObwFQDfkg"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  《原子習慣》
                </a>
                一書
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
