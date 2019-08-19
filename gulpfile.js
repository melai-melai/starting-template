/*
 * Load plugins 
 */
const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const cleanCSS = require('gulp-clean-css');
//const imagemin = require('gulp-imagemin');
const image = require('gulp-image');
const newer = require('gulp-newer');
const plumber = require('gulp-plumber');
const stylelint = require('gulp-stylelint');
const eslint = require('gulp-eslint');
const del = require('del');
const sourcemaps = require('gulp-sourcemaps');
const browsersync = require('browser-sync').create();

sass.compiler = require('node-sass');

/* 
 * Paths 
 */
const paths = {
  styles: {
  	src: 'resources/scss/**/*.scss',
  	dest: 'public_html/css/'
  },
  scripts: {
  	src: 'resources/js/**/*.js',
  	dest: 'public_html/js/'
  },
  images: {
  	src: 'resources/images/**/*',
  	dest: 'public_html/images/'
  },
  html: {
  	src: 'public_html/**/*.html'
  },
  maps: {
    dest: '/maps'
  }
};

/* 
 * Task: Clear public_html except html files 
 */
function clean() {
  return del([ 'public_html/**/*' , '!public_html/**/*.html' ]);
}

/* 
 * Task: BrowserSync reload 
 */
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

/* 
 * Task: BrowserSync init 
 */
function browserSync(done) {
  browsersync.init({
  	server: {
  	  baseDir: './public_html',
      index: 'index.html'
  	},
  	//proxy: 'yourlocal.dev',
  	port: 3000,
    browser: 'firefox'
  });
  done();
}

/* 
 * Task: Optimize css 
 */
function styles() {
  return gulp.src(paths.styles.src)
    .pipe(sourcemaps.init())
    .pipe(plumber())
    .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError)) // scss to css
    .pipe(autoprefixer({
    	cascade: false
    }))
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(rename({
      basename: 'styles',
      suffix: '.min'
    }))
    .pipe(sourcemaps.write(paths.maps.dest))
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(browsersync.stream());
}

/* 
 * Task: Lint styles 
 */
function stylesLint() {
  return gulp.src(paths.styles.src)
    .pipe(plumber())
  	.pipe(stylelint({
  	  failAfterError: true,
  	  reporters: [
  	    {formatter: 'string', console: true}
  	  ]
  	}));
}

/* 
 * Task: Optimize js 
 */
function scripts() {
  return gulp.src(paths.scripts.src, { sourcemaps: true })
	.pipe(sourcemaps.init())
	.pipe(plumber())
	.pipe(babel({presets: ['@babel/env']}))
	.pipe(uglify())
	.pipe(concat('scripts.min.js'))
	.pipe(sourcemaps.write(paths.maps.dest))
	.pipe(gulp.dest(paths.scripts.dest));
}

/* 
 * Task: Lint scripts 
 */
function scriptsLint() {
  return gulp.src(paths.scripts.src)
    .pipe(plumber())
    .pipe(eslint())
    .pipe(eslint.format());
    //.pipe(eslint.failAfterError());
}

/* 
 * Task: Optimize images 
 */
function images() {
  return gulp.src(paths.images.src)
    .pipe(newer(paths.images.dest))
    // .pipe(
    //   imagemin([
    //   	imagemin.gifsicle({ interlaced: true }),
    //   	imagemin.jpegtran({ progressive: true }),
    //   	imagemin.optipng({ optimizationLevel: 5 }),
    //   	imagemin.svgo({
    //   	  plugins: [
    //   		{
    //   		  removeViewBox: false,
    //   		  collapseGroups: true
    //   		}
    //   	  ]
    //   	})
    //   ])
    // )
    .pipe(image())
    .pipe(gulp.dest(paths.images.dest));
}

/* 
 * Task: Watch files 
 */
function watchFiles() {
	gulp.watch(paths.styles.src, gulp.series(stylesLint, styles));
	gulp.watch(paths.scripts.src, gulp.series(scriptsLint, scripts, browserSyncReload));
	gulp.watch(paths.images.src, images, browserSyncReload);
	gulp.watch(paths.html.src).on('change', browsersync.reload);
}

/* 
 * Define complex tasks 
 */
const css = gulp.series(stylesLint, styles);
const js = gulp.series(scriptsLint, scripts);
const watch = gulp.parallel(watchFiles, browserSync);
const build = gulp.series(clean, gulp.parallel(styles, scripts, images));

/* 
 * Export tasks 
 */
exports.clean = clean;
exports.css = css;
exports.js = js;
exports.images = images;
exports.watch = watch;
exports.build = build;
exports.default = watch;