const typescript = require('rollup-plugin-typescript2');
const pkg = require('./package.json');

module.exports = [
    // CommonJS build
    {
        input: 'src/index.ts',
        output: {
            file: pkg.main,
            format: 'cjs',
            sourcemap: true,
        },
        plugins: [
            typescript({
                typescript: require('typescript'),
                tsconfig: './tsconfig.json',
            }),
        ],
        external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],
    },
    // ES Module build
    {
        input: 'src/index.ts',
        output: {
            file: pkg.module,
            format: 'esm',
            sourcemap: true,
        },
        plugins: [
            typescript({
                typescript: require('typescript'),
                tsconfig: './tsconfig.json',
            }),
        ],
        external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],
    },
];
