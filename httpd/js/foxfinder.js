// Author: soliforte
// Email: soliforte@protonmail.com
// Git: github.com/soliforte
// Freeware, enjoy. If you do something really cool with it, let me know. Pull requests encouraged

(
  typeof define === "function" ? function (m) { define("plugin-foxfinder-js", m); } :
  typeof exports === "object" ? function (m) { module.exports = m(); } :
  function(m){ this.foxfinder = m(); }
)(function () {

  "use strict";

  var exports = {};

  // Flag we're still loading
  exports.load_complete = 0;

kismet_ui_tabpane.AddTab({
	id:    'foxfinder',
	tabTitle:    'Fox Finder',
  expandable: true,
	createCallback: function(div) {
    $(document).ready(function(){
      var search = document.getElementsByTagName("input")[0].value;
      $('#foxfinder').append('<input id="foxsearch" type="text" style="margin: 1px;"> Insert MAC</input>')
      $('#foxfinder').append('<div id="foxfreqmap"></div>')
      $('#foxfinder').append('<div id="foxfinderchart" style="height: 70%; width:95%;"></div>')
      $('#foxfinder').append('<div id="foxfinderwarn"></div')
        var lastsearch = ""
        var packetsold = 0
        var uuids = []
        var dps = []; // dataPoints

        var sigchart = Morris.Line({
          element: 'foxfinderchart',
          resize: true,
          hideHover: true,
          xLabels: 'Packets',
          parseTime: false,
          data: dps,
          xkey: 'x',
          ykeys: 'y',
          labels: ['Signal'],
        });

        var dataLength = 100; // number of dataPoints visible at any point

      $(window).ready( function() {
       setInterval(getTarget, 1000);
      });

      function getTarget() {
        var search = document.getElementById("foxsearch").value;
        if (search != ""){
          if (search != lastsearch){
            lastsearch = search
            packetsold = 0
            dps = []
            sigchart.setData(dps)
          }
        $.getJSON("/devices/by-mac/"+search+"/device.json").done(function(devs) {
            for (var x = 0; x < devs.length; x++) {
              var ssid = devs[x]['kismet.device.base.name'];
              var packets = devs[x]['kismet.device.base.packets.total']
              var freqmap = devs[x]['kismet.device.base.freq_khz_map']
              var seenby = devs[x]['kismet.device.base.seenby']
              var type = devs[x]['kismet.device.base.type'];
              var mac = devs[x]['kismet.device.base.macaddr'];
              var lastrssi = devs[x]['kismet.device.base.signal']['kismet.common.signal.last_signal_dbm']; //Last signal dBm
              for (var a in seenby){
                var seenbyuuid = seenby[a]['kismet.common.seenby.uuid']
                var seenbyrssi = seenby[a]['kismet.common.seenby.signal']['kismet.common.signal.last_signal_dbm']
                var seenbypackets = seenby[a]['kismet.common.seenby.num_packets']
              }
              $('#foxfreqmap').empty()
              $('#foxfinderwarn').empty()
              for (var i in freqmap){
                $('#foxfreqmap').append('<span style="border: solid 1px; margin: 1px; padding: 1px;"><i class="fa fa-signal" aria-hidden="true"></i>'+" "+i+": "+freqmap[i]+'</span>')
              }

              if (packets == packetsold){
                $('#foxfinderwarn').append('<span style="border: solid 1px; margin: 3px; padding: 5px; background: red; color: white;"><i class="fa fa-exclamation-triangle" aria-hidden="true"></i>Device might be on another channel, or out of range</span>')
              } else if (packets > packetsold){
                dps.push({
                  x: seenbypackets,
                  y: lastrssi,
                });
                if (dps.length > dataLength) {
                  dps.shift();
                }
                sigchart.setData(dps)
                console.log(dps)
                packetsold = packets
              }
            }// end of for
          }).fail(function(){
            $('#foxfreqmap').empty()
            $('#foxfreqmap').append('<span style="border: solid 1px; margin: 3px; padding: 5px;"><i class="fa fa-exclamation-triangle" aria-hidden="true"></i>Invalid Search or MAC not yet seen<span>')
          });
        } //End of If
        }
      });//Close document.ready
    },//End of div
    priority: 	-800,
  });// We’re done loading
  exports.load_complete = 1;
  return exports;
});
