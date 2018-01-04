$(function () {
    'use strict';
    var oldData = [
        'sounds/itsuka_no_yume.mp3',
    ];
    
    var audioData = [
        {id: '', data: {}, url: ''}
        
    ];
    
    var audioInstance = {
        main: null,
        decision: null,
        cancel: null
    };
    
    createjs.Sound.volume = 1;
    
    var config = {};
    config.bgm = new createjs.PlayPropsConfig().set({
        interrupt: createjs.Sound.INTERRUPT_LATE,
        loop: -1,
        volume: 0.5
    });
    config.sound = new createjs.PlayPropsConfig().set({
        interrupt: createjs.Sound.INTERRUPT_LATE,
        loop: 0,
        volume: 0.8
    });
    
    var deferred = $.soundLoader(oldData);
    
    deferred.then(
        function (successList, failList) {
            console.log(successList);
            var instance = createjs.Sound.createInstance('itsuka_no_yume');
            instance.play(config);
        }
    );
    
});