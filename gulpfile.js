
var gulp = require('gulp');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var plumber = require('gulp-plumber');

gulp.task('build', function () {
    
    gulp.src('sass/*.scss').
        pipe(plumber()).
        pipe(sass()).
        pipe(gulp.dest('public/stylesheets/'));
    
    gulp.src('src/*.js').
        pipe(plumber()).
        pipe(
            rename({
                extname: '.min.js',
            })
        ).
        pipe(sourcemaps.init()).
        pipe(uglify()).
        pipe(sourcemaps.write()).
        pipe(gulp.dest('dist/'));
});

gulp.task('watch', function () {
    gulp.watch(['src/*.js', 'sass/*.scss'], ['build']);
});

gulp.task('default', ['build']);