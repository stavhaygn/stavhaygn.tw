import React from 'react';
import FlexCenterBox from './FlexCenterBox';

type AppProps = {
  src: string;
  author: string;
  authorUrl: string;
  source: string;
  sourceUrl: string;
};

const Cover = ({
  src,
  author,
  authorUrl,
  source,
  sourceUrl,
}: AppProps): JSX.Element => (
  <FlexCenterBox>
    <img src={src} alt="cover" />
    <>
      {author && authorUrl && (
        <p>
          {'Photo by '}
          <a href={authorUrl} target="_blank">
            {author}
          </a>
          {source && sourceUrl && (
            <>
              {' on '}
              <a href={sourceUrl} target="_blank">
                {source}
              </a>
            </>
          )}
        </p>
      )}
    </>
  </FlexCenterBox>
);

export default Cover;
