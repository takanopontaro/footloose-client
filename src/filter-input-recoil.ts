import { RecoilState, atomFamily } from 'recoil';

export const inputElState = atomFamily<HTMLInputElement | null, string>({
  key: 'filterInput/inputEl',
  default: null,
});

export const filterRecoilState = atomFamily<RecoilState<string> | null, string>(
  {
    key: 'filterInput/filterRecoil',
    default: null,
  }
);
