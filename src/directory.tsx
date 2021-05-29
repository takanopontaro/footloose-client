import dayjs from 'dayjs';
import filesize from 'filesize';
import { FC, memo } from 'react';
import { useRecoilValue } from 'recoil';
import { useExportsEffect } from './app-hooks';
import {
  useActiveRowFixEffect,
  useDirectoryExports,
  useHandleThClick,
  useHandleTrClick,
  useHandleTrDoubleClick,
  useInitializationEffect,
  usePreviousDirectorySelectionEffect,
  useSaveDataEffect,
  useVirtualDirectoryDetectionEffect,
} from './directory-hooks';
import {
  DIRECTORY_KEY,
  getCssCustomProperty,
  getSortOrder,
} from './directory-lib';
import {
  directoryStatusState,
  displayDirectoryPathState,
  entryFilterState,
  entrySortsState,
  previewMakerState,
  sortedEntriesRefState,
  sortedEntriesState,
} from './directory-recoil';
import { FilterInput } from './filter-input';

type IProps = {
  id: string;
};

const DirectoryComponent: FC<IProps> = ({ id }) => {
  const dateTimeFormat = getCssCustomProperty('--date-time-format');

  const displayDirectoryPath = useRecoilValue(displayDirectoryPathState(id));

  const directoryStatus = useRecoilValue(directoryStatusState(id));

  const sortedEntries = useRecoilValue(sortedEntriesState(id));

  const sortedEntriesRef = useRecoilValue(sortedEntriesRefState(id));
  sortedEntriesRef.current = sortedEntries;

  const entrySorts = useRecoilValue(entrySortsState(id));

  const getPreviewHtml = useRecoilValue(previewMakerState(id));

  const handleThClick = useHandleThClick(id);

  const handleTrClick = useHandleTrClick(id);

  const handleTrDoubleClick = useHandleTrDoubleClick(id);

  useInitializationEffect(id);

  useExportsEffect(DIRECTORY_KEY, useDirectoryExports());

  usePreviousDirectorySelectionEffect(id);

  useActiveRowFixEffect(id);

  useVirtualDirectoryDetectionEffect(id);

  useSaveDataEffect(id);

  return (
    <>
      <div className="directoryPath">
        <div>{displayDirectoryPath}</div>
      </div>
      <div className="tableWrapper">
        <table className="table">
          <colgroup className="table_colgroup">
            <col className="table_col" data-col="icon" />
            <col className="table_col" data-col="name" />
            <col className="table_col" data-col="ext" />
            <col className="table_col" data-col="type" />
            <col className="table_col" data-col="atime" />
            <col className="table_col" data-col="mtime" />
            <col className="table_col" data-col="ctime" />
            <col className="table_col" data-col="birthtime" />
            <col className="table_col" data-col="size" />
          </colgroup>
          <thead className="table_thead">
            <tr className="table_tr">
              <th className="table_th" data-col="icon">
                <div className="table_cell" />
              </th>
              <th className="table_th" data-col="preview">
                <div className="table_cell" />
              </th>
              <th
                className="table_th"
                onClick={handleThClick}
                aria-sort={getSortOrder('name', entrySorts)}
                data-col="name"
              >
                <div className="table_cell" />
              </th>
              <th
                className="table_th"
                onClick={handleThClick}
                aria-sort={getSortOrder('ext', entrySorts)}
                data-col="ext"
              >
                <div className="table_cell" />
              </th>
              <th
                className="table_th"
                onClick={handleThClick}
                aria-sort={getSortOrder('type', entrySorts)}
                data-col="type"
              >
                <div className="table_cell" />
              </th>
              <th
                className="table_th"
                onClick={handleThClick}
                aria-sort={getSortOrder('mime', entrySorts)}
                data-col="mime"
              >
                <div className="table_cell" />
              </th>
              <th
                className="table_th"
                onClick={handleThClick}
                aria-sort={getSortOrder('atime', entrySorts)}
                data-col="atime"
              >
                <div className="table_cell" />
              </th>
              <th
                className="table_th"
                onClick={handleThClick}
                aria-sort={getSortOrder('mtime', entrySorts)}
                data-col="mtime"
              >
                <div className="table_cell" />
              </th>
              <th
                className="table_th"
                onClick={handleThClick}
                aria-sort={getSortOrder('ctime', entrySorts)}
                data-col="ctime"
              >
                <div className="table_cell" />
              </th>
              <th
                className="table_th"
                onClick={handleThClick}
                aria-sort={getSortOrder('birthtime', entrySorts)}
                data-col="birthtime"
              >
                <div className="table_cell" />
              </th>
              <th
                className="table_th"
                onClick={handleThClick}
                aria-sort={getSortOrder('size', entrySorts)}
                data-col="size"
              >
                <div className="table_cell" />
              </th>
            </tr>
          </thead>
          <tbody className="table_tbody">
            {sortedEntries.map((entry, i) => {
              const previewHtml = getPreviewHtml(entry);
              const atime = dayjs(entry.atime).format(dateTimeFormat);
              const mtime = dayjs(entry.mtime).format(dateTimeFormat);
              const ctime = dayjs(entry.ctime).format(dateTimeFormat);
              const birthtime = dayjs(entry.birthtime).format(dateTimeFormat);
              const size = filesize(entry.size, { spacer: ' ' });
              return (
                <tr
                  key={entry.path}
                  className="table_tr"
                  onClick={handleTrClick}
                  onDoubleClick={handleTrDoubleClick}
                  aria-selected="false"
                  data-active="false"
                  data-index={i}
                  data-parent={entry.parent}
                  data-path={entry.path}
                  data-type={entry.type}
                  data-mime={entry.mime}
                >
                  <td className="table_td" data-col="icon">
                    <div className="table_cell" />
                  </td>
                  <td className="table_td" data-col="preview">
                    <div
                      className="table_cell"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </td>
                  <td className="table_td" data-col="name">
                    <div className="table_cell">
                      <span data-name={entry.name} data-ext={entry.ext} />
                    </div>
                  </td>
                  <td className="table_td" data-col="ext">
                    <div className="table_cell">{entry.ext.substr(1)}</div>
                  </td>
                  <td className="table_td" data-col="type">
                    <div className="table_cell" />
                  </td>
                  <td className="table_td" data-col="mime">
                    <div className="table_cell">{entry.mime}</div>
                  </td>
                  <td className="table_td" data-col="atime">
                    <div className="table_cell">{atime}</div>
                  </td>
                  <td className="table_td" data-col="mtime">
                    <div className="table_cell">{mtime}</div>
                  </td>
                  <td className="table_td" data-col="ctime">
                    <div className="table_cell">{ctime}</div>
                  </td>
                  <td className="table_td" data-col="birthtime">
                    <div className="table_cell">{birthtime}</div>
                  </td>
                  <td className="table_td" data-col="size">
                    <div className="table_cell">{size}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="directoryError">{directoryStatus}</div>
      </div>
      <FilterInput frameId={id} filterState={entryFilterState(id)} />
    </>
  );
};

const Directory = memo(DirectoryComponent);

export { Directory };
