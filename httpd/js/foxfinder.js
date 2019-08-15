// Author: soliforte
// Email: soliforte@protonmail.com
// Git: gitlab.com/soliforte
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
      $('#foxfinder').append('<div style="display: table">Insert MAC: <input id="foxsearch" type="text" size="13" style="display: table-cell;" /><div id="UUIDS" style="display: table-cell"></div></div>') //<button id="popDF" style="display: table-cell">DF</button>
      //$('#popDF').on("click", popDFModal)
      $('#foxfinder').append('<div id="foxfreqmap"></div>')
      $('#foxfinder').append('<div id="foxfinderchart" style="height: 70%; width:95%; border: 1px solid black;"></div>')
      $('#foxfinder').append('<div id="foxfinderwarn"></div')
      //$('#foxfinder').append('<div id="dfModal" title="FoxFinder DF"><canvas id="lobCanvas" width="300" height="300">Your browser does not support the HTML5 canvas tag.</canvas></div>')

      var lastsearch = ""
      var packetsold = 0
      var uuids = []
      var dps = []; // dataPoints

      function popDFModal(){
        $('#dfModal').dialog()
      }

      var sigchart = Morris.Line({
        element: 'foxfinderchart',
        resize: true,
        smooth: false,
        //hideHover: true,
        xLabels: 'Packets',
        parseTime: false,
        data: dps,
        xkey: 'x',
        ykeys: 'y',
        labels: ['Signal'],
      });

      var dataLength = 100; // number of dataPoints visible at any point

      $(window).ready( function() {
       setInterval(getTarget, 450);
      });

      // DF vars and stuff:

      //var canvas = document.getElementById("lobCanvas");
      //var ctx = canvas.getContext("2d");
      //var radius = canvas.height / 2;
      //ctx.translate(radius, radius);
      //radius = radius * 0.90

      //function df(){ //pass the lob arg later on.
      //  drawFace(ctx, radius)
      //  drawTime(ctx, radius); //lob will also go here.
      //}

      /**function drawFace(ctx, radius) {
          var grad;

          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, 2*Math.PI);
          ctx.fillStyle = 'white';
          ctx.fill();

          grad = ctx.createRadialGradient(0,0,radius*0.95, 0,0,radius*1.05);
          grad.addColorStop(0, '#333');
          grad.addColorStop(0.5, 'white');
          grad.addColorStop(1, '#333');
          ctx.strokeStyle = grad;
          ctx.lineWidth = radius*0.1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, 0, radius*0.1, 0, 2*Math.PI);
          ctx.fillStyle = '#333';
          ctx.fill();
      }

      function drawTime(ctx, radius){ //add the lob arg here.
        var pos = Math.floor(Math.random() * 359) + 0 // This will be replaced with lob + -90 since 0 is at noon.
        //second=(second*Math.PI/30);
        drawHand(ctx, pos, radius*0.9, radius*0.02);
      }

      function drawHand(ctx, pos, length, width) {
          ctx.beginPath();
          ctx.lineWidth = width;
          ctx.lineCap = "round";
          ctx.moveTo(0,0);
          ctx.rotate(pos);
          ctx.lineTo(0, -length);
          ctx.stroke();
          ctx.rotate(-pos);
      }**/

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
// NOTE TO SELF: Somewhere in the device record a LOB will be recorded, at which point I will call a method to update the DF dial.
              var ssid = devs[x]['kismet.device.base.name'];
              var packets = devs[x]['kismet.device.base.packets.total']
              var freqmap = devs[x]['kismet.device.base.freq_khz_map']
              var seenby = devs[x]['kismet.device.base.seenby']
              var type = devs[x]['kismet.device.base.type'];
              var mac = devs[x]['kismet.device.base.macaddr'];
              var lastrssi = devs[x]['kismet.device.base.signal']['kismet.common.signal.last_signal']; //Last signal dBm
              $('#UUIDS').empty()
              for (var a in seenby){
                // IF I had to guess, LOB will show up in here.
                // var lob = seenby[a]['kismet.common.seenby.lob']
                var seenbyuuid = seenby[a]['kismet.common.seenby.uuid']
                var seenbyrssi = seenby[a]['kismet.common.seenby.signal']['kismet.common.signal.last_signal']
                var seenbypackets = seenby[a]['kismet.common.seenby.num_packets']
                //df() //This will take an arg called lob.
                $('#UUIDS').append('<span value="'+seenbyrssi+'" style="border: solid 1px; margin: 1px; padding: 1px;"><i class="fa fa-eye" aria-hidden="true"></i> '+seenbyuuid+" Packets: "+seenbypackets+" Signal: "+seenbyrssi+'</span>')
              }
              $('#foxfreqmap').empty()
              $('#foxfinderwarn').empty()
              for (var i in freqmap){
                $('#foxfreqmap').append('<span style="border: solid 1px; margin: 1px; padding: 1px;"><i class="fa fa-signal" aria-hidden="true"></i>'+" Channel "+kismet_ui.GetPhyConvertedChannel("IEEE802.11", i)+": "+freqmap[i]+'</span>')
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
