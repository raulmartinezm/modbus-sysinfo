var config = {};
config.modbus = {};

// Refresh time in miliseconds
config.refreshTime = 3000;
config.modbus.port = process.env.MODBUS_PORT || 1502;
config.modbus.ip = '127.0.0.1';

module.exports = config;
