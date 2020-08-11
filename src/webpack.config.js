
var path = require('path')
var buildPath = path.resolve('..', 'docs')

var webpack = require('webpack')



module.exports = (env) => ({

    mode: (() => {
        return (env && env.production) ?
            'production' : 'development'
    })(),

    entry: './index.js',
    resolve: {

        /*
         * Note: this next setting is only necessary if the project declares 
         * a dependency on `noa-engine` via the local file system. 
         * If you pull in `noa-engine` normally from npm or from a 
         * github link then this setting shouldn't be necessary 
         * (though I don't think it breaks anything..)
        */
		symlinks: false,
		


	},
    performance: {
        // change the default size warnings
        maxEntrypointSize: 1.5e6,
        maxAssetSize: 1.5e6,
    },
    output: {
        path: buildPath,
        filename: 'bundle.js',
    },
    stats: {
        modules: false,
    },
    devServer: {
        contentBase: buildPath,
        inline: true,
        host: "0.0.0.0",
        stats: "minimal",
    },
    watchOptions: {
        aggregateTimeout: 500,
        poll: 1000,
        ignored: ["node_modules"],
    },
    optimization: {
        splitChunks: {
            cacheGroups: {
                babylon: {
                    chunks: 'initial',
                    test: /babylonjs/,
                    filename: 'babylon.js',
                },
            },
        },
    },
})
