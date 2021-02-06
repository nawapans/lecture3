import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124.0/build/three.module.js'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/controls/OrbitControls.js'
import { Rhino3dmLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/loaders/3DMLoader.js'
import rhino3dm from 'https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/rhino3dm.module.js'
import { RhinoCompute } from 'https://cdn.jsdelivr.net/npm/compute-rhino3d@0.13.0-beta/compute.rhino3d.module.js'

// reference the definition
const definitionName = 'roof.gh'

// listen for slider change events
const count_slider = document.getElementById('count')
    //count_slider.addEventListener('input', onSliderChange, false)
count_slider.addEventListener('mouseup', onSliderChange, false)

//const radius_slider = document.getElementById('radius')
//radius_slider.addEventListener('input', onSliderChange, false)

const downloadButton = document.getElementById("downloadButton")
downloadButton.onclick = download

//const enterButton = document.getElementById("enter")
//enterButton.onclick.addEventListener('input', onSliderChange, true)

// set up loader for converting the results to threejs
const loader = new Rhino3dmLoader()
loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/')

window.addEventListener('click', onclick, false)


// create a few variables to store a reference to the rhino3dm library and to the loaded definition
let rhino, definition, doc

rhino3dm().then(async m => {
    rhino = m

    // local 
    //RhinoCompute.url = 'http://localhost:8081/' // Rhino.Compute server url

    // remote
    RhinoCompute.url = 'https://macad2021.compute.rhino3d.com/'
    RhinoCompute.apiKey = getApiKey() // needed when calling a remote RhinoCompute server

    //source a .gh/.ghx file in the same directory
    let url = definitionName
    let res = await fetch(url)
    let buffer = await res.arrayBuffer()
    definition = new Uint8Array(buffer)

    init()
    compute()
    animate()
})

async function compute() {

    // collect data

    // get slider values
    let count = document.getElementById('count').valueAsNumber
        //let radius = document.getElementById('radius').valueAsNumber

    // format data
    //let param1 = new RhinoCompute.Grasshopper.DataTree('RH_IN:radius')
    //param1.append([0], [radius])
    let param2 = new RhinoCompute.Grasshopper.DataTree('RH_IN:count')
    param2.append([0], [count])

    // Add all params to an array
    let trees = []
        // trees.push(param1)
    trees.push(param2)

    // Call RhinoCompute

    const res = await RhinoCompute.Grasshopper.evaluateDefinition(definition, trees)

    console.log(res)

    collectResults(res.values)
    document.getElementById("myText").value = count;

}

function collectResults(values) {

    // clear doc
    if (doc !== undefined)
        doc.delete()

    // clear objects from scene
    scene.traverse(child => {
        if (!child.isLight) {
            scene.remove(child)
        }
    })

    console.log(values)
    doc = new rhino.File3dm()

    for (let i = 0; i < values.length; i++) {

        const list = values[i].InnerTree['{ 0; }']

        for (let j = 0; j < list.length; j++) {

            const data = JSON.parse(values[i].InnerTree['{ 0; }'][j].data)
            const rhinoObject = rhino.CommonObject.decode(data)
            doc.objects().add(rhinoObject, null)

        }

    }

    const buffer = new Uint8Array(doc.toByteArray()).buffer
    loader.parse(buffer, function(object) {
        scene.add(object)
            // hide spinner
        document.getElementById('loader').style.display = 'none'

        // enable download button
        downloadButton.disabled = false
    })


}

function onSliderChange() {

    // show spinner
    document.getElementById('loader').style.display = 'block'

    // disable download button
    downloadButton.disabled = false

    compute()

}

function getApiKey() {
    let auth = null
    auth = localStorage['compute_api_key']
    if (auth == null) {
        auth = window.prompt('RhinoCompute Server API Key')
        if (auth != null) {
            localStorage.setItem('compute_api_key', auth)
        }
    }
    return auth
}


// download button handler
function download() {
    let buffer = doc.toByteArray()
    saveByteArray("Model no." + (myText.value) + ".3dm", buffer)
}

function saveByteArray(fileName, byte) {
    let blob = new Blob([byte], { type: "application/octect-stream" })
    let link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = fileName
    link.click()
}

// BOILERPLATE //
// declare variables to store scene, camera, and renderer
let scene, camera, renderer

function init() {

    // create a scene and a camera
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0c05a)
    camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.y = -70
    camera.position.z = 30

    // create the renderer and add it to the html
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    // add some controls to orbit the camera
    const controls = new OrbitControls(camera, renderer.domElement)

    // add a directional light
    // add a directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff)
    directionalLight.intensity = 1
    scene.add(directionalLight)
    directionalLight.position.set(400, 0, 0)

    const directionalLight2 = new THREE.DirectionalLight(0x064a89)
    directionalLight2.position.set(0, 100, 0)
    directionalLight2.castShadow = true
    directionalLight2.intensity = 2
    scene.add(directionalLight2)

    const directionalLight3 = new THREE.DirectionalLight(0x444e58)
    directionalLight3.position.set(-100, 0, 0)
    directionalLight3.castShadow = true
    directionalLight3.intensity = 2
    scene.add(directionalLight3)

    const directionalLight4 = new THREE.DirectionalLight(0xffffff)
    directionalLight4.position.set(0, -10, 0)
    directionalLight4.castShadow = true
    directionalLight4.intensity = 2
    scene.add(directionalLight4)

    const directionalLight5 = new THREE.DirectionalLight('black')
    directionalLight5.position.set(0, 0, 500)
    directionalLight5.castShadow = true
    directionalLight5.intensity = 1
    scene.add(directionalLight5)


    const ambientLight = new THREE.AmbientLight()
    scene.add(ambientLight)

}


// function to continuously render the scene
function animate() {

    requestAnimationFrame(animate)
    renderer.render(scene, camera)

}