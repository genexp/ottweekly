var gulp = require('gulp');
var inject = require('gulp-inject');
var svgstore = require('gulp-svgstore');
var svgmin = require('gulp-svgmin');
var modernizr = require('gulp-modernizr');
var path = require('path');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync').create();

// Metalsmith
var metalsmith = require('gulp-metalsmith');
var permalinks = require('metalsmith-permalinks');
var htmlMinifier = require('metalsmith-html-minifier');
var sitemap = require('metalsmith-sitemap');
var markdown = require('metalsmith-markdown-remarkable');
var collections = require('metalsmith-collections');
var layouts = require('metalsmith-layouts');
var inPlace = require('metalsmith-in-place');
var paths = require('metalsmith-paths');
var feed = require('metalsmith-feed');

gulp.task('styles', function () {
	return gulp
		.src('./src/scss/main.scss')
		.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
		.pipe(autoprefixer({
			browsers: ['last 2 versions'],
			cascade: false
		}))
		.pipe(gulp.dest('build'))
		.pipe(browserSync.stream());
});

gulp.task('metalsmith', function () {
	// build the svgs
	var svgs = gulp
	.src('./src/icons/**/*.svg')
	.pipe(svgmin(function (file) {
		var prefix = path.basename(file.relative, path.extname(file.relative));
		return {
			plugins: [{
				cleanupIDs: {
					prefix: prefix + '-',
					minify: true
				}
			}]
		};
	}))
	.pipe(svgstore({
		inlineSvg: true
	}));

	function fileContents(filePath, file) {
		return file.contents.toString();
	}

	return gulp
	.src('src/pages/**')
	.pipe(metalsmith({
		root: __dirname,
		use: [
			paths(),
			collections({
				archives: 'archives/*.md'
			}),
			markdown(),
			permalinks({
				pattern: ':title',
				date: 'YYYY',
				linksets: [{
					match: {collection: 'archives'},
					pattern: 'archives/:file'
				}]
			}),
			inPlace({
				engine: 'twig'
			}),
			layouts({
				engine: 'twig',
				default: 'default.html.twig',
				directory: 'src/layouts'
			}),
			htmlMinifier({
				collapseWhitespace: true,
				removeComments: false
			}),
			sitemap({
				hostname: 'http://www.ottweekly.com',
				omitIndex: true
			})
		]
	}))
	.pipe(inject(svgs, {transform: fileContents}))
	.pipe(browserSync.stream())
	.pipe(gulp.dest('build'));
});

gulp.task('metalsmith:reload', function () {
	runSequence('metalsmith', 'styles');
});

gulp.task('static', function () {
	return gulp
	.src(['src/assets/**/*'], {base: './src'})
	.pipe(gulp.dest('build'));
});

gulp.task('modernizr', function () {
	return gulp
		.src(['src/scss/**/*', 'src/assets/js/**/*.js'], {base: './src'})
		.pipe(modernizr({
			options: [
				'setClasses',
				'html5printshiv'
			]
		}))
		.pipe(gulp.dest('build'));
});

gulp.task('browsersync:init', function () {
	return browserSync.init({
		ui: {
			port: 3002
		},
		startPath: '/',
		server: {
			baseDir: './build'
		}
	});
});

gulp.task('_watch', function () {
	gulp.watch(['src/pages/**/*', 'src/views/**/*'], ['metalsmith:reload']);
	gulp.watch(['src/assets/**/*'], ['static']);
	gulp.watch('./src/scss/**/*.scss', ['styles']);
	gulp.watch('./src/icons/**/*.svg', ['metalsmith:reload']);
});

gulp.task('clean', function (cb) {
	return del([
		'build/**/*'
	], cb);
});

gulp.task('serve', function () {
	return runSequence('clean', 'metalsmith', ['styles', 'modernizr', 'static'], 'browsersync:init', '_watch');
});

gulp.task('default', ['serve']);
