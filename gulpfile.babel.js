import gulp from 'gulp';
import plumber from 'gulp-plumber';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import flexbugsFixes from 'postcss-flexbugs-fixes';
import sass from 'gulp-sass';
import rename from 'gulp-rename';
import notify from 'gulp-notify';
import browserify from 'browserify';
import babelify from 'babelify';
import uglify from 'gulp-uglify';
import source from 'vinyl-source-stream';
import sourcemaps from 'gulp-sourcemaps';
import buffer from 'vinyl-buffer';
import browserSync from 'browser-sync';
import del from 'del';
const server = browserSync.create();

/* config vars */
const config = {
  plugins: [
    autoprefixer({
      browsers: 'last 2 versions',
    }),
    flexbugsFixes,
    cssnano({
      discardComments: {
        removeAll: true,
      },
      zindex: false,
    }),
  ],
};

/**
 * handle errors compilation, task errors and don't stop the gulp task
 */
const onError = function (err) {
  console.log('Se ha producido un error: ', err.message);
  this.emit('end');
};

/**
 * Compile sass files and add through postcss plugins minify, autoprefix and resolve some flex issues
 */
function styles() {
  return gulp
    .src('./src/styles/main.scss')
    .pipe(
      plumber({
        errorHandler: onError,
      })
    )
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(postcss(config.plugins))
    .pipe(rename('main.css'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('public/'))
    .pipe(browserSync.stream())
    .pipe(notify({ message: 'Styles task ended' }));
}

/**
 * Clean partials dir
 */
gulp.task('clean:partials', function () {
  return del(['public/front/css/partials/**/*.*']);
});

/**
 * Bundling of javascript files
 */
function scripts() {
  return browserify('./src/js/main.js')
    .transform(babelify, {
      presets: ['@babel/preset-env'],
    })
    .bundle()
    .on(
      'error',
      notify.onError({
        message: 'Error: <%= error.message %>',
        title: 'Failed running browserify',
      })
    )
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(
      sourcemaps.init({
        loadMaps: true,
      })
    )
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('public/'))
    .pipe(browserSync.stream())
    .pipe(
      notify({
        message: 'Browserify task ended',
      })
    );
}

/**
 * Browser sync live server
 */
function reload(done) {
  server.reload();
  done();
}

function serve(done) {
  server.init({
    server: {
      baseDir: './',
    },
    browser: 'google-chrome',
  });
  done();
}

gulp.watch('index.html', reload);
gulp.watch('./src/js/**/*.js', gulp.series(scripts, reload));
gulp.watch('./src/styles/**/*.scss', gulp.series(styles, reload));

gulp.task('default', serve);
