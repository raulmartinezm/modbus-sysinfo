modbus-sysinfo
--------------

Exposes system information throught Modbus-TCP protocol.
It begins in Modbus Read-Only registers (from 30001 to 39999).

Parameters:

|  Parameter | Read Input Register  | Type |
| ---------- | -------------------  | ---- |
| *Timestamp (Unix epoch)*   | 1  | long |
| *Free memory*  | 3  |   long |
| *Number of CPUS*  | 5  |  int |
| *CPU n user time* | 6+(n*8) | long | 
| *CPU n nice time* | 8+(n*8) | long |
| *CPU n sys time* | 10+(n*8) | long |
| *CPU n idle time* | 12+(n*8) | long |
| *Load average* | 5+NumberOfCPUs*8 | long |



Motivation
----------

The main reason was learning some node-js/javascript and simulate a device with modbusTCP interface which exposes real data for another projects.
It may could be useful to be integrated in some Modbus SCADA data acqusition software.

Installation
------------

	$ npm install


Running
-------
    
    $ nodejs server.js

Test
----

TODO

Future improvements
-------------------

* Tests.
* Init script.
* Add functions and parameters programatically.
* Web interface for configuration and show status, requests, etc...
* ...
* ¯\\\_(ツ)\_/¯ 

License
-------

MIT