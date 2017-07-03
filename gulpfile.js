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

var browserify = require('browserify');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify')

// Define default destination folder
var dest = 'public/';
var srcFolders = ['node_modules/angular/angular.js',
					'']

gulp.task('js', function(cb) {
	console.log(mainBowerFiles);
	pump([
	gulp.src(mainBowerFiles()),
		filter('**/*.js'),
		//concat('test.js'),
		uglify({mangle:false}),
		gulp.dest(dest + 'js1')
		],
		cb);

});

gulp.task('css', function(cb) {
	pump([ gulp.src(mainBowerFiles()),
		filter('**/*.css'),
		cleanCSS(),
		gulp.dest(dest + 'css1')
		],
		cb);
});

gulp.task('less', function(cb) {
	console.log(mainBowerFiles());
	pump([ gulp.src(mainBowerFiles()),
		filter('**/*.less'),
		less(),
		gulp.dest(dest + 'css1')
		],
		cb);
});

gulp.task('browserify', function() {
	return browserify('browserify.js')
		.bundle()
		.pipe(source('bundle.js'))
		.pipe(streamify(uglify()))
		.pipe(gulp.dest('public/js/'));
})


gulp.task('default',['js','css','less']);
