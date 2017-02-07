// Include Gulp
var gulp = require('gulp');
var pump = require('pump');
var uglify = require('gulp-uglify');
var filter = require('gulp-filter');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var less = require('gulp-less');
var mainBowerFiles = require('main-bower-files');
var cleanCSS = require('gulp-clean-css');

// Include plugins
var plugins = require("gulp-load-plugins")({
	pattern: ['gulp-*', 'gulp.*', 'main-bower-files'],
	replaceString: /\bgulp[\-.]/
});

// Define default destination folder
var dest = 'public/';

console.log(mainBowerFiles());

gulp.task('js', function(cb) {
	pump([ 
            gulp.src(mainBowerFiles()),
            filter('**/*.js'),
            //concat('test.js'),
            uglify({mangle:false}),
            gulp.dest(dest + 'js')
            ],
            cb);

});

gulp.task('css', function(cb) {
	pump([ gulp.src(mainBowerFiles({
            overrides: {
                bootstrap: {
                    main: [
                        './dist/js/bootstrap.js',
                        './dist/css/*.min.*',
                        './dist/fonts/*.*'
                    ]
                }
            }
        })),
		filter('**/*.css'),
		cleanCSS(),
		gulp.dest(dest + 'css')
		],
		cb);
});

gulp.task('less', function(cb) {
	pump([ gulp.src(mainBowerFiles()),
		filter('**/*.less'),
		less(),
		gulp.dest(dest + 'css')
		],
		cb);
});


gulp.task('default',['js','css']);
