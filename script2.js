var video;
var webcamOffset;
var children = [];
const mainText = document.getElementsByClassName('main-text');
const liveView = document.getElementById('liveView');
const demosSection = document.getElementById('demos');
const enableWebcamButton = document.getElementById('webcamButton');
const imageContainers = document.getElementsByClassName('classifyOnClick');
var isWebcamOn = false;

// Check if webcam access is supported.
function getUserMediaSupported() {
    return !!(navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia);
}

// If webcam supported, add event listener to button for when user
// wants to activate it to call enableCam function which we will
// define in the next step.
if (getUserMediaSupported()) {
    enableWebcamButton.addEventListener('click', enableCam);

} else {
    console.warn('getUserMedia() is not supported by your browser');
}

// Enable the live webcam view and start classification.
function enableCam(event) {

    document.getElementById("liveView").innerHTML = '<video id="webcam" autoplay muted width="640" height="480"></video>';
    document.getElementById("historyBrowserContainer").innerHTML = '<div id="historyBrowser"><div>HISTORIQUE</div></div>';
    video = document.getElementById('webcam');

    children = [];

    function getWebcamOffset() {
        var webcamPosition = document.getElementById('liveView');
        webcamOffset = webcamPosition.getBoundingClientRect();
    }

    // Only continue if the COCO-SSD has finished loading.
    if (!model) {
        return;
    }

    // getUsermedia parameters to force video but not audio.
    const constraints = {
        video: true
    };

    // Activate the webcam stream.
    isWebcamOn = true;
    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
        if (isWebcamOn) {
            video.srcObject = stream;
            video.addEventListener('loadeddata', predictWebcam);
        }
        enableWebcamButton.innerHTML = 'Disable Webcam';
        enableWebcamButton.removeEventListener('click', enableCam);
        getWebcamOffset();
        if (enableWebcamButton.innerHTML == "Disable Webcam") {
            enableWebcamButton.addEventListener('click', stopWebcam);
        }
    });
}

// Store the resulting model in the global scope of our app.
var model = undefined;

// Before we can use COCO-SSD class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment
// to get everything needed to run.
// Note: cocoSsd is an external object loaded from our index.html
// script tag import so ignore any warning in Glitch.
cocoSsd.load().then(function(loadedModel) {
    model = loadedModel;
});

function predictWebcam() {
    // Now let's start classifying a frame in the stream.
    model.detect(video).then(function(predictions) {
        // Remove any highlighting we did previous frame.
        for (let i = 0; i < children.length; i++) {
            liveView.removeChild(children[i]);
        }
        children.splice(0);

        // Now lets loop through predictions and draw them to the live view if
        // they have a high confidence score.
        for (let n = 0; n < predictions.length; n++) {
            // If we are over 66% sure we are sure we classified it right, draw it!
            if (predictions[n].score > 0.66) {
                const p = document.createElement('p');
                p.setAttribute('id', 'ptitle');
                p.innerText = predictions[n].class + ' - with ' +
                    Math.round(parseFloat(predictions[n].score) * 100) +
                    '% confidence';
                p.style = 'margin-left: ' + predictions[n].bbox[0] + 'px; margin-top: ' +
                    (predictions[n].bbox[1] - 10) + 'px; width: ' +
                    (predictions[n].bbox[2] - 10) + 'px; top: 0; left: 0;';


                const highlighter = document.createElement('div');
                highlighter.setAttribute('class', 'highlighter');
                highlighter.setAttribute('id', 'highlighter');
                highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px; top: ' +
                    predictions[n].bbox[1] + 'px; width: ' +
                    predictions[n].bbox[2] + 'px; height: ' +
                    predictions[n].bbox[3] + 'px;';


                liveView.appendChild(highlighter);
                liveView.appendChild(p);
                children.push(highlighter);
                children.push(p);
            }
        }

        // Call this function again to keep predicting when the browser is ready.
        window.requestAnimationFrame(predictWebcam);
    });
}

var stopWebcam = function() {
    var stream = video.srcObject;
    var tracks = stream.getTracks();

    for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i];
        track.stop();
    }
    isWebcamOn = false;
    enableWebcamButton.innerHTML = 'Enable Webcam';
    enableWebcamButton.removeEventListener('click', stopWebcam);
    enableWebcamButton.addEventListener('click', enableCam);
    var element = document.getElementById("ptitle");
    element.parentNode.removeChild(element);
    var element2 = document.getElementById("highlighter");
    element2.parentNode.removeChild(element2);
    document.getElementById("historyBrowserContainer").innerHTML = "";
    video.srcObject = null;
    video = null;
}

// Now let's go through all of these and add a click event listener.
for (let i = 0; i < imageContainers.length; i++) {
    // Add event listener to the child element whichis the img element.
    imageContainers[i].children[0].addEventListener('click', handleClick);
}

// When an image is clicked, let's classify it and display results!
function handleClick(event) {
    if (!model) {
        console.log('Wait for model to load before clicking!');
        return;
    }

    // We can call model.classify as many times as we like with
    // different image data each time. This returns a promise
    // which we wait to complete and then call a function to
    // print out the results of the prediction.
    model.detect(event.target).then(function(predictions) {
        // Lets write the predictions to a new paragraph element and
        // add it to the DOM.
        console.log(predictions);
        for (let n = 0; n < predictions.length; n++) {
            // Description text
            const p = document.createElement('p');
            p.setAttribute('id', 'ptitle2');
            p.innerText = predictions[n].class + ' - with ' +
                Math.round(parseFloat(predictions[n].score) * 100) +
                '% confidence';
            // Positioned at the top left of the bounding box.
            // Height is whatever the text takes up.
            // Width subtracts text padding in CSS so fits perfectly.
            p.style = 'left: ' + predictions[n].bbox[0] + 'px;' +
                'top: ' + predictions[n].bbox[1] + 'px; ' +
                'width: ' + (predictions[n].bbox[2] - 10) + 'px;';

            const highlighter = document.createElement('div');
            highlighter.setAttribute('class', 'highlighter');
            highlighter.setAttribute('id', 'highlighter2');
            highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px;' +
                'top: ' + predictions[n].bbox[1] + 'px;' +
                'width: ' + predictions[n].bbox[2] + 'px;' +
                'height: ' + predictions[n].bbox[3] + 'px;';

            event.target.parentNode.appendChild(highlighter);
            event.target.parentNode.appendChild(p);
        }
    });
}