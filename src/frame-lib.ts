export function createFrameTypeListSetter(
  frameType: string,
  addOrDelete: boolean
): (frameTypeList: Set<string>) => Set<string> {
  return (frameTypeList) => {
    if (addOrDelete) {
      frameTypeList.add(frameType);
    } else {
      frameTypeList.delete(frameType);
    }
    return new Set(frameTypeList);
  };
}
