const { merge } = require('webpack-merge')
const commonConfiguration = require('./webpack.common.js')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const zlib = require('zlib')

module.exports = merge(
    commonConfiguration,
    {
        mode: 'production',
        optimization: {
            concatenateModules: false,
            splitChunks: {
                chunks: 'all',
            },
        },
        plugins:
        [
            new CleanWebpackPlugin(),
            new CompressionPlugin({
                algorithm: 'gzip',
                test: /\.(js|css|html|svg)$/,
                threshold: 8192,
            }),
            new CompressionPlugin({
                algorithm: 'brotliCompress',
                compressionOptions: {
                    params: {
                        [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
                    },
                },
                filename: '[path][base].br',
                test: /\.(js|css|html|svg)$/,
                threshold: 8192,
            }),
        ]
    }
)
