import { FC, memo } from 'react';
import { useRecoilValue } from 'recoil';
import { useExportsEffect } from './app-hooks';
import {
  useInitializationEffect,
  useLogExports,
  useLogUpdateEffect,
} from './log-hooks';
import { LOG_KEY } from './log-lib';
import { logDataState } from './log-recoil';

type IProps = {
  id: string;
};

const LogComponent: FC<IProps> = () => {
  const logData = useRecoilValue(logDataState);

  useInitializationEffect();

  useExportsEffect(LOG_KEY, useLogExports());

  useLogUpdateEffect();

  return (
    <>
      {logData.map((log) => (
        <div
          key={log.id}
          className={`log ${log.className ?? ''}`}
          data-level={log.level}
          dangerouslySetInnerHTML={{ __html: log.data }}
          {...log.attributes}
        />
      ))}
    </>
  );
};

const Log = memo(LogComponent);

export { Log };
