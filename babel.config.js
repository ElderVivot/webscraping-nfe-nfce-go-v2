module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    node: 'current'
                }
            }
        ],
        '@babel/preset-typescript'
    ],
    plugins: [
        ['module-resolver', {
            alias: {
                '@common': './src/common',
                '@config': './src/config',
                '@queues': './src/queues',
                '@schedules': './src/schedules',
                '@scrapings': './src/scrapings',
                '@services': './src/services',
                '@utils': './src/utils'
            }
        }]
    ],
    ignore: [
        '**/*.spec.ts'
    ]
}