const { merge } = require('webpack-merge')
const commonConfiguration = require('./webpack.common.js')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = merge(
    commonConfiguration,
    {
        mode: 'production',
        optimization: {
            concatenateModules: false,
        },
        plugins:
        [
            new CleanWebpackPlugin()
        ]
    }
)
