/*
 * Load plugins 
 */
var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var babel = require('gulp-babel');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var cleanCSS = require('gulp-clean-css');
var imagemin = require('gulp-imagemin');
var newer = require('gulp-newer');
var plumber = require('gulp-plumber');
var stylelint = require('gulp-stylelint');
var eslint = require('gulp-eslint');
var del = require('del');
var sourcemaps = require('gulp-sourcemaps');
var browsersync = require('browser-sync').create();

sass.compiler = require('node-sass');

/* 
 * Paths 
 */
var paths = {
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
    dest: 'public_html/maps'
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
    	browsers: ['last 2 versions'],
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
	.pipe(babel())
	.pipe(uglify())
	.pipe(concat('scripts.min.js'))
	.pipe(sourcemaps.write(paths.styles.dest))
	.pipe(gulp.dest(paths.scripts.dest));
}

/* 
 * Task: Lint scripts 
 */
function scriptsLint() {
  return gulp.src(paths.scripts.src)
    .pipe(plumber())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

/* 
 * Task: Optimize images 
 */
function images() {
  return gulp.src(paths.images.src)
    .pipe(newer(paths.images.dest))
    .pipe(
      imagemin([
      	imagemin.gifsicle({ interlaced: true }),
      	imagemin.jpegtran({ progressive: true }),
      	imagemin.optipng({ optimizationLevel: 5 }),
      	imagemin.svgo({
      	  plugins: [
      		{
      		  removeViewBox: false,
      		  collapseGroups: true
      		}
      	  ]
      	})
      ])
    )
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
var css = gulp.series(stylesLint, styles);
var js = gulp.series(scriptsLint, scripts);
var watch = gulp.parallel(watchFiles, browserSync);
var build = gulp.series(clean, gulp.parallel(styles, scripts, images));

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