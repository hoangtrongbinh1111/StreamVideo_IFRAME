const express = require("express");
const app = express();

// Định nghĩa endpoint API
app.get("/video", (req, res) => {
  const uuid = req.query.uuid;
  const channel = req.query.channel;

  // Tạo URL cho endpoint API video HLS
  const videoEndpoint = `http://127.0.0.1:8083/stream/${uuid}/channel/${channel}/webrtc`;

  // Trả về trang HTML chứa thẻ video nhúng (embed) và script video.js
  const html = `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>RTSPtoWeb WebRTC example</title>
    </head>
    <body>
      <h1>RTSPtoWeb WebRTC example</h1>
  
      <input type="hidden" name="webrtc-url" id="webrtc-url"
          value="${videoEndpoint}">
  
      <video id="webrtc-video" autoplay muted playsinline controls
          style="max-width: 100%; max-height: 100%;"></video>
  
      <script>
          document.addEventListener('DOMContentLoaded', function () {
      function startPlay (videoEl, url) {
        const webrtc = new RTCPeerConnection({
          iceServers: [{
            urls: ['stun:stun.l.google.com:19302']
          }],
          sdpSemantics: 'unified-plan'
        })
        webrtc.ontrack = function (event) {
          console.log(event.streams.length + ' track is delivered')
          videoEl.srcObject = event.streams[0]
          videoEl.play()
        }
        webrtc.addTransceiver('video', { direction: 'sendrecv' })
        webrtc.onnegotiationneeded = async function handleNegotiationNeeded () {
          const offer = await webrtc.createOffer()
    
          await webrtc.setLocalDescription(offer)
    
          fetch(url, {
            method: 'POST',
            body: new URLSearchParams({ data: btoa(webrtc.localDescription.sdp) })
          })
            .then(response => response.text())
            .then(data => {
              try {
                webrtc.setRemoteDescription(
                  new RTCSessionDescription({ type: 'answer', sdp: atob(data) })
                )
              } catch (e) {
                console.warn(e)
              }
            })
        }
    
        const webrtcSendChannel = webrtc.createDataChannel('rtsptowebSendChannel')
        webrtcSendChannel.onopen = (event) => {
          
          webrtcSendChannel.send('ping')
        }
        webrtcSendChannel.onclose = (_event) => {
          
          startPlay(videoEl, url)
        }
        webrtcSendChannel.onmessage = event => console.log(event.data)
      }
    
      const videoEl = document.querySelector('#webrtc-video')
      const webrtcUrl = document.querySelector('#webrtc-url').value
    
      startPlay(videoEl, webrtcUrl)
    })
      </script>
    </body>
  </html>
  `;
  res.send(html);
});

// Khởi chạy server
const port = 9000;
app.listen(port, () => {
  console.log(`Server đang lắng nghe tại http://localhost:${port}`);
});