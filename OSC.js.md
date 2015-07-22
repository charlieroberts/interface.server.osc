OSC
===
_ is our lo-dash reference; omgosc refers to the node module, https://github.com/deanm/omgosc.
TODO: There is a chance omgosc should be replaced with osc-min... requires research.

    !function() {
      
    var _ = require( 'lodash' ), 
            oscMin = require( 'osc-min' ),
            udp = require( 'dgram' ),
            EE,
            oscin,
            oscInputCount = 0,
            IS,
		
    OSC = {
      app: IS,
      
      receivers: {},
      outputDestinations: [],
      
      out: null,
      
      init: function() {
        this.__proto__ = new (require( 'events' ).EventEmitter)()
        this.__proto__.setMaxListeners( 0 )
        // remote handles input OSC messages for remote control
        var remotePort = IS.config.transports.osc.remoteControlPort || 8081
        this.remote = this.receiver( remotePort, 'remote' )
        
        this.out = udp.createSocket( 'udp4' )
      },
      
*receiver* Create an OSC receiver on given port with an optional name. If no name is provided, the port
will be named with a uuid. Return the newly opened socket for event handling.
      
      receiver: function( port, _name ) {
        if( typeof port === 'undefined' ) {
          console.log( "OSC error: no port provided to receiver constructor." )
          return
        }
        
        var name = _name || oscInputCount++
            
        oscin = udp.createSocket( 'udp4', function( rawMsg, rinfo ) {
          var address = rinfo.address,
              oscMsg  = oscMin.fromBuffer( rawMsg ),
              args    = _.pluck( oscMsg.args, 'value' )
          
          args.unshift( oscMsg.address ) // switchboard.route accepts one array argument with path at beginning
          //args.push( address ) // push ip address to end of message              
    
          var shouldReply = OSC.app.switchboard.route.call( OSC.app.switchboard, args, address )
          if( shouldReply ) {
            // TODO: where should the result be sent to???
          }
        })
        oscin.bind( port )
        
        return oscin
      },

*sender* Create an OSC sender on a given port with an optional IP address. If no IP address is provided, localhost
will be used. Return the newly opened socket for sending messages.

      sender: function( _ip, _port ) {
        var port = _port || 8080,
            ip   = _ip || '127.0.0.1',
            destination = { 'port':port, 'ip':ip },
            sender = {}
            //sender = new omgosc.UdpSender( ip, port )
        
        if( !OSC.outputDestinations.indexOf( destination ) ) {
          OSC.outputDestinations.push( destination )
        }
        
        OSC.out.output = function( address, typetags, values ) {
          var buf = oscMin.toBuffer({
            address: address,
            args: values
          })
          
          for( var i = 0; i < OSC.outputs.length; i++ ) {
            OSC.out.send( buf, 0, buf.length, OSC.outputs[ i ].port, OSC.outputs[ i ].ip )
          } 
          //this.send( address, typetags, values )
        }
        
        return OSC.out
      },

*close* Close a socket using an optional name argument. If no name argument is provided, all
existing OSC sockets are closed.
      
      close: function( name ) {
        if( name ) {
          this.receivers[ name ].close()
          delete this.receivers[ name ]
        }else{
          _.forIn( this.receivers, function( recv ) {
            recv.close()
          })
          this.receivers = {}
        }
      },
    }
    
    module.exports = function( __IS ) { if( typeof IS === 'undefined' ) { IS = __IS; } OSC.app = IS; return OSC; }
    
    }()
