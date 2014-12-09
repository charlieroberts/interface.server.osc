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
  
  out: null,
  
  init: function() {
    this.__proto__ = new (require( 'events' ).EventEmitter)()
    this.__proto__.setMaxListeners( 0 )
    // remote handles input OSC messages for remote control
    var remotePort = IS.config.transports.osc.remoteControlPort || 8081
    this.remote = this.receiver( remotePort, 'remote' )
    
    this.out = udp.createSocket( 'udp4' )
  },
  
  
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
  sender: function( _ip, _port ) {
    var port = _port || 8080,
        ip   = _ip || '127.0.0.1',
        sender = {}
        //sender = new omgosc.UdpSender( ip, port )
    
    OSC.out.output = function( address, typetags, values ) {
      var buf = oscMin.toBuffer({
        address: address,
        args: values
      })
  
      OSC.out.send( buf, 0, buf.length, port, ip )
      //this.send( address, typetags, values )
    }
    
    return OSC.out
  },
  
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