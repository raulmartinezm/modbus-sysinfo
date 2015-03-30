// Simple client for test purpose

var mb = require('modbus').create();
var log = console.log;

mb.onError(function (msg) {
    log('ERROR', msg);
});

// create master device
var ctx = mb.createMaster({

    // connection type and params
    con: mb.createConTcp('127.0.0.1', 1502),
    //con: mb.createConRtu(1, '/dev/ttyS1', 9600),

    // callback functions
    onConnect: function () {
        log('onConnect');
        
        log(ctx.getInputRegs(0,43));
//        ctx.setBit(1, false);
        ctx.destroy();
    },
    onDestroy: function () {
        log('onDestroy');
    }
});
