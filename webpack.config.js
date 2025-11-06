import path from 'path';
import { fileURLToPath } from 'url';

const dirName = path.dirname(fileURLToPath(import.meta.url));

export default {
  entry: './src/server.ts',
  target: 'node',
  mode: process.env.NODE_ENV || 'production',

  output: {
    path: path.resolve(dirName, 'dist'),
    filename: 'server.js',
    clean: true,
  },

  resolve: {
    extensions: ['.ts', '.js'],
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },

  devtool: 'source-map',
};
