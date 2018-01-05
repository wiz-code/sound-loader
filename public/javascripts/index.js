$(function () {
    'use strict';
    
    var audioData1 = [
        {
            id: 'main',
            src: 'itsuka_no_yume.mp3',
            data: {
                audioSprite: [
                    {id: "audio-sprite1", startTime: 1500, duration: 1500},
                    {id: "audio-sprite2", startTime: 3000, duration: 1500}
                ]
            },
        },
        {id: 'start', src: 'decision7.mp3', data: {channels: 1}},
        {id: 'decision', src: {wav: 'decision3.wav', mp3: 'decision3.mp3'}}
    ];
    
    var audioData2 = [
        {id: 'cancel', src: 'cancel4.mp3'},
        {id: 'hover', src: 'cursor1.mp3'}
    ];
    
    var audioInstance = {
        main: null,
        decision: null,
        cancel: null
    };
    createjs.Sound.alternateExtensions = ['mp3', 'wav'];
    /* マスタボリュームの設定 */
    createjs.Sound.volume = 1.0;
    
    var config = {};
    /* BGM用の設定。音量を小さめにしリピートさせる */
    config.bgm = new createjs.PlayPropsConfig().set({
        interrupt: createjs.Sound.INTERRUPT_LATE,
        loop: -1,
        volume: .5
    });
    /* 効果音用の設定。音量をBGMより大きめにする */
    config.sound = new createjs.PlayPropsConfig().set({
        interrupt: createjs.Sound.INTERRUPT_LATE,
        loop: 0,
        volume: .8
    });
    
    var deferred1 = soundLoader(audioData1, 'sounds/');
    var deferred2 = soundLoader(audioData2, 'sounds/');
    
    var index = 0;
    deferred1.then(callback);
    deferred2.then(callback);
    
    function callback(result) {
        var list, instance;
         if (result.success) {
             list = result.success;
             for (var i = 0; i < list.length; i += 1, index += 1) {
                 instance = createjs.Sound.createInstance(list[i].id);
                 $('#track-' + (index + 1) + '-play').on('click', {instance: instance}, function (e) {
                     e.data.instance.play(config.sound);
                 });
                 $('#track-' + (index + 1) + '-stop').on('click', {instance: instance}, function (e) {
                     e.data.instance.stop();
                 });
                 
             }
         }
    }
    
    if (!Array.prototype.find) {
      Object.defineProperty(Array.prototype, 'find', {
        value: function(predicate) {
         // 1. Let O be ? ToObject(this value).
          if (this == null) {
            throw new TypeError('"this" is null or not defined');
          }

          var o = Object(this);

          // 2. Let len be ? ToLength(? Get(O, "length")).
          var len = o.length >>> 0;

          // 3. If IsCallable(predicate) is false, throw a TypeError exception.
          if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
          }

          // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
          var thisArg = arguments[1];

          // 5. Let k be 0.
          var k = 0;

          // 6. Repeat, while k < len
          while (k < len) {
            // a. Let Pk be ! ToString(k).
            // b. Let kValue be ? Get(O, Pk).
            // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
            // d. If testResult is true, return kValue.
            var kValue = o[k];
            if (predicate.call(thisArg, kValue, k, o)) {
              return kValue;
            }
            // e. Increase k by 1.
            k++;
          }

          // 7. Return undefined.
          return undefined;
        }
      });
    }
});