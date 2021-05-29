import React from 'react';
import ReactDOM from 'react-dom';
import { MutableSnapshot, RecoilRoot } from 'recoil';
import { App } from './app';
import { bootstrapState } from './app-recoil';
import { IBootstrap } from './app-typings';

declare global {
  interface Window {
    Footloose: typeof render;
  }
}

function initialize(bootstrap: IBootstrap) {
  return ({ set }: MutableSnapshot) => {
    set(bootstrapState, () => bootstrap);
  };
}

function render(selector: string, bootstrap: IBootstrap): void {
  ReactDOM.render(
    <React.StrictMode>
      <RecoilRoot initializeState={initialize(bootstrap)}>
        <App />
      </RecoilRoot>
    </React.StrictMode>,
    document.querySelector(selector)
  );
}

window.Footloose = render;
