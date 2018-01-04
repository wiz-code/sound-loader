/*
 * SoundLoader.js
 * 
 * SoundJSライブラリ使用の音楽ファイル簡易ローダー
 * 
 * -- 使い方 --
 * (1) 音楽ファイルをひとつだけ登録する場合
 * soundLoader()メソッドの第1引数に音楽ファイルのパスを指定する（必須）。必要であれば第2引数にID名を、第3引数にdataプロパティを指定できるがこれらは省略が可能。ID名を省略した場合、音楽ファイルの拡張子を除いたファイル名に自動的にIDが割り振られるので注意が必要（音楽を鳴らすときIDが必要になる）。
 *
 * var deferred = $.soundLoader('sound-1.mp3', 'main-bgm');
 *
 * また、これらの情報をオブジェクトに格納した形でメソッドに渡すこともできる。
 * var deferred = $.soundLoader({ src: 'sound-1.mp3', id: 'main-bgm' });
 *
 * 複数の音楽ファイルを一度に渡したいときは、上記のオブジェクトを要素とした配列を指定する。
 * var soundFiles = [
 *     { src: 'sound-1.mp3', id: 'main-bgm' },
 *     { src: 'sound-2.mp3', id: 'sub-bgm' },
 *     { src: 'sound-3.mp3', id: 'gameover-bgm' }
 * ];
 *
 * var deferred = $.soundLoader(soundFiles);
 *
 * さらにSoundJSに準じたオーディオスプライトなどの高度なデータの指定ができる。
 * var soundFiles = [
 *     {
 *         src: "sound-1.mp3",
 *         data: {
 *             audioSprite: [
 *                 {id: "audio-sprite1", startTime: 0, duration: 1000},
 *                 {id: "audio-sprite2", startTime: 1500, duration: 1000}
 *             ]
 *         }
 *     },
 *     {id "sound-2", src: "/audio/bgm/sound-3.mp3", data: 5}
 * ];
 * 
 * 返り値はPromiseオブジェクトとなる。これを変数に格納しておき、done()やthen()メソッドにつないでロード終了後の処理を記述する。
 * なお、メソッドの第2引数にパスを指定することで、第1引数に渡すファイルのパスをファイル名と拡張子のみ（例：sound-3.mp3）に省略できます。
 * 
 * var deferred = $.soundLoader(soundFiles, basePath);
 *
 * 返り値をDone()またはThen()、fail()メソッドにチェーンします。ひとつでも読み込みに成功した音楽ファイルがあれば、成功時のコールバックが呼び出されます。
 * 第1引数に読み込みに成功した音楽ファイルのデータが配列で渡され、第2引数に読み込みに失敗したファイルが配列で渡されます。
 * すべての音楽ファイルが読み込みに失敗したときだけ、失敗時のコールバックが呼び出されます。この場合、第1引数に読み込みに失敗したファイルが配列で渡されます。
 * 
 * var soundList;
 * deferred.done(function (successList, errorList) {
 *     doSomething(successList);
 * });
 * 
 * 音楽データはハッシュ形式で次のようなプロパティを持ちます。ID名は自動的に拡張子を除いた音楽ファイル名になります。idおよびsrcプロパティはcreatejs.Sound.play()など
 * Soundクラスの静的メソッドの引数に指定することができます。
 * { id: 'sound-1', name: 'sound-1', src: 'sound-1.mp3' }
 * 
 * createjs.Sound.play('sound-1');
*/

;(function (global) {
    'use strict';
    var soundLoader, groups, caches, initialized, VALIDATE_PATH_REG, DEFAULT_CHANNELS;
    groups = [];
    caches = [];
    initialized = false;
    VALIDATE_PATH_REG = /(.*\/)?([^\/]+?)\.(mp3|ogg|opus|mpeg|wav|m4a|mp4|aiff|wma|mid)$/;
    DEFAULT_CHANNELS = 100;

    createjs.Sound.registerPlugins([createjs.HTMLAudioPlugin]);

    soundLoader = function (source, id, data) {
        var group = {
            success: [],
            error: [],
            fileLength: 0
        };
        groups[groups.length] = group;
        
        return new Promise(function (resolve, reject) {
            var cache, altId, request, path, manifest, fileLength;

            if (Array.isArray(source)) {
                manifest = [];
                path = !isUndefined(id) ? id : '';
                
                source.forEach(function (obj, i) {
                    altId = getFileName(obj.src);
                    
                    if (altId !== '') {
                        request = {src: obj.src};
                        request.id = !isUndefined(obj.id) ? obj.id : altId;
                        request.data = isNumber(obj.data) || isObject(obj.data) ? obj.data : DEFAULT_CHANNELS;

                        cache = {
                            src: request.src,
                            id: request.id,
                            order: i
                        };
                        caches.push(cache);
                        manifest.push(request);
                        
                    } else {
                        group.error.push({id: altId, src: obj.src, error: 'invalid file'});
                    }
                });
            } else {
                if (isString(source)) {
                    path = '';
                    altId = getFileName(source);
                    if (altId !== '') {
                        request = {src: source};
                        request.id = isString(id) ? id : altId;
                        request.data = isNumber(data) || isObject(data) ? data : DEFAULT_CHANNELS;

                        cache = {
                            src: request.src,
                            id: request.id,
                            order: 0
                        };
                        caches.push(cache);
                        manifest = [request];
                        
                    } else {
                        group.error.push({id: altId, src: source, error: 'invalid file'});
                    }
                    
                } else if (isObject(source)) {
                    path = !isUndefined(id) ? id : '';
                    altId = getFileName(source.src);
                    if (altId !== '') {
                        request = {src: source.src};
                        request.id = !isUndefined(source.id) ? source.id : altId;
                        request.data = isNumber(source.data) || isObject(source.data) ? source.data : DEFAULT_CHANNELS;

                        cache = {
                            src: request.src,
                            id: request.id,
                            order: 0
                        };
                        caches.push(cache);
                        manifest = [request];
                        
                    } else {
                        group.error.push({id: altId, src: source.src, error: 'invalid file'});
                    }
                }
            }
            
            group.fileLength = manifest.length;
            createjs.Sound.registerSounds(manifest, path);
            
            manifest = null;

            if (!initialized) {
                initialized = true;
                createjs.Sound.on('fileload', loadSuccess);
                createjs.Sound.on('fileerror', loadError);
            }
            
            function loadSuccess(event) {
                var id, src, cache, data;
                id = event.id;
                src = event.src;
                cache = caches.find(function (c) {
                    return c.id === id && (path + c.src) === src;
                });

                group.fileLength -= 1;

                if (isObject(event.data) && !isUndefined(event.data.audioSprite)) {
                    data = event.data.audioSprite.map(function (p) {
                        return {id: p.id, src: cache.src};
                    });
                    group.success = group.success.concat(data);

                }
                group.success.push(cache);

                if (group.fileLength === 0) {
                    loadComplete(group);
                }
            }

            function loadError(event) {
                var id, src, cache;
                id = event.id;
                src = event.src;
                cache = caches.find(function (c) {
                    return c.id === id && (path + c.src) === src;
                });
                
                group.error.push({id: cache.id, src: cache.src, error: 'load error'});
                group.fileLength -= 1;
                if (group.fileLength === 0) {
                    loadComplete(group);
                }
            }
            
            function loadComplete() {
                var result, index;
                result = {};
                
                if (group.success.length > 0) {
                    group.success.sort(function(a, b) {
                        if (a.order < b.order) {
                            return -1;
                        } else if (a.order > b.order) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });
                    result.success = group.success;
                    
                    if (group.error.length > 0) {
                        result.error = group.error;
                    }
                    resolve(result);
                    
                } else {
                    result.error = group.error;
                    reject(result);
                }
                
                index = groups.indexOf(group);
                groups.splice(index, 1);
            }
        });
    };

    global.soundLoader = soundLoader;

    function getFileName(source) {
        var result, matched;
        result = '';
        matched = source.match(VALIDATE_PATH_REG);
        if (matched !== null) {
            result =  matched[2];
        }
        return result;
    }

    function isString(value) {
        return Object.prototype.toString.call(value) === '[object String]';
    }
    
    function isNumber(value) {
        return Object.prototype.toString.call(value) === '[object Number]';
    }

    function isObject(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }

    function isUndefined(value) {
        return typeof value === 'undefined';
    }
}(this));