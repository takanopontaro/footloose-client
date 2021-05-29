import { FC, memo } from 'react';
import { Frame } from './frame';
import { Log } from './log';
import { LOG_KEY } from './log-lib';

type IProps = {
  id: string;
};

const LogFrameComponent: FC<IProps> = ({ id }) => (
  <Frame id={id} type={LOG_KEY}>
    <Log id={id} />
  </Frame>
);

const LogFrame = memo(LogFrameComponent);

export { LogFrame };
