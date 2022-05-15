const cam = document.getElementById('cam')

const startVideo = () => {
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            if (Array.isArray(devices)) {
                devices.forEach(device => {
                    if (device.kind === 'videoinput') {
                        navigator.getUserMedia(
                            {
                                video: {
                                    deviceId: device.deviceId
                                }
                            },
                            stream => cam.srcObject = stream,
                            error => console.error(error)
                        )
                    }
                })
            }
        })
}

Promise.all([ // Retorna uma promisse quando todas já estiverem resolvidas
    faceapi.nets.tinyFaceDetector.loadFromUri('/assets/lib/face-api/models'),   // É igual uma detecção facial normal, porém menor e mais rapido.
    faceapi.nets.faceLandmark68Net.loadFromUri('/assets/lib/face-api/models'),  // Pega os pontos de referencia do sue rosto.
    faceapi.nets.faceRecognitionNet.loadFromUri('/assets/lib/face-api/models'), // Vai permitir a api saber onde o rosto está localizado no video.
    faceapi.nets.faceExpressionNet.loadFromUri('/assets/lib/face-api/models'),  // Vai permitir a api saber suas expressões.
    faceapi.nets.ageGenderNet.loadFromUri('/assets/lib/face-api/models'),       // Vai permitir a api calcular sua idade.
    faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/lib/face-api/models'),     // Especificar o detector de rosto passando o objeto de opções.
]).then(startVideo)

cam.addEventListener('play', async () => {
    const canvas = faceapi.createCanvasFromMedia(cam)   // Criando canvas para mostrar nossos resultador.
    const canvasSize = {    // criando tamanho do display a partir das dimenssões da nossa cam.
        width: cam.width,
        height: cam.height
    }
    faceapi.matchDimensions(canvas, canvasSize) // Igualando as dimensões do canvas com da cam.
    document.body.appendChild(canvas)
    setInterval(async () => {        // Intervalo para detectar os rostos a cada 100ms.
        const detections = await faceapi
            .detectAllFaces(
                cam,
                new faceapi.TinyFaceDetectorOptions() // Qual tipo de biblioteca vamos usar para detectar os rostos.
            )
            .withFaceLandmarks()    // Vai desenhar os pontos de marcação no rosto.
            .withFaceExpressions()  // Vai determinar nossas expressões.
            .withAgeAndGender()     // Vai determinar idade.

        const resizedDetections = faceapi.resizeResults(detections, canvasSize)

        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
        faceapi.draw.drawDetections(canvas, resizedDetections)      // Desenhando decções.
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)   // Desenhando os pontos de referencia.
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections) // Desenhando expressões.

        resizedDetections.forEach(detection => {
            console.log("detection", detection);
            const { age, gender, genderProbability } = detection
            new faceapi.draw.DrawTextField([
                `${parseInt(age, 10)} anos`,
            ], detection.detection.box.topRight).draw(canvas)
        })
        // results.forEach((result, index) => {
        //     const box = resizedDetections[index].detection.box
        //     const { label, distance } = result
        //     new faceapi.draw.DrawTextField([
        //         `${label} (${parseInt(distance * 100, 10)})`
        //     ], box.bottomRight).draw(canvas)
        // })
    }, 100)
})
