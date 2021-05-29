import { FC, memo } from 'react';
import { useRecoilValue } from 'recoil';
import { Directory } from './directory';
import { DIRECTORY_KEY } from './directory-lib';
import { activeDirectoryFrameIdState } from './directory-recoil';
import { Frame } from './frame';

type IProps = {
  id: string;
};

const DirectoryFrameComponent: FC<IProps> = ({ id }) => {
  const activeDirectoryFrameId = useRecoilValue(activeDirectoryFrameIdState);

  return (
    <Frame id={id} type={DIRECTORY_KEY} active={activeDirectoryFrameId === id}>
      <Directory id={id} />
    </Frame>
  );
};

const DirectoryFrame = memo(DirectoryFrameComponent);

export { DirectoryFrame };
