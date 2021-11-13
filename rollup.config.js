import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';

const plugins = [resolve(), typescript(), commonjs()]

const onwarn = (warning, warn) => {
  if(warning.code === "FILE_NAME_CONFLICT") return
  warn(warning)
}

export default [  
  {
    input: 'src/index.ts',
    output: {
      name: "fetchclient",
      file: 'dist/index.js',
      format: 'umd'
    },
    plugins,
    onwarn,
  },    
  {
    input: 'src/index.ts',
    output: {
      name: "fetchclient",
      file: 'dist/index.iife.js',
      format: 'iife'
    },
    plugins,
    onwarn,
  },  
];
