/**
 * Project janux-persistence
 * Created by ernesto on 5/26/17.
 */
'use strict';

var path = require('path');
//Gulp compiler options
var cfg = {
    dir: {
        src: 'src',
        dist: 'dist',
        test: 'test',
        doc: 'doc',
        config: 'config'
    },
    file: {
        app: 'app.js'
    },
    debugPort: 30000,
    fileset: {}
};

cfg.fileset.ts = path.join(cfg.dir.src, '**', '*.ts');
cfg.fileset.filesToWatch = path.join(cfg.dir.src, '**', '*');
cfg.configDirectoryFilesToCopy = path.join(cfg.dir.src, cfg.dir.config, "**", "*");
cfg.fileset.tsTest = path.join(cfg.dir.test, '**', '*.spec.ts');
cfg.serverAppFile = path.join(cfg.dir.dist, cfg.file.app);

// files watched during the build
cfg.fileset.watch = [];


// The test specs; override this locally to run a single test suite
cfg.fileset.test = [
    path.join(cfg.dir.test, '**', '*.spec.js')
];

cfg.jshint = {
    rcfile: '.jshintrc',
    reporter: 'default'
};

cfg.tsConfig = {
    module: "commonjs",
    removeComments: true,
    target: 'ES5',
    skipLibCheck: true,
    declaration: true
};

module.exports = cfg;
