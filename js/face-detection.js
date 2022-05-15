const webcamElement = document.getElementById('webcam');
const webcam = new Webcam(webcamElement, 'user');

let currentStream;
let displaySize;
let convas;
let faceDetection;

$("#webcam-switch").change(function () {
  if (this.checked) {
    webcam.start()
      .then(result => {
        cameraStarted();
        webcamElement.style.transform = "";
        console.log("webcam started");
        createBtnPrint();
      })
      .catch(err => {
        removeBtnPrint();
        displayError();
      });
  }
  else {
    cameraStopped();
    webcam.stop();
    removeBtnPrint();
    console.log("webcam stopped");
  }
});

$('#cameraFlip').click(function () {
  webcam.flip();
  webcam.start()
    .then(result => {
      webcamElement.style.transform = "";
    });
});

$("#webcam").bind("loadedmetadata", function () {
  displaySize = { width: this.scrollWidth, height: this.scrollHeight }
});

$("#detection-switch").change(function () {
  if (this.checked) {
    $("#expression-switch").prop('checked', true);
    $("#age-gender-switch").prop('checked', true);
    $("#box-switch").prop('checked', true);
    $(".loading").removeClass('d-none');
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('lib/face-api/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('lib/face-api/models'),
      //faceapi.nets.faceRecognitionNet.loadFromUri('/lib/face-api/models'),
      faceapi.nets.faceExpressionNet.loadFromUri('lib/face-api/models'),
      faceapi.nets.ageGenderNet.loadFromUri('lib/face-api/models'),
      //faceapi.nets.ssdMobilenetv1.loadFromUri('/lib/face-api/models'),
    ]).then(function () {
      createCanvas();
      startDetection();
    })
  }
  else {
    clearInterval(faceDetection);
    toggleContrl("box-switch", false);
    toggleContrl("landmarks-switch", false);
    toggleContrl("expression-switch", false);
    toggleContrl("age-gender-switch", false);
    if (typeof canvas !== "undefined") {
      setTimeout(function () {
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
      }, 1000);
    }
  }
});

function createBtnPrint() {
  let btnPrint = document.getElementById("button_print");

  if (btnPrint) {
    let btn = document.createElement("button");
    btn.innerHTML = "PRINT";
    btn.classList.add("btn")
    btn.classList.add("btn-primary")
    btn.addEventListener("click", ImagetoPrint);
    btnPrint.appendChild(btn);
  }
}

function removeBtnPrint() {
  let element = document.getElementById("button_print");
  if (element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }
}

function createCanvas() {
  if (document.getElementsByTagName("canvas").length == 0) {
    canvas = faceapi.createCanvasFromMedia(webcamElement)
    document.getElementById('webcam-container').append(canvas)
    faceapi.matchDimensions(canvas, displaySize)
  }
}

function toggleContrl(id, show) {
  if (show) {
    $("#" + id).prop('disabled', false);
    $("#" + id).parent().removeClass('disabled');
  } else {
    $("#" + id).prop('checked', false).change();
    $("#" + id).prop('disabled', true);
    $("#" + id).parent().addClass('disabled');
  }
}

function startDetection() {
  faceDetection = setInterval(async () => {
    const detections = await faceapi.detectAllFaces(
      webcamElement,
      new faceapi.TinyFaceDetectorOptions()
    )
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();

    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    if ($("#box-switch").is(":checked")) {
      faceapi.draw.drawDetections(canvas, resizedDetections)
    }
    if ($("#landmarks-switch").is(":checked")) {
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    }
    if ($("#expression-switch").is(":checked")) {
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
    }
    if ($("#age-gender-switch").is(":checked")) {
      resizedDetections.forEach(detection => {
        const { age, gender, genderProbability } = detection
        new faceapi.draw.DrawTextField([
          `${parseInt(age, 10)} anos`,
        ], detection.detection.box.topRight).draw(canvas)
      })
    }

    if (!$(".loading").hasClass('d-none')) {
      $(".loading").addClass('d-none')
    }
  }, 300)
}

function cameraStarted() {
  toggleContrl("detection-switch", true);
  $("#errorMsg").addClass("d-none");
  if (webcam.webcamList.length > 1) {
    $("#cameraFlip").removeClass('d-none');
  }
}

function cameraStopped() {
  toggleContrl("detection-switch", false);
  $("#errorMsg").addClass("d-none");
  $("#cameraFlip").addClass('d-none');
  $(".loading").addClass('d-none')
}

function displayError(err = '') {
  if (err != '') {
    $("#errorMsg").html(err);
  }
  $("#errorMsg").removeClass("d-none");
}


// MEUS
// Get the modal
var modal = document.getElementById("myModal");
// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];
// When the user clicks on <span> (x), close the modal
span.onclick = function () {
  modal.style.display = "none";
}
// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

function ImagetoPrint() {
  var el = document.getElementById('video-container');
  console.log(el)
  if (el) {
    getScreenshotOfElement(el, function (data) {
      var img = new Image();
      img.width =
        img.onload = function () {
          img.onload = null;
          document.getElementById("outputImage").appendChild(img);
        };
      img.src = data;
      console.log(data);
      openModal();
    });
  }
}

function getScreenshotOfElement(element, callback) {
  html2canvas(element, {
    onrendered: function (canvas2) {
      callback(canvas2.toDataURL("image/png"));
    },
    useCORS: false,
    taintTest: false,
    allowTaint: false
  });
}

function openModal() {
  modal.style.display = "block";
}