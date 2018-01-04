/*
 * jQuery.SoundLoader.js
 * 
 * SoundJSライブラリ使用の音楽ファイル簡易ローダー
 * jQuery, Underscore.js SoundJSライブラリが必要です。
 * 
 * -- 使い方 --
 * 
 * 次のように音楽ファイルのURLを入れた配列またはJSONを用意します。ファイルは同じドメインのものに限られます。
 * また、文字列ではなく、第1要素にファイル名、第2要素にURLとした配列を渡すと、音楽データのnameプロパティに指定したファイル名が付けられます。
 * var soundFiles = [
 *     "sound-1.mp3",
 *     "audio/sound-2.mp3",
 *     ["サウンド３", "/audio/bgm/sound-3.mp3"]
 * ];
 *
 * さらにSoundJSに準じたオーディオスプライトなどの高度なデータの指定ができます。
 * var soundFiles = [
 *     [
 *         "sound-1.mp3",
 *         {
 *             audioSprite: [
 *                 {id: "audio-sprite1", startTime: 0, duration: 1000}
 *                 {id: "audio-sprite2", startTime: 1500, duration: 1000}
 *             ]
 * 	       }
 *     ],
 *     ["サウンド２", "/audio/bgm/sound-3.mp3", 5]
 * ];
 * 
 * このリストを$.soundLoader()メソッドの引数に渡して実行します。返り値は$.DeferredのPromiseオブジェクトなので、別の変数に入れておきます。
 * メソッドの第2引数にパスを指定することで、第1引数に渡すファイルのパスをファイル名と拡張子のみ（例：sound-3.mp3）に省略できます。
 * 
 * var deferred = $.soundLoader(soundFiles);
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

;(function (global, $) {
	'use strict';
	var groups, props, calledOnce, reg;
	groups = [];
	props = [];
	calledOnce = false;
	reg = /(.*\/)?([^\/]+?)\.(mp3|ogg|opus|mpeg|wav|m4a|mp4|aiff|wma|mid)$/;

	createjs.Sound.registerPlugins([createjs.HTMLAudioPlugin]);

	$.soundLoader = function (source, path) {
		var deferred, group, index, manifest, fileLength;
		deferred = $.Deferred();
		index = groups.length;
		group = {
			success: [],
			error: [],
			fileLength: 0,
			deferred: deferred
		};
		groups[index] = group;

		if (!_.isArray(source)) {
			source = [source];
		}

		manifest = _.compact(
			_.map(source, function (s, i) {
				var matched, prop;
				prop = {};

				if (_.isArray(s)) {
					if (!_.isString(s[1])) {
						prop.src = s[0];
						if (!_.isUndefined(s[1])) {
							prop.data = s[1];
						}
					} else {
						prop.name = s[0];
						prop.src = s[1];
						prop.data = s[2];
					}
				} else {
					prop.src = s;
				}

				matched = prop.src.match(reg);
				if (!_.isNull(matched)) {
					if (!_.isObject(prop.data)) {
						prop.id = matched[2];
						prop.name = !_.isUndefined(prop.name) ? prop.name : prop.id;
					}
				} else {
					group.error.push({src: prop.src, error: 'invalid file'});
					console.warn('URLは音楽ファイルを指定します。');
					return;
				}

				prop.path = !_.isUndefined(path) ? path : '';
				prop.order = i;
				prop.index = index;
				props.push(prop);

				prop.data = !_.isUndefined(prop.data) ? prop.data : 2;
				return {id: prop.id, src: prop.src, data: prop.data};
			})
		);

		group.fileLength = manifest.length;

		if (!_.isUndefined(path)) {
			manifest = {
				path: path,
				manifest: manifest
			};
		}

		createjs.Sound.registerSounds(manifest);
		manifest = null;

		if (!calledOnce) {
			calledOnce = true;
			createjs.Sound.on('fileload', loadSuccess);
			createjs.Sound.on('fileerror', loadError);
		}

		return deferred.promise();
	};

	function loadSuccess(event) {
		var id, src, prop, group, data;
		id = event.id;
		src = event.src;
		prop = _.find(props, function (prop) {
			return prop.path + prop.src === src;
		});
		group = groups[prop.index];

		group.fileLength -= 1;

		if (_.isObject(prop.data)) {
			data = _.map(prop.data.audioSprite, function (p) {
				return {id: p.id, name: p.id};
			});
			group.success = group.success.concat(data);
		} else {
			data = {
				id: id,
				name: prop.name,
				order: prop.order,
				src: src
			};
			group.success.push(data);
		}

		if (group.fileLength === 0) {
			loadComplete(group);
		}
	}

	function loadError(event) {
		var src, prop, group;
		src = event.src;
		prop = _.find(props, function (prop) {
			return prop.path + prop.src === src;
		});
		group = groups[prop.index];
		group.error.push({src: src, error: 'load error'});
		group.fileLength -= 1;
		if (group.fileLength === 0) {
			loadComplete(group);
		}
	}

	function loadComplete(group) {
		if (group.success.length > 0) {
			group.success = _.sortBy(group.success, function (item) {
				return item.order;
			});

			group.deferred.resolve(group.success, group.error);
		} else {
			group.deferred.reject(group.error);
		}
		group = null;
	}
}(this, jQuery));