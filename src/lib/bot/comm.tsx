import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { MdMic, MdStop } from "react-icons/md"
import * as d3 from "d3"

interface Props {
  bot: number
}

export function Comm(props: Props) {


  const { bot } = props
  const [recoding, setRecoding] = useState(false)


  function onStart() {

  }

  let classNameColor = "bg-blue-500"
  if (recoding) {
    classNameColor = "bg-red-500"
  }


  return (
    <div className="w-full h-full flex items-center justify-center bg-black text-white" >
      <div className="text-center">

        <CirclesVisualization />



        {/* <div className={`rounded-full p-4 mb-4 cursor-pointer ${classNameColor}`}
          onMouseDown={() => setRecoding(true)}
          onMouseUp={() => setRecoding(false)}
          onMouseLeave={() => setRecoding(false)}
        >
          <MdMic size={128} />
        </div>
        <div className="font-bold">
          PUSH TO TALK
        </div>
 */}

      </div>
    </div>
  )

}


function CirclesVisualization() {


  const state = useRef({
    executed: false,
    audioBuffer: null as AudioBuffer
  })


  async function audioCircles() {

    if (state.current.executed) return
    state.current.executed = true

    let soundsrc: AudioBufferSourceNode
    let analyzer: AnalyserNode
    let frequency: Uint8Array
    let context = new AudioContext()

    if (!state.current.audioBuffer) {
      const response = await fetch('https://s3-us-west-2.amazonaws.com/s.cdpn.io/481938/Scarlet_Fire.mp3')
      const arrayBuffer = await response.arrayBuffer()
      state.current.audioBuffer = await context.decodeAudioData(arrayBuffer)
    }

    soundsrc = context.createBufferSource()
    analyzer = context.createAnalyser()
    frequency = new Uint8Array(analyzer.frequencyBinCount)

    soundsrc.buffer = state.current.audioBuffer
    soundsrc.connect(context.destination)
    soundsrc.connect(analyzer)
    soundsrc.addEventListener('ended', function () {
      soundsrc.stop()
    })

    try {
      soundsrc.stop()
    } catch (error) { }


    soundsrc.start(0)

    // d3.select('#vis').append('svg').attr('width', '100%').attr('height', '100%').append('defs')
    // const radial = d3.select('defs').append('radialGradient').attr('id', 'gradient').attr('cx', '50%').attr('cy', '50%').attr('r', '50%').attr('fx', '50%').attr('fy', '50%')
    // radial.append('stop').attr('offset', '80%').style({ 'stop-color': 'rgb(0,0,0)', 'stop-opacity': 0 })
    // radial.append('stop').attr('offset', '90%').style({ 'stop-color': 'rgb(255,255,255)', 'stop-opacity': 1 })
    // radial.append('stop').attr('offset', '100%').style({ 'stop-color': 'rgb(0,0,0)', 'stop-opacity': 0 })

    // const soundsrc = context.createBufferSource()
    // const analyzer = context.createAnalyser()
    // const frequency = new Uint8Array(analyzer.frequencyBinCount)

    // soundsrc.buffer = audioBuffer
    // soundsrc.connect(context.destination)
    // soundsrc.connect(analyzer)
    // soundsrc.addEventListener('ended', function () {
    //   soundsrc.stop()
    // })

    // soundsrc.start(0)
    render()

    function render() {
      requestAnimationFrame(render)
      analyzer.getByteFrequencyData(frequency)

      const sv = d3.select('svg')

      const freq = frequency.slice(0, 4)

      document.getElementById("sq1").style.width = `${freq[0]}px`
      document.getElementById("sq2").style.width = `${freq[1]}px`
      document.getElementById("sq3").style.width = `${freq[2]}px`
      document.getElementById("sq4").style.width = `${freq[3]}px`

      //   sv.selectAll('circle')
      //     .data(frequency.slice(0, 10))
      //     .attr('r', function (d) {
      //       return ((d / 255) * 25) + '%'
      //     })
      //     .enter().append('circle')
      //     .attr('cx', '50%')
      //     .attr('cy', '50%')
      //     .attr('fill', 'url(#gradient)')

    }

  }



  useLayoutEffect(() => {
    audioCircles().then(() => {

    })
  }, [])


  return <div id="vis" className="w-full h-full flex flex-col justify-center">
    <div id="sq1" className="bg-white w-[192px] h-[32px] rounded-lg my-4"></div>
    <div id="sq2" className="bg-white w-[192px] h-[32px] rounded-lg my-4"></div>
    <div id="sq3" className="bg-white w-[192px] h-[32px] rounded-lg my-4"></div>
    <div id="sq4" className="bg-white w-[192px] h-[32px] rounded-lg my-4"></div>
  </div>

}


