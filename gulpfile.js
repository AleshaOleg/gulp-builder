const gulp = require('gulp'),
      postcss = require('gulp-postcss'),
      precss = require('precss'),
      cssnext = require('postcss-cssnext'),
      gutil = require('gulp-util'),
      sourcemaps = require('gulp-sourcemaps'),
      nano = require('gulp-cssnano'),
      concat = require('gulp-concat'),
      cache = require('gulp-cached'),
      portfinder = require('portfinder'),
      image = require('gulp-imagemin'),
      browserSync = require('browser-sync'),
      cachebust = require('gulp-cache-bust'),
      plumber = require('gulp-plumber'),
      pug = require('gulp-pug'),
      font2css = require('gulp-font2css').default,
      eslint = require('gulp-eslint'),
      babel = require('gulp-babel'),
      uglify = require('gulp-uglify'),
      reload = browserSync.reload,
      debug = require('gulp-debug');

const processors = [
  precss(),
  cssnext()
];

const paths = {
  build: 'build/',
  source: 'src/',
  components: 'src/components/',
  pages: 'src/pages/',
  images: 'src/images',
  styles: 'src/build/styles/',
  scripts: 'src/build/scripts',
  html: './'
};

gulp.task('watch', ['build'], function() {
  gulp.watch([paths.components + '**/*.pug', paths.pages + '**/*.pug'], ['pages']);
  gulp.watch(paths.components + '**/*.pcss', ['styles', 'reload']);
  gulp.watch(paths.components + '**/*.js', ['scripts', 'reload']);
  gulp.watch(paths.images + '*.{png,jpg,gif,svg}', ['reload']).on('change', function(event) {
    if (event.type === 'deleted') {
      del(paths.images + path.basename(event.path));
      delete cache.caches['images'][event.path];
    }
  });
  gulp.watch(paths.html + '*.html', ['reload']);
});

gulp.task('pages', function() {
  return gulp.src(paths.pages + '*.pug')
    .pipe(plumber({ errorHandler: onError }))
    .pipe(pug({pretty: true}))
    .pipe(gulp.dest(paths.html))
});

gulp.task('fonts', function() {
  return gulp.src('src/fonts/**/*.{otf,ttf,woff,woff2}')
    .pipe(font2css())
    .pipe(concat('fonts.pcss'))
    .pipe(gulp.dest('src/styles'))
});

gulp.task('styles', ['fonts'], function () {
  return gulp.src(paths.source + '**/*.pcss')
    .pipe(plumber({ errorHandler: onError }))
    .pipe(sourcemaps.init())
    .pipe(postcss(processors))
    .pipe(concat('styles.min.css'))
    .pipe(nano({discardUnused: { fontFace: false, namespace: false }}))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.build));
});

gulp.task('scripts', function() {
  return gulp.src(paths.components + '**/*.js')
    .pipe(plumber({errorHandler: onError}))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(babel())
    .pipe(concat('scripts.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(paths.build));
});

gulp.task('images', function() {
  return gulp.src(paths.images + '/**/*.{png,jpg,gif,svg}')
    .pipe(plumber({ errorHandler: onError }))
    .pipe(cache('images'))
    .pipe(image({
      verbose: true
    }))
    .pipe(gulp.dest(paths.build + 'images'));
});

gulp.task('cache', function() {
  return gulp.src(paths.html + '*.html')
    .pipe(plumber({ errorHandler: onError }))
    .pipe(cache('cache'))
    .pipe(cachebust())
    .pipe(gulp.dest(paths.html));
});

gulp.task('reload', ['cache'], function() {
  return gulp.src(paths.html + '*.html')
    .pipe(plumber({ errorHandler: onError }))
    .pipe(reload({ stream: true }));
});

gulp.task('local-server', function() {
  portfinder.getPort(function (err, port) {
    browserSync({
      server: {
        baseDir: "./"
      },
      host: 'localhost',
      notify: false,
      port: port
    }, function() {
      gulp.start('watch');
    });
  });
});

gulp.task('tunnel-server', function() {
  portfinder.getPort(function (err, port) {
    browserSync({
      server: {
        baseDir: "./"
      },
      tunnel: true,
      host: 'localhost',
      notify: false,
      port: port
    }, function() {
      gulp.start('watch');
    });
  });
});

function onError (error) {
  gutil.log([
    (error.name + ' in ' + error.plugin).bold.red,
    '',
    error.message,
    ''
  ].join('\n'));
  gutil.beep();
  this.emit('end');
}

gulp.task('build', ['pages', 'styles', 'scripts', 'images', 'cache']);

gulp.task('default', ['build']);

gulp.task('local', ['local-server']);

gulp.task('tunnel', ['tunnel-server']);
