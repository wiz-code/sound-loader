$(function () {
    'use strict';
    
    var audioData = [
        {
            id: 'main',
            src: 'itsuka_no_yume.mp3',
            data: {
                audioSprite: [
                    {id: "audio-sprite1", startTime: 1500, duration: 500},
                    {id: "audio-sprite2", startTime: 2000, duration: 500}
                ]
            },
        },
        {id: 'start', src: 'decision7.mp3', data: {channels: 1}},
        {id: 'decision', src: 'decision3.mp3'},
        {id: 'cancel', src: 'cancel4.mp3'},
        {id: 'hover', src: 'cursor1.mp3'},
    ];
    
    /*var audioData = {
        src: 'decision3.wav',
        id: 'main',
        data: {
            audioSprite: [
                {id: "audio-sprite1", startTime: 0, duration: 500},
                {id: "audio-sprite2", startTime: 500, duration: 1000}
            ]
        }
    };*/
    
    var audioInstance = {
        main: null,
        decision: null,
        cancel: null
    };
    createjs.Sound.alternateExtensions = ['wav'];
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
    
    var deferred = soundLoader(audioData, 'sounds/');
    
    deferred.then(
        function (result) {
            console.dir(result);
            
            
            $('#play').on('click', function (e) {
                var instance = createjs.Sound.createInstance('audio-sprite1');
                instance.play(config.sound);
            });
            $('#stop').on('click', function (e) {
                var instance = createjs.Sound.createInstance('decision');
                instance.play(config.sound);
            });
        },
        function (result) {
            console.dir(result);
        }
    );
    
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