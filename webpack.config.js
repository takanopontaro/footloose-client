const path = require('path');
const WriteFilePlugin = require('write-file-webpack-plugin');

module.exports = (env) => {
  const mode = env.NODE_ENV;
  return {
    mode,
    devtool: mode === 'production' ? false : 'eval-cheap-module-source-map',
    entry: {
      footloose: './src/index.tsx',
    },
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            compilerOptions: {
              jsx: mode === 'production' ? 'react-jsx' : 'react-jsxdev',
            },
          },
        },
      ],
    },
    plugins: [new WriteFilePlugin()],
    externals: {
      'socket.io-client': 'io',
    },
  };
};
