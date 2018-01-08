/*
 * SoundLoader.js 0.1.2
 * 
 * Promise音楽ファイルローダー
 * 
 * SoundLoader.jsはSoundJSライブラリで音楽ファイルのプリロードを行うとき、読み込んだ結果をPromiseオブジェクトを使用して処理できるようにしたライブラリです。
 * CreateJSのSoundJSライブラリを必要とします。また、PromiseやES5の機能が使えない環境ではポリフィルを導入する必要があります。
 *
 * -- 使い方 --
 * 音楽ファイルをひとつだけ登録する場合、SoundJSライブラリのregisterSound()メソッドに指定するものと同様、soundLoader()メソッドの第1引数に音楽ファイルの
 * パス（文字列）を指定します（必須）。必要であれば第2引数にID名を、第3引数にdataプロパティを指定できますがこれらは省略が可能です。ID名を省略した場合、その
 * 音楽ファイルの拡張子を除いたファイル名に自動的にIDが割り振られるので注意が必要です（音楽を鳴らすときIDが必要になる）。
 *
 * var promise = soundLoader('sound-1.mp3', 'main-bgm');
 *
 * また、これらの情報をオブジェクトに格納した形でメソッドに渡すこともできます。第1引数にオブジェクトまたは配列を指定した場合、第2引数にファイルまでのパス
 * （"sounds/"など）が指定可能です。その他、第3引数にロード完了時のデータに紐付けるためのデータ（ラベル）を指定できます。
 * var promise = $.soundLoader({ src: 'sound-1.mp3', id: 'main-bgm' });
 *
 * 複数の音楽ファイルを一度に渡したいときは、上記のオブジェクトを要素とした配列を指定します。SoundJSでは複数指定の場合、registerSounds()メソッドを使用します
 * が、SoundLoader.jsは同じsoundLoader()メソッドに指定します。
 * var soundFiles = [
 *     { src: 'sound-1.mp3', id: 'main-bgm' },
 *     { src: 'sound-2.mp3', id: 'sub-bgm' },
 *     { src: 'sound-3.mp3', id: 'gameover-bgm' }
 * ];
 *
 * var promise = soundLoader(soundFiles);
 *
 * さらにSoundJSと同様にオーディオスプライトなどの高度なデータの指定が可能です。
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
 * 返り値はPromiseオブジェクトになるので、これをthen()メソッドにつないでファイルのロード終了後の処理を記述します。
 * 
 * var promise = soundLoader(soundFiles, 'sounds/');
 *
 * 読み込んだ音楽ファイルのうちひとつでも読み込みに成功した場合、成功時のコールバックが呼び出されます。結果は第1引数にオブジェクトとして渡され、読み込みに成功
 * した音楽ファイルのリストがそのsuccessプロパティに、失敗したファイルのリストがerrorプロパティに格納されます。soundLoader()呼び出し時にラベルを指定した
 * 場合、labelプロパティから紐付けたデータを参照できます。
 * 失敗時のコールバックが呼び出されるのは、すべての音楽ファイルが読み込みに失敗したときだけです。この場合も第1引数に同様のオブジェクトが渡されますが、error
 * プロパティのみアクセスできます。
 * 
 * promise.then(function (result) {
 *     if (typeof result.success !== 'undefined') {
 *         doSomething(result.success);
 *     }
 * });
 * 
 * 音楽データはハッシュ形式で次のようなプロパティを持ちます。IDプロパティはcreatejs.Sound.play()メソッドなどを利用するときに必要になり、読み込みに失敗したデータについては、失敗した理由がerrorプロパティに格納されます。
 * { id: 'sound-1', src: 'sound-1.mp3', data: 100 }
 * 
 * createjs.Sound.play('sound-1');
*/
if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
        if (this === null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}

;(function (global) {
    'use strict';

    var soundLoader, groups, caches, initialized, VALIDATE_PATH_REG, DEFAULT_CHANNELS;
    groups = {};
    caches = [];
    initialized = false;
    VALIDATE_PATH_REG = /(.*\/)?([^\/]+?)\.(mp3|ogg|opus|mpeg|wav|m4a|mp4|aiff|wma|mid)$/;
    DEFAULT_CHANNELS = 100;

    soundLoader = function (source, id, data) {
        var group, groupId;
        group = {
            id: '',
            label: '',
            success: [],
            error: [],
            fileLength: 0,
            complete: null
        };
        groupId = createUUID();
        group.id= groupId;
        groups[groupId] = group;
        
        return new Promise(function (resolve, reject) {
            var cache, altId, request, path, manifest, fileLength;

            if (Array.isArray(source)) {
                manifest = [];
                path = !isUndefined(id) ? id : '';
                group.label = !isUndefined(data) ? data : '';
                
                source.forEach(function (obj, i) {
                    if (isString(obj.src)) {
                        altId = getFileName(obj.src);

                        if (altId !== '') {
                            request = {src: obj.src};
                            request.id = !isUndefined(obj.id) ? obj.id : altId;
                            request.data = isNumber(obj.data) || isObject(obj.data) ? obj.data : DEFAULT_CHANNELS;

                            cache = {
                                src: request.src,
                                id: request.id,
                                order: i,
                                groupId: groupId
                            };
                            caches.push(cache);
                            manifest.push(request);

                        } else {
                            group.error.push({id: altId, src: obj.src, error: 'invalid file'});
                        }
                    } else {
                        request = {id: obj.id, src: {}};
                        request.data = isNumber(obj.data) || isObject(obj.data) ? obj.data : DEFAULT_CHANNELS;
                        
                        Object.keys(obj.src).forEach(function (key) {
                            altId = getFileName(obj.src[key]);
                            if (altId !== '') {
                                request.src[key] = obj.src[key];
                                
                            } else {
                                group.error.push({id: altId, src: obj.src[key], error: 'invalid alternate file'});
                            }
                        });
                        
                        cache = {
                            src: request.src,
                            id: request.id,
                            order: i,
                            groupId: groupId
                        };
                        caches.push(cache);
                        manifest.push(request);
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
                            order: 0,
                            groupId: groupId
                        };
                        caches.push(cache);
                        manifest = [request];
                        
                    } else {
                        group.error.push({id: altId, src: source, error: 'invalid file'});
                    }
                    
                } else if (isObject(source)) {
                    path = !isUndefined(id) ? id : '';
                    group.label = !isUndefined(data) ? data : '';
                    
                    if (isString(source.src)) {
                        altId = getFileName(source.src);
                        if (altId !== '') {
                            request = {src: source.src};
                            request.id = !isUndefined(source.id) ? source.id : altId;
                            request.data = isNumber(source.data) || isObject(source.data) ? source.data : DEFAULT_CHANNELS;

                            cache = {
                                src: request.src,
                                id: request.id,
                                order: 0,
                                groupId: groupId
                            };
                            caches.push(cache);
                            manifest = [request];

                        } else {
                            group.error.push({id: altId, src: source.src, error: 'invalid file'});
                        }
                    } else {
                        request = {id: source.id, src: {}};
                        request.data = isNumber(source.data) || isObject(source.data) ? source.data : DEFAULT_CHANNELS;
                        
                        Object.keys(source.src).forEach(function (key) {
                            altId = getFileName(source.src[key]);
                            if (altId !== '') {
                                request.src[key] = source.src[key];
                                
                            } else {
                                group.error.push({id: altId, src: source.src[key], error: 'invalid alternate file'});
                            }
                        });
                        
                        cache = {
                            src: request.src,
                            id: request.id,
                            order: 0,
                            groupId: groupId
                        };
                        caches.push(cache);
                        manifest = [request];
                    }
                }
            }
            
            group.fileLength = manifest.length;
            createjs.Sound.registerSounds(manifest, path);
            
            group.complete = function () {
                var result, index;
                result = {
                    label: group.label
                };
                
                if (group.success.length > 0) {
                    group.success.sort(function (a, b) {
                        if (a.order < b.order) {
                            return -1;
                        } else if (a.order > b.order) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });
                    
                    result.success = group.success.map(function (obj) {
                        return {
                            id: obj.id,
                            src: obj.id,
                            data: obj.data
                        };
                    });
                    
                    if (group.error.length > 0) {
                        result.error = group.error;
                    }
                    
                    resolve(result);
                    
                } else {
                    result.error = group.error;
                    reject(result);
                }
                
                groups[group.id] = null;
                group = null;
            };
            
            if (!initialized) {
                initialized = true;
                createjs.Sound.on('fileload', loadSuccess);
                createjs.Sound.on('fileerror', loadError);
            }
        });
    };

    global.soundLoader = soundLoader;
    
    function createUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    function loadSuccess(event) {
        var id, src, data, result, group, cache, sprites;
        id = event.id;
        src = event.src;
        data = event.data;
        
        cache = caches.find(function (c) {
            return c.id === id;
        });
        result = {
            id: id,
            src: src,
            data: data,
            order: cache.order
        };
        Object.keys(groups).forEach(function (key) {
            if (cache.groupId === key) {
                group = groups[key];
            }
        });
        
        group.success.push(result);
        if (isObject(data) && !isUndefined(data.audioSprite)) {
            sprites = data.audioSprite.map(function (p) {
                return {id: p.id, src: src, order: cache.order};
            });
            group.success = group.success.concat(sprites);
        }
        
        group.fileLength -= 1;
        if (group.fileLength === 0) {
            group.complete();
        }
    }

    function loadError(event) {
        var id, src, cache, group;
        id = event.id;
        src = event.src;
        
        cache = caches.find(function (c) {
            return c.id === id;
        });
        
        Object.keys(groups).forEach(function (key) {
            if (cache.groupId === key) {
                group = groups[key];
            }
        });
        
        group.error.push({id: id, src: src, error: 'load error'});
        group.fileLength -= 1;
        if (group.fileLength === 0) {
            group.complete();
        }
    }

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