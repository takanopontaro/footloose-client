import { FC, memo } from 'react';
import { useRecoilValue } from 'recoil';
import {
  useAppExports,
  useExportsEffect,
  useInitializationEffect,
  useKeyMapsUpdateEffect,
  useKeyboardShortcutsEffect,
} from './app-hooks';
import { APP_KEY } from './app-lib';
import { Dialog } from './dialog';
import { dialogIdListState } from './dialog-recoil';
import { DirectoryFrame } from './directory-frame';
import { DIRECTORY_ID_LIST } from './directory-lib';
import { LogFrame } from './log-frame';
import { LOG_KEY } from './log-lib';
import { TaskManagerFrame } from './task-manager-frame';
import { TASK_MANAGER_KEY } from './task-manager-lib';

const AppComponent: FC = () => {
  const dialogIdList = useRecoilValue(dialogIdListState);

  useKeyboardShortcutsEffect(APP_KEY, APP_KEY);

  useInitializationEffect();

  useExportsEffect(APP_KEY, useAppExports());

  useKeyMapsUpdateEffect();

  return (
    <>
      <div className="frameSet frameSet-column">
        <div className="frameSet frameSet-row frameSet-upper">
          <DirectoryFrame id={DIRECTORY_ID_LIST[0]} />
          <DirectoryFrame id={DIRECTORY_ID_LIST[1]} />
        </div>
        <div className="frameSet frameSet-row frameSet-lower">
          <LogFrame id={LOG_KEY} />
          <TaskManagerFrame id={TASK_MANAGER_KEY} />
        </div>
      </div>
      {dialogIdList.map((id) => (
        <Dialog key={id} id={id} />
      ))}
    </>
  );
};

const App = memo(AppComponent);

export { App };
