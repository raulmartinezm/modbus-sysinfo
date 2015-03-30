/**
 *
 * Exposes some system like values (cpu usage, free memory, etc...) throw a Modbus TCP interface.
 *
 * 
 */

var os = require('os');
var mb = require('modbus').create();
var bunyan = require('bunyan');

// Read configuration
var config = require('./config');

var log = bunyan.createLogger({
    name: 'modbus-sysinfo',
    streams: [{
        type: 'rotating-file',
        path: './log/mbsysinfo.log',
        period: '1d',   // daily rotation
        count: 3        // keep 3 back copies
    }]
});

log.info("Service started. Refresh interval "+config.refreshTime + " ms.");
log.info("Configuration loaded");

var numberOfCPUs = os.cpus().length;

var dataMap = mb.createData({ dataInputReg: new Array(11+numberOfCPUs*8)});

// Get some variables from config.
var refreshTime = config.refreshTime;
var modbusPort = config.modbus.port;
var modbusIP = config.modbus.ip || '127.0.0.1';

var ctx = mb.createSlave({
    con: mb.createConTcp(modbusIP, modbusPort),

    data: dataMap,

    onQuery: function() {
        log.info("Query received.");
    },

    onDestroy: function() {
        log.info("Destroyed!");   
    }
});

function readInformation() {
    var information = {};
    information.timestamp = getUnixEpoch(Date.now());
    information.freeMemory = os.freemem();
    information.cpus = {};
    information.cpus.times = [];

    for ( var i = 0 ; i < os.cpus().length ; i++ ){
        information.cpus.times[i] = os.cpus()[i].times;
    }

    information.loadavg = [];
    information.loadavg = os.loadavg();
    for ( var i in information.loadavg) {
        information.loadavg[i]*=100;   
    }

    return information;
};


function getUnixEpoch (timestamp) {
    return parseInt(timestamp/1000);
};

// Returns array of 2 modbus 16-bit integer
function integerToArray(value, endianness) {
    var array = [];
    var x=value;
    var aux;

    array[1] = x&(65535);
    x=x>>16;
    array[0] = x&(65535);

    switch (endianness){
        case 'big-endian':
            aux = array[0];
            array[0] = array[1];
            array[1] = aux;
            break;
        case 'little-endian':
        default: 

    }

    return array;
}

/** 
 * Returns an object with the values of the modbus memory map.
 */
function getMemoryMap() {
    var memoryMap = new Array();
    memoryMap.parameter = new Array();
    memoryMap.register = new Array();
    memoryMap.numRegisters = new Array();

    memoryMap.parameter[0] = "Timestamp";
    memoryMap.register[0] = 0;
    memoryMap.numRegisters[0] = 2;

    memoryMap.parameter[1] = "Free Memory";
    memoryMap.register[1] = 2;
    memoryMap.numRegisters[1] = 2;

    memoryMap.parameter[2] = "Number of CPUs";
    memoryMap.register[2] = 4;
    memoryMap.numRegisters[2] = 1;
    for ( var i = 0 ; i < numberOfCPUs ; i++){
        memoryMap.parameter[3+(i*numberOfCPUs)] = "CPU("+i+") user time";
        memoryMap.register[3+(i*numberOfCPUs)] = (i*8+5);
        memoryMap.numRegisters[3+(i*numberOfCPUs)] = 2;

        memoryMap.parameter[4+(i*numberOfCPUs)] = "CPU("+i+") nice time";
        memoryMap.register[4+(i*numberOfCPUs)] = (i*8+7);
        memoryMap.numRegisters[4+(i*numberOfCPUs)] = 2;

        memoryMap.parameter[5+(i*numberOfCPUs)] = "CPU("+i+") sys time ";
        memoryMap.register[5+(i*numberOfCPUs)] = (i*8+9);
        memoryMap.numRegisters[5+(i*numberOfCPUs)] = 2;

        memoryMap.parameter[6+(i*numberOfCPUs)] = "CPU("+i+") idle time";
        memoryMap.register[6+(i*numberOfCPUs)] = (i*8+11);
        memoryMap.numRegisters[6+(i*numberOfCPUs)] = 2;
    }

    memoryMap.parameter[numberOfCPUs*4+3] = "Load average";
    memoryMap.register[numberOfCPUs*4+3] = numberOfCPUs*8+5;
    memoryMap.numRegisters[numberOfCPUs*4+3] = 2;

    return memoryMap;
}


function printMemoryMap (memoryMap) {
    
    console.log("Parameter      | Register | Number of registers");
    console.log("---------------+----------+--------------------");
    
    for ( var i = 0 ; i < memoryMap.parameter.length ; i++) {
        console.log(memoryMap.parameter[i]+"    "+memoryMap.register[i]+"    "+memoryMap.numRegisters[i]);
    }

}


// Starts the program

printMemoryMap(getMemoryMap());


/** 
 * Set the refresh interval funcion.
 */
setInterval(function(){
    var info = readInformation(); 

    // Timestamp
    ctx.setInputRegs(0, integerToArray(info.timestamp)); 

    // Free memory
    ctx.setInputRegs(2, integerToArray (info.freeMemory)); 

    // Number of cpus
    ctx.setInputRegs(4, [numberOfCPUs]); // It doesn't change, just to know how many register must be read

    // Cpu usage: user, nice, sys, idle
    for ( var i = 0 ; i < numberOfCPUs ; i++) {
        // User
        ctx.setInputRegs(5+(8*i), integerToArray(info.cpus.times[i].user));   
        // Nice
        ctx.setInputRegs(7+(8*i), integerToArray(info.cpus.times[i].nice));   
        // Sys
        ctx.setInputRegs(9+(8*i), integerToArray(info.cpus.times[i].sys));   
        // Idle
        ctx.setInputRegs(11+(8*i), integerToArray(info.cpus.times[i].idle));   
    }
    ctx.setInputRegs((numberOfCPUs*8+5),info.loadavg);

    log.info("Registers updated");

}, refreshTime);