import { resolve } from 'path';

export default {
  entry: './src/index.ts',
  target: 'node',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'index.js',
    path: resolve(import.meta.dirname, 'dist'),
  },
};
